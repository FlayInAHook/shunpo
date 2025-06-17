import { ElectronAPI } from '@electron-toolkit/preload'

interface UpdateAPI {
  checkForUpdates: () => Promise<any>
  downloadUpdate: () => Promise<any>
  installUpdate: () => Promise<void>
  getAppVersion: () => Promise<string>
  onUpdateStatus: (callback: (event: any, data: any) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: UpdateAPI
  }
}
