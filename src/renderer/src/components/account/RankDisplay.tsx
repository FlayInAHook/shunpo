import { Box, Image, Stack, Text } from "@chakra-ui/react";
import { Account } from "../../Datastorage";
import TIER_BRONZE from "../../assets/tier/bronze.png";
import TIER_CHALLENGER from "../../assets/tier/challenger.png";
import TIER_DIAMOND from "../../assets/tier/diamond.png";
import TIER_EMERALD from "../../assets/tier/emerald.png";
import TIER_GOLD from "../../assets/tier/gold.png";
import TIER_GRANDMASTER from "../../assets/tier/grandmaster.png";
import TIER_IRON from "../../assets/tier/iron.png";
import TIER_MASTER from "../../assets/tier/master.png";
import TIER_PLATINUM from "../../assets/tier/platinum.png";
import TIER_SILVER from "../../assets/tier/silver.png";
import TIER_UNRANKED from "../../assets/tier/unranked.png";
import { Tooltip } from "../ui/tooltip";

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

interface RankDisplayProps {
  rank: Account["rank"];
  queueType?: "solo" | "flex";
}

function RankDisplay({ rank, queueType }: RankDisplayProps) {
  function renderSingleRank(
    rankData: NonNullable<Account["rank"]>["soloQueue"] | NonNullable<Account["rank"]>["flexQueue"],
    queueLabel: string
  ) {
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

    const isUnranked = rankData.tier === "UNRANKED" || rankData.tier === "";
    const isPreviousSeasonUnranked = rankData.previousSeasonEndTier === "UNRANKED" || rankData.previousSeasonEndTier === "";

    let tooltipContent = "";
    if (isUnranked && rankData.previousSeasonEndTier) {
      const prevSeason =
        rankData.previousSeasonEndDivision !== "NA"
          ? `${rankData.previousSeasonEndTier} ${rankData.previousSeasonEndDivision}`
          : rankData.previousSeasonEndTier;
      tooltipContent = `${queueLabel}: Unranked (Last season: ${prevSeason})`;
    } else if (isUnranked) {
      tooltipContent = `${queueLabel}: Unranked`;
    } else {
      const division = rankData.division === "NA" ? "" : ` ${rankData.division}`;
      tooltipContent = `${queueLabel}: ${rankData.tier}${division} - ${rankData.leaguePoints} LP (${rankData.wins}W/${rankData.losses}L)`;
    }

    let displayText;
    if (isUnranked && isPreviousSeasonUnranked) {
      displayText = "";
    } else if (isUnranked && rankData.previousSeasonEndTier) {
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
        </Box>
      </Tooltip>
    );
  }

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

  // If a specific queue type is requested, show only that queue
  if (queueType === "solo") {
    return (
      <Box display="flex" justifyContent="center">
        {renderSingleRank(rank.soloQueue, "Solo/Duo")}
      </Box>
    );
  }
  
  if (queueType === "flex") {
    return (
      <Box display="flex" justifyContent="center">
        {renderSingleRank(rank.flexQueue, "Flex")}
      </Box>
    );
  }

  // Default: show both queues side by side
  return (
    <Stack direction="row" gap="2" alignItems="center">
      {renderSingleRank(rank.soloQueue, "Solo/Duo")}
      {renderSingleRank(rank.flexQueue, "Flex")}
    </Stack>
  );
}

export default RankDisplay;
