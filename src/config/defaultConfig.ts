import type { CmdLoveConfig } from './types.js';

export const defaultConfig: CmdLoveConfig = {
  terminals: {
    conemu: {
      type: 'conemu',
      executable: 'C:\\Program Files\\ConEmu\\ConEmu64.exe',
    },
    cmd: {
      type: 'cmd',
      executable: 'cmd.exe',
    },
    powershell: {
      type: 'powershell',
      executable: 'powershell.exe',
    },
    windowsTerminal: {
      type: 'windowsTerminal',
      executable: 'wt.exe',
    },
    wsl: {
      type: 'wsl',
      executable: 'wsl.exe',
    },
  },
  defaultTerminal: 'conemu',
  openOnTrayClick: 'show-conemu',
  menu: [
    { type: 'separator' },
    {
      type: 'command',
      id: 'sam-api',
      label: 'ConEmu task: sam-api',
      terminal: 'conemu',
      task: '{sam-api}',
    },
    {
      type: 'command',
      id: 'sam-docker-compose-up',
      label: 'ConEmu task: sam-docker-compose-up',
      terminal: 'conemu',
      task: '{sam-docker-compose-up}',
    },
    {
      type: 'command',
      id: 'sam-docker-compose-down',
      label: 'ConEmu task: sam-docker-compose-down',
      terminal: 'conemu',
      task: '{sam-docker-compose-down}',
    },
    {
      type: 'command',
      id: 'docker-ps',
      label: 'docker ps -a',
      terminal: 'conemu',
      command: 'docker ps -a',
    },
    { type: 'separator' },
    {
      type: 'command',
      id: 'show-conemu',
      label: 'Show ConEmu',
      terminal: 'conemu',
      command: '-cur_console:n exit',
    },
    {
      type: 'command',
      id: 'new-console',
      label: 'New Console',
      terminal: 'conemu',
      command: '-new_console:echo "Welcome!"',
    },
  ],
};
