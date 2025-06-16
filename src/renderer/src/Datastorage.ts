import { atom } from "jotai";


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
};


const accountsDefaultValue: Account[] = JSON.parse(await window.electron.ipcRenderer.invoke("decryptString", localStorage.getItem("accounts") || "[]"));
export const accountsAtom = atom(accountsDefaultValue, (_get, set, newAccounts: Account[]) => {
  set(accountsAtom, newAccounts);
  const stringifiedAccounts = JSON.stringify(newAccounts);
  window.electron.ipcRenderer.invoke("encryptString", stringifiedAccounts).then((encryptedAccounts) => {
    localStorage.setItem("accounts", encryptedAccounts);
  });
});
