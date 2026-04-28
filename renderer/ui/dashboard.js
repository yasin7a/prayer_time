import { formatTime } from "../../utils/time.js";

export function buildPrayerStatusItems(prayerTimes, logs) {
  const now = new Date();
  const statusMap = new Map();
  const todayKey = new Date().toDateString();

  (logs || []).forEach((entry) => {
    if (new Date(entry.timestamp).toDateString() !== todayKey) {
      return;
    }
    if (!statusMap.has(entry.prayer) || entry.status === "YES") {
      statusMap.set(entry.prayer, entry.status);
    }
  });

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

export function renderPrayerList(prayerItems) {
  return prayerItems
    .map((item) => {
      const statusLabel =
        item.status === "completed"
          ? "Completed"
          : item.status === "missed"
            ? "Missed"
            : "Pending";

      return `
      <li data-prayer="${item.name}" class="prayer-item ${
        item.status === "completed" ? "completed" : ""
      }">
        <div class="prayer-item-copy">
          <strong>${item.name}</strong>
          <span>${formatTime(item.time)}</span>
        </div>
        <span class="status-pill status-${item.status}">${statusLabel}</span>
      </li>`;
    })
    .join("\n");
}

export function renderLogEntries(logs) {
  return (logs || [])
    .slice(-5)
    .reverse()
    .map(
      (entry) => `
      <li>
        ${new Date(entry.timestamp).toLocaleString()} • <strong>${entry.prayer}</strong> ${entry.status}
      </li>`,
    )
    .join("\n");
}

export function formatProgress(prayerItems) {
  const completedCount = prayerItems.filter(
    (item) => item.status === "completed",
  ).length;
  return {
    count: completedCount,
    label: `${completedCount} / ${prayerItems.length} completed`,
  };
}
