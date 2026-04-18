function applyTheme(theme) {
  document.body.classList.remove("light", "dark", "high");
  document.body.classList.add(theme);
}

function applyTextSize(size) {
  const scale = size === "large" ? 1.25 : 1;
  document.documentElement.style.setProperty("--text-scale", scale);
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}

function setTextSize(size) {
  localStorage.setItem("textSize", size);
  applyTextSize(size);
}

function bindSettingsButtons() {
  const themeButtons = document.querySelectorAll("[data-theme]");
  const textSizeButtons = document.querySelectorAll("[data-text-size]");

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.theme);
    });
  });

  textSizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTextSize(button.dataset.textSize);
    });
  });
}

window.setTheme = setTheme;
window.setTextSize = setTextSize;

document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme") || "light";
  const size = localStorage.getItem("textSize") || "normal";

  applyTheme(theme);
  applyTextSize(size);
  bindSettingsButtons();
});
