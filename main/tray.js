const { Menu, Tray, nativeImage } = require("electron");
const path = require("path");
const { appConfig } = require("../config/config");

function createAppTray({ onShow, onQuit }) {
  const iconPath = path.join(__dirname, "..", "assets", "icons", "logo.ico");
  const trayIcon = nativeImage.createFromPath(iconPath);
  const tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Namaz Tracker",
      click: onShow,
    },
    { type: "separator" },
    {
      label: "Exit",
      click: onQuit,
    },
  ]);

  tray.setToolTip(appConfig.trayTooltip);
  tray.setContextMenu(contextMenu);
  tray.on("click", onShow);

  return tray;
}

module.exports = {
  createAppTray,
};
