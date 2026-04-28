const { Notification } = require("electron");
const { appConfig } = require("../config/config");

const pendingNotificationTimers = new Map();

function createNotifier({ onClick }) {
  function notifyPrayer(prayerName) {
    if (!Notification.isSupported()) {
      return;
    }

    cancelNotification(prayerName);

    const timerId = setTimeout(() => {
      pendingNotificationTimers.delete(prayerName);

      const notification = new Notification({
        title: appConfig.notificationTitle,
        body: `It's time for ${prayerName}. Tap to confirm your prayer status.`,
        silent: false,
      });

      notification.on("click", () => {
        if (typeof onClick === "function") {
          onClick(prayerName);
        }
      });

      notification.show();
    }, appConfig.notificationDelayMs);

    pendingNotificationTimers.set(prayerName, timerId);
  }

  function cancelNotification(prayerName) {
    const timerId = pendingNotificationTimers.get(prayerName);
    if (timerId) {
      clearTimeout(timerId);
      pendingNotificationTimers.delete(prayerName);
    }
  }

  function cancelAllNotifications() {
    for (const timerId of pendingNotificationTimers.values()) {
      clearTimeout(timerId);
    }
    pendingNotificationTimers.clear();
  }

  return {
    notifyPrayer,
    cancelNotification,
    cancelAllNotifications,
  };
}

module.exports = {
  createNotifier,
};
