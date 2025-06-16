import { Box, Button, Popover, Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { FaCog, FaSort, FaSortAmountDown } from "react-icons/fa";
import { enabledColumnsAtom } from "../../Datastorage";

interface AccountListControlsProps {
  sortMode: "none" | "solo" | "flex";
  onToggleSortMode: () => void;
}

function AccountListControls({ sortMode, onToggleSortMode }: AccountListControlsProps) {
  const [enabledColumns, setEnabledColumns] = useAtom(enabledColumnsAtom);
  
  const allColumns = ["summonerName", "rank", "isPhoneVerified", "ownedChampions"];

  function getColumnHeader(column: string) {
    switch (column) {
      case "summonerName":
        return "Summoner Name";
      case "rank":
        return "Rank";
      case "isPhoneVerified":
        return "Phone Verified";
      case "ownedChampions":
        return "Champions";
      default:
        return column;
    }
  }

  function toggleColumn(column: string) {
    if (enabledColumns.includes(column as any)) {
      // Don't allow removing the last column
      if (enabledColumns.length > 1) {
        setEnabledColumns(enabledColumns.filter(col => col !== column));
      }
    } else {
      setEnabledColumns([...enabledColumns, column as any]);
    }
  }

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb="2">
      {/* Column Settings */}
      <Popover.Root>
        <Popover.Trigger>
          <Button size="sm" variant="outline">
            <FaCog />
            Column Settings
          </Button>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.CloseTrigger />
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Popover.Body>
              <Popover.Title>Show Columns:</Popover.Title>
              <Stack gap="1" mt="2">
                {allColumns.map((column) => (
                  <Button
                    key={column}
                    size="xs"
                    variant={enabledColumns.includes(column as any) ? "solid" : "outline"}
                    colorPalette={enabledColumns.includes(column as any) ? "riot" : "gray"}
                    onClick={() => toggleColumn(column)}
                    disabled={enabledColumns.includes(column as any) && enabledColumns.length === 1}
                  >
                    {getColumnHeader(column)}
                  </Button>
                ))}
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>

      {/* Sort Controls */}
      <Button
        size="sm"
        variant="outline"
        onClick={onToggleSortMode}
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
  );
}

export default AccountListControls;
