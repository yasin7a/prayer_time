const fs = require("fs").promises;
const path = require("path");
const {
  createDefaultPrayerState,
  createDefaultReminderState,
} = require("./schema");
const { toDateKey } = require("../utils/time");

const storageDir = path.join(__dirname, "data");
const logFile = path.join(storageDir, "logs.json");
const stateFile = path.join(storageDir, "state.json");
const tempLogFile = `${logFile}.tmp`;
const tempStateFile = `${stateFile}.tmp`;

async function ensureStorageDirectory() {
  await fs.mkdir(storageDir, { recursive: true });
}

async function writeJsonAtomic(filePath, tempFilePath, data) {
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(tempFilePath, payload, "utf8");
  await fs.rename(tempFilePath, filePath);
}

async function recoverCorruptedFile(filePath, defaultValue) {
  try {
    await fs.rename(filePath, `${filePath}.corrupt`);
  } catch (error) {
    // ignore errors from rename
  }
  await writeJsonAtomic(filePath, `${filePath}.tmp`, defaultValue);
  return defaultValue;
}

async function getJsonFile(filePath, defaultValue) {
  await ensureStorageDirectory();

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
    date: toDateKey(),
    prayerState: createDefaultPrayerState(),
    reminderActive: createDefaultReminderState(),
  };

  const state = await getJsonFile(stateFile, defaultState);
  if (state.date !== toDateKey()) {
    return saveState(defaultState);
  }

  return {
    ...defaultState,
    ...state,
    date: toDateKey(),
    prayerState: {
      ...defaultState.prayerState,
      ...state.prayerState,
    },
    reminderActive: {
      ...defaultState.reminderActive,
      ...state.reminderActive,
    },
  };
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
    date: toDateKey(),
  };
  return saveState(nextState);
}

async function resetDailyState() {
  const state = {
    date: toDateKey(),
    prayerState: createDefaultPrayerState(),
    reminderActive: createDefaultReminderState(),
  };
  return saveState(state);
}

module.exports = {
  loadLogs: getLogs,
  appendLog,
  loadState: getState,
  updateState,
  resetDailyState,
};
