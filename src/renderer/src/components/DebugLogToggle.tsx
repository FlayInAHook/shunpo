import { HStack, Switch, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

function DebugLogToggle() {
  const [enabled, setEnabled] = useState(false)
  const [logFile, setLogFile] = useState('')

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('debugLogging:get')
      .then((state: { enabled: boolean; logFile: string }) => {
        setEnabled(state.enabled)
        setLogFile(state.logFile)
      })
  }, [])

  return (
    <HStack justify="center" gap="3" py="1" opacity={enabled ? 1 : 0.4} _hover={{ opacity: 1 }}>
      <Switch.Root
        size="sm"
        checked={enabled}
        onCheckedChange={(e) => {
          setEnabled(e.checked)
          window.electron.ipcRenderer.invoke('debugLogging:set', e.checked)
        }}
      >
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label fontSize="xs">Debug logging</Switch.Label>
      </Switch.Root>
      {enabled && (
        <Text fontSize="xs" color="gray.500">
          {logFile}
        </Text>
      )}
    </HStack>
  )
}

export default DebugLogToggle
