import { Box, Button, HStack, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { VscChromeMaximize, VscChromeMinimize, VscChromeRestore, VscClose } from "react-icons/vsc";
import Icon from "../assets/icon.png";

interface CustomTitleBarProps {
  visible: boolean;
}

function CustomTitleBar({ visible }: CustomTitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Listen for window state changes
    const handleMaximized = () => setIsMaximized(true);
    const handleUnmaximized = () => setIsMaximized(false);

    window.electron.ipcRenderer.on('window-maximized', handleMaximized);
    window.electron.ipcRenderer.on('window-unmaximized', handleUnmaximized);

    return () => {
      window.electron.ipcRenderer.removeListener('window-maximized', handleMaximized);
      window.electron.ipcRenderer.removeListener('window-unmaximized', handleUnmaximized);
    };
  }, []);

  const handleMinimize = () => {
    window.electron.ipcRenderer.send('window-minimize');
  };

  const handleMaximize = () => {
    if (isMaximized) {
      window.electron.ipcRenderer.send('window-unmaximize');
    } else {
      window.electron.ipcRenderer.send('window-maximize');
    }
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send('window-close');
  };

  if (!visible) return null;

  return (
    <Box
      h="32px"
      bg="gray.900"
      color="white"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      px="4"
      userSelect="none"
      style={{
        WebkitAppRegion: 'drag'
      } as any}
      borderBottom="1px solid"
      borderColor="gray.700"
    >
      <Image src={Icon} alt="Shunpo Icon" boxSize="20px" />
      
      <HStack gap="0" style={{ WebkitAppRegion: 'no-drag' } as any}>        
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          h="28px"
          w="46px"
          borderRadius="0"
          _hover={{ bg: "gray.700" }}
          onClick={handleMinimize}
        >
          <VscChromeMinimize />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          h="28px"
          w="46px"
          borderRadius="0"
          _hover={{ bg: "gray.700" }}
          onClick={handleMaximize}
        >
          {isMaximized ? <VscChromeRestore /> : <VscChromeMaximize />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          h="28px"
          w="46px"
          borderRadius="0"
          _hover={{ bg: "red.600" }}
          onClick={handleClose}
        >
          <VscClose />
        </Button>
      </HStack>
    </Box>
  );
}

export default CustomTitleBar;
