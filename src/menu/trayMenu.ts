import type { MenuItemConstructorOptions } from 'electron';
import type { CmdLoveConfig, ConfigMenuItem } from '../config/types.js';

export interface TrayMenuActions {
  launchCommand(commandId: string): void;
  reloadConfig(): void;
  openConfig(): void;
  openLogs(): void;
}

export interface BuildTrayMenuOptions {
  config: CmdLoveConfig;
  configErrors: string[];
  actions: TrayMenuActions;
}

export function buildTrayMenuTemplate({
  config,
  configErrors,
  actions,
}: BuildTrayMenuOptions): MenuItemConstructorOptions[] {
  const template: MenuItemConstructorOptions[] = [];

  if (configErrors.length > 0) {
    template.push({
      label: 'Config errors - using defaults',
      enabled: false,
    });
    for (const error of configErrors) {
      template.push({
        label: truncateLabel(error),
        enabled: false,
      });
    }
    template.push({ type: 'separator' });
  }

  template.push(...config.menu.map((item) => buildMenuItem(item, actions)));
  template.push(
    { type: 'separator' },
    { label: 'Reload config', click: () => actions.reloadConfig() },
    { label: 'Open config', click: () => actions.openConfig() },
    { label: 'Open logs', click: () => actions.openLogs() },
    { type: 'separator' },
    { role: 'quit' },
  );

  return template;
}

function buildMenuItem(
  item: ConfigMenuItem,
  actions: TrayMenuActions,
): MenuItemConstructorOptions {
  if (item.type === 'separator') {
    return { type: 'separator' };
  }

  if (item.type === 'group') {
    return {
      label: item.label,
      submenu: item.items.map((child) => buildMenuItem(child, actions)),
    };
  }

  return {
    label: item.label,
    accelerator: item.accelerator,
    icon: item.icon,
    click: () => actions.launchCommand(item.id),
  };
}

function truncateLabel(label: string): string {
  const maxLength = 90;
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}
