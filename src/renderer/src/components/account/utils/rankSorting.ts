import { Account } from "../../../Datastorage";

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

export { getFlexQueueSortValue, getSoloQueueSortValue };

