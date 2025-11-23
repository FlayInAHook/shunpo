import {
  IconButton,
  Text
} from '@chakra-ui/react'
import { dismissedUpdateVersionsAtom } from '@renderer/Datastorage'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { toaster } from './ui/toaster'

interface UpdateStatus {
  status: string
  data?: any
}

const resolveVersionFromStatus = (status: UpdateStatus): string | null => {
  const { data } = status ?? {}

  if (!data) {
    return null
  }

  if (typeof data === 'string') {
    return data
  }

  const candidates = [
    data?.version,
    data?.info?.version,
    data?.releaseName,
    data?.name,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }

  return null
}

// Custom hook for update functionality
export const useUpdateManager = () => {
  const [appVersion, setAppVersion] = useState<string>('')
  const [isUpdateReadyToInstall, setIsUpdateReadyToInstall] = useState(false)
  const [availableUpdateVersion, setAvailableUpdateVersion] = useState<string | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [dismissedVersions, setDismissedVersions] = useAtom(dismissedUpdateVersionsAtom)
  const dismissedVersionsRef = useRef<string[]>(dismissedVersions)
  const availableUpdateVersionRef = useRef<string | null>(availableUpdateVersion)

  useEffect(() => {
    dismissedVersionsRef.current = dismissedVersions
  }, [dismissedVersions])

  useEffect(() => {
    availableUpdateVersionRef.current = availableUpdateVersion
  }, [availableUpdateVersion])

  const checkForUpdates = useCallback(async () => {
    try {
      await window.api.checkForUpdates()
    } catch (error) {
      console.error('Error checking for updates:', error)
      throw error
    }
  }, [])

  const maybeOpenModalForVersion = useCallback((incomingVersion: string | null) => {
    const versionToUse = incomingVersion ?? availableUpdateVersionRef.current

    if (!versionToUse) {
      return
    }

    setAvailableUpdateVersion(versionToUse)

    if (!dismissedVersionsRef.current.includes(versionToUse)) {
      setIsUpdateModalOpen(true)
    }
  }, [])

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
        case 'update-available': {
          const version = resolveVersionFromStatus(data)
          if (version) {
            setAvailableUpdateVersion(version)
          }
          break
        }
        case 'error':
          // Silent error logging
          console.error('Update check error:', data)
          break
        case 'download-progress':
          // Silent download progress
          break
        case 'update-downloaded':
          setIsUpdateReadyToInstall(true)
          maybeOpenModalForVersion(resolveVersionFromStatus(data))
          break
      }
    })

    // Auto-check for updates on component mount
    checkForUpdates().catch(() => {
      // Errors already logged in checkForUpdates
    })

    return cleanup
  }, [checkForUpdates, maybeOpenModalForVersion])

  const handleCheckForUpdatesWithToast = useCallback(async () => {
    try {
      await checkForUpdates()
      toaster.create({
        title: 'Checking for updates',
        description: 'Manual update check triggered (Ctrl+Shift+U)',
        type: 'info',
        duration: 2000,
      })
    } catch (error) {
      toaster.create({
        title: 'Error checking for updates',
        description: 'Please try again later.',
        type: 'error',
        duration: 3000,
      })
    }
  }, [checkForUpdates])

  const handleInstallUpdate = useCallback(async () => {
    try {
      setIsUpdateModalOpen(false)
      await window.api.installUpdate()
    } catch (error) {
      toaster.create({
        title: 'Error installing update',
        description: 'Please try again later.',
        type: 'error',
        duration: 3000,
      })
    }
  }, [])

  const dismissUpdateModal = useCallback(() => {
    setIsUpdateModalOpen(false)
  }, [])

  const suppressUpdateForCurrentVersion = useCallback(() => {
    const version = availableUpdateVersionRef.current

    if (!version) {
      setIsUpdateModalOpen(false)
      return
    }

    setDismissedVersions((prev) => {
      if (prev.includes(version)) {
        return prev
      }
      return [...prev, version]
    })
    setIsUpdateModalOpen(false)
  }, [setDismissedVersions])

  return {
    appVersion,
    isUpdateReadyToInstall,
    availableUpdateVersion,
    isUpdateModalOpen,
    handleCheckForUpdatesWithToast,
    handleInstallUpdate,
    dismissUpdateModal,
    suppressUpdateForCurrentVersion
  }
}

// Version display component for header
type VersionDisplayProps = {
  appVersion: string
  isUpdateReadyToInstall: boolean
  onInstallUpdate: () => Promise<void> | void
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({
  appVersion,
  isUpdateReadyToInstall,
  onInstallUpdate,
}) => {
  const handleClick = useCallback(() => {
    void onInstallUpdate()
  }, [onInstallUpdate])

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
          onClick={handleClick}
          title="Install update and restart"
        >
          <FaDownload />
        </IconButton>
      )}
    </>
  )
}

export default VersionDisplay
