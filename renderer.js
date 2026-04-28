const todayDateEl = document.getElementById("today-date");
const currentPrayerEl = document.getElementById("current-prayer");
const currentTimeEl = document.getElementById("current-time");
const prayerTimesEl = document.getElementById("prayer-times");
const logListEl = document.getElementById("log-list");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const progressChip = document.getElementById("progress-chip");
const currentCountEl = document.getElementById("current-count");
const toastEl = document.getElementById("toast");

let currentPrayerName = null;
let toastTimer = null;
let highlightedPrayer = null;

function highlightPrayer(prayerName) {
  highlightedPrayer = prayerName;
  const items = prayerTimesEl.querySelectorAll('[data-prayer]');
  items.forEach((item) => {
    if (item.dataset.prayer === prayerName) {
      item.classList.add('highlighted');
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      item.classList.remove('highlighted');
    }
  });
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayKey(date) {
  return new Date(date).toDateString();
}

function buildPrayerStatusItems(prayerTimes, logs) {
  const todayKey = dayKey(new Date());
  const todaysLogs = (logs || []).filter(
    (entry) => dayKey(entry.timestamp) === todayKey,
  );
  const statusMap = new Map();

  todaysLogs.forEach((entry) => {
    if (!statusMap.has(entry.prayer) || entry.status === "YES") {
      statusMap.set(entry.prayer, entry.status);
    }
  });

  const now = new Date();
  return prayerTimes.map((item) => {
    const itemTime = new Date(item.time);
    let status = "pending";
    const recordedStatus = statusMap.get(item.name);

    if (recordedStatus === "YES") {
      status = "completed";
    } else if (itemTime <= now) {
      status = "missed";
    }

    return {
      ...item,
      status,
    };
  });
}

function showToast(message, variant = "success") {
  toastEl.textContent = message;
  toastEl.className = `toast show ${variant}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.className = "toast";
  }, 2200);
}

function refreshUI(data) {
  const date = new Date();
  todayDateEl.textContent = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  currentPrayerName = data.currentPrayerName;
  currentPrayerEl.textContent = currentPrayerName;
  currentTimeEl.textContent = formatTime(data.currentPrayerTime);

  const prayerItems = buildPrayerStatusItems(data.prayerTimes, data.logs || []);
  const completedCount = prayerItems.filter(
    (item) => item.status === "completed",
  ).length;

  progressChip.textContent = `${completedCount} / ${prayerItems.length} completed`;
  currentCountEl.textContent = completedCount;

  prayerTimesEl.innerHTML = prayerItems
    .map((item) => {
      const statusLabel =
        item.status === "completed"
          ? "Completed"
          : item.status === "missed"
            ? "Missed"
            : "Pending";
      return `
        <li data-prayer="${item.name}">
          <div class="prayer-item-copy">
            <strong>${item.name}</strong>
            <span>${formatTime(item.time)}</span>
          </div>
          <span class="status-pill status-${item.status}">${statusLabel}</span>
        </li>
      `;
    })
    .join("");

  logListEl.innerHTML = (data.logs || [])
    .slice(-5)
    .reverse()
    .map(
      (entry) => `
      <li>${new Date(entry.timestamp).toLocaleString()} • <strong>${entry.prayer}</strong> ${entry.status}</li>
    `,
    )
    .join("");
}

async function loadPrayerData() {
  const data = await window.electronAPI.getPrayerData();
  refreshUI(data);
}

yesButton.addEventListener("click", () => {
  if (!currentPrayerName) return;
  window.electronAPI.sendUserResponse({
    prayer: currentPrayerName,
    status: "YES",
  });
});

noButton.addEventListener("click", () => {
  if (!currentPrayerName) return;
  window.electronAPI.sendUserResponse({
    prayer: currentPrayerName,
    status: "NO",
  });
});

window.electronAPI.onPrayerData((data) => {
  refreshUI(data);
});

window.electronAPI.onOpenPrayerUI((prayerName) => {
  highlightPrayer(prayerName);
  currentPrayerName = prayerName;
  showToast(`Reminder for ${prayerName} opened`, "success");
});

window.electronAPI.onLogUpdated((entry) => {
  const message =
    entry.status === "YES"
      ? "✔ Prayer completed"
      : "Reminder saved — we will check in again.";
  showToast(message, entry.status === "YES" ? "success" : "warn");
  loadPrayerData();
});

loadPrayerData();
