import { HasagiClient } from "@hasagi/core";
import { BrowserWindow, ipcMain } from "electron";
import { OverlayController } from "electron-overlay-window";

const client = new HasagiClient();
let loginCheckInterval: NodeJS.Timeout | null = null;
let lastUsername: string = "";

ipcMain.on("riotLogin", (_, username: string, password: string) => {
    try {
      console.log('Received ping from renderer process');
      lastUsername = username;
      const controls = OverlayController.findEditControls();
      console.log('Found Edit controls:', controls);
      const inputEditSuccess = OverlayController.inputTextToEdit(0, username);
      const inputEditSuccess2 = OverlayController.inputTextToEdit(1, password);
      setTimeout(() => {
        const buttons = OverlayController.findButtonControls();
        const buttonClickSuccess = OverlayController.clickButton(buttons.count - 2);

        console.log('Input success:', inputEditSuccess, inputEditSuccess2, buttonClickSuccess);
        
        if (inputEditSuccess && inputEditSuccess2 && buttonClickSuccess) {
          startConnectionMonitoring();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error in IPC ping handler:', error);
    }
});

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
      await client.connect();
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
  if (event.data == "None"){
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
  client.removeAllLCUEventListeners();
}

