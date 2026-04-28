document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button[data-prayer]");
  const loader = document.getElementById("loader");
  let loading = false;

  const setLoading = (active) => {
    loading = active;
    if (loader) {
      loader.classList.toggle("active", active);
    }

    buttons.forEach((btn) => {
      if (active) {
        btn.disabled = true;
      } else if (!btn.dataset.tempDisabled) {
        btn.disabled = false;
      }
    });
  };

  const setTempDisabled = (btn) => {
    btn.dataset.tempDisabled = "true";
    setTimeout(() => {
      btn.removeAttribute("data-temp-disabled");
      if (!loading) {
        btn.disabled = false;
      }
    }, 5000);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const prayer = btn.getAttribute("data-prayer");
      setLoading(true);
      setTempDisabled(btn);

      try {
        if (window.api && typeof window.api.remind === "function") {
          await window.api.remind(prayer);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });
  });
});
