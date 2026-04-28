const { ipcMain } = require("electron");
const logger = require("../utils/logger");

function registerIpcHandlers({ getPrayerData, handleUserResponse }) {
  ipcMain.handle("get-prayer-data", async () => {
    return getPrayerData();
  });

  ipcMain.on("prayer-response", async (event, response) => {
    try {
      await handleUserResponse(response);
    } catch (error) {
      logger.error("prayer-response handler failed", error);
    }
  });

  ipcMain.on("reminder-response", async (event, response) => {
    try {
      await handleUserResponse(response);
    } catch (error) {
      logger.error("reminder-response handler failed", error);
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
