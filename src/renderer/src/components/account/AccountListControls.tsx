import { Box, Button, Popover, Stack } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { FaCog, FaSort, FaSortAmountDown } from "react-icons/fa";
import { accountsAtom, enabledColumnsAtom, selectedChampionsAtom } from "../../Datastorage";

interface AccountListControlsProps {
  sortMode: "none" | "solo" | "flex";
  onToggleSortMode: () => void;
}

function AccountListControls({ sortMode, onToggleSortMode }: AccountListControlsProps) {
  const [enabledColumns, setEnabledColumns] = useAtom(enabledColumnsAtom);
  const accounts = useAtomValue(accountsAtom);
  const [selectedChampions, setSelectedChampions] = useAtom(selectedChampionsAtom);

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
      if (enabledColumns.length > 1) {
        setEnabledColumns(enabledColumns.filter(col => col !== column));
      }
    } else {
      setEnabledColumns([...enabledColumns, column as any]);
    }
  }

  const championOptions = useCallback(() => {
    return accounts.reduce((acc, account) => {
      if (account.ownedChampions) {
        account.ownedChampions.forEach(champion => {
          if (!acc.some(opt => opt.value === champion)) {
            acc.push({ value: champion, label: champion });
          }
        });
      }
      return acc;
    }, [] as { value: string; label: string }[]);
  }, [accounts]);

  function handleSelectChange(selectedOptions: any) {
    const selectedValues = selectedOptions.map((option: any) => option.value);
    setSelectedChampions(selectedValues);
  }

  /*function handleSelectAll() {
    const allValues = championOptions().map((option) => option.value);
    setSelectedChampions(allValues);
  }

  const CustomDropdownIndicator = (props: any) => {
    const { innerProps, selectProps } = props;
    return (
      <HStack gap={1} pr={2} tabIndex={-1} zIndex={200} pointerEvents={"auto"} color={"gray.400"}>
        <Text
          as="button"
          onClick={(e) => {
            e.stopPropagation()
            handleSelectAll();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          fontSize="sm"
          fontWeight="medium"
          _hover={{ textDecoration: "underline" }}
          mr={2}
          pb={"2px"}
        >
          Select All
        </Text>
        {selectProps.components.DropdownIndicator && (
          <div {...innerProps}>
            {props.selectProps.menuIsOpen ? (
              <MdKeyboardArrowUp size="1.25em" />
            ) : (
              <MdKeyboardArrowDown size="1.25em" />
            )}
          </div>
        )}
      </HStack>
    );
  };*/

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
      <Select
        isMulti
        size="sm"
        options={championOptions()}
        value={championOptions().filter(option => selectedChampions.includes(option.value))}
        onChange={handleSelectChange}
        menuPortalTarget={document.body}
        chakraStyles={{
          container: (provided) => ({
            ...provided,
            marginX: "5",
          }),
          control: (provided) => ({
            ...provided,
            minHeight: "36px", // Match the height of sm buttons
            height: "36px",
          }),
        }}
        //components={{ DropdownIndicator: CustomDropdownIndicator }}
        //styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
      />

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
