const appConfig = {
  reminderRetryIntervalMs: 1 * 60 * 1000, // 1 minute interval for retrying missed prayer reminders
  notificationDelayMs: 10 * 1000, // 10 seconds delay before showing notification
  appName: "Namaz Reminder & Tracker",
  appId: "com.namaz.reminder",
  trayTooltip: "Namaz Reminder & Tracker",
  notificationTitle: "Namaz Reminder",
};

module.exports = {
  appConfig,
};
