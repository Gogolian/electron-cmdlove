// Modules to control application life and create native browser window
const { app, Tray, Menu } = require('electron')

const { spawn, exec } = require('child_process');


const path = require('path')

const iconpath = path.join(__dirname, 'user.ico')

let tray = null

app.on('ready', () =>{

  tray = new Tray(iconpath)

  const conemu = "C:\\Program Files\\ConEmu\\ConEmu64.exe"

  const runcmd = ['-run', 'cmd', '/k', '-cur_console:',]

  const ops = {
    detached: true,
    stdio: 'ignore'
  }

  let separator = true, quit = true;

  const menu = [
    {
      separator
    },
    {
      task: '{sam-api}'
    },
    {
      task: '{sam-docker-compose-up}'
    },
    {
      task: '{sam-docker-compose-down}'
    },
    {
      cmd: 'docker ps -a'
    },
    {
      separator
    },
    {
      text: 'Show ConEmu',
      cmd: '-cur_console:n exit'
    },
    {
      text: 'New Console',
      cmd: '-new_console:echo "Welcome!"'
    },
    {
      separator
    },
    {
      quit
    }
  ]


  const contextMenu = Menu.buildFromTemplate(menu.map((mi)=>{

    if(mi.quit) return { role: 'quit' }
    if(mi.separator) return { type: 'separator' }

    let label = mi.text || mi.cmd || mi.task || 'No Name';

    let command = mi.cmd ? [...runcmd, mi.cmd] :  mi.task ? ['-run', mi.task] : [] 

    return {
        label,
        click: function () {
          spawn(conemu, command, ops)
        }
    }

  }));

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    spawn(conemu, [...runcmd, '-cur_console:n exit'], ops)
  })

})