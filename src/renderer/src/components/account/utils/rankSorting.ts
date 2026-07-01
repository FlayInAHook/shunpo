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

function getQueueSortValue(rankData: NonNullable<Account["rank"]>["soloQueue"]): number {
  if (!rankData) return RANK_ORDER.NONE;

  const tierValue =
    RANK_ORDER[rankData.tier as keyof typeof RANK_ORDER] || RANK_ORDER.NONE;
  const divisionValue =
    DIVISION_ORDER[rankData.division as keyof typeof DIVISION_ORDER] || 0;
  const lpValue = rankData.leaguePoints || 0;

  return tierValue * 10000 + divisionValue * 1000 + lpValue;
}

const getSoloQueueSortValue = (account: Account): number => getQueueSortValue(account.rank?.soloQueue);
const getFlexQueueSortValue = (account: Account): number => getQueueSortValue(account.rank?.flexQueue);
const getRanked5sSortValue = (account: Account): number => getQueueSortValue(account.rank?.ranked5s);

export { getFlexQueueSortValue, getRanked5sSortValue, getSoloQueueSortValue };

