export type TerminalType =
  | 'cmd'
  | 'powershell'
  | 'windowsTerminal'
  | 'conemu'
  | 'wsl'
  | 'custom';

export interface TerminalProfile {
  type: TerminalType;
  executable?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface CommandMenuItem {
  type: 'command';
  id: string;
  label: string;
  terminal?: string;
  command?: string;
  args?: string[];
  task?: string;
  cwd?: string;
  env?: Record<string, string>;
  detached?: boolean;
  runAsAdmin?: boolean;
  accelerator?: string;
  icon?: string;
}

export interface SeparatorMenuItem {
  type: 'separator';
}

export interface GroupMenuItem {
  type: 'group';
  label: string;
  items: ConfigMenuItem[];
}

export type ConfigMenuItem =
  | CommandMenuItem
  | SeparatorMenuItem
  | GroupMenuItem;

export interface CmdLoveConfig {
  terminals: Record<string, TerminalProfile>;
  defaultTerminal: string;
  openOnTrayClick?: string;
  menu: ConfigMenuItem[];
}

export interface ConfigLoadResult {
  config: CmdLoveConfig;
  configPath: string;
  errors: string[];
}
