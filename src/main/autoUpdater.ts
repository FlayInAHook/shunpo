import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupAutoUpdater();
    this.setupIpcHandlers();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }
  private setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = true; // Automatically download updates
    autoUpdater.autoInstallOnAppQuit = false; // Do not auto-install on quit

    // Only check for updates in production
    if (is.dev) {
      console.log('Auto-updater disabled in development mode');
      return;
    }

    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      this.sendUpdateStatus('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      this.sendUpdateStatus('update-available', info);
      // No dialog - just let it auto-download
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
      this.sendUpdateStatus('update-not-available', info);
    });

    autoUpdater.on('error', (err) => {
      console.error('Auto-updater error:', err);
      this.sendUpdateStatus('error', { message: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log('Download progress:', progressObj);
      this.sendUpdateStatus('download-progress', progressObj);
    });    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      this.sendUpdateStatus('update-downloaded', info);
      // No dialog - just notify via status that update is ready
    });
  }
  private setupIpcHandlers() {
    ipcMain.handle('check-for-updates', async () => {
      if (is.dev) {
        return { message: 'Updates disabled in development mode' };
      }
      try {
        const result = await autoUpdater.checkForUpdates();
        return result;
      } catch (error) {
        console.error('Error checking for updates:', error);
        throw error;
      }
    });

    ipcMain.handle('install-update', () => {
      autoUpdater.quitAndInstall();
    });

    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });
  }
  private sendUpdateStatus(status: string, data?: any) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('update-status', { status, data });
    }
  }
  async checkForUpdates(): Promise<void> {
    if (is.dev) {
      console.log('Auto-updater disabled in development mode');
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  startPeriodicUpdateCheck(intervalHours: number = 6): void {
    if (is.dev) {
      console.log('Periodic update check disabled in development mode');
      return;
    }

    // Clear existing interval if any
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Set up periodic check (convert hours to milliseconds)
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);

    console.log(`Periodic update check started (every ${intervalHours} hours)`);
  }

  stopPeriodicUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      console.log('Periodic update check stopped');
    }
  }
}

export const appUpdater = new AutoUpdater();
