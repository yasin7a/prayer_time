import { formatTime } from "../utils/time.js";

export function renderPrayerList(prayerItems) {
  return prayerItems
    .map(
      (item) => `
      <li data-prayer="${item.name}" class="prayer-item">
        <div class="prayer-item-copy">
          <strong>${item.name}</strong>
          <span>${formatTime(item.time)}</span>
        </div>
      </li>`,
    )
    .join("\n");
}
