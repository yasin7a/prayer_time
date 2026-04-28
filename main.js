const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  powerMonitor,
} = require("electron");
const path = require("path");
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
});

const {
  getPrayerTimesForDate,
  getUpcomingPrayer,
  getPrayerTimeList,
  prayerNames,
} = require("./prayer");
const {
  initPrayerScheduler,
  stopReminder,
  stopScheduler,
} = require("./scheduler");
const {
  appendLog,
  getLogs,
  getState,
  updateState,
  resetDailyState,
} = require("./storage");

let mainWindow;
let scheduler = null;
let prayerTimes = getPrayerTimesForDate();
let appState = null;

function getDefaultPrayerState() {
  return {
    Fajr: "pending",
    Dhuhr: "pending",
    Asr: "pending",
    Maghrib: "pending",
    Isha: "pending",
  };
}

function getDefaultReminderActive() {
  return {
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  };
}

async function setPrayerState(prayerName, status) {
  if (!appState || !appState.prayerState) return;
  appState.prayerState[prayerName] = status;
  await updateState({ prayerState: appState.prayerState });
}

async function setReminderActive(prayerName, active) {
  if (!appState || !appState.reminderActive) return;
  appState.reminderActive[prayerName] = active;
  await updateState({ reminderActive: appState.reminderActive });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 620,
    icon: path.join(__dirname, "assets", "icons", "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.once("did-finish-load", () => {
    updateMainWindow().catch(console.error);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createReminderWindow(prayerName) {
  if (mainWindow && mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  const reminderWindow = new BrowserWindow({
    width: 360,
    height: 220,
    icon: path.join(__dirname, "assets", "icons", "logo.ico"),
    parent: mainWindow || undefined,
    modal: Boolean(mainWindow),
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  reminderWindow.loadFile(path.join(__dirname, "reminder.html"), {
    query: { prayer: prayerName },
  });
  reminderWindow.setMenuBarVisibility(false);
}

function getSerializedPrayerData() {
  const upcoming = getUpcomingPrayer(prayerTimes);
  return {
    currentPrayerName: upcoming.name,
    currentPrayerTime: upcoming.time.toISOString(),
    prayerTimes: getPrayerTimeList(prayerTimes).map((item) => ({
      name: item.name,
      time: item.time.toISOString(),
    })),
  };
}

async function updateMainWindow() {
  if (!mainWindow) {
    return;
  }

  const data = getSerializedPrayerData();
  const logs = await getLogs();
  mainWindow.webContents.send("prayer-data", {
    ...data,
    logs,
    prayerStates: appState ? appState.prayerState : getDefaultPrayerState(),
    reminderActive: appState
      ? appState.reminderActive
      : getDefaultReminderActive(),
  });
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function loadAppState() {
  const state = await getState();
  if (state.date !== getTodayKey()) {
    return resetDailyState();
  }

  return state;
}

async function persistReminderState(prayerName) {
  await setReminderActive(prayerName, true);
}

async function clearReminderActivity(prayerName) {
  await setReminderActive(prayerName, false);
}

function handleNotificationClick(prayerName) {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("open-prayer-ui", prayerName);
  }
}

function notifyPrayer(prayerName) {
  if (!Notification.isSupported()) {
    return;
  }

  const notification = new Notification({
    title: "Prayer Reminder",
    body: `${prayerName} time - please complete your prayer`,
    silent: false,
  });

  notification.on("click", () => {
    handleNotificationClick(prayerName);
  });

  notification.show();
}

async function handlePrayerReminder(prayerName) {
  await persistReminderState(prayerName);
  notifyPrayer(prayerName);

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.focus();
    mainWindow.webContents.send("open-prayer-ui", prayerName);
  }

  createReminderWindow(prayerName);
  await updateMainWindow();
}

async function clearReminderActivity(prayerName) {
  await setReminderActive(prayerName, false);
}

async function logPrayerResponse(prayer, status) {
  const entry = {
    prayer,
    status,
    timestamp: new Date().toISOString(),
  };

  try {
    await appendLog(entry);
    if (mainWindow) {
      mainWindow.webContents.send("log-updated", entry);
    }
  } catch (error) {
    console.error("Failed to save prayer response:", error);
  }
}

function startScheduler(activeReminderPrayers = []) {
  if (scheduler) {
    stopScheduler();
  }

  scheduler = initPrayerScheduler({
    prayerTimes,
    activeReminderPrayers,
    onPrayerReminder: (prayerName) => {
      handlePrayerReminder(prayerName).catch(console.error);
    },
    onReminderStart: (prayerName) => {
      setReminderActive(prayerName, true).catch(console.error);
    },
    onReminderStop: (prayerName) => {
      setReminderActive(prayerName, false).catch(console.error);
    },
    onNextDay: (nextPrayerTimes) => {
      prayerTimes = nextPrayerTimes;
      updateMainWindow().catch(console.error);
    },
  });
}

function isValidPrayerResponse(payload) {
  return (
    payload &&
    typeof payload.prayer === "string" &&
    prayerNames.includes(payload.prayer) &&
    (payload.status === "YES" || payload.status === "NO")
  );
}

async function handleSystemResume() {
  if (!appState || appState.date !== getTodayKey()) {
    appState = await resetDailyState();
  }

  prayerTimes = getPrayerTimesForDate();
  const activeReminders = Object.keys(appState.reminderActive).filter(
    (prayer) => appState.reminderActive[prayer],
  );
  startScheduler(activeReminders);
  await updateMainWindow();
}

app.whenReady().then(async () => {
  if (app.setAppUserModelId) {
    app.setAppUserModelId("com.example.prayer-reminder");
  }

  appState = await loadAppState();
  createMainWindow();
  const activeReminders = Object.keys(appState.reminderActive).filter(
    (prayer) => appState.reminderActive[prayer],
  );
  startScheduler(activeReminders);

  powerMonitor.on("resume", () => {
    handleSystemResume().catch(console.error);
  });

  ipcMain.handle("get-prayer-data", async () => {
    const logs = await getLogs();
    return {
      ...getSerializedPrayerData(),
      logs,
      prayerStates: appState ? appState.prayerState : getDefaultPrayerState(),
      reminderActive: appState
        ? appState.reminderActive
        : getDefaultReminderActive(),
    };
  });

  ipcMain.on("prayer-response", async (event, response) => {
    if (!isValidPrayerResponse(response)) {
      return;
    }

    const { prayer, status } = response;
    await logPrayerResponse(prayer, status);

    if (status === "YES") {
      scheduler?.stopReminder(prayer);
      await setPrayerState(prayer, "completed");
      await clearReminderActivity(prayer);
    } else {
      await setReminderActive(prayer, true);
    }
  });

  ipcMain.on("reminder-response", async (event, response) => {
    if (!isValidPrayerResponse(response)) {
      return;
    }

    const { prayer, status } = response;
    await logPrayerResponse(prayer, status);

    if (status === "YES") {
      scheduler?.stopReminder(prayer);
      await setPrayerState(prayer, "completed");
      await clearReminderActivity(prayer);
    } else {
      await setReminderActive(prayer, true);
    }

    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.close();
    }
  });
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("before-quit", () => {
  stopScheduler();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
