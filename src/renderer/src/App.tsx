import { Box, Container, Stack } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import AccountList from './components/AccountList'
import Footer from './components/Footer'
import Header from './components/Header'
import { useColorMode } from './components/ui/color-mode'
import { Toaster } from './components/ui/toaster'
import darkScrollbar from './theme/scrollbar.dark.css?inline'
import lightScrollbar from './theme/scrollbar.light.css?inline'

function App(): React.JSX.Element {

  const { colorMode } = useColorMode()

  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const [containerHeight, setContainerHeight] = useState('calc(100vh - 68px)') // Default height, will be updated on mount

  useEffect(() => {
    const updateContainerHeight = () => {
      if (headerRef.current && footerRef.current) {
        const headerHeight = headerRef.current.offsetHeight
        const footerHeight = footerRef.current.offsetHeight
        setContainerHeight(`calc(100vh - ${headerHeight + footerHeight}px)`)
      }
    }

    // Initial height calculation
    updateContainerHeight()

    // Update height on window resize
    window.addEventListener('resize', updateContainerHeight)

    return () => {
      window.removeEventListener('resize', updateContainerHeight)
    }
  }, [headerRef, footerRef])
  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <Toaster />
      <style>{colorMode === "light" ? lightScrollbar : darkScrollbar}</style>
      <Box ref={headerRef}>
        <Header />
      </Box>

      <Container maxW="6xl" h={containerHeight} flex="1" p="5" overflowY="scroll">        <Stack gap="6" height="100%">
          <Box flex="1">
            <AccountList />
          </Box>        </Stack>
      </Container>
      
      <Box ref={footerRef}>
        <Footer />
      </Box>
    </Box>
  )
}

export default App
