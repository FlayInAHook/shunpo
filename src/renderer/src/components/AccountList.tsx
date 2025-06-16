import { Box, Stack, Text } from "@chakra-ui/react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { accountsAtom, selectedChampionsAtom } from "../Datastorage";
import { AccountListControls, getFlexQueueSortValue, getSoloQueueSortValue, SortableAccountRow } from "./account";
import AddAccountInline from "./AddAccountInline";

const restrictToHorizontalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

function AccountList() {
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [sortMode, setSortMode] = useState<"none" | "solo" | "flex">("none");
  const selectedChampions = useAtomValue(selectedChampionsAtom);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function getSortedAccounts() {
    if (sortMode === "solo") {
      return [...accounts].sort(
        (a, b) => getSoloQueueSortValue(b) - getSoloQueueSortValue(a)
      );
    }
    if (sortMode === "flex") {
      return [...accounts].sort(
        (a, b) => getFlexQueueSortValue(b) - getFlexQueueSortValue(a)
      );
    }
    return accounts;
  }

  function handleDragEnd(event: DragEndEvent) {
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
  }

  function toggleSortMode() {
    const nextMode =
      sortMode === "none" ? "solo" : sortMode === "solo" ? "flex" : "none";
    setSortMode(nextMode);
  }

  useEffect(() => {
    function handleRiotDataUpdate(_event: any, data: any) {
      console.log("Received Riot data update:", data);

      if (data.username && data.connected) {
        const updatedAccounts = accounts.map((account) =>
          account.username === data.username
            ? {
                ...account,
                summonerName: data.summonerName,
                rank: data.rankInfo,
                isPhoneVerified: data.isPhoneVerified,
                ownedChampions: data.ownedChampions,
                summonerInfo: data.summonerInfo,
              }
            : account
        );
        setAccounts(updatedAccounts);
      }
    }

    window.electron.ipcRenderer.on("riotDataUpdate", handleRiotDataUpdate);

    return () => {
      window.electron.ipcRenderer.removeAllListeners("riotDataUpdate");
    };
  }, [accounts, setAccounts]);
  if (accounts.length === 0) {
    return (
      <Stack gap="4">
        <Box textAlign="center" py="8">
          <Text fontSize="lg" color="gray.500" _dark={{ color: "gray.400" }}>
            No accounts added yet
          </Text>
          <Text fontSize="sm" color="gray.400" _dark={{ color: "gray.500" }}>
            Add your first account below
          </Text>
        </Box>
        <AddAccountInline />
      </Stack>
    );
  }

  const sortedAccounts = getSortedAccounts();
  const filteredAccounts = sortedAccounts.filter(account =>
    selectedChampions.length === 0 || account.ownedChampions?.some(champion =>
      selectedChampions.includes(champion)
    )
  );
  return (
    <Stack gap="2">
      <AccountListControls
        sortMode={sortMode}
        onToggleSortMode={toggleSortMode}
      />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext
          items={filteredAccounts.map(
            (account, index) => `${account.username}-${index}`
          )}
          strategy={verticalListSortingStrategy}
        >
          {filteredAccounts.map((account, index) => (
            <SortableAccountRow
              key={`${account.username}-${index}`}
              account={account}
              index={accounts.indexOf(account)}
              id={`${account.username}-${index}`}
              disableDragHandle={sortMode != "none" || selectedChampions.length > 0}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <AddAccountInline />
    </Stack>
  );
}

export default AccountList;
