import { Box, Button, Dialog, Heading, List } from "@chakra-ui/react";
import { changelog } from "@renderer/changelog";
import { lastSeenChangelogVersionAtom } from "@renderer/Datastorage";
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
        <Dialog.Content textAlign="left">
          <Dialog.Header>
            <Dialog.Title>What&apos;s new</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Box maxH="60vh" overflowY="auto">
              {changelog.map((entry) => (
                <Box key={entry.version} mb="4">
                  <Heading size="sm" mb="1">
                    v{entry.version}
                  </Heading>
                  <List.Root ps="4">
                    {entry.changes.map((change) => (
                      <List.Item key={change}>{change}</List.Item>
                    ))}
                  </List.Root>
                </Box>
              ))}
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
