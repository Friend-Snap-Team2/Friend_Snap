function applySavedTheme(theme) {
  document.body.classList.remove("light", "dark", "high");
  document.body.classList.add(theme);
}

function applySavedTextSize(size) {
  const scale = size === "large" ? 1.25 : 1;
  document.documentElement.style.setProperty("--text-scale", scale);
}

const savedTheme = localStorage.getItem("theme") || "light";
applySavedTheme(savedTheme);

const savedSize = localStorage.getItem("textSize") || "normal";
applySavedTextSize(savedSize);

function runAuthGuard() {
  const token = localStorage.getItem('token');

  const path = window.location.pathname;

  const isLoginPage = path.includes('index.html');

  // only protect app pages, NOT login or public pages
  const protectedPages = ['home', 'friends', 'chat', 'me', 'add-photo'];

  const isProtected = protectedPages.some(p => path.includes(p));

  if (!token && isProtected) {
    window.location.href = '/index.html';
  }
}

runAuthGuard();

async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('nickname');
  localStorage.removeItem('avatar');
  localStorage.removeItem('createdAt');
  window.location.href = '/index.html';
}

function getAvatarPath(index) {
  return `/assets/avatars/avatar-${index}.png`;
}

loadComponent('header', '/components/header.html').then(() => {
  const nickname = localStorage.getItem('nickname');
  const avatar = localStorage.getItem('avatar') ?? 0;

  const usernameElement = document.querySelector('.username');
  if (usernameElement && nickname) {
    usernameElement.textContent = nickname;
  }

  const avatarElement = document.querySelector('.avatar img');
  if (avatarElement) {
    avatarElement.src = `/assets/avatars/avatar-${avatar}.png`;
  }
});

loadComponent('footer', '/components/footer.html').then(() => {
  const path = window.location.pathname;
  const navItems = document.querySelectorAll('.nav');

  const pageMap = [
    { path: 'home', index: 0 },
    { path: 'add-photo', index: 1 },
    { path: 'friends', index: 2 },
    { path: 'chat', index: 3 },
    { path: 'me', index: 4 },
  ];

  navItems.forEach(item => item.classList.remove('active'));
  const match = pageMap.find(p => path.includes(p.path));
  if (match) navItems[match.index].classList.add('active');
});
