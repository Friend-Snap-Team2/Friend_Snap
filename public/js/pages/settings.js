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

  if(size === "large"){
    document.body.style.fontSize = "20px";
  } else {
    document.body.style.fontSize = "16px";
  }
}

// LOAD SAVED SETTINGS

window.onload = function(){
  const theme = localStorage.getItem("theme") || "light";
  const size = localStorage.getItem("textSize") || "normal";

  applyTheme(theme);
  applyTextSize(size);
}