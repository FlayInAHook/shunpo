import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, Menu, shell, Tray } from 'electron';
import { OverlayController } from 'electron-overlay-window';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import "./encrypt.ts";
import "./riotInteractions.ts";

let mainWindow: BrowserWindow | null = null
let appIcon: Tray | null = null;
function createWindow(): void {
  // Check if menubar and titlebar should be auto-hidden
  const shouldAutoHideMenuBar = !is.dev || process.env.BUILD_TEST === 'true';
  const shouldHideTitleBar = !is.dev || process.env.BUILD_TEST === 'true';
  
  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: shouldAutoHideMenuBar,
    titleBarStyle: shouldHideTitleBar ? 'hidden' : 'default',
    ...(process.platform === 'linux' ? { icon } : {}),    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  
  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // Send window state changes to renderer for custom title bar
  mainWindow.on('maximize', () => {
    mainWindow!.webContents.send('window-maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow!.webContents.send('window-unmaximized')
  })

  // Hide to tray instead of closing on Windows/Linux
  mainWindow.on('close', (event) => {
    if (process.platform !== 'darwin') {
      event.preventDefault()
      mainWindow!.hide()
      
      // Show notification on first minimize to tray
      if (!mainWindow!.isMinimized()) {
        appIcon?.displayBalloon({
          iconType: 'info',
          title: 'Riot Account Manager',
          content: 'App was minimized to tray. Click the tray icon to restore.'
        })
      }
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  makeDemoInteractive()

  /*OverlayController.attachByTitle(
  mainWindow!,
  'Riot Client',
  { 
    hasTitleBarOnMac: true,
    marginPercent: {
      top: 25,
      left: 70,
    },
    selfHandleClickable: true
  })*/
  mainWindow!.setIgnoreMouseEvents(false);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })  // IPC test
  ipcMain.on('ping', (_event, _username: string, _password: string) => {
    console.log('Received ping from renderer process');
  })
  // IPC handler for tray actions
  ipcMain.handle('hide-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  ipcMain.handle('show-from-tray', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  ipcMain.handle('quit-app', () => {
    app.quit()
  })

  // IPC handlers for custom title bar window controls
  ipcMain.handle('is-dev', () => {
    return is.dev
  })

  ipcMain.on('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-unmaximize', () => {
    if (mainWindow) {
      mainWindow.unmaximize()
    }
  })

  ipcMain.on('window-close', () => {
    if (mainWindow) {
      mainWindow.close()
    }
  })
  createWindow()

  // Create system tray
  createTray()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function createTray(): void {
  appIcon = new Tray(icon)
  appIcon.setToolTip('Riot Account Manager')
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show/Hide', 
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide()
          } else {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Restart App', 
      click: () => {
        app.relaunch()
        app.exit()
      }
    },
    { 
      label: 'Quit', 
      click: () => {
        app.quit()
      }
    }
  ])

  appIcon.setContextMenu(contextMenu)
  
  // Handle tray icon click (show/hide window)
  appIcon.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

let isInteractable = false; 
function makeDemoInteractive () {
  // Function to toggle overlay state - available for global shortcuts
  const toggleOverlayState = () => {
    if (isInteractable) {
      isInteractable = false
      OverlayController.focusTarget()
      mainWindow!.webContents.send('focus-change', false)
    } else {
      isInteractable = true
      OverlayController.activateOverlay()
      mainWindow!.webContents.send('focus-change', true)
    }
  }

  mainWindow!.on('blur', () => {
    isInteractable = false
    mainWindow!.webContents.send('focus-change', false)
  })

  // Global shortcuts can be enabled here if needed
  // globalShortcut.register('CmdOrCtrl + J', toggleOverlayState)
  // globalShortcut.register('CmdOrCtrl + L', () => logIntoLeague("", ""))
  
  // Prevent unused function warning
  void toggleOverlayState
}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// Modified: Don't quit when window is closed, keep running in tray
app.on('window-all-closed', () => {
  // Only quit if on macOS and Cmd+Q was pressed, otherwise keep running in tray
  if (process.platform === 'darwin') {
    app.quit()
  }
  // On Windows/Linux, app continues running in system tray
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
