document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button[data-prayer]");
  const remindersToggle = document.getElementById("toggle-reminders");
  const soundToggle = document.getElementById("toggle-sound");
  const compactToggle = document.getElementById("toggle-compact");

  const defaultSettings = {
    enableReminders: true,
    notificationSound: true,
    compactMode: false,
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem("prayTimeSettings");
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (error) {
      return defaultSettings;
    }
  };

  const saveSettings = (settings) => {
    localStorage.setItem("prayTimeSettings", JSON.stringify(settings));
  };

  const applySettings = (settings) => {
    remindersToggle.checked = settings.enableReminders;
    soundToggle.checked = settings.notificationSound;
    compactToggle.checked = settings.compactMode;

    buttons.forEach((btn) => {
      btn.disabled = !settings.enableReminders;
      btn.style.opacity = settings.enableReminders ? "1" : "0.6";
      btn.style.cursor = settings.enableReminders ? "pointer" : "not-allowed";
    });

    document.body.classList.toggle("compact-mode", settings.compactMode);
  };

  const settings = loadSettings();
  applySettings(settings);

  const handleToggle = () => {
    const updated = {
      enableReminders: remindersToggle.checked,
      notificationSound: soundToggle.checked,
      compactMode: compactToggle.checked,
    };
    saveSettings(updated);
    applySettings(updated);
  };

  [remindersToggle, soundToggle, compactToggle].forEach((input) => {
    input.addEventListener("change", handleToggle);
  });

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prayer = btn.getAttribute("data-prayer");
      const currentSettings = loadSettings();
      if (!currentSettings.enableReminders) {
        window.alert("Reminders are disabled in app settings.");
        return;
      }
      if (window.api && typeof window.api.remind === "function") {
        window.api.remind(prayer);
      }
    });
  });
});
