import {
  buildPrayerStatusItems,
  renderPrayerList,
  renderLogEntries,
  formatProgress,
} from "./ui/dashboard.js";
import { bindReminderModal, openReminderModal } from "./ui/modal.js";
import { showToast } from "./ui/toast.js";

const todayDateEl = document.getElementById("today-date");
const currentPrayerEl = document.getElementById("current-prayer");
const currentTimeEl = document.getElementById("current-time");
const prayerTimesEl = document.getElementById("prayer-times");
const logListEl = document.getElementById("log-list");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const progressChip = document.getElementById("progress-chip");

let currentPrayerName = null;

function highlightPrayer(prayerName) {
  const items = prayerTimesEl.querySelectorAll("[data-prayer]");
  items.forEach((item) => {
    if (item.dataset.prayer === prayerName) {
      item.classList.add("highlighted");
      item.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      item.classList.remove("highlighted");
    }
  });
}

function updateDateDisplay() {
  const date = new Date();
  todayDateEl.textContent = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function refreshUI(data) {
  updateDateDisplay();

  currentPrayerName = data.currentPrayerName;
  currentPrayerEl.textContent = currentPrayerName;
  currentTimeEl.textContent = new Date(data.currentPrayerTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const prayerItems = buildPrayerStatusItems(data.prayerTimes, data.logs || []);
  const progress = formatProgress(prayerItems);

  progressChip.textContent = progress.label;

  prayerTimesEl.innerHTML = renderPrayerList(prayerItems);
  logListEl.innerHTML = renderLogEntries(data.logs || []);
}

async function loadPrayerData() {
  const data = await window.electronAPI.getPrayerData();
  refreshUI(data);
}

function sendPrayerResponse(status) {
  if (!currentPrayerName) {
    return;
  }

  window.electronAPI.sendUserResponse({
    prayer: currentPrayerName,
    status,
  });
}

yesButton.addEventListener("click", () => sendPrayerResponse("YES"));
noButton.addEventListener("click", () => sendPrayerResponse("NO"));

bindReminderModal({
  onYes: () => {
    if (currentPrayerName) {
      window.electronAPI.sendReminderResponse({
        prayer: currentPrayerName,
        status: "YES",
      });
    }
  },
  onNo: () => {
    if (currentPrayerName) {
      window.electronAPI.sendReminderResponse({
        prayer: currentPrayerName,
        status: "NO",
      });
    }
  },
});

window.electronAPI.onPrayerData((data) => {
  refreshUI(data);
});

window.electronAPI.onOpenPrayerUI((prayerName) => {
  currentPrayerName = prayerName;
  openReminderModal(prayerName);
  highlightPrayer(prayerName);
  showToast(`Reminder open for ${prayerName}`, "success");
});

window.electronAPI.onLogUpdated((entry) => {
  const message = entry.status === "YES"
    ? "✔ Prayer completed"
    : "Reminder saved — we will check in again.";
  showToast(message, entry.status === "YES" ? "success" : "warn");
  loadPrayerData();
});

loadPrayerData();
