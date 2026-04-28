const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 520,
    resizable: false,
    backgroundColor: "#0f1720",
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

ipcMain.handle("remind", (event, prayerName) => {
  const notif = new Notification({
    title: "Salah Reminder",
    body: `${prayerName} reminder triggered`,
  });
  notif.show();

  if (mainWindow) {
    try {
      if (
        typeof mainWindow.isMinimized === "function" &&
        mainWindow.isMinimized()
      )
        mainWindow.restore();
    } catch (e) {}
    try {
      mainWindow.show();
      mainWindow.focus();
    } catch (e) {}
  }

  return true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
