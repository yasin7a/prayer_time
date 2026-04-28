const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function createDefaultPrayerState() {
  return PRAYER_NAMES.reduce((state, prayerName) => {
    state[prayerName] = "pending";
    return state;
  }, {});
}

function createDefaultReminderState() {
  return PRAYER_NAMES.reduce((state, prayerName) => {
    state[prayerName] = false;
    return state;
  }, {});
}

module.exports = {
  PRAYER_NAMES,
  createDefaultPrayerState,
  createDefaultReminderState,
};
