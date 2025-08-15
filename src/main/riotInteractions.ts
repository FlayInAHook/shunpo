import { is } from "@electron-toolkit/utils";
import { HasagiClient } from "@hasagi/core";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { OverlayController } from "electron-overlay-window";
import fs from "fs";

const client = new HasagiClient();
let loginCheckInterval: NodeJS.Timeout | null = null;
let lastUsername: string = "";

ipcMain.on("riotLogin", (_, username: string, password: string) => {
    try {
      console.log('Received ping from renderer process');
      lastUsername = username;
      // First attempt with a short pre-delay, then retry once if needed
      attemptLoginOnce(username, password, 100).then((firstOk) => {
        if (!firstOk) {
          console.warn('First login attempt failed, retrying once...');
          setTimeout(() => {
            attemptLoginOnce(username, password).then((secondOk) => {
              if (!secondOk && !is.dev) {
                console.error('Second login attempt failed.');
              }
            });
          }, 300);
        }
      });
    } catch (error) {
      console.error('Error in IPC ping handler:', error);
    }
});

function attemptOverlayLogin(username: string, password: string): boolean {
  try {
  // Ensure the overlay target has focus for this attempt
    OverlayController.focusTarget();
    const controls = OverlayController.findEditControls();
    console.log('Found Edit controls:', controls);
    const inputEditSuccess = OverlayController.inputTextToEdit(0, username);
    const inputEditSuccess2 = OverlayController.inputTextToEdit(1, password);
    const buttons = OverlayController.findButtonControls();
    const buttonClickSuccess = OverlayController.clickButton(buttons.count - 2);

    console.log('Input success:', inputEditSuccess, inputEditSuccess2, buttonClickSuccess);
    return !!(inputEditSuccess && inputEditSuccess2 && buttonClickSuccess);
  } catch (err) {
    console.error('Error during overlay login attempt:', err);
    return false;
  }
}

async function attemptLoginOnce(
  username: string,
  password: string,
  preDelayMs: number = 0
): Promise<boolean> {
  try {
    if (preDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, preDelayMs));
    }
    const success = attemptOverlayLogin(username, password);
    if (is.dev || success) {
      setTimeout(() => startConnectionMonitoring(), 10_000);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error during login attempt flow:', err);
    return false;
  }
}

function startConnectionMonitoring() {
  // Clear existing interval if any
  if (loginCheckInterval) {
    clearInterval(loginCheckInterval);
  }
  
  loginCheckInterval = setInterval(async () => {
    try {
      const isConnected = await connectToRiot();
      if (isConnected) {
        setTimeout(async () => {
          const dataGathered = await gatherDataAndSendToRenderer();
          if (dataGathered) {
            console.log("Successfully gathered and sent Riot data.");
          } else {
            console.error("Failed to gather Riot data.");
          }
        }, 5000);
        
        if (loginCheckInterval) {
          clearInterval(loginCheckInterval);
          loginCheckInterval = null;
        }
      }
    } catch (error) {
      console.error('Error checking riot connection:', error);
    }
  }, 5000);
}

async function gatherDataAndSendToRenderer() {
  try {
    const summonerInfo = await requestSummoner();
    const [soloQueue, flexQueue] = await requestRank();
    const isPhoneVerified = await requestPhoneVerification();
    const ownedChampions = await requestOwnedChampions();
    addListenersToRiotEvents();


    // Send data to renderer
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      const data = {
        username: lastUsername,
        summonerName: summonerInfo.gameName,
        rankInfo: {
          soloQueue,
          flexQueue
        },
        summonerInfo,
        isPhoneVerified,
        ownedChampions,
        connected: true
      };
      console.log("Gathered Riot data:", data);
      mainWindow.webContents.send("riotDataUpdate", {
        ...data
      });
    }
  } catch (error) {
    console.error('Error gathering data:', error);
    return false;
  }
  return true;
}



