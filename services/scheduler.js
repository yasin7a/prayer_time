const { getPrayerTimeList, getDailyPrayerTimes } = require("./prayerService");

let activeTimers = new Map();
let onPrayerDue = null;
let onDayChange = null;

function clearTimers() {
  for (const timeoutId of activeTimers.values()) {
    clearTimeout(timeoutId);
  }
  activeTimers.clear();
}

function schedulePrayerEvents(prayerTimes) {
  clearTimers();
  const now = new Date();
  const upcomingPrayers = getPrayerTimeList(prayerTimes).filter(
    (item) => item.time > now,
  );

  if (upcomingPrayers.length === 0) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextPrayerTimes = getDailyPrayerTimes(tomorrow);
    if (typeof onDayChange === "function") {
      onDayChange(nextPrayerTimes);
    }
    schedulePrayerEvents(nextPrayerTimes);
    return;
  }

  for (const prayer of upcomingPrayers) {
    const delay = prayer.time.getTime() - now.getTime();
    const timeoutId = setTimeout(() => {
      if (typeof onPrayerDue === "function") {
        onPrayerDue(prayer.name);
      }
    }, delay);
    activeTimers.set(prayer.name, timeoutId);
  }

  const midnight = new Date(now);
  midnight.setHours(24, 0, 5, 0);
  const refreshDelay = midnight.getTime() - now.getTime();
  const refreshTimeout = setTimeout(() => {
    const nextPrayerTimes = getDailyPrayerTimes(new Date());
    if (typeof onDayChange === "function") {
      onDayChange(nextPrayerTimes);
    }
    schedulePrayerEvents(nextPrayerTimes);
  }, refreshDelay);
  activeTimers.set("__refresh__", refreshTimeout);
}

function stopScheduler() {
  clearTimers();
}

function stopReminder(prayerName) {
  const timeoutId = activeTimers.get(prayerName);
  if (timeoutId) {
    clearTimeout(timeoutId);
    activeTimers.delete(prayerName);
  }
}

function initScheduler({
  prayerTimes,
  onPrayerDue: callback,
  onDayChange: dayCallback,
}) {
  onPrayerDue = callback;
  onDayChange = dayCallback;
  schedulePrayerEvents(prayerTimes);

  return {
    stop: stopScheduler,
    stopReminder,
  };
}

module.exports = {
  initScheduler,
  stopScheduler,
  stopReminder,
};
