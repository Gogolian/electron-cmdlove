import { app, dialog, Menu, shell, Tray } from 'electron';
import path from 'node:path';
import { findCommand, launchCommand } from '../commands/terminal.js';
import { loadConfig } from '../config/loader.js';
import type { CmdLoveConfig } from '../config/types.js';
import { createLogger, type Logger } from '../logging/logger.js';
import { buildTrayMenuTemplate } from '../menu/trayMenu.js';

let tray: Tray | null = null;
let config: CmdLoveConfig;
let configErrors: string[] = [];
let configPath = '';
let logger: Logger;

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showTrayBalloon('CmdLove is already running.');
  });

  app
    .whenReady()
    .then(startApplication)
    .catch((error: unknown) => {
      dialog.showErrorBox('CmdLove startup failed', formatError(error));
      app.quit();
    });

  app.on('window-all-closed', () => {});
}

function startApplication(): void {
  logger = createLogger(app.getPath('userData'));
  logger.info('Starting CmdLove.');
  reloadConfig();

  tray = new Tray(resolveIconPath());
  tray.setToolTip('CmdLove');
  tray.on('click', launchOpenOnTrayClick);
  rebuildTrayMenu();
}

function reloadConfig(): void {
  const result = loadConfig({ userDataPath: app.getPath('userData') });
  config = result.config;
  configPath = result.configPath;
  configErrors = result.errors;

  if (configErrors.length > 0) {
    logger?.error(`Config errors: ${configErrors.join('; ')}`);
  } else {
    logger?.info(`Loaded config from ${configPath}.`);
  }

  rebuildTrayMenu();
}

function rebuildTrayMenu(): void {
  if (!tray || !config) {
    return;
  }

  const menu = Menu.buildFromTemplate(
    buildTrayMenuTemplate({
      config,
      configErrors,
      actions: {
        launchCommand: (commandId) => launchCommandById(commandId),
        reloadConfig,
        openConfig: () => openPath(configPath),
        openLogs: () => openPath(logger.logPath),
      },
    }),
  );

  tray.setContextMenu(menu);
}

function launchCommandById(commandId: string): void {
  const command = findCommand(config, commandId);

  if (!command) {
    const message = `Command "${commandId}" was not found.`;
    logger.error(message);
    showTrayBalloon(message);
    return;
  }

  const result = launchCommand(config, command, logger);
  if (!result.ok) {
    showTrayBalloon(result.error?.message ?? `Unable to launch ${commandId}.`);
  }
}

function launchOpenOnTrayClick(): void {
  if (config.openOnTrayClick) {
    launchCommandById(config.openOnTrayClick);
  }
}

function openPath(targetPath: string): void {
  shell.openPath(targetPath).then((errorMessage) => {
    if (errorMessage) {
      logger.error(`Unable to open ${targetPath}: ${errorMessage}`);
      showTrayBalloon(errorMessage);
    }
  });
}

function resolveIconPath(): string {
  return path.join(app.getAppPath(), 'user.ico');
}

function showTrayBalloon(message: string): void {
  if (process.platform === 'win32' && tray) {
    tray.displayBalloon({ title: 'CmdLove', content: message });
    return;
  }

  logger?.info(message);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
