import {
  IconButton,
  Text
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { toaster } from './ui/toaster'

interface UpdateStatus {
  status: string
  data?: any
}

// Custom hook for update functionality
export const useUpdateManager = () => {
  const [appVersion, setAppVersion] = useState<string>('')
  const [isUpdateReadyToInstall, setIsUpdateReadyToInstall] = useState(false)

  useEffect(() => {
    // Get current app version
    window.api.getAppVersion().then(setAppVersion)

    // Listen for update status changes
    const cleanup = window.api.onUpdateStatus((_event, data: UpdateStatus) => {
      switch (data.status) {        
        case 'checking-for-update':
          // Silent check, no toast
          break
        case 'update-not-available':
          // Silent, no toast needed
          break
        case 'update-available':
          // Silent - download happens automatically in electron
          break
        case 'error':
          // Silent error logging
          console.error('Update check error:', data)
          break
        case 'download-progress':
          // Silent download progress
          break
        case 'update-downloaded':
          setIsUpdateReadyToInstall(true)
          // Silent - only show download arrow
          break
      }
    })

    // Auto-check for updates on component mount
    handleCheckForUpdates()

    return cleanup
  }, [])

  const handleCheckForUpdates = async () => {
    try {
      await window.api.checkForUpdates()
    } catch (error) {
      console.error('Error checking for updates:', error)
    }
  }

  const handleCheckForUpdatesWithToast = async () => {
    try {
      await window.api.checkForUpdates()
      toaster.create({
        title: 'Checking for updates',
        description: 'Manual update check triggered (Ctrl+Shift+U)',
        type: 'info',
        duration: 2000,
      })
    } catch (error) {
      console.error('Error checking for updates:', error)
      toaster.create({
        title: 'Error checking for updates',
        description: 'Please try again later.',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleInstallUpdate = async () => {
    try {
      await window.api.installUpdate()
    } catch (error) {
      toaster.create({
        title: 'Error installing update',
        description: 'Please try again later.',
        type: 'error',
        duration: 3000,
      })
    }
  }

  return {
    appVersion,
    isUpdateReadyToInstall,
    handleCheckForUpdatesWithToast,
    handleInstallUpdate
  }
}

// Version display component for header
export const VersionDisplay: React.FC = () => {
  const { appVersion, isUpdateReadyToInstall, handleInstallUpdate } = useUpdateManager()

  return (
    <>
      <Text fontSize="xl" color="white" fontStyle="italic">
        v{appVersion}
      </Text>
      {isUpdateReadyToInstall && (
        <IconButton
          size="sm"
          colorScheme="green"
          variant="solid"
          onClick={handleInstallUpdate}
          title="Install update and restart"
        >
          <FaDownload />
        </IconButton>
      )}
    </>
  )
}

export default VersionDisplay
