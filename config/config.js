const appConfig = {
  reminderRetryIntervalMs:
    Number(process.env.REMINDER_RETRY_INTERVAL_MS) || 5 * 60 * 1000,
  appName: "Namaz Reminder & Tracker",
  appId: "com.namaz.reminder",
  trayTooltip: "Namaz Reminder & Tracker",
  notificationTitle: "Namaz Reminder",
};

module.exports = {
  appConfig,
};
