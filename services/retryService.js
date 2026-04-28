const { appConfig } = require("../config/config");
const logger = require("../utils/logger");

const activeReminderIntervals = new Map();

function activateReminder(prayerName, callback) {
  if (activeReminderIntervals.has(prayerName)) {
    return;
  }

  const intervalId = setInterval(() => {
    try {
      callback(prayerName);
    } catch (error) {
      logger.error("Reminder retry failed", error);
    }
  }, appConfig.reminderRetryIntervalMs);

  activeReminderIntervals.set(prayerName, intervalId);
}

function stopReminder(prayerName) {
  const intervalId = activeReminderIntervals.get(prayerName);
  if (intervalId) {
    clearInterval(intervalId);
    activeReminderIntervals.delete(prayerName);
  }
}

function stopAllReminders() {
  for (const intervalId of activeReminderIntervals.values()) {
    clearInterval(intervalId);
  }
  activeReminderIntervals.clear();
}

module.exports = {
  activateReminder,
  stopReminder,
  stopAllReminders,
};
