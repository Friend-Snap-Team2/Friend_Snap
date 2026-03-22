document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // =====================================
  // SWITCH VIEWS
  // =====================================
  function openChat(friend) {
    // Fill in friend data
    document.getElementById('chatNickname').textContent = friend.nickname;
    document.getElementById('chatAvatar').src = `/assets/avatars/avatar-${friend.avatar ?? 0}.png`;

    // Hide header and footer
    document.getElementById('header').style.display = 'none';
    document.getElementById('footer').style.display = 'none';

    // Swap views
    document.getElementById('chat-list-view').style.display = 'none';
    document.getElementById('chat-window-view').style.display = 'flex';
  }

  window.showChatList = function() {
    // Show header and footer again
    document.getElementById('header').style.display = 'block';
    document.getElementById('footer').style.display = 'block';

    // Swap views
    document.getElementById('chat-window-view').style.display = 'none';
    document.getElementById('chat-list-view').style.display = 'block';
  }

  // =====================================
  // LOAD FRIENDS INTO CHAT LIST
  // =====================================
  async function loadFriends() {
    try {
      const res = await fetch('/api/auth/friends', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      const data = await res.json();
      renderFriends(data.friends || []);
    } catch (err) {
      console.error('Friends fetch error', err);
    }
  }

  function renderFriends(friends) {
    const friendsEl = document.getElementById('chat-list');
    if (!friendsEl) return;

    friendsEl.innerHTML = '';

    if (!friends.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No friends yet!';
        empty.style.textAlign = 'center';
        empty.style.color = '#888';
        empty.style.marginBottom = '15px';

        const addBtn = document.createElement('button');
        addBtn.textContent = '👥 Add Friends';
        addBtn.style.display = 'block';
        addBtn.style.margin = '0 auto';
        addBtn.style.background = 'linear-gradient(90deg, #ff8a3d, #ff6a2d)';
        addBtn.style.color = 'white';
        addBtn.style.border = 'none';
        addBtn.style.padding = '12px 25px';
        addBtn.style.borderRadius = '25px';
        addBtn.style.fontWeight = 'bold';
        addBtn.style.cursor = 'pointer';
        addBtn.style.fontSize = '16px';

        addBtn.addEventListener('click', () => {
            window.location.href = '/pages/friends.html';
        });

        friendsEl.appendChild(empty);
        friendsEl.appendChild(addBtn);
        return;
        }

    friends.forEach(friend => {
      const card = document.createElement('div');
      card.className = 'chat-card';

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

      const chatBtn = document.createElement('button');
      chatBtn.className = 'chat-btn';
      chatBtn.textContent = '💬 Message';

      chatBtn.addEventListener('click', () => openChat(friend));

      card.appendChild(info);
      card.appendChild(chatBtn);
      friendsEl.appendChild(card);
    });
  }

  loadFriends();
});