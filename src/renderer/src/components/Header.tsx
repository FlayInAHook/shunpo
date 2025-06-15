import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { FaCog, FaUser } from "react-icons/fa";

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
        Riot Account Manager
      </Text>
      <Stack direction="row" gap="2">
        <Button
          size="sm"
          variant="ghost"
          color="white"
          _hover={{ bg: "riot.600" }}
        >
          <FaUser />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          color="white"
          _hover={{ bg: "riot.600" }}
        >
          <FaCog />
        </Button>
      </Stack>
    </Box>
  );
}

export default Header;
