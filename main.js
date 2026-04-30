const { app, Tray, Menu } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

const DEFAULT_CONEMU_PATH = 'C:\\Program Files\\ConEmu\\ConEmu64.exe'
const CONEMU_PATH = process.env.CMDLOVE_CONEMU_PATH || DEFAULT_CONEMU_PATH
const ICON_PATH = path.join(__dirname, 'user.ico')
const RUN_IN_CMD = ['-run', 'cmd', '/k', '-cur_console:']
const SPAWN_OPTIONS = {
  detached: true,
  stdio: 'ignore'
}

const MENU_ITEMS = [
  { separator: true },
  { task: '{sam-api}' },
  { task: '{sam-docker-compose-up}' },
  { task: '{sam-docker-compose-down}' },
  { cmd: 'docker ps -a' },
  { separator: true },
  {
    text: 'Show ConEmu',
    cmd: '-cur_console:n exit'
  },
  {
    text: 'New Console',
    cmd: '-new_console:echo "Welcome!"'
  },
  { separator: true },
  { quit: true }
]

let tray = null

function getCommand(menuItem) {
  if (menuItem.cmd) return [...RUN_IN_CMD, menuItem.cmd]
  if (menuItem.task) return ['-run', menuItem.task]

  return null
}

function runConEmu(command) {
  spawn(CONEMU_PATH, command, SPAWN_OPTIONS).unref()
}

function createMenuItem(menuItem) {
  if (menuItem.quit) return { role: 'quit' }
  if (menuItem.separator) return { type: 'separator' }

  const label = menuItem.text || menuItem.cmd || menuItem.task
  const command = getCommand(menuItem)
  if (!label || !command) throw new Error('Menu item must define both a label and either a command or task')

  return {
    label,
    click() {
      runConEmu(command)
    }
  }
}

app.on('ready', () => {
  tray = new Tray(ICON_PATH)
  tray.setContextMenu(Menu.buildFromTemplate(MENU_ITEMS.map(createMenuItem)))

  tray.on('click', () => runConEmu([...RUN_IN_CMD, '-cur_console:n exit']))
})
