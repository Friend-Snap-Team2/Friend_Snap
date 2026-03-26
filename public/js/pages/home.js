document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const cardsEl = document.querySelector('.cards');
  if (!cardsEl) return;

  async function loadSuggestions() {
    try {
      const res = await fetch('/api/auth/suggestions', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (!res.ok) {
        console.error('Failed to load suggestions');
        return;
      }
      const data = await res.json();
      console.log('Suggestions data:', data.users);
      renderSuggestions((data.users || []).slice(0, 2));
    } catch (err) {
      console.error('Suggestions fetch error', err);
    }
  }

  function renderSuggestions(users) {
    cardsEl.innerHTML = '';
    if (!users.length) {
      cardsEl.innerHTML = '<p>No suggestions available</p>';
      return;
    }

    users.forEach(user => {
      const card = document.createElement('div');
      card.className = 'card';

      const blockBtn = document.createElement('button');
      blockBtn.className = 'block';
      blockBtn.textContent = 'Block';

      const profile = document.createElement('div');
      profile.className = 'profile';

      const icon = document.createElement('div');
      icon.className = 'profile-icon';

      const avatarImg = document.createElement('img');
      avatarImg.src = `/assets/avatars/avatar-${user.avatar ?? 0}.png`;
      avatarImg.alt = user.nickname;

      icon.appendChild(avatarImg);

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = user.nickname;

      const likes = document.createElement('div');
      likes.className = 'likes';
      likes.innerHTML = 'Likes photos of: <b>photos</b>';

      info.appendChild(name);
      info.appendChild(likes);

      profile.appendChild(icon);
      profile.appendChild(info);

      const helloBtn = document.createElement('button');
      helloBtn.className = 'hello-btn';
      helloBtn.textContent = '👋 Say Hello!';
      helloBtn.addEventListener('click', () => {
        // navigate to chat (basic behavior)
        window.location.href = '/pages/chat.html';
      });

      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = 'Tap to send a friendly hello';

      blockBtn.addEventListener('click', async () => {
        try {
          const r = await fetch('/api/auth/block', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ id: user.id })
          });
          if (r.ok) {
            card.remove();
          } else {
            const err = await r.json().catch(() => ({}));
            alert(err.message || 'Could not block user');
          }
        } catch (err) {
          console.error('Block request failed', err);
        }
      });

      card.appendChild(blockBtn);
      card.appendChild(profile);
      card.appendChild(helloBtn);
      card.appendChild(hint);

      cardsEl.appendChild(card);
    });
  }

  loadSuggestions();
  loadPhotoFeed();

  async function loadPhotoFeed() {
    const grid = document.querySelector('.photo-grid');
    if (!grid) return;
    try {
      const res = await fetch('/api/photos');
      if (!res.ok) return;
      const data = await res.json();
      renderFeed((data.photos || []));
    } catch (err) {
      console.error('Photo feed error', err);
    }
  }

  function renderFeed(photos) {
    const grid = document.querySelector('.photo-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!photos.length) {
      grid.innerHTML = '<p style="text-align:center;color:#666">No photos yet</p>';
      return;
    }

    photos.forEach(p => {
      const box = document.createElement('div');
      box.className = 'photo-box';
      const img = document.createElement('img');
      img.src = p.url;
      img.alt = p.owner ? p.owner.nickname : 'photo';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      box.appendChild(img);
      grid.appendChild(box);
    });
  }
});
