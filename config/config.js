const appConfig = {
  reminderRetryIntervalMs: 1 * 60 * 1000, // 1 minute interval for retrying missed prayer reminders
  notificationDelayMs: 10 * 1000, // 10 seconds delay before showing notification
  appName: "Salah Reminder",
  appId: "com.salah.reminder",
  trayTooltip: "Salah Reminder",
  notificationTitle: "Salah Reminder",
};

module.exports = {
  appConfig,
};
