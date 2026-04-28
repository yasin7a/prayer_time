import { renderPrayerList } from "./ui/dashboard.js";
import { bindReminderModal, openReminderModal } from "./ui/modal.js";
import { showToast } from "./ui/toast.js";

const todayDateEl = document.getElementById("today-date");
const currentPrayerEl = document.getElementById("current-prayer");
const currentTimeEl = document.getElementById("current-time");
const prayerTimesEl = document.getElementById("prayer-times");

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
  currentTimeEl.textContent = new Date(
    data.currentPrayerTime,
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  prayerTimesEl.innerHTML = renderPrayerList(data.prayerTimes);
}

async function loadPrayerData() {
  const data = await window.electronAPI.getPrayerData();
  refreshUI(data);
}

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

loadPrayerData();