async function connectToRiot() {
  if (!client.isConnected) {
    try {
      await client.connect({maxConnectionAttempts: 1, authenticationStrategy: "process"});
      console.log("Connected to Riot Client");
    } catch (error) {
      console.error("Failed to connect to Riot Client:", error);
      return false;
    }
    return client.isConnected;
  } else {
    return true;
  }
}



async function requestSummoner() {
  if (!client.isConnected) await client.connect();
  const response = await client.request("get", "/lol-summoner/v1/current-summoner");

  return response
}

async function requestRank() {
  if (!client.isConnected) await client.connect();
  const response = await client.request("get", "/lol-ranked/v1/current-ranked-stats");

  const soloQueue = response.queues.find((queue) => queue.queueType === "RANKED_SOLO_5x5");
  const flexQueue = response.queues.find((queue) => queue.queueType === "RANKED_FLEX_SR");

  return [soloQueue, flexQueue];
}

async function requestPhoneVerification() {
  if (!client.isConnected) await client.connect();
  const response = await client.request("get", "/lol-account-verification/v1/is-verified");

  return response.success;
}

async function requestOwnedChampions() {
  if (!client.isConnected) await client.connect();
  const response = await client.request("get", "/lol-champions/v1/owned-champions-minimal");

  const champions = response.map((champion) => champion.name);
  return champions;
}


function addListenersToRiotEvents() {
  //OnJsonApiEvent_lol-end-of-game_v1_eog-stats-block
  // 
  //OnJsonApiEvent_lol-champions_v1_inventories

  // Disenchant/Buy: lol-inventory/v2/inventory/CHAMPION
  //             lol-inventory/v1/notifications/CHAMPION
  //             lol-champions/v1/owned-champions-minimal
  //             lol-champions/v1/<summonerId>/champions-playable-count
  client.removeAllLCUEventListeners();

  client.addLCUEventListener({
    name: "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase",
    types: ["Update"],
    callback: onGameFlowPhaseUpdate
  });

  client.addLCUEventListener({
    name: "OnJsonApiEvent_lol-champions_v1_owned-champions-minimal",
    types: ["Update"],
    callback: onOwnedChampionsUpdate
  });

  client.addLCUEventListener({
    name: "OnJsonApiEvent_riotclient_pre-shutdown_begin",
    types: ["Update"],
    callback: onPreShutdownBeginUpdate
  });


}

function onGameFlowPhaseUpdate(event: any) {
  console.log("Gameflow phase changed:", event);
  writeToDebugLog(`Gameflow phase changed: ${JSON.stringify(event, null, 2)}`);
  if (event.data == "None" || event.data == "Lobby" || event.data == "EndOfGame") {
    gatherDataAndSendToRenderer();
  }
}

function onOwnedChampionsUpdate(_event: any) {
  console.log("Owned champions updated:");
  // one could probably also use the data in here but w/e
  gatherDataAndSendToRenderer();
}

function onPreShutdownBeginUpdate(event: any) {
  console.log("Pre-shutdown event received:", event);
  writeToDebugLog(`Pre-shutdown event received: ${JSON.stringify(event, null, 2)}`);
  client.removeAllLCUEventListeners();
}


//write debug logs to a file
ipcMain.on("debugLog", (_, message: string) => {
  console.log("Debug log message received:", message);
  //writeToDebugLog(message);
});


export function writeToDebugLog(message: string) {
  return;
  const logFilePath = 'shunpo_debug.log';
  //showDialogOnMainWindow("Debug Log", `Writing to debug log: ${message}`);
  
  fs.appendFile(logFilePath, `${new Date().toISOString()} - ${message}\n`, (err: any) => {
    if (err) {
      console.error('Failed to write to debug log:', err);
      //showDialogOnMainWindow("Debug Log Error", `Failed to write to debug log: ${JSON.stringify(err)}`);
    } else {
      console.log('Debug log updated:', message);
    }
  });
}


export function showDialogOnMainWindow(title: string, message: string) {
  dialog.showMessageBox({
    type: "info",
    title: title,
    message: message,
    buttons: ["OK"]
  });
}