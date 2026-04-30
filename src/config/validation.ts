import type {
  CmdLoveConfig,
  CommandMenuItem,
  ConfigMenuItem,
  TerminalProfile,
  TerminalType,
} from './types.js';

const terminalTypes: readonly TerminalType[] = [
  'cmd',
  'powershell',
  'windowsTerminal',
  'conemu',
  'wsl',
  'custom',
];

export function validateConfig(value: unknown): string[] {
  const errors: string[] = [];

  if (!isObject(value)) {
    return ['Config must be a JSON object.'];
  }

  const config = value as Partial<CmdLoveConfig>;
  validateTerminals(config, errors);

  if (!isNonEmptyString(config.defaultTerminal)) {
    errors.push('defaultTerminal must be a non-empty string.');
  } else if (isObject(config.terminals) && !config.terminals[config.defaultTerminal]) {
    errors.push(`defaultTerminal "${config.defaultTerminal}" does not exist in terminals.`);
  }

  if (config.openOnTrayClick !== undefined && !isNonEmptyString(config.openOnTrayClick)) {
    errors.push('openOnTrayClick must be a non-empty command id when provided.');
  }

  if (!Array.isArray(config.menu)) {
    errors.push('menu must be an array.');
  } else {
    const commandIds = new Set<string>();
    validateMenu(config.menu, 'menu', config, errors, commandIds);

    if (config.openOnTrayClick && !commandIds.has(config.openOnTrayClick)) {
      errors.push(`openOnTrayClick "${config.openOnTrayClick}" does not match a command id.`);
    }
  }

  return errors;
}

function validateTerminals(config: Partial<CmdLoveConfig>, errors: string[]): void {
  if (!isObject(config.terminals)) {
    errors.push('terminals must be an object.');
    return;
  }

  for (const [name, terminal] of Object.entries(config.terminals)) {
    if (!isNonEmptyString(name)) {
      errors.push('terminal names must be non-empty strings.');
    }
    validateTerminal(terminal, `terminals.${name}`, errors);
  }
}

function validateTerminal(value: unknown, path: string, errors: string[]): void {
  if (!isObject(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  const terminal = value as Partial<TerminalProfile>;
  if (!terminal.type || !terminalTypes.includes(terminal.type)) {
    errors.push(`${path}.type must be one of: ${terminalTypes.join(', ')}.`);
  }

  validateOptionalString(terminal.executable, `${path}.executable`, errors);
  validateOptionalString(terminal.cwd, `${path}.cwd`, errors);
  validateOptionalStringArray(terminal.args, `${path}.args`, errors);
  validateOptionalEnv(terminal.env, `${path}.env`, errors);
}

function validateMenu(
  items: ConfigMenuItem[],
  path: string,
  config: Partial<CmdLoveConfig>,
  errors: string[],
  commandIds: Set<string>,
): void {
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isObject(item)) {
      errors.push(`${itemPath} must be an object.`);
      return;
    }

    if (item.type === 'separator') {
      return;
    }

    if (item.type === 'group') {
      if (!isNonEmptyString(item.label)) {
        errors.push(`${itemPath}.label must be a non-empty string.`);
      }
      if (!Array.isArray(item.items)) {
        errors.push(`${itemPath}.items must be an array.`);
      } else {
        validateMenu(item.items, `${itemPath}.items`, config, errors, commandIds);
      }
      return;
    }

    if (item.type === 'command') {
      validateCommand(item, itemPath, config, errors, commandIds);
      return;
    }

    errors.push(`${itemPath}.type must be "command", "separator", or "group".`);
  });
}

function validateCommand(
  item: CommandMenuItem,
  path: string,
  config: Partial<CmdLoveConfig>,
  errors: string[],
  commandIds: Set<string>,
): void {
  if (!isNonEmptyString(item.id)) {
    errors.push(`${path}.id must be a non-empty string.`);
  } else if (commandIds.has(item.id)) {
    errors.push(`${path}.id "${item.id}" is duplicated.`);
  } else {
    commandIds.add(item.id);
  }

  if (!isNonEmptyString(item.label)) {
    errors.push(`${path}.label must be a non-empty string.`);
  }

  if (!isNonEmptyString(item.command) && !Array.isArray(item.args) && !isNonEmptyString(item.task)) {
    errors.push(`${path} must define command, args, or task.`);
  }

  const terminalName = item.terminal ?? config.defaultTerminal;
  if (!isNonEmptyString(terminalName)) {
    errors.push(`${path}.terminal must be a non-empty string when provided.`);
  } else if (isObject(config.terminals) && !config.terminals[terminalName]) {
    errors.push(`${path}.terminal "${terminalName}" does not exist in terminals.`);
  }

  validateOptionalString(item.command, `${path}.command`, errors);
  validateOptionalString(item.task, `${path}.task`, errors);
  validateOptionalString(item.cwd, `${path}.cwd`, errors);
  validateOptionalString(item.accelerator, `${path}.accelerator`, errors);
  validateOptionalString(item.icon, `${path}.icon`, errors);
  validateOptionalStringArray(item.args, `${path}.args`, errors);
  validateOptionalEnv(item.env, `${path}.env`, errors);

  if (item.detached !== undefined && typeof item.detached !== 'boolean') {
    errors.push(`${path}.detached must be a boolean.`);
  }

  if (item.runAsAdmin !== undefined && typeof item.runAsAdmin !== 'boolean') {
    errors.push(`${path}.runAsAdmin must be a boolean.`);
  }
}

function validateOptionalString(value: unknown, path: string, errors: string[]): void {
  if (value !== undefined && typeof value !== 'string') {
    errors.push(`${path} must be a string.`);
  }
}

function validateOptionalStringArray(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    errors.push(`${path} must be an array of strings.`);
  }
}

function validateOptionalEnv(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) {
    return;
  }
  if (!isObject(value) || Object.values(value).some((entry) => typeof entry !== 'string')) {
    errors.push(`${path} must be an object with string values.`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
