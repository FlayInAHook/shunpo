import { atom } from "jotai";


export type Account = {
  username: string;
  password: string;
  summonerName?: string;
  rank?: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
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
