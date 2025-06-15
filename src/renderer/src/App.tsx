import { Box, Container, Stack } from '@chakra-ui/react'
import AccountList from './components/AccountList'
import AddAccountModal from './components/AddAccountModal'
import Footer from './components/Footer'
import Header from './components/Header'
import { useColorMode } from './components/ui/color-mode'
import darkScrollbar from './theme/scrollbar.dark.css?inline'
import lightScrollbar from './theme/scrollbar.light.css?inline'

function App(): React.JSX.Element {

  const { toggleColorMode, colorMode } = useColorMode()
  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <style>{colorMode === "light" ? lightScrollbar : darkScrollbar}</style>
      <Header />

      <Container maxW="6xl" h="calc(100vh - 64px)" flex="1" p="6" overflow="scroll">
        <Stack gap="6" height="100%">
          <Box flex="1">
            <AccountList />
          </Box>            
          <Box textAlign="center">
            <AddAccountModal />
          </Box>
        </Stack>
      </Container>
      
      <Footer />
    </Box>
  )
}

export default App
