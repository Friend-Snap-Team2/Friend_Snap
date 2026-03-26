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

// Show my photos popup when photos-card clicked
document.addEventListener('DOMContentLoaded', () => {
  const photosCard = document.querySelector('.photos-card');
  const popup = document.getElementById('my-photos-popup');
  const closeBtn = document.getElementById('my-photos-close');
  const grid = document.getElementById('my-photos-grid');

  if (photosCard) photosCard.addEventListener('click', async () => {
    // open popup
    popup.style.display = 'flex';
    grid.innerHTML = '<p style="width:100%;text-align:center;color:#666">Loading...</p>';

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/photos/mine', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        grid.innerHTML = '<p style="width:100%;text-align:center;color:#c33">Could not load photos</p>';
        return;
      }
      const data = await res.json();
      grid.innerHTML = '';
      if (!data.photos || !data.photos.length) {
        grid.innerHTML = '<p style="width:100%;text-align:center;color:#666">No photos yet</p>';
        return;
      }

      data.photos.forEach(p => {
        const img = document.createElement('img');
        img.src = p.url;
        img.style.width = '150px';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '10px';
        grid.appendChild(img);
      });

    } catch (err) {
      console.error('My photos error', err);
      grid.innerHTML = '<p style="width:100%;text-align:center;color:#c33">Error loading</p>';
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', () => { popup.style.display = 'none'; });
  // close when clicking overlay
  if (popup) popup.addEventListener('click', (e) => { if (e.target === popup) popup.style.display = 'none'; });
});