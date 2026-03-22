function loadProfileData() {
  const nickname = localStorage.getItem('nickname');
  const createdAt = localStorage.getItem('createdAt');
  const avatar = localStorage.getItem('avatar') ?? 0;

  // Load username
  const usernameEl = document.querySelector('.username');
  if (usernameEl) usernameEl.textContent = nickname;

  // Load avatar
  const profileAvatar = document.querySelector('.profile-avatar img');
  if (profileAvatar) {
    profileAvatar.src = `/assets/avatars/avatar-${avatar}.png`;
  }

  // Load member since date
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

loadProfileData();