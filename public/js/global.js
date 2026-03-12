function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/index.html';
  }
}

async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('nickname');
  window.location.href = '/index.html';
}

// Fills in the me.html profile page with user data
function loadProfileData() {
  const nickname = localStorage.getItem('nickname');
  const createdAt = localStorage.getItem('createdAt');

  const usernameEl = document.querySelector('.username');
  if (usernameEl) usernameEl.textContent = nickname;

  const dateEl = document.querySelector('.member-since');
  if (dateEl && createdAt) {
    const date = new Date(createdAt);
    const formatted = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    dateEl.textContent = 'Member since ' + formatted;
  }
}

// Run on every page
checkAuth();

loadComponent('header', '/components/header.html').then(() => {
  const nickname = localStorage.getItem('nickname');
  const usernameElement = document.querySelector('.username');
  if (usernameElement && nickname) {
    usernameElement.textContent = nickname;
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