// SAVE + APPLY THEME
function setTheme(theme){
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}

function applyTheme(theme){
  document.body.classList.remove("light", "dark", "high");
  document.body.classList.add(theme);
}

// TEXT SIZE
function setTextSize(size){
  localStorage.setItem("textSize", size);
  applyTextSize(size);
}

function applyTextSize(size){
  let scale = 1;

  if(size === "large"){
    scale = 1.25;
  }

  document.documentElement.style.setProperty("--text-scale", scale);
}

// LOAD SAVED SETTINGS
document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme") || "light";
  const size = localStorage.getItem("textSize") || "normal";

  applyTheme(theme);
  applyTextSize(size);
});