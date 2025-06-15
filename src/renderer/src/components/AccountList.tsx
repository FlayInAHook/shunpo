import {
  Box,
  Button,
  Grid,
  Input,
  Stack,
  Text
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { FaEdit, FaPlay, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { Account, accountsAtom } from "../Datastorage";

interface AccountRowProps {
  account: Account;
  index: number;
}

function AccountRow({ account, index }: AccountRowProps) {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(account.username);
  const [editPassword, setEditPassword] = useState(account.password);

  const handleLogin = () => {
    window.electron.ipcRenderer.send("riotLogin", account.username, account.password);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedAccount: Account = {
      username: editUsername,
      password: editPassword,
      summonerName: account.summonerName,
      rank: account.rank,
    };
    
    const updatedAccounts = [...accounts];
    updatedAccounts[index] = updatedAccount;
    setAccounts(updatedAccounts);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditUsername(account.username);
    setEditPassword(account.password);
    setIsEditing(false);
  };

  const handleDelete = () => {
    const updatedAccounts = accounts.filter((_, i) => i !== index);
    setAccounts(updatedAccounts);
  };
  if (isEditing) {
    return (
      <Grid templateColumns="1fr 1fr 1fr" gap="3" p="3" bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
        <Input
          value={editUsername}
          onChange={(e) => setEditUsername(e.target.value)}
          placeholder="Username"
          size="sm"
          colorPalette="riot"
        />
        <Input
          type="password"
          value={editPassword}
          onChange={(e) => setEditPassword(e.target.value)}
          placeholder="Password"
          size="sm"
          colorPalette="riot"
        />
        <Stack direction="row" gap="1">
          <Button
            size="sm"
            colorPalette="riot"
            onClick={handleSave}
            disabled={!editUsername || !editPassword}
          >
            <FaSave />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
          >
            <FaTimes />
          </Button>
        </Stack>
      </Grid>
    );
  }
  const formatRank = (rank: Account['rank']): string => {
    if (!rank) return "never logged in";
    if (rank.division == "NA") return `${rank.tier} (${rank.lp} LP)`;
    return `${rank.tier} ${rank.division} (${rank.lp} LP)`;
  };

  return (
    <Grid templateColumns="1fr 1fr 1fr" gap="3" p="3" bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md" alignItems="center">
      <Text fontWeight="medium">{account.summonerName || account.username}</Text>
      <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
        {formatRank(account.rank)}
      </Text>
      <Stack direction="row" gap="1">
        <Button
          size="sm"
          colorPalette="riot"
          onClick={handleLogin}
          title="Login"
        >
          <FaPlay />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleEdit}
          title="Edit"
        >
          <FaEdit />
        </Button>
        <Button
          size="sm"
          variant="outline"
          colorScheme="red"
          onClick={handleDelete}
          title="Delete"
        >
          <FaTrash />
        </Button>
      </Stack>
    </Grid>
  );
}

function AccountList() {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  useEffect(() => {
    // Listen for riot data updates
    const handleRiotDataUpdate = (_event: any, data: any) => {
      console.log("Received Riot data update:", data);
      
      if (data.username && data.connected) {
        // Find and update the account with the matching username
        const updatedAccounts = accounts.map(account => 
          account.username === data.username 
            ? {
                ...account,
                summonerName: data.summonerName,
                rank: data.rankInfo
              }
            : account
        );
        setAccounts(updatedAccounts);
      }
    };

    window.electron.ipcRenderer.on("riotDataUpdate", handleRiotDataUpdate);
    
    // Cleanup
    return () => {
      window.electron.ipcRenderer.removeAllListeners("riotDataUpdate");
    };
  }, [accounts, setAccounts]);

  if (accounts.length === 0) {
    return (
      <Box textAlign="center" py="8">
        <Text fontSize="lg" color="gray.500" _dark={{ color: "gray.400" }}>
          No accounts added yet
        </Text>
        <Text fontSize="sm" color="gray.400" _dark={{ color: "gray.500" }}>
          Click the + button below to add your first account
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="2">
      {accounts.map((account, index) => (
        <AccountRow key={`${account.username}-${index}`} account={account} index={index} />
      ))}
    </Stack>
  );
}

export default AccountList;
