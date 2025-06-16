import { Box, Button, Grid, Image, Input, Stack, Text } from "@chakra-ui/react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  FaEdit,
  FaPlay,
  FaSave,
  FaSort,
  FaSortAmountDown,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
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

const RANK_ORDER = {
  CHALLENGER: 12,
  GRANDMASTER: 11,
  MASTER: 10,
  DIAMOND: 9,
  EMERALD: 8,
  PLATINUM: 7,
  GOLD: 6,
  SILVER: 5,
  BRONZE: 4,
  IRON: 3,
  UNRANKED: 2,
  NONE: 1,
};

const DIVISION_ORDER = {
  I: 4,
  II: 3,
  III: 2,
  IV: 1,
  NA: 0,
};

function getSoloQueueSortValue(account: Account): number {
  if (!account.rank?.soloQueue) return RANK_ORDER.NONE;

  const rankData = account.rank.soloQueue;
  const tierValue =
    RANK_ORDER[rankData.tier as keyof typeof RANK_ORDER] || RANK_ORDER.NONE;
  const divisionValue =
    DIVISION_ORDER[rankData.division as keyof typeof DIVISION_ORDER] || 0;
  const lpValue = rankData.leaguePoints || 0;

  return tierValue * 10000 + divisionValue * 1000 + lpValue;
}

function getFlexQueueSortValue(account: Account): number {
  if (!account.rank?.flexQueue) return RANK_ORDER.NONE;

  const rankData = account.rank.flexQueue;
  const tierValue =
    RANK_ORDER[rankData.tier as keyof typeof RANK_ORDER] || RANK_ORDER.NONE;
  const divisionValue =
    DIVISION_ORDER[rankData.division as keyof typeof DIVISION_ORDER] || 0;
  const lpValue = rankData.leaguePoints || 0;

  return tierValue * 10000 + divisionValue * 1000 + lpValue;
}

interface AccountRowProps {
  account: Account;
  index: number;
  id: string;
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
      return TIER_UNRANKED;
  }
}

