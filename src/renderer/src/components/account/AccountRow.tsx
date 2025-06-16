import { Box, Button, Grid, Input, Stack, Text } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useState } from "react";
import { FaEdit, FaPlay, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { Account, accountsAtom, enabledColumnsAtom } from "../../Datastorage";
import RankDisplay from "../account/RankDisplay";

interface AccountRowProps {
  account: Account;
  index: number;
  id: string;
  dragHandleProps?: any;
}

function AccountRow({ account, index, dragHandleProps }: AccountRowProps) {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [enabledColumns] = useAtom(enabledColumnsAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(account.username);
  const [editPassword, setEditPassword] = useState(account.password);

  const allColumns = ["summonerName", "rank", "isPhoneVerified", "ownedChampions"];
  
  function getOrderedEnabledColumns() {
    return allColumns.filter(column => enabledColumns.includes(column as any));
  }

  function handleLogin() {
    window.electron.ipcRenderer.send(
      "riotLogin",
      account.username,
      account.password
    );
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleSave() {
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
  }

  function handleCancel() {
    setEditUsername(account.username);
    setEditPassword(account.password);
    setIsEditing(false);
  }

  function handleDelete() {
    const updatedAccounts = accounts.filter((_, i) => i !== index);
    setAccounts(updatedAccounts);
  }

  function renderColumnContent(column: string) {
    switch (column) {
      case "summonerName":
        return (
          <Box display="flex" justifyContent="center">
            <Text fontWeight="medium">
              {account.summonerName || account.username}
            </Text>
          </Box>
        );
      case "rank":
        return <RankDisplay rank={account.rank} />;
      case "isPhoneVerified":
        return (
          <Box display="flex" justifyContent="center">
            <Text
              fontSize="sm"
              color={account.isPhoneVerified ? "green.500" : "red.500"}
              fontWeight="medium"
            >
              {account.isPhoneVerified ? "✓ Verified" : "✗ Not Verified"}
            </Text>
          </Box>
        );
      case "ownedChampions":
        return (
          <Box display="flex" justifyContent="center">
            <Text fontSize="sm" fontWeight="medium">
              {account.ownedChampions ? account.ownedChampions.length : 0} Champions
            </Text>
          </Box>
        );
      default:
        return null;
    }
  }

  function getGridColumns() {
    return `auto ${enabledColumns.map(() => "1fr").join(" ")} auto`;
  }

  function renderDragHandle() {
    return (
      <Box
        {...dragHandleProps}
        cursor="grab"
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="20px"
        height="20px"
        borderRadius="md"
        _hover={{ bg: "gray.200", _dark: { bg: "gray.600" } }}
        title="Drag to reorder"
      >
        <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
          ⋮⋮
        </Text>
      </Box>
    );
  }

  function renderActionButtons() {
    return (
      <Stack direction="row" gap="1">
        <Button
          size="sm"
          colorPalette="riot"
          onClick={handleLogin}
          title="Login"
        >
          <FaPlay />
        </Button>
        <Button size="sm" variant="outline" onClick={handleEdit} title="Edit">
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
    );
  }

  if (isEditing) {
    return (
      <Grid
        templateColumns="auto 1fr 1fr auto"
        gap="3"
        p="3"
        bg="gray.50"
        _dark={{ bg: "gray.700" }}
        borderRadius="md"
      >
        {renderDragHandle()}
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
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <FaTimes />
          </Button>
        </Stack>
      </Grid>
    );
  }

  return (
    <Grid
      templateColumns={getGridColumns()}
      gap="3"
      p="3"
      bg="gray.50"
      _dark={{ bg: "gray.700" }}
      borderRadius="md"
      alignItems="center"
    >
      {renderDragHandle()}
      {getOrderedEnabledColumns().map((column) => (
        <Box key={column} display="flex" justifyContent="center">
          {renderColumnContent(column)}
        </Box>
      ))}
      {renderActionButtons()}
    </Grid>
  );
}

export default AccountRow;
