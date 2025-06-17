import { Box, Stack, Switch, Text } from "@chakra-ui/react";
import { accountsAtom } from "@renderer/Datastorage";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

function Header() {
  const [isOverlayPaused, setIsOverlayPaused] = useState(false);
  const accounts = useAtomValue(accountsAtom);

  const [showAmount, setShowAmount] = useState(false);

  useHotkeys('ctrl+shift+a', () => {
    setShowAmount(!showAmount);
  }, [showAmount]);

  useEffect(() => {
    // Listen for overlay state changes from main process
    const handleOverlayStateChange = (_event: any, data: { isPaused: boolean }) => {
      setIsOverlayPaused(data.isPaused);
    };

    window.electron.ipcRenderer.on('overlay-state-changed', handleOverlayStateChange);

    return () => {
      window.electron.ipcRenderer.removeListener('overlay-state-changed', handleOverlayStateChange);
    };
  }, []);

  return (
    <Box
      bg="riot.400"
      color="white"
      p="4"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      boxShadow="md"
    >
      <Text fontSize="xl" fontWeight="bold">
        Shunpo - LoL Account Manager
      </Text>
      {showAmount && <Text>
        {accounts.length + " Acc(s)"}
      </Text>}
      <Stack direction="row" gap="2">
        <Switch.Root
          checked={isOverlayPaused}
          onCheckedChange={(e) => {
            setIsOverlayPaused(e.checked);
            if (e.checked) {
              window.electron.ipcRenderer.send("pauseOverlayAttach");
            } else {
              window.electron.ipcRenderer.send("resumeOverlayAttach");
            }
          }}
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>
            {isOverlayPaused ? 'Resume Overlay (Hide Title Bar)' : 'Pause Overlay (Show Title Bar)'}
          </Switch.Label>
        </Switch.Root>
      </Stack>
    </Box>
  );
}

export default Header;
