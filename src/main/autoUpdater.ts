import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
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
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true;

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
      this.showUpdateAvailableDialog(info);
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
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      this.sendUpdateStatus('update-downloaded', info);
      this.showUpdateReadyDialog(info);
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

    ipcMain.handle('download-update', async () => {
      if (is.dev) {
        return { message: 'Updates disabled in development mode' };
      }
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error('Error downloading update:', error);
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

  private async showUpdateAvailableDialog(info: any) {
    if (!this.mainWindow) return;

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download the update now?`,
      buttons: ['Download Now', 'Download Later', 'Skip This Version'],
      defaultId: 0,
      cancelId: 1
    });

    switch (result.response) {
      case 0: // Download Now
        this.downloadUpdate();
        break;
      case 1: // Download Later
        console.log('User chose to download later');
        break;
      case 2: // Skip This Version
        console.log('User chose to skip this version');
        // You could implement version skipping logic here
        break;
    }
  }

  private async showUpdateReadyDialog(info: any) {
    if (!this.mainWindow) return;

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Update (${info.version}) has been downloaded and is ready to install.`,
      detail: 'The application will restart to apply the update. Any unsaved work should be saved before proceeding.',
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
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

  async downloadUpdate(): Promise<void> {
    if (is.dev) {
      console.log('Auto-updater disabled in development mode');
      return;
    }

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
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
