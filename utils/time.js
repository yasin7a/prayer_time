function toDateKey(date = new Date()) {
  const normalized = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return normalized.toISOString().slice(0, 10);
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = {
  toDateKey,
  formatTime,
};
