const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function createDefaultReminderState() {
  return PRAYER_NAMES.reduce((state, prayerName) => {
    state[prayerName] = false;
    return state;
  }, {});
}

module.exports = {
  PRAYER_NAMES,
  createDefaultReminderState,
};
