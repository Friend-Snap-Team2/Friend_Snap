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

  // ✅ PAGINATION STATE
  let currentPages = {
    suggestions: 1,
    friends: 1
  };

  const itemsPerPage = 6;

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

    // PAGINATION SLICE
    const start = (currentPages.suggestions - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedUsers = users.slice(start, end);

    paginatedUsers.forEach(user => {
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

    const totalPages = Math.ceil(users.length / itemsPerPage);
    document.getElementById("suggestions-page-info").textContent =
      "Page " + currentPages.suggestions + " of " + totalPages;

    renderPageNumbers("suggestions", users.length);
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

    if (!friends.length) return;

    // PAGINATION SLICE
    const start = (currentPages.friends - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedFriends = friends.slice(start, end);

    paginatedFriends.forEach(friend => {
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

      card.appendChild(info);
      friendsEl.appendChild(card);
    });

    const totalPages = Math.ceil(friends.length / itemsPerPage);
    document.getElementById("friends-page-info").textContent =
      "Page " + currentPages.friends + " of " + totalPages;

    renderPageNumbers("friends", friends.length);
  }

  // ----------------------------
  // PAGE NUMBER RENDERER (ADDED)
  // ----------------------------
  function renderPageNumbers(type, totalItems) {
    const container = document.getElementById(type + "-pages");
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (!container) return;

    container.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;

      if (currentPages[type] === i) {
        btn.style.fontWeight = "bold";
        btn.style.background = "#4f8df5";
        btn.style.color = "white";
      }

      btn.onclick = () => {
        currentPages[type] = i;

        if (type === "suggestions") {
          renderSuggestions(allSuggestions);
        } else {
          renderFriends(allFriends);
        }
      };

      container.appendChild(btn);
    }
  }

  // ----------------------------
  // SEARCH FUNCTIONALITY
  // ----------------------------
  searchInput.addEventListener('input', () => {
    currentPages.suggestions = 1;
    currentPages.friends = 1;

    const query = searchInput.value.toLowerCase().trim();

    const filteredSuggestions = query
      ? allSuggestions.filter(u => u.nickname.toLowerCase().includes(query))
      : allSuggestions;

    const filteredFriends = query
      ? allFriends.filter(f => f.nickname.toLowerCase().includes(query))
      : allFriends;

    renderSuggestions(filteredSuggestions);
    renderFriends(filteredFriends);
  });

  // ----------------------------
  // PAGINATION BUTTONS (UNCHANGED)
  // ----------------------------
  window.nextPage = function(type) {
    const list = type === "suggestions" ? allSuggestions : allFriends;
    const totalPages = Math.ceil(list.length / itemsPerPage);

    if (currentPages[type] < totalPages) {
      currentPages[type]++;
      type === "suggestions"
        ? renderSuggestions(allSuggestions)
        : renderFriends(allFriends);
    }
  };

  window.prevPage = function(type) {
    if (currentPages[type] > 1) {
      currentPages[type]--;
      type === "suggestions"
        ? renderSuggestions(allSuggestions)
        : renderFriends(allFriends);
    }
  };

  // ----------------------------
  // INIT
  // ----------------------------
  loadSuggestions();
  loadFriends();
});