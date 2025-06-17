import { Box, Container, Stack } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import AccountList from './components/AccountList'
import CustomTitleBar from './components/CustomTitleBar'
import Header from './components/Header'
import PatternBackground from './components/PatternBackground'
import { useColorMode } from './components/ui/color-mode'
import { Toaster } from './components/ui/toaster'
import darkScrollbar from './theme/scrollbar.dark.css?inline'
import lightScrollbar from './theme/scrollbar.light.css?inline'

function App(): React.JSX.Element {

  const { colorMode } = useColorMode()

  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const [containerHeight, setContainerHeight] = useState('calc(100vh - 68px)') // Default height, will be updated on mount
  const [isOverlayPaused, setIsOverlayPaused] = useState(false) // Track overlay state
  useEffect(() => {
    const updateContainerHeight = () => {
      if (headerRef.current && footerRef.current) {
        const headerHeight = headerRef.current.offsetHeight
        const footerHeight = footerRef.current.offsetHeight
        const titleBarHeight = isOverlayPaused ? 32 : 0 // Account for custom title bar
        setContainerHeight(`calc(100vh - ${headerHeight + footerHeight + titleBarHeight}px)`)
      }
    }

    // Initial height calculation
    updateContainerHeight()

    // Update height on window resize
    window.addEventListener('resize', updateContainerHeight)

    return () => {
      window.removeEventListener('resize', updateContainerHeight)
    }
  }, [headerRef, footerRef, isOverlayPaused])

  useEffect(() => {
    // Listen for overlay state changes from main process
    const handleOverlayStateChange = (_event: any, data: { isPaused: boolean }) => {
      setIsOverlayPaused(data.isPaused)
    }

    window.electron.ipcRenderer.on('overlay-state-changed', handleOverlayStateChange)

    return () => {
      window.electron.ipcRenderer.removeListener('overlay-state-changed', handleOverlayStateChange)
    }
  }, [])
  
  return (
    <PatternBackground pattern='isometric' textAlign="center" justifyContent={'center'} h="100vh" display="flex" flexDirection="column" className="dark" overflowX={"hidden"}>
      <Toaster />
      <style>{colorMode === "light" ? lightScrollbar : darkScrollbar}</style>
      
      <CustomTitleBar visible={isOverlayPaused} />
      
      <Box ref={headerRef}>
        <Header />
      </Box>

      <Container maxW="6xl" h={containerHeight} flex="1" p="5" overflowY="scroll">       
        <Stack gap="6" height="100%">
          <Box flex="1">
            <AccountList />
          </Box>
        </Stack>
      </Container>
      
      <Box ref={footerRef}>
        {/*<Footer />*/}
      </Box>
    </PatternBackground>
  )
}

export default App
