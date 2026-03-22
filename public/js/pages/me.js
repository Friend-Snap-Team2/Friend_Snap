function loadProfileData() {
  const nickname = localStorage.getItem('nickname');
  const createdAt = localStorage.getItem('createdAt');
  const avatar = localStorage.getItem('avatar') ?? 0;

  const usernameEl = document.querySelector('.username');
  if (usernameEl) usernameEl.textContent = nickname;

  const profileAvatar = document.querySelector('.profile-avatar img');
  if (profileAvatar) {
    profileAvatar.src = `/assets/avatars/avatar-${avatar}.png`;
  }

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

window.openBlockedPopup = function() {
  document.getElementById('blocked-popup').style.display = 'flex';
  loadBlockedUsers();
}

window.closeBlockedPopup = function() {
  document.getElementById('blocked-popup').style.display = 'none';
}

async function loadBlockedUsers() {
  const token = localStorage.getItem('token');
  const blockedEl = document.getElementById('blocked-list');
  if (!blockedEl) return;

  try {
    const res = await fetch('/api/auth/blocked', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    renderBlockedUsers(data.blocked || []);
  } catch (err) {
    console.error('Blocked fetch error', err);
  }
}

function renderBlockedUsers(users) {
  const blockedEl = document.getElementById('blocked-list');

  if (!users.length) {
    blockedEl.innerHTML = '<p class="blocked-empty">No blocked users</p>';
    return;
  }

  blockedEl.innerHTML = '';

  users.forEach(user => {
    const row = document.createElement('div');
    row.className = 'blocked-row';

    const info = document.createElement('div');
    info.className = 'suggest-info';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'friend-avatar';

    const avatarImg = document.createElement('img');
    avatarImg.src = `/assets/avatars/avatar-${user.avatar ?? 0}.png`;
    avatarImg.alt = user.nickname;
    avatarDiv.appendChild(avatarImg);

    const name = document.createElement('div');
    name.className = 'friend-name';
    name.textContent = user.nickname;

    info.appendChild(avatarDiv);
    info.appendChild(name);

    const unblockBtn = document.createElement('button');
    unblockBtn.className = 'unblock-btn';
    unblockBtn.textContent = 'Unblock';

    unblockBtn.addEventListener('click', async () => {
      const token = localStorage.getItem('token');
      try {
        const r = await fetch('/api/auth/unblock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ id: user.id })
        });
        if (r.ok) {
          row.remove();
          if (!document.querySelectorAll('.blocked-row').length) {
            blockedEl.innerHTML = '<p class="blocked-empty">No blocked users</p>';
          }
        }
      } catch (err) {
        console.error('Unblock error', err);
      }
    });

    row.appendChild(info);
    row.appendChild(unblockBtn);
    blockedEl.appendChild(row);
  });
}

loadProfileData();
loadBlockedUsers();