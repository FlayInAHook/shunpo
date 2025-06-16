import { Box, Button, Checkbox, Grid, Input, Popover, Stack, Text } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useRef, useState } from "react";
import { FaDownload, FaPlus, FaSave, FaTimes, FaUpload } from "react-icons/fa";
import { Account, accountsAtom } from "../Datastorage";
import { toaster } from "./ui/toaster";

function AddAccountInline() {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [overrideAll, setOverrideAll] = useState(false);
  const [importOnlyCredentials, setImportOnlyCredentials] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  function handleAdd() {
    setIsAdding(true);
    setError("");
  }
  function handleSave() {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    const existingAccount = accounts.find(
      account => account.username.toLowerCase() === username.trim().toLowerCase()
    );
    
    if (existingAccount) {
      toaster.error({
        title: "Account with this username already exists",
      })
      return;
    }

    const newAccount: Account = {
      username: username.trim(),
      password: password.trim(),
    };

    setAccounts([...accounts, newAccount]);
    
    setUsername("");
    setPassword("");
    setIsAdding(false);
    setError("");
  }
  function handleCancel() {
    setUsername("");
    setPassword("");
    setIsAdding(false);
    setError("");
  }
  function handleExport() {
    const dataStr = JSON.stringify(accounts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'riot-accounts.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toaster.success({
      title: "Accounts exported successfully",
    });
  }
  function handleImportClick() {
    setIsImportOpen(true);
  }
  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string) as Account[];
        
        if (!Array.isArray(importedData)) {
          toaster.error({
            title: "Invalid file format",
            description: "Please select a valid JSON file with account data",
          });
          return;
        }

        let processedAccounts: Account[];
        
        if (overrideAll) {
          processedAccounts = importedData;
        } else {
          const existingUsernames = new Set(accounts.map(acc => acc.username.toLowerCase()));
          const newAccounts = importedData.filter(acc => 
            !existingUsernames.has(acc.username.toLowerCase())
          );
          
          if (importOnlyCredentials) {
            processedAccounts = [
              ...accounts,
              ...newAccounts.map(acc => ({
                username: acc.username,
                password: acc.password,
              }))
            ];
          } else {
            processedAccounts = [...accounts, ...newAccounts];
          }
        }

        setAccounts(processedAccounts);
        
        const addedCount = overrideAll ? importedData.length : 
          (processedAccounts.length - accounts.length);
        
        toaster.success({
          title: `Successfully imported ${addedCount} accounts`,
        });
        
        setIsImportOpen(false);
        
      } catch (error) {
        toaster.error({
          title: "Import failed",
          description: "Please select a valid JSON file",
        });
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  }

  function handleOverrideAllChange(e: any) {
    setOverrideAll(e.checked === true);
  }

  function handleImportOnlyCredentialsChange(e: any) {
    setImportOnlyCredentials(e.checked === true);
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
    setError("");
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    setError("");
  }

  function handlePasswordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }

  function handleImportOpenChange(e: any) {
    setIsImportOpen(e.open);
  }

  function handleImportCancel() {
    setIsImportOpen(false);
  }

  if (isAdding) {
    return (
      <Box>        
        <Grid
          templateColumns="1fr 1fr auto"
          gap="3"
          p="3"
          bg="gray.50"
          _dark={{ bg: "gray.700", borderColor: "gray.600" }}
          borderRadius="md"
          border="2px"
          borderColor="gray.200"
          mb="4"
        >
          <Input
            value={username}
            onChange={handleUsernameChange}
            placeholder="Username"
            size="sm"
            colorPalette="riot"
            autoFocus
          />
          <Input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Password"
            size="sm"
            colorPalette="riot"
            onKeyDown={handlePasswordKeyDown}
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
  }  return (
    <Box textAlign="center" py="2">
      <Stack direction="row" gap="3" justifyContent="center">
        <Button
          colorPalette="riot"
          size="lg"
          onClick={handleAdd}
        >
          <FaPlus />
          Add Account
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={handleExport}
          disabled={accounts.length === 0}
        >
          <FaDownload />
          Export
        </Button>
        
        <Popover.Root open={isImportOpen} onOpenChange={handleImportOpenChange}>
          <Popover.Trigger>
            <Button
              size="lg"
              variant="outline"
              onClick={handleImportClick}
            >
              <FaUpload />
              Import
            </Button>
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Header>
                <Text fontSize="lg" fontWeight="bold">Import Options</Text>
              </Popover.Header>
              <Popover.Body>
                <Stack gap="4">                  <Checkbox.Root
                    checked={overrideAll}
                    onCheckedChange={handleOverrideAllChange}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Override all existing accounts</Checkbox.Label>
                  </Checkbox.Root>
                  
                  <Checkbox.Root
                    checked={importOnlyCredentials}
                    onCheckedChange={handleImportOnlyCredentialsChange}
                    disabled={overrideAll}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Import only username and password</Checkbox.Label>
                  </Checkbox.Root>
                  
                  <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                    {overrideAll 
                      ? "All current accounts will be replaced with imported data."
                      : "New accounts will be added, duplicates will be skipped."
                    }
                  </Text>
                </Stack>
              </Popover.Body>
              <Popover.Footer>
                <Stack direction="row" gap="2" width="100%">
                  <Button
                    colorPalette="riot"
                    onClick={handleFileSelect}
                    flex="1"
                  >
                    Select File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleImportCancel}
                    flex="1"
                  >
                    Cancel
                  </Button>
                </Stack>
              </Popover.Footer>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </Stack>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />
    </Box>
  );
}

export default AddAccountInline;
