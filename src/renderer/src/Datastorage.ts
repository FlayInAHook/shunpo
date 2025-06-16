import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";


export type Account = {
  username: string;
  password: string;
  summonerName?: string;
  rank?: {
    soloQueue?: {
      tier: string;
      division: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      previousSeasonEndTier?: string;
      previousSeasonEndDivision?: string;
    } | null;
    flexQueue?: {
      tier: string;
      division: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      previousSeasonEndTier?: string;
      previousSeasonEndDivision?: string;
    } | null;
  } | null;
  isPhoneVerified?: boolean;
  ownedChampions?: string[];
  summonerInfo?: {
    summonerId: number;
    accountId: number;
    displayName: string;
    internalName: string;
    profileIconId: number;
    summonerLevel: number;
    xpSinceLastLevel: number;
    xpUntilNextLevel: number;
    percentCompleteForNextLevel: number;
    puuid: string;
    nameChangeFlag: boolean;
    unnamed: boolean;
    gameName: string;
    tagLine: string;
  }
};


const accountsDefaultValue: Account[] = JSON.parse(await window.electron.ipcRenderer.invoke("decryptString", localStorage.getItem("accounts") || "[]"));
export const accountsAtom = atom(accountsDefaultValue, (_get, set, newAccounts: Account[]) => {
  set(accountsAtom, newAccounts);
  const stringifiedAccounts = JSON.stringify(newAccounts);
  window.electron.ipcRenderer.invoke("encryptString", stringifiedAccounts).then((encryptedAccounts) => {
    localStorage.setItem("accounts", encryptedAccounts);
  });
});



type ColumnTypes = "summonerName" | "rank" | "isPhoneVerified" | "ownedChampions";
export const enabledColumnsAtom = atomWithStorage<ColumnTypes[]>("enabledColumns", ["summonerName", "rank"]);

export const selectedChampionsAtom = atom<string[]>([]);