function SortableAccountRow({ account, index, id }: AccountRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <AccountRow
        account={account}
        index={index}
        id={id}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface AccountRowInternalProps extends AccountRowProps {
  dragHandleProps?: any;
}

function AccountRow({
  account,
  index,
  dragHandleProps,
}: AccountRowInternalProps) {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(account.username);
  const [editPassword, setEditPassword] = useState(account.password);

  const handleLogin = () => {
    window.electron.ipcRenderer.send(
      "riotLogin",
      account.username,
      account.password
    );
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
      <Grid
        templateColumns="auto 1fr 1fr 1fr"
        gap="3"
        p="3"
        bg="gray.50"
        _dark={{ bg: "gray.700" }}
        borderRadius="md"
      >
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
  const renderRankDisplay = (rank: Account["rank"]) => {
    if (!rank || (!rank.soloQueue && !rank.flexQueue)) {
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

    const renderSingleRank = (
      rankData: typeof rank.soloQueue,
      queueType: string
    ) => {
      if (!rankData) {
        return (
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
        );
      }

      const isUnranked = rankData.tier === "UNRANKED";

      let tooltipContent = "";
      if (isUnranked && rankData.previousSeasonEndTier) {
        const prevSeason =
          rankData.previousSeasonEndDivision !== "NA"
            ? `${rankData.previousSeasonEndTier} ${rankData.previousSeasonEndDivision}`
            : rankData.previousSeasonEndTier;
        tooltipContent = `${queueType}: Unranked (Last season: ${prevSeason})`;
      } else if (isUnranked) {
        tooltipContent = `${queueType}: Unranked`;
      } else {
        const division = rankData.division === "NA" ? "" : ` ${rankData.division}`;
        tooltipContent = `${queueType}: ${rankData.tier}${division} - ${rankData.leaguePoints} LP (${rankData.wins}W/${rankData.losses}L)`;
      }

      let displayText;
      if (isUnranked && rankData.previousSeasonEndTier) {
        displayText =
          rankData.previousSeasonEndDivision !== "NA"
            ? rankData.previousSeasonEndDivision
            : rankData.previousSeasonEndTier.substring(0, 2);
      } else {
        displayText =
          rankData.division === "NA"
            ? rankData.leaguePoints
            : rankData.division;
      }

      const textColor =
        isUnranked && rankData.previousSeasonEndTier ? "yellow.400" : "white";

      return (
        <Tooltip content={tooltipContent}>
          <Box position="relative" display="inline-block">
            <Image
              src={getTierImage(
                isUnranked && rankData.previousSeasonEndTier
                  ? rankData.previousSeasonEndTier
                  : rankData.tier
              )}
              alt={rankData.tier}
              width="40px"
              height="40px"
            />
            {displayText && (
              <Text
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                fontSize="xs"
                fontWeight="bold"
                color={textColor}
                textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                pointerEvents="none"
              >
                {displayText}
              </Text>
            )}
          </Box>
        </Tooltip>
      );
    };
    return (
      <Stack direction="row" gap="2" alignItems="center">
        {renderSingleRank(rank.soloQueue, "Solo/Duo")}
        {renderSingleRank(rank.flexQueue, "Flex")}
      </Stack>
    );
  };

  return (
    <Grid
      templateColumns="auto 1fr 1fr 1fr"
      gap="3"
      p="3"
      bg="gray.50"
      _dark={{ bg: "gray.700" }}
      borderRadius="md"
      alignItems="center"
    >
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
      <Text fontWeight="medium">
        {account.summonerName || account.username}
      </Text>
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
        {" "}
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
    </Grid>
  );
}

const restrictToHorizontalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

function AccountList() {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [sortMode, setSortMode] = useState<"none" | "solo" | "flex">("none");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedAccounts =
    sortMode === "solo"
      ? [...accounts].sort(
          (a, b) => getSoloQueueSortValue(b) - getSoloQueueSortValue(a)
        )
      : sortMode === "flex"
      ? [...accounts].sort(
          (a, b) => getFlexQueueSortValue(b) - getFlexQueueSortValue(a)
        )
      : accounts;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = accounts.findIndex(
        (account) =>
          `${account.username}-${accounts.indexOf(account)}` === active.id
      );
      const newIndex = accounts.findIndex(
        (account) =>
          `${account.username}-${accounts.indexOf(account)}` === over?.id
      );

      setAccounts(arrayMove(accounts, oldIndex, newIndex));
    }
  };

  const toggleSortMode = () => {
    const nextMode =
      sortMode === "none" ? "solo" : sortMode === "solo" ? "flex" : "none";
    setSortMode(nextMode);
  };

  useEffect(() => {
    const handleRiotDataUpdate = (_event: any, data: any) => {
      console.log("Received Riot data update:", data);

      if (data.username && data.connected) {
        const updatedAccounts = accounts.map((account) =>
          account.username === data.username
            ? {
                ...account,
                summonerName: data.summonerName,
                rank: data.rankInfo,
              }
            : account
        );
        setAccounts(updatedAccounts);
      }
    };

    window.electron.ipcRenderer.on("riotDataUpdate", handleRiotDataUpdate);

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
      <Box display="flex" justifyContent="flex-end" mb="2">
        <Button
          size="sm"
          variant="outline"
          onClick={toggleSortMode}
          colorPalette={sortMode !== "none" ? "riot" : "gray"}
        >
          {sortMode !== "none" ? <FaSortAmountDown /> : <FaSort />}
          {sortMode === "solo"
            ? "Sorted by Solo Queue"
            : sortMode === "flex"
            ? "Sorted by Flex Queue"
            : "Sort by Rank"}
        </Button>
      </Box>
      {" "}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext
          items={sortedAccounts.map(
            (account, index) => `${account.username}-${index}`
          )}
          strategy={verticalListSortingStrategy}
        >
          {sortedAccounts.map((account, index) => (
            <SortableAccountRow
              key={`${account.username}-${index}`}
              account={account}
              index={accounts.indexOf(account)}
              id={`${account.username}-${index}`}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Stack>
  );
}

export default AccountList;
