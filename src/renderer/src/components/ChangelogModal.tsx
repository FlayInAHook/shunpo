import { Box, Button, Dialog, Text } from "@chakra-ui/react";
import { lastSeenChangelogVersionAtom } from "@renderer/Datastorage";
import changelog from "../../../../CHANGELOG.md?raw";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

function ChangelogModal() {
  const [lastSeenVersion, setLastSeenVersion] = useAtom(lastSeenChangelogVersionAtom);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.api.getAppVersion().then((version) => {
      // ponytail: skip the modal on a brand new install, only show after an update
      if (lastSeenVersion && lastSeenVersion !== version) {
        setOpen(true);
      }
      if (lastSeenVersion !== version) {
        setLastSeenVersion(version);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)} modal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>What&apos;s new</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Box whiteSpace="pre-wrap" fontSize="sm" maxH="60vh" overflowY="auto">
              <Text as="pre" whiteSpace="pre-wrap" fontFamily="inherit">
                {changelog}
              </Text>
            </Box>
          </Dialog.Body>
          <Dialog.Footer>
            <Button colorPalette="riot" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default ChangelogModal;
