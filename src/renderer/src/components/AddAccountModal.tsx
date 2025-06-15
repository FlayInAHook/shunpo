import {
  Button,
  Dialog,
  Input,
  Stack,
  Text
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Account, accountsAtom } from "../Datastorage";

function AddAccountModal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!username || !password) return;
    
    const newAccount: Account = {
      username,
      password,
    };
    
    setAccounts([...accounts, newAccount]);
    
    // Reset form
    setUsername("");
    setPassword("");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setUsername("");
    setPassword("");
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger>
        <Button
          colorPalette="riot"
          size="lg"
          mb="1"
        >
          <FaPlus />
          Add Account
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Text fontSize="xl" fontWeight="bold" color="riot.500">Add New Account</Text>
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap="4">
              <Stack gap="2">
                <Text fontWeight="medium">Username</Text>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  colorPalette="riot"
                />
              </Stack>
              
              <Stack gap="2">
                <Text fontWeight="medium">Password</Text>
                <Input
                  type="password"                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  colorPalette="riot"
                />
              </Stack>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer>
            <Stack direction="row" gap="3" width="100%">
              <Button
                colorPalette="riot"
                onClick={handleSubmit}
                disabled={!username || !password}
                flex="1"
              >
                Add Account
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                flex="1"
              >
                Cancel
              </Button>
            </Stack>          
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default AddAccountModal;
