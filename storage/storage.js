const fs = require("fs").promises;
const path = require("path");

const dataDir = path.join(__dirname, "data");
const logFile = path.join(dataDir, "logs.json");
const stateFile = path.join(dataDir, "state.json");
const tempLogFile = `${logFile}.tmp`;
const tempStateFile = `${stateFile}.tmp`;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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

async function ensureDataDirectory() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function writeJsonAtomic(filePath, tempPath, data) {
  const serialized = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, serialized, "utf8");
  await fs.rename(tempPath, filePath);
}

async function recoverCorruptedFile(filePath, defaultValue) {
  const backupName = `${filePath}.corrupt.${Date.now()}`;
  try {
    await fs.rename(filePath, backupName);
  } catch {
    // ignore rename failures and continue with a fresh file
  }
  const tempPath = `${filePath}.tmp`;
  await writeJsonAtomic(filePath, tempPath, defaultValue);
  return defaultValue;
}

async function getJsonFile(filePath, defaultValue) {
  await ensureDataDirectory();

  try {
    const content = await fs.readFile(filePath, "utf8");
    if (!content.trim()) {
      await writeJsonAtomic(filePath, `${filePath}.tmp`, defaultValue);
      return defaultValue;
    }
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeJsonAtomic(filePath, `${filePath}.tmp`, defaultValue);
      return defaultValue;
    }
    return recoverCorruptedFile(filePath, defaultValue);
  }
}

async function getLogs() {
  return getJsonFile(logFile, []);
}

async function appendLog(entry) {
  const logs = await getLogs();
  logs.push(entry);
  try {
    await writeJsonAtomic(logFile, tempLogFile, logs);
  } catch (error) {
    await recoverCorruptedFile(logFile, [entry]);
  }
}

async function getState() {
  const defaultState = {
    date: todayKey(),
    prayerState: getDefaultPrayerState(),
    reminderActive: getDefaultReminderActive(),
  };
  const state = await getJsonFile(stateFile, defaultState);
  if (state && state.date === todayKey()) {
    return {
      prayerState: { ...defaultState.prayerState, ...state.prayerState },
      reminderActive: {
        ...defaultState.reminderActive,
        ...state.reminderActive,
      },
      date: todayKey(),
    };
  }

  return saveState(defaultState);
}

async function saveState(state) {
  await writeJsonAtomic(stateFile, tempStateFile, state);
  return state;
}

async function updateState(updates) {
  const current = await getState();
  const nextState = {
    ...current,
    ...updates,
    date: todayKey(),
  };
  return saveState(nextState);
}

async function resetDailyState() {
  const state = {
    date: todayKey(),
    prayerState: getDefaultPrayerState(),
    reminderActive: getDefaultReminderActive(),
  };
  return saveState(state);
}

module.exports = {
  getLogs,
  appendLog,
  getState,
  updateState,
  resetDailyState,
};
