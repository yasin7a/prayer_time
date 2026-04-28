const { getPrayerTimeList, getPrayerTimesForDate } = require("./prayer");

const REMINDER_INTERVAL_MS = Number(
  process.env.REMINDER_INTERVAL_MS || 5 * 60 * 1000,
);
const TEST_REMINDER_SECONDS = Number(process.env.TEST_REMINDER_SECONDS || 0);
let activeTimeouts = new Map();
let reminderIntervals = new Map();
let currentPrayerTimes = null;
let currentScheduleDate = null;
let triggeredPrayers = new Set();
let onPrayerReminder = null;
let onReminderStart = null;
let onReminderStop = null;
let onNextDay = null;

function clearActiveTimeouts() {
  for (const timerId of activeTimeouts.values()) {
    clearTimeout(timerId);
  }
  activeTimeouts.clear();
}

function clearReminderInterval(prayerName) {
  const intervalId = reminderIntervals.get(prayerName);
  if (intervalId) {
    clearInterval(intervalId);
    reminderIntervals.delete(prayerName);
    if (typeof onReminderStop === "function") {
      onReminderStop(prayerName);
    }
  }
}

function clearAllReminderIntervals() {
  for (const prayerName of reminderIntervals.keys()) {
    clearReminderInterval(prayerName);
  }
}

function getScheduleDateKey(prayerTimes) {
  const referenceTime = prayerTimes.fajr || new Date();
  return new Date(referenceTime).toDateString();
}

function beginReminderLoop(prayerName) {
  if (reminderIntervals.has(prayerName)) {
    return;
  }

  if (typeof onPrayerReminder === "function") {
    onPrayerReminder(prayerName);
  }

  if (typeof onReminderStart === "function") {
    onReminderStart(prayerName);
  }

  const intervalId = setInterval(() => {
    if (typeof onPrayerReminder === "function") {
      onPrayerReminder(prayerName);
    }
  }, REMINDER_INTERVAL_MS);

  reminderIntervals.set(prayerName, intervalId);
}

function scheduleDay(prayerTimes, activeReminderPrayers = []) {
  clearActiveTimeouts();
  clearAllReminderIntervals();

  const scheduleKey = getScheduleDateKey(prayerTimes);
  if (scheduleKey !== currentScheduleDate) {
    currentScheduleDate = scheduleKey;
    triggeredPrayers = new Set();
  }

  currentPrayerTimes = prayerTimes;
  const now = new Date();
  const prayerList = getPrayerTimeList(prayerTimes);

  prayerList.forEach((item, index) => {
    const delay = item.time.getTime() - now.getTime();
    const initialDelay =
      index === 0 && TEST_REMINDER_SECONDS > 0
        ? TEST_REMINDER_SECONDS * 1000
        : delay;

    if (initialDelay <= 0) {
      if (activeReminderPrayers.includes(item.name)) {
        beginReminderLoop(item.name);
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      handlePrayerTrigger(item.name);
    }, initialDelay);
    activeTimeouts.set(item.name, timeoutId);
  });

  for (const prayerName of activeReminderPrayers) {
    if (!reminderIntervals.has(prayerName)) {
      const prayer = prayerList.find((item) => item.name === prayerName);
      if (prayer && prayer.time <= now) {
        beginReminderLoop(prayerName);
      }
    }
  }
}

function handlePrayerTrigger(prayerName) {
  if (triggeredPrayers.has(prayerName)) {
    return;
  }
  triggeredPrayers.add(prayerName);
  beginReminderLoop(prayerName);

  const remaining = getPrayerTimeList(currentPrayerTimes).filter(
    (item) => item.time > new Date(),
  );
  if (remaining.length === 0) {
    scheduleTomorrow();
  }
}

function scheduleTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextPrayerTimes = getPrayerTimesForDate(tomorrow);
  if (typeof onNextDay === "function") {
    onNextDay(nextPrayerTimes);
  }
  scheduleDay(nextPrayerTimes);
}

function stopReminder(prayerName) {
  clearReminderInterval(prayerName);
}

function stopScheduler() {
  clearActiveTimeouts();
  clearAllReminderIntervals();
}

function initPrayerScheduler({
  prayerTimes,
  activeReminderPrayers = [],
  onPrayerReminder: reminderCallback,
  onReminderStart: reminderStartCallback,
  onReminderStop: reminderStopCallback,
  onNextDay: nextDayCallback,
}) {
  onPrayerReminder = reminderCallback;
  onReminderStart = reminderStartCallback;
  onReminderStop = reminderStopCallback;
  onNextDay = nextDayCallback;

  scheduleDay(prayerTimes, activeReminderPrayers);
  return {
    stopReminder,
    stop: stopScheduler,
  };
}

module.exports = {
  initPrayerScheduler,
  stopReminder,
  stopScheduler,
};
