async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

loadComponent('header', '/components/header.html');
loadComponent('footer', '/components/footer.html').then(() => {
    
  // highlight the correct nav item based on current page
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

// Set username and avatar in header after it loads
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

// Read Aloud functionality
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const readBtn = document.querySelector('.read-btn');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        const text = document.querySelector('main')?.innerText || document.body.innerText;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          readBtn.textContent = '🔊 Read Aloud';
        } else {
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
