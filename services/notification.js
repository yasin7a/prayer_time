const { Notification } = require("electron");
const { appConfig } = require("../config/config");

function createNotifier({ onClick }) {
  function notifyPrayer(prayerName) {
    if (!Notification.isSupported()) {
      return;
    }

    setTimeout(() => {
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
  }

  return {
    notifyPrayer,
  };
}

module.exports = {
  createNotifier,
};
