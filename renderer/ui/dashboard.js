import { formatTime } from "../utils/time.js";

export function buildPrayerStatusItems(prayerTimes, prayerStates) {
  const now = new Date();

  return prayerTimes.map((item) => {
    const itemTime = new Date(item.time);
    let status = prayerStates[item.name] || "pending";

    if (status === "pending" && itemTime <= now) {
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

export function formatProgress(prayerItems) {
  const completedCount = prayerItems.filter(
    (item) => item.status === "completed",
  ).length;
  return {
    count: completedCount,
    label: `${completedCount} / ${prayerItems.length} completed`,
  };
}
