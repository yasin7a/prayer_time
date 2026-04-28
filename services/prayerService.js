const {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  Madhab,
} = require("adhan");

const coordinates = new Coordinates(23.8103, 90.4125);
const params = CalculationMethod.MuslimWorldLeague();
params.madhab = Madhab.Shafi;

const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function getPrayerTimesForDate(date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return new PrayerTimes(coordinates, today, params);
}

function getPrayerTimeList(prayerTimes) {
  return prayerNames.map((name) => ({
    name,
    time: prayerTimes[name.toLowerCase()],
  }));
}

function getUpcomingPrayer(prayerTimes, now = new Date()) {
  const list = getPrayerTimeList(prayerTimes);
  const nextPrayer = list.find((item) => item.time > now);
  if (nextPrayer) {
    return nextPrayer;
  }

  const tomorrow = getPrayerTimesForDate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
  );
  const tomorrowList = getPrayerTimeList(tomorrow);
  return tomorrowList[0];
}

module.exports = {
  getPrayerTimesForDate,
  getUpcomingPrayer,
  getPrayerTimeList,
  prayerNames,
};
