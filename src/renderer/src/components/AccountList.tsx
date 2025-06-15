import {
  Box,
  Button,
  Grid,
  Image,
  Input,
  Stack,
  Text
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { FaEdit, FaPlay, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { Account, accountsAtom } from "../Datastorage";
import TIER_BRONZE from "../assets/tier/bronze.png";
import TIER_CHALLENGER from "../assets/tier/challenger.png";
import TIER_DIAMOND from "../assets/tier/diamond.png";
import TIER_EMERALD from "../assets/tier/emerald.png";
import TIER_GOLD from "../assets/tier/gold.png";
import TIER_GRANDMASTER from "../assets/tier/grandmaster.png";
import TIER_IRON from "../assets/tier/iron.png";
import TIER_MASTER from "../assets/tier/master.png";
import TIER_PLATINUM from "../assets/tier/platinum.png";
import TIER_SILVER from "../assets/tier/silver.png";
import TIER_UNRANKED from "../assets/tier/unranked.png";
import { Tooltip } from "./ui/tooltip";

interface AccountRowProps {
  account: Account;
  index: number;
}

function getTierImage(tier: string): string {
  switch (tier) {
    case "UNRANKED":
      return TIER_UNRANKED;
    case "IRON":
      return TIER_IRON;
    case "BRONZE":
      return TIER_BRONZE;
    case "SILVER":
      return TIER_SILVER;
    case "GOLD":
      return TIER_GOLD;
    case "PLATINUM":
      return TIER_PLATINUM;
    case "EMERALD":
      return TIER_EMERALD;
    case "DIAMOND":
      return TIER_DIAMOND;
    case "MASTER":
      return TIER_MASTER;
    case "GRANDMASTER":
      return TIER_GRANDMASTER;
    case "CHALLENGER":
      return TIER_CHALLENGER;
    default:
      return TIER_UNRANKED; // Fallback to unranked
  }
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
  
  const renderRankDisplay = (rank: Account['rank']) => {
    if (!rank) {
      return (
        <Tooltip content="Never logged in">
          <Box position="relative" display="inline-block">
            <Image 
              src={getTierImage("UNRANKED")} 
              alt="Unranked"
              width="40px"
              height="40px"
            />
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontSize="xs"
              fontWeight="bold"
              color="white"
              textShadow="1px 1px 2px rgba(0,0,0,0.8)"
              pointerEvents="none"
            >
              --
            </Text>
          </Box>
        </Tooltip>
      );
    }

    const tooltipContent = rank.division === "NA" 
      ? `${rank.tier} - ${rank.lp} LP (${rank.wins}W/${rank.losses}L)`
      : `${rank.tier} ${rank.division} - ${rank.lp} LP (${rank.wins}W/${rank.losses}L)`;

    const divisionText = rank.division === "NA" ? "" : rank.division;

    return (
      <Tooltip content={tooltipContent}>
        <Box position="relative" display="inline-block">
          <Image 
            src={getTierImage(rank.tier)} 
            alt={rank.tier}
            width="40px"
            height="40px"
          />
          {divisionText && (
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontSize="xs"
              fontWeight="bold"
              color="white"
              textShadow="1px 1px 2px rgba(0,0,0,0.8)"
              pointerEvents="none"
            >
              {divisionText}
            </Text>
          )}
        </Box>
      </Tooltip>
    );
  };
  return (
    <Grid templateColumns="1fr 1fr 1fr" gap="3" p="3" bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md" alignItems="center">
      <Text fontWeight="medium">{account.summonerName || account.username}</Text>
      <Box display="flex" justifyContent="center">
        {renderRankDisplay(account.rank)}
      </Box>
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
