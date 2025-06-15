import { Box, Stack, Text } from "@chakra-ui/react";
import Versions from "./Versions";

function Footer() {
  return (
    <Box
      bg="gray.100"
      _dark={{ bg: "gray.800", borderColor: "gray.600" }}
      p="4"
      borderTop="1px"
      borderColor="gray.200"
      textAlign="center"
    >
      <Stack gap="3">
        <Stack gap="1">
          <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
            Riot Account Manager v1.0.0
          </Text>
          <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.500" }}>
            Built with Electron + React
          </Text>
        </Stack>
        <Versions />
      </Stack>
    </Box>
  );
}

export default Footer;
