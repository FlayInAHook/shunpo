import { ipcMain, safeStorage } from "electron";

ipcMain.handle("encryptString", (_, args) => {
    console.log("encr");
    return safeStorage.encryptString(args).toString("binary");
});

ipcMain.handle("decryptString", (_, args) => {
    console.log("decry", args)
    return safeStorage.decryptString(Buffer.from(args, 'binary')).toString();
});

