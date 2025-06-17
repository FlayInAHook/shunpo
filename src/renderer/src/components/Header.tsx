import { Box, Stack, Switch, Text } from "@chakra-ui/react";

function Header() {

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
      <Stack direction="row" gap="2">
        <Switch.Root
          onCheckedChange={(e) => {
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
          <Switch.Label>Pause Overlay</Switch.Label>
        </Switch.Root>
      </Stack>
    </Box>
  );
}

export default Header;
