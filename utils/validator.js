const { PRAYER_NAMES } = require("../storage/schema");

const VALID_RESPONSE_STATUSES = ["YES", "NO"];

function isValidPrayerName(name) {
  return typeof name === "string" && PRAYER_NAMES.includes(name);
}

function isValidResponseStatus(status) {
  return VALID_RESPONSE_STATUSES.includes(status);
}

module.exports = {
  isValidPrayerName,
  isValidResponseStatus,
};
