const { app, powerMonitor } = require("electron");
const { createAppWindow, showMainWindow, sendToRenderer } = require("./window");
const { registerIpcHandlers } = require("./ipc");
const { createAppTray } = require("./tray");
const {
  getDailyPrayerTimes,
  getUpcomingPrayer,
  getPrayerTimeList,
} = require("../services/prayerService");
const { initScheduler, stopReminder } = require("../services/scheduler");
const { createNotifier } = require("../services/notification");
const {
  activateReminder,
  stopAllReminders,
} = require("../services/retryService");
const {
  loadState,
  updateState,
  resetDailyState,
  appendLog,
} = require("../storage/storage");
const { toDateKey } = require("../utils/time");
const logger = require("../utils/logger");
const {
  isValidPrayerName,
  isValidResponseStatus,
} = require("../utils/validator");

let scheduler = null;
let notifier = null;
let tray = null;
let appState = null;
let prayerTimes = null;

async function loadApplicationState() {
  const state = await loadState();
  if (state.date !== toDateKey()) {
    return resetDailyState();
  }
  return state;
}

function getSerializedPrayerData() {
  const upcoming = getUpcomingPrayer(prayerTimes);
  const prayerTimesList = getPrayerTimeList(prayerTimes).map((item) => ({
    name: item.name,
    time: item.time.toISOString(),
  }));

  return {
    currentPrayerName: upcoming.name,
    currentPrayerTime: upcoming.time.toISOString(),
    prayerTimes: prayerTimesList,
  };
}

async function getPrayerPayload() {
  return {
    ...getSerializedPrayerData(),
    prayerStates: appState.prayerState,
    reminderActive: appState.reminderActive,
  };
}

async function refreshMainWindow() {
  const payload = await getPrayerPayload();
  sendToRenderer("prayer-data", payload);
}

async function handleNotificationClick(prayerName) {
  showMainWindow();
  sendToRenderer("open-prayer-ui", prayerName);
  await refreshMainWindow();
}

async function handlePrayerDue(prayerName) {
  if (!appState.reminderActive[prayerName]) {
    appState.reminderActive[prayerName] = true;
    await updateState({ reminderActive: appState.reminderActive });
  }

  notifier.notifyPrayer(prayerName);
  activateReminder(prayerName, handlePrayerDue);
  showMainWindow();
  sendToRenderer("open-prayer-ui", prayerName);
  await refreshMainWindow();
}

async function handleUserResponse(response) {
  if (!response || typeof response !== "object") {
    return;
  }

  const { prayer, status } = response;
  if (!isValidPrayerName(prayer) || !isValidResponseStatus(status)) {
    logger.error("Invalid user response", response);
    return;
  }

  const entry = {
    prayer,
    status,
    timestamp: new Date().toISOString(),
  };

  await appendLog(entry);

  if (status === "YES") {
    appState.prayerState[prayer] = "completed";
    appState.reminderActive[prayer] = false;
    notifier.cancelNotification(prayer);
    stopReminder(prayer);
  } else {
    appState.reminderActive[prayer] = true;
    activateReminder(prayer, handlePrayerDue);
  }

  await updateState({
    prayerState: appState.prayerState,
    reminderActive: appState.reminderActive,
  });

  await refreshMainWindow();
  sendToRenderer("log-updated", entry);
}

function restoreActiveReminders() {
  const activePrayers = Object.entries(appState.reminderActive)
    .filter(([, active]) => active)
    .map(([prayer]) => prayer);

  activePrayers.forEach((prayerName) => {
    activateReminder(prayerName, handlePrayerDue);
  });
}

function startScheduler() {
  if (scheduler) {
    scheduler.stop();
  }

  scheduler = initScheduler({
    prayerTimes,
    onPrayerDue: handlePrayerDue,
    onDayChange: async (nextPrayerTimes) => {
      prayerTimes = nextPrayerTimes;
      await refreshMainWindow();
    },
  });
}

async function handleSystemResume() {
  prayerTimes = getDailyPrayerTimes();
  appState = await loadApplicationState();
  startScheduler();
  restoreActiveReminders();
  await refreshMainWindow();
}

function quitApp() {
  stopAllReminders();
  scheduler?.stop();
  tray?.destroy();
  app.quit();
}

async function createApplication() {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  if (app.setAppUserModelId) {
    app.setAppUserModelId("com.namaz.reminder");
  }

  appState = await loadApplicationState();
  prayerTimes = getDailyPrayerTimes();
  notifier = createNotifier({ onClick: handleNotificationClick });

  createAppWindow();
  tray = createAppTray({ onShow: showMainWindow, onQuit: quitApp });
  registerIpcHandlers({
    getPrayerData: getPrayerPayload,
    handleUserResponse,
  });

  startScheduler();
  restoreActiveReminders();

  powerMonitor.on("resume", () => {
    handleSystemResume().catch(logger.error);
  });
}

app
  .whenReady()
  .then(createApplication)
  .catch((error) => {
    logger.error("Failed to initialize application", error);
  });

app.on("second-instance", () => {
  showMainWindow();
});

app.on("activate", () => {
  showMainWindow();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
