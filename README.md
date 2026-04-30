# CmdLove

CmdLove is a tiny Windows tray launcher for terminal commands and task profiles. It started as a hardcoded ConEmu tray helper and is now a configurable Electron app for launching ConEmu tasks, `cmd.exe`, PowerShell, Windows Terminal, WSL, or a custom executable.

## Product direction

CmdLove is intentionally tray-only. It does not open a browser window, load remote content, or expose Node APIs to a renderer. The tray menu is generated from a user-editable JSON config file and the app focuses on safe process launching, clear validation errors, and simple packaging for Windows.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run validate
npm start
```

Useful scripts:

- `npm run build` compiles TypeScript into `dist/`.
- `npm run lint` runs ESLint.
- `npm run format` checks Prettier formatting.
- `npm test` runs unit tests.
- `npm run dist` builds Windows installer and portable packages with electron-builder.

## Configuration

On first launch, CmdLove writes a default config to Electron's `userData` directory:

- `config.json` is the active user-editable config.
- `config.json.example` is a regenerated example based on built-in defaults.
- `cmdlove.log` contains startup, config, and launch errors.

Use the tray menu to open the config or log file. Use **Reload config** after editing.

### Example config

```json
{
  "terminals": {
    "conemu": {
      "type": "conemu",
      "executable": "C:\\Program Files\\ConEmu\\ConEmu64.exe"
    },
    "cmd": {
      "type": "cmd",
      "executable": "cmd.exe"
    },
    "powershell": {
      "type": "powershell",
      "executable": "powershell.exe"
    },
    "windowsTerminal": {
      "type": "windowsTerminal",
      "executable": "wt.exe"
    },
    "wsl": {
      "type": "wsl",
      "executable": "wsl.exe"
    }
  },
  "defaultTerminal": "conemu",
  "openOnTrayClick": "show-conemu",
  "menu": [
    {
      "type": "command",
      "id": "docker-ps",
      "label": "docker ps -a",
      "terminal": "conemu",
      "command": "docker ps -a"
    },
    {
      "type": "group",
      "label": "PowerShell",
      "items": [
        {
          "type": "command",
          "id": "list-files",
          "label": "List files",
          "terminal": "powershell",
          "command": "Get-ChildItem"
        }
      ]
    }
  ]
}
```

### Terminal profiles

Each terminal profile has a `type` and optional `executable`, `args`, `cwd`, and `env` fields.

Supported terminal types:

- `conemu` launches ConEmu tasks or commands.
- `cmd` launches `cmd.exe /k <command>`.
- `powershell` launches `powershell.exe -NoExit -Command <command>`.
- `windowsTerminal` launches `wt.exe cmd.exe /k <command>`.
- `wsl` launches `wsl.exe --exec sh -lc <command>`.
- `custom` launches an explicitly configured executable.

### Menu items

The `menu` array supports:

- `command` items with `id`, `label`, `command`, `args`, or `task`.
- `group` items with nested `items`.
- `separator` items.

Command items can override the terminal, working directory, environment variables, detached mode, icon, and accelerator. `runAsAdmin` is validated but currently reserved for a future signed Windows launcher integration.

## Security notes

CmdLove avoids `shell: true` when launching commands. Configured command strings are passed as arguments to the selected terminal executable. Treat the config file as trusted local user input; do not paste commands from untrusted sources.

## Packaging and releases

`npm run dist` creates Windows NSIS and portable builds in `release/`. CI validates install, linting, type checking, tests, build, and packaging on Windows. Dependabot is configured for npm and GitHub Actions updates.

## Troubleshooting

- If the tray menu says the config is invalid, open the config from the tray menu, fix the listed validation errors, and click **Reload config**.
- If a command does not launch, open the logs from the tray menu and check the executable path and arguments.
- If ConEmu is installed in a custom location, update the `conemu.executable` path in `config.json`.
