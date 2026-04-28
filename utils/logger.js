function log(...args) {
  console.log("[NamazApp]", ...args);
}

function error(...args) {
  console.error("[NamazApp] ERROR", ...args);
}

module.exports = {
  log,
  error,
};
