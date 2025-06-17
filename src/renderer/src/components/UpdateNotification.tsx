import {
  Alert,
  Button,
  HStack,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { toaster } from './ui/toaster'

interface UpdateStatus {
  status: string
  data?: any
}

export const UpdateNotification: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [appVersion, setAppVersion] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    // Get current app version
    window.api.getAppVersion().then(setAppVersion)

    // Listen for update status changes
    const cleanup = window.api.onUpdateStatus((_event, data: UpdateStatus) => {
      setUpdateStatus(data)
      
      switch (data.status) {        
        case 'checking-for-update':
          toaster.create({
            title: 'Checking for updates...',
            type: 'info',
            duration: 2000,
          })
          break
        case 'update-not-available':
          toaster.create({
            title: 'No updates available',
            description: 'You are using the latest version.',
            type: 'success',
            duration: 3000,
          })
          setUpdateStatus(null)
          break
        case 'error':
          toaster.create({
            title: 'Update check failed',
            description: data.data?.message || 'An error occurred while checking for updates.',
            type: 'error',
            duration: 5000,
          })
          setUpdateStatus(null)
          setIsDownloading(false)
          break
        case 'download-progress':
          setIsDownloading(true)
          break
        case 'update-downloaded':
          setIsDownloading(false)
          toaster.create({
            title: 'Update ready to install',
            description: 'The update has been downloaded and is ready to install.',
            type: 'success',
            duration: 5000,
          })
          break
      }
    })

    return cleanup
  }, [])

  const handleCheckForUpdates = async () => {
    try {
      await window.api.checkForUpdates()    } catch (error) {
      toaster.create({
        title: 'Error checking for updates',
        description: 'Please try again later.',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleDownloadUpdate = async () => {
    try {
      setIsDownloading(true)
      await window.api.downloadUpdate()
    } catch (error) {
      setIsDownloading(false)
      toaster.create({
        title: 'Error downloading update',
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

  if (!updateStatus || updateStatus.status === 'checking-for-update') {
    return (
      <HStack justify="space-between" align="center" p={2}>
        <Text fontSize="sm" color="gray.500">
          Version: {appVersion}
        </Text>
        <Button size="sm" variant="ghost" onClick={handleCheckForUpdates}>
          Check for Updates
        </Button>
      </HStack>
    )
  }

  if (updateStatus.status === 'update-available') {
    return (
      <Alert.Root status="info" bg="blue.50" borderRadius="md" mb={4}>
        <VStack align="start" gap={2} flex={1}>
          <Alert.Title>Update Available!</Alert.Title>
          <Alert.Description>
            A new version ({updateStatus.data?.version}) is available.
            Current version: {appVersion}
          </Alert.Description>
          <HStack gap={2}>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleDownloadUpdate}
              loading={isDownloading}
              loadingText="Downloading..."
            >
              Download Update
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUpdateStatus(null)}
            >
              Later
            </Button>
          </HStack>
        </VStack>
      </Alert.Root>
    )
  }

  if (updateStatus.status === 'download-progress' && isDownloading) {
    const progress = updateStatus.data
    const percent = Math.round(progress?.percent || 0)
    
    return (
      <Alert.Root status="info" bg="blue.50" borderRadius="md" mb={4}>
        <VStack align="start" gap={2} flex={1}>
          <Alert.Title>Downloading Update...</Alert.Title>
          <VStack align="start" gap={1} w="full">
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
              <div 
                style={{ 
                  width: `${percent}%`, 
                  height: '100%', 
                  backgroundColor: '#3182ce', 
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm">
                {progress?.transferred && progress?.total 
                  ? `${(progress.transferred / 1024 / 1024).toFixed(1)} MB / ${(progress.total / 1024 / 1024).toFixed(1)} MB`
                  : 'Downloading...'
                }
              </Text>
              <Text fontSize="sm">{percent}%</Text>
            </HStack>
          </VStack>
        </VStack>
      </Alert.Root>
    )
  }

  if (updateStatus.status === 'update-downloaded') {
    return (
      <Alert.Root status="success" bg="green.50" borderRadius="md" mb={4}>
        <VStack align="start" gap={2} flex={1}>
          <Alert.Title>Update Ready!</Alert.Title>
          <Alert.Description>
            The update has been downloaded and is ready to install.
            The application will restart to apply the update.
          </Alert.Description>
          <HStack gap={2}>
            <Button
              size="sm"
              colorScheme="green"
              onClick={handleInstallUpdate}
            >
              Restart & Install
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUpdateStatus(null)}
            >
              Install Later
            </Button>
          </HStack>
        </VStack>
      </Alert.Root>
    )
  }

  return (
    <HStack justify="space-between" align="center" p={2}>
      <Text fontSize="sm" color="gray.500">
        Version: {appVersion}
      </Text>
      <Button size="sm" variant="ghost" onClick={handleCheckForUpdates}>
        Check for Updates
      </Button>
    </HStack>
  )
}

export default UpdateNotification
