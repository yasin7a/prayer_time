document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button[data-prayer]");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prayer = btn.getAttribute("data-prayer");
      if (window.api && typeof window.api.remind === "function") {
        window.api.remind(prayer);
      }
    });
  });
});
