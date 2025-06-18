import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, Menu, shell, Tray } from 'electron';
import { OverlayController } from 'electron-overlay-window';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import { appUpdater } from './autoUpdater';
import "./encrypt.ts";
import "./riotInteractions.ts";

let mainWindow: BrowserWindow | null = null
let appIcon: Tray | null = null;

// Single instance functionality
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {  
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window instead.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })
}

// Auto-start functionality
function getAutoStartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

function setAutoStartEnabled(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: enabled, // Start minimized to tray when auto-started
  });
}

// Cleanup function to remove config data
function cleanupConfigData(): void {
  try {
    const configDir = join(app.getPath('userData'), 'config');
    if (existsSync(configDir)) {
      rmSync(configDir, { recursive: true, force: true });
      console.log('Config data cleaned up successfully');
    }
  } catch (error) {
    console.error('Error cleaning up config data:', error);
  }
}

// First run detection and default auto-start setup
function setupDefaultAutoStart(): void {
  try {
    const configDir = join(app.getPath('userData'), 'config');
    const configFile = join(configDir, 'config.json');
    console.log('Config directory:', configDir);
    
    // Check if config file exists (indicates previous installation)
    if (!existsSync(configFile)) {
      // First run - enable auto-start by default
      if (process.platform === 'win32' && !is.dev) {
        setAutoStartEnabled(true);
        
        // Show notification about auto-start being enabled
        setTimeout(() => {
          appIcon?.displayBalloon({
            iconType: 'info',
            title: 'Riot Account Manager',
            content: 'Auto-start with Windows has been enabled by default. You can disable this in the tray menu.'
          })
        }, 3000); // Delay to ensure tray is created
      }
      
      // Create config directory and file to mark as initialized
      if (!existsSync(configDir)) {
        require('fs').mkdirSync(configDir, { recursive: true });
      }
      
      writeFileSync(configFile, JSON.stringify({
        firstRunCompleted: true,
        autoStartEnabledByDefault: true,
        createdAt: new Date().toISOString()
      }, null, 2));
    }
  } catch (error) {
    console.error('Error setting up default auto-start:', error);
  }
}
function createWindow(showWindow: boolean = true): void {
  // Check if menubar and titlebar should be auto-hidden
  const shouldAutoHideMenuBar = !is.dev || process.env.BUILD_TEST === 'true';
  const shouldAttachOverlay = !is.dev || process.env.BUILD_TEST === 'true';
  
  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: shouldAutoHideMenuBar,
    titleBarStyle: 'hidden', // Always use hidden - we'll manage custom title bar in React
    ...(process.platform === 'linux' ? { icon } : {}),    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  
  if (showWindow) {
    console.log('Main window is ready to show')
    mainWindow!.show()
    mainWindow!.focus()
  } else {
    mainWindow.minimize() // Start minimized to tray if auto-started
  }

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
          title: 'Shunpo - LoL Account Manager',
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
  if (shouldAttachOverlay) {
    OverlayController.attachByTitle(
      mainWindow!,
      'Riot Client',
      {
        hasTitleBarOnMac: true,
        marginPercent: {
          top: 25,
          left: 50,
        },
        selfHandleClickable: true
      }
    )
  }
  mainWindow!.setIgnoreMouseEvents(false);

  // Set main window for auto-updater
  appUpdater.setMainWindow(mainWindow!);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Setup default auto-start on first run
  setupDefaultAutoStart()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  // Check if app was started by Windows startup (auto-start)
  const wasAutoStarted = process.argv.includes('--hidden') || app.getLoginItemSettings().wasOpenedAsHidden;
  
  // IPC test
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

  // IPC handler for cleaning up config data (useful for testing or reset functionality)
  ipcMain.handle('cleanup-config-data', () => {
    cleanupConfigData()
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
    app.exit();
  })
  ipcMain.on("pauseOverlayAttach", () => {
    OverlayController.pause();
    mainWindow?.show();
    mainWindow?.focus();
    setTimeout(() => {
      mainWindow?.show();
      mainWindow?.focus();
    }, 10);
    
    // Notify renderer that overlay is paused (title bar should be shown)
    mainWindow?.webContents.send('overlay-state-changed', { isPaused: true });
  })

  ipcMain.on("resumeOverlayAttach", () => {
    mainWindow?.unmaximize();
    OverlayController.resume();
    OverlayController.resetPosition();
    setTimeout(() => {
      mainWindow?.minimize();
    }, 10);
    
    // Notify renderer that overlay is resumed (title bar should be hidden)
    mainWindow?.webContents.send('overlay-state-changed', { isPaused: false });
  })

    // Create window - don't show if auto-started
  createWindow(!wasAutoStarted)
  // Create system tray
  createTray()

  // Start periodic update checks (every 6 hours)
  appUpdater.startPeriodicUpdateCheck(1)

  // Check for updates on startup (delayed to let the app fully load)
  setTimeout(() => {
    appUpdater.checkForUpdates()
  }, 5000) // 5 second delay

  // Show notification if auto-started
  if (wasAutoStarted) {
    setTimeout(() => {
      appIcon?.displayBalloon({
        iconType: 'info',
        title: 'Shunpo - LoL Account Manager',
        content: 'App started with Windows and is running in the system tray.'
      })
    }, 2000) // Small delay to ensure tray is created
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function createTray(): void {
  appIcon = new Tray(icon)
  appIcon.setToolTip('Riot Account Manager')
  
  const updateContextMenu = () => {
    const isAutoStartEnabled = getAutoStartEnabled();
    
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
        label: 'Start on Windows Startup',
        type: 'checkbox',
        checked: isAutoStartEnabled,
        click: () => {
          const newState = !getAutoStartEnabled();
          setAutoStartEnabled(newState);
          // Update the menu to reflect the new state
          updateContextMenu();        }
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => {
          appUpdater.checkForUpdates()
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
          app.exit()
        }
      }
    ])

    appIcon!.setContextMenu(contextMenu)
  }

  // Initial menu creation
  updateContextMenu()
  
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


function makeDemoInteractive () {

  mainWindow!.on('blur', () => {
    mainWindow!.webContents.send('focus-change', false)
  })
}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// Modified: Don't quit when window is closed, keep running in tray
app.on('window-all-closed', () => {
  // Only quit if on macOS and Cmd+Q was pressed, otherwise keep running in tray
  if (process.platform === 'darwin') {
    app.quit()
  }  // On Windows/Linux, app continues running in system tray
})

// Handle app quit events
app.on('before-quit', () => {
  // Note: We don't clean up config data here as it should persist between sessions
  // The cleanup only happens during uninstall via the NSIS script
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
