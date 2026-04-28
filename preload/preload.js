const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getPrayerData: () => ipcRenderer.invoke("get-prayer-data"),
  sendUserResponse: (response) => ipcRenderer.send("prayer-response", response),
  sendReminderResponse: (response) =>
    ipcRenderer.send("reminder-response", response),
  onPrayerData: (callback) =>
    ipcRenderer.on("prayer-data", (event, data) => callback(data)),
  onOpenPrayerUI: (callback) =>
    ipcRenderer.on("open-prayer-ui", (event, prayerName) =>
      callback(prayerName),
    ),
});
