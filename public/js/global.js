// Apply saved theme and text size on every page load
(function() {
  const theme = localStorage.getItem('theme') || 'light';
  const size = localStorage.getItem('textSize') || 'normal';
  document.body.classList.add(theme);
  const scale = size === 'large' ? 1.25 : 1;
  document.documentElement.style.setProperty('--text-scale', scale);
})();

async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

loadComponent('header', '/components/header.html');
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

function checkAuth() {
  const token = localStorage.getItem('token');
  const path = window.location.pathname;
  const protectedPages = ['home', 'friends', 'chat', 'me', 'add-photo'];
  const isProtected = protectedPages.some(p => path.includes(p));
  if (!token && isProtected) {
    window.location.href = '/pages/index.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('nickname');
  localStorage.removeItem('avatar');
  localStorage.removeItem('createdAt');
  window.location.href = '/index.html';
}

function removeEmojis(text) {
  return text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const nickname = localStorage.getItem('nickname');
    const avatar = localStorage.getItem('avatar') ?? 0;
    const usernameEl = document.querySelector('.username');
    if (usernameEl && nickname) usernameEl.textContent = nickname;
    const avatarEl = document.querySelector('.avatar img');
    if (avatarEl) avatarEl.src = `/assets/avatars/avatar-${avatar}.png`;
  }, 300);
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const readBtn = document.querySelector('.read-btn');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        const isChat = window.location.pathname.includes('chat');
        let rawText = document.querySelector('main')?.innerText || document.body.innerText;
        const text = isChat ? rawText : removeEmojis(rawText);

        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          readBtn.textContent = '🔊 Read Aloud';
        } else {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
          readBtn.textContent = '⏹ Stop';
          utterance.onend = () => {
            readBtn.textContent = '🔊 Read Aloud';
          };
        }
      });
    }
  }, 300);
});
