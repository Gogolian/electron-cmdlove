const { app, Tray, Menu } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

const CONEMU_PATH = 'C:\\Program Files\\ConEmu\\ConEmu64.exe'
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

  return []
}

function runConEmu(command) {
  spawn(CONEMU_PATH, command, SPAWN_OPTIONS)
}

function createMenuItem(menuItem) {
  if (menuItem.quit) return { role: 'quit' }
  if (menuItem.separator) return { type: 'separator' }

  const label = menuItem.text || menuItem.cmd || menuItem.task || 'No Name'
  const command = getCommand(menuItem)

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
