const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  remind: (prayerName) => ipcRenderer.invoke("remind", prayerName),
});
