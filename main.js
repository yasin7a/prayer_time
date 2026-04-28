const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 520,
    resizable: false,
    backgroundColor: "#0f1720",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on("close", (event) => {
    if (!app.quitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function showAppWindow() {
  if (!mainWindow) {
    createWindow();
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  const iconPath = path.join(__dirname, "assets", "icons", "logo.ico");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Salah Reminder",
      click: () => showAppWindow(),
    },
    {
      label: "Quit",
      click: () => {
        app.quitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Salah Reminder Network");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => showAppWindow());
}

function showNotification(title, body) {
  const notification = new Notification({ title, body });
  notification.on("click", () => {
    showAppWindow();
  });
  notification.show();
}

app.setAppUserModelId("com.salahreminder.network");
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("before-quit", () => {
  app.quitting = true;
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

app.on("activate", () => {
  showAppWindow();
});

ipcMain.handle("notify", (event, { title, body }) => {
  showNotification(title, body);
  return true;
});

ipcMain.handle("show-app", () => {
  showAppWindow();
  return true;
});
