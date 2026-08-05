import { ipcMain, safeStorage } from "electron";

ipcMain.handle("encryptString", (_, args) => {
    console.log("encr");
    return safeStorage.encryptString(args).toString("binary");
});

ipcMain.handle("decryptString", (_, args) => {
    console.log("decry") // ponytail: don't log the ciphertext, it's binary noise in the debug log
    let decryptedBuffer;
    try {
      decryptedBuffer = safeStorage.decryptString(Buffer.from(args, 'binary'));
    } catch (error) {
      console.error("Decryption failed:", error, "result" + args);
      return args;
    }
    return decryptedBuffer.toString();
});

