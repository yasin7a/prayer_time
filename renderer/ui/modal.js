export function bindReminderModal({ onYes, onNo }) {
  const modal = document.getElementById("reminder-modal");
  const yesButton = document.getElementById("modal-yes-button");
  const noButton = document.getElementById("modal-no-button");

  yesButton.addEventListener("click", () => {
    onYes();
    closeReminderModal();
  });

  noButton.addEventListener("click", () => {
    onNo();
    closeReminderModal();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeReminderModal();
    }
  });
}

export function openReminderModal(prayerName) {
  const modal = document.getElementById("reminder-modal");
  const questionTextElement = document.getElementById("question-text");
  questionTextElement.textContent = `Did you complete ${prayerName}?`;
  modal.classList.add("modal-visible");
}

export function closeReminderModal() {
  const modal = document.getElementById("reminder-modal");
  modal.classList.remove("modal-visible");
}
