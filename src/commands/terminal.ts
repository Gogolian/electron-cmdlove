import { spawn } from 'node:child_process';
import type { Logger } from '../logging/logger.js';
import type { CmdLoveConfig, CommandMenuItem, TerminalProfile } from '../config/types.js';

export interface LaunchPlan {
  executable: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  detached: boolean;
}

export interface LaunchResult {
  ok: boolean;
  error?: Error;
  plan?: LaunchPlan;
}

export function createLaunchPlan(config: CmdLoveConfig, command: CommandMenuItem): LaunchPlan {
  const terminalName = command.terminal ?? config.defaultTerminal;
  const terminal = config.terminals[terminalName];

  if (!terminal) {
    throw new Error(`Unknown terminal profile: ${terminalName}`);
  }

  if (command.runAsAdmin) {
    throw new Error('runAsAdmin is reserved for a future signed Windows launcher integration.');
  }

  const executable = terminal.executable ?? defaultExecutableFor(terminal);
  const args = buildTerminalArgs(terminal, command);

  return {
    executable,
    args,
    cwd: command.cwd ?? terminal.cwd,
    env: mergeEnv(terminal.env, command.env),
    detached: command.detached ?? true,
  };
}

export function launchCommand(
  config: CmdLoveConfig,
  command: CommandMenuItem,
  logger: Logger,
): LaunchResult {
  let plan: LaunchPlan;

  try {
    plan = createLaunchPlan(config, command);
  } catch (error) {
    const launchError = toError(error);
    logger.error(`Unable to create launch plan for ${command.id}.`, launchError);
    return { ok: false, error: launchError };
  }

  try {
    const child = spawn(plan.executable, plan.args, {
      cwd: plan.cwd,
      detached: plan.detached,
      env: plan.env,
      stdio: 'ignore',
      windowsHide: false,
    });

    child.on('error', (error) => {
      logger.error(`Unable to launch ${command.id} with ${plan.executable}.`, error);
    });

    child.unref();
    logger.info(`Launched ${command.id} with ${plan.executable}.`);
    return { ok: true, plan };
  } catch (error) {
    const launchError = toError(error);
    logger.error(`Unable to launch ${command.id} with ${plan.executable}.`, launchError);
    return { ok: false, error: launchError, plan };
  }
}

export function findCommand(config: CmdLoveConfig, id: string): CommandMenuItem | undefined {
  const stack = [...config.menu];

  while (stack.length > 0) {
    const item = stack.shift();
    if (!item) {
      continue;
    }
    if (item.type === 'command' && item.id === id) {
      return item;
    }
    if (item.type === 'group') {
      stack.unshift(...item.items);
    }
  }

  return undefined;
}

function buildTerminalArgs(terminal: TerminalProfile, command: CommandMenuItem): string[] {
  const baseArgs = terminal.args ?? [];

  if (command.args) {
    return [...baseArgs, ...command.args];
  }

  if (command.task) {
    if (terminal.type === 'conemu') {
      return [...baseArgs, '-run', command.task];
    }
    return [...baseArgs, command.task];
  }

  const commandText = command.command ?? '';

  switch (terminal.type) {
    case 'conemu':
      return [...baseArgs, '-run', 'cmd', '/k', '-cur_console:', commandText];
    case 'cmd':
      return [...baseArgs, '/k', commandText];
    case 'powershell':
      return [...baseArgs, '-NoExit', '-Command', commandText];
    case 'windowsTerminal':
      return [...baseArgs, 'cmd.exe', '/k', commandText];
    case 'wsl':
      return [...baseArgs, '--exec', 'sh', '-lc', commandText];
    case 'custom':
      return commandText ? [...baseArgs, commandText] : [...baseArgs];
  }
}

function defaultExecutableFor(terminal: TerminalProfile): string {
  switch (terminal.type) {
    case 'cmd':
      return 'cmd.exe';
    case 'powershell':
      return 'powershell.exe';
    case 'windowsTerminal':
      return 'wt.exe';
    case 'conemu':
      return 'ConEmu64.exe';
    case 'wsl':
      return 'wsl.exe';
    case 'custom':
      throw new Error('Custom terminal profiles must define executable.');
  }
}

function mergeEnv(
  terminalEnv: Record<string, string> | undefined,
  commandEnv: Record<string, string> | undefined,
): NodeJS.ProcessEnv | undefined {
  if (!terminalEnv && !commandEnv) {
    return undefined;
  }

  return {
    ...process.env,
    ...terminalEnv,
    ...commandEnv,
  };
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
