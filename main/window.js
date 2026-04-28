const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow = null;

function createAppWindow() {
  if (mainWindow) {
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 420,
    minHeight: 640,
    show: false,
    resizable: true,
    icon: path.join(__dirname, "..", "assets", "icons", "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function showMainWindow() {
  if (!mainWindow) {
    createAppWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function sendToRenderer(channel, payload) {
  if (!mainWindow || !mainWindow.webContents) {
    return;
  }

  mainWindow.webContents.send(channel, payload);
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createAppWindow,
  showMainWindow,
  sendToRenderer,
  getMainWindow,
};
