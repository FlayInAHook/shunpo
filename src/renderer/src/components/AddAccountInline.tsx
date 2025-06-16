import { Box, Button, Grid, Input, Stack, Text } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useState } from "react";
import { FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { Account, accountsAtom } from "../Datastorage";

function AddAccountInline() {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    setIsAdding(true);
    setError("");
  };

  const handleSave = () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    // Check for duplicate username
    const existingAccount = accounts.find(
      account => account.username.toLowerCase() === username.trim().toLowerCase()
    );
    
    if (existingAccount) {
      setError("An account with this username already exists");
      return;
    }

    const newAccount: Account = {
      username: username.trim(),
      password: password.trim(),
    };

    setAccounts([...accounts, newAccount]);
    
    // Reset form
    setUsername("");
    setPassword("");
    setIsAdding(false);
    setError("");
  };
  const handleCancel = () => {
    setUsername("");
    setPassword("");
    setIsAdding(false);
    setError("");
  };
  if (isAdding) {
    return (
      <Box>        <Grid
          templateColumns="1fr 1fr auto"
          gap="3"
          p="3"
          bg="gray.50"
          _dark={{ bg: "gray.700", borderColor: "gray.600" }}
          borderRadius="md"
          border="2px"
          borderColor="gray.200"
        >
          <Input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="Username"
            size="sm"
            colorPalette="riot"
            autoFocus
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
            size="sm"
            colorPalette="riot"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
          <Stack direction="row" gap="1">
            <Button
              size="sm"
              colorPalette="riot"
              onClick={handleSave}
              disabled={!username.trim() || !password.trim()}
              title="Save account"
            >
              <FaSave />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              title="Cancel"
            >
              <FaTimes />
            </Button>
          </Stack>
        </Grid>
        {error && (
          <Text
            fontSize="sm"
            color="red.500"
            mt="2"
            px="3"
            fontWeight="medium"
          >
            {error}
          </Text>
        )}
      </Box>
    );
  }
  return (
    <Box textAlign="center" py="2">
      <Button
        colorPalette="riot"
        size="lg"
        onClick={handleAdd}
      >
        <FaPlus />
        Add Account
      </Button>
    </Box>
  );
}

export default AddAccountInline;
