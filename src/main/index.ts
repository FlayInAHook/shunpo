import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { OverlayController } from 'electron-overlay-window';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import "./encrypt.ts";
//import "./riotInteractions.ts";

let mainWindow: BrowserWindow | null = null
function createWindow(): void {
  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
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
  })

  // IPC test
  ipcMain.on('ping', (evet, username: string, password: string) => {
    console.log('Received ping from renderer process');
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})



const toggleMouseKey = 'CmdOrCtrl + J'
const toggleShowKey = 'CmdOrCtrl + K'


let isInteractable = false; 
function makeDemoInteractive () {
  

  function toggleOverlayState () {
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

  //globalShortcut.register(toggleMouseKey, toggleOverlayState)
  //globalShortcut.register("CmdOrCtrl + L", () => logIntoLeague("", ""))

}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
