function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(tabName).style.display = 'block';
  event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const suggestionsEl = document.getElementById('suggestions');
  const friendsEl = document.getElementById('friends');
  const searchInput = document.getElementById('friend-search');

  let allSuggestions = [];
  let allFriends = [];

  // ----------------------------
  // Load Suggestions
  // ----------------------------
  async function loadSuggestions() {
    try {
      const res = await fetch('/api/auth/suggestions', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      const data = await res.json();
      allSuggestions = data.users || [];
      renderSuggestions(allSuggestions);
    } catch (err) {
      console.error('Suggestions fetch error', err);
    }
  }

  function renderSuggestions(users) {
    suggestionsEl.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'suggest-title';
    title.textContent = 'Add Friends';
    suggestionsEl.appendChild(title);

    if (!users.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No suggestions available';
      suggestionsEl.appendChild(empty);
      return;
    }

    users.forEach(user => {
      const card = document.createElement('div');
      card.className = 'friend-card';

      const suggestInfo = document.createElement('div');
      suggestInfo.className = 'suggest-info';

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'friend-avatar';
      const avatarImg = document.createElement('img');
      avatarImg.src = `/assets/avatars/avatar-${user.avatar ?? 0}.png`;
      avatarImg.alt = user.nickname;
      avatarDiv.appendChild(avatarImg);

      const name = document.createElement('div');
      name.className = 'friend-name';
      name.textContent = user.nickname;

      suggestInfo.appendChild(avatarDiv);
      suggestInfo.appendChild(name);

      const addBtn = document.createElement('button');
      addBtn.className = 'suggest-add-btn';
      addBtn.textContent = 'Add Friend';
      addBtn.addEventListener('click', async () => {
        try {
          const r = await fetch('/api/auth/addfriend', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ id: user.id })
          });
          if (r.ok) {
            addBtn.textContent = '✓ Added';
            addBtn.disabled = true;
            addBtn.style.background = '#34c759';
          } else {
            const err = await r.json().catch(() => ({}));
            alert(err.message || 'Could not add friend');
          }
        } catch (err) {
          console.error('Add friend error', err);
        }
      });

      const blockBtn = document.createElement('button');
      blockBtn.className = 'friend-block-btn';
      blockBtn.textContent = 'Block';
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
          if (r.ok) card.remove();
          else alert('Could not block user');
        } catch (err) {
          console.error('Block request failed', err);
        }
      });

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.appendChild(addBtn);
      actions.appendChild(blockBtn);

      card.appendChild(suggestInfo);
      card.appendChild(actions);
      suggestionsEl.appendChild(card);
    });
  }

  // ----------------------------
  // Load Friends
  // ----------------------------
  async function loadFriends() {
    try {
      const res = await fetch('/api/auth/friends', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      const data = await res.json();
      allFriends = data.friends || [];
      renderFriends(allFriends);
    } catch (err) {
      console.error('Friends fetch error', err);
    }
  }

  function renderFriends(friends) {
    friendsEl.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'suggest-title';
    title.textContent = 'My Friends';
    friendsEl.appendChild(title);

    if (!friends.length) {
      const empty = document.createElement('p');
      empty.textContent = 'You have no friends yet — add some from the Suggestions tab!';
      empty.style.textAlign = 'center';
      empty.style.color = '#888';
      friendsEl.appendChild(empty);
      return;
    }

    friends.forEach(friend => {
      const card = document.createElement('div');
      card.className = 'friend-card';

      const info = document.createElement('div');
      info.className = 'suggest-info';

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'friend-avatar';
      const avatarImg = document.createElement('img');
      avatarImg.src = `/assets/avatars/avatar-${friend.avatar ?? 0}.png`;
      avatarImg.alt = friend.nickname;
      avatarDiv.appendChild(avatarImg);

      const name = document.createElement('div');
      name.className = 'friend-name';
      name.textContent = friend.nickname;

      info.appendChild(avatarDiv);
      info.appendChild(name);

      const blockBtn = document.createElement('button');
      blockBtn.className = 'friend-block-btn';
      blockBtn.textContent = 'Block';
      blockBtn.addEventListener('click', async () => {
        try {
          const r = await fetch('/api/auth/block', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ id: friend.id })
          });
          if (r.ok) card.remove();
          else alert('Could not block user');
        } catch (err) {
          console.error('Block request failed', err);
        }
      });

      card.appendChild(info);
      card.appendChild(blockBtn);
      friendsEl.appendChild(card);
    });
  }

  // ----------------------------
  // SEARCH FUNCTIONALITY
  // ----------------------------
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    // If query is empty, show all users
    const filteredSuggestions = query
      ? allSuggestions.filter(u => u.nickname.toLowerCase().includes(query))
      : allSuggestions;
    renderSuggestions(filteredSuggestions);

    const filteredFriends = query
      ? allFriends.filter(f => f.nickname.toLowerCase().includes(query))
      : allFriends;
    renderFriends(filteredFriends);
  });

  // ----------------------------
  // Initial Load
  // ----------------------------
  loadSuggestions();
  loadFriends();
});