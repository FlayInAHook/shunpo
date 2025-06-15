import { ipcRenderer } from "electron";
import { atom } from "jotai";


export type Account = {
  username: string;
  password: string;
  displayName?: string;
  rank?: string;
};


const accountsDefaultValue: Account[] = await ipcRenderer.invoke("decryptString", localStorage.getItem("accounts") || "[]");
const accountsAtom = atom(accountsDefaultValue, (get, set, newAccounts: Account[]) => {
  set(accountsAtom, newAccounts);
  const stringifiedAccounts = JSON.stringify(newAccounts);
  ipcRenderer.invoke("encryptString", stringifiedAccounts).then((encryptedAccounts) => {
    localStorage.setItem("accounts", encryptedAccounts);
  });
});
