document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  let currentFriend = null;
  let pollInterval  = null;   // message polling
  let gameInterval  = null;   // game state polling
  let currentGameId = null;
  let emojiQueue    = [];
  let gfExpanded    = true;   // floating window expanded by default

  // ── refs ─────────────────────────────────────────────────
  const previewEl   = document.getElementById('emojiPreview');
  const clearBtn    = document.getElementById('emojiClearBtn');
  const sendBtn     = document.getElementById('emojiSendBtn');
  const gameFloat   = document.getElementById('game-float');
  const gfPanel     = document.getElementById('gfPanel');
  const gfToggleBtn = document.getElementById('gfToggleBtn');
  const gfBarBadge  = document.getElementById('gfBarBadge');
  const gameBadge   = document.getElementById('gameBadge');

  // =============================================
  // EMOJI COMPOSE
  // =============================================
  function updatePreview() {
    if (!emojiQueue.length) {
      previewEl.textContent = 'Tap emojis below…';
      previewEl.classList.remove('has-content');
      sendBtn.disabled = true;
    } else {
      previewEl.textContent = emojiQueue.join('');
      previewEl.classList.add('has-content');
      sendBtn.disabled = false;
    }
  }

  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      emojiQueue.push(btn.dataset.emoji);
      updatePreview();
      btn.style.transform = 'scale(1.3)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    });
  });

  clearBtn.addEventListener('click', () => { emojiQueue = []; updatePreview(); });

  sendBtn.addEventListener('click', async () => {
    if (!currentFriend || !emojiQueue.length) return;
    const combined = emojiQueue.join('');
    emojiQueue = []; updatePreview();
    try {
      const r = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ receiverId: currentFriend.id, emoji: combined })
      });
      if (r.ok) {
        const c = document.getElementById('chatMessages');
        addMessageBubble(combined, true, c);
        c.scrollTop = c.scrollHeight;
      }
    } catch (e) { console.error(e); }
  });

  // =============================================
  // READ ALOUD — reads every bubble with a label
  // =============================================
  document.getElementById('readAloudBtn').addEventListener('click', () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.getElementById('readAloudBtn').textContent = '🔊 Read Aloud';
      return;
    }
    const parts = [];
    const nick = document.getElementById('chatNickname').textContent;
    if (nick) parts.push(`Chat with ${nick}.`);
    document.querySelectorAll('.chat-hint span').forEach(el => parts.push(el.textContent));

    document.querySelectorAll('.message-wrap').forEach(wrap => {
      const bubble = wrap.querySelector('.message-bubble');
      if (!bubble) return;
      const mine = wrap.classList.contains('mine');
      parts.push((mine ? 'You sent: ' : `${nick} sent: `) + bubble.textContent);
    });

    if (!parts.length) parts.push('No messages yet.');
    document.getElementById('readAloudBtn').textContent = '⏹ Stop';
    parts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      if (i === parts.length - 1) {
        u.onend = () => { document.getElementById('readAloudBtn').textContent = '🔊 Read Aloud'; };
      }
      setTimeout(() => window.speechSynthesis.speak(u), i * 50);
    });
  });

  // =============================================
  // BLOCK
  // =============================================
  document.getElementById('blockBtn').addEventListener('click', async () => {
    if (!currentFriend) return;
    await fetch('/api/auth/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id: currentFriend.id })
    });
    showChatList();
    loadFriends();
  });

  // =============================================
  // VIEW SWITCHING
  // =============================================
  function openChat(friend) {
    currentFriend = friend;
    // Persist so a page refresh restores the chat without losing state
    localStorage.setItem('currentFriend', JSON.stringify(friend));

    document.getElementById('chatNickname').textContent = friend.nickname;
    document.getElementById('chatAvatar').src = `/assets/avatars/avatar-${friend.avatar ?? 0}.png`;
    document.getElementById('header').style.display = 'none';
    document.getElementById('chat-list-view').style.display = 'none';
    document.getElementById('chat-window-view').style.display = 'flex';

    loadMessages();
    clearInterval(pollInterval);
    pollInterval = setInterval(loadMessages, 1000); // 1s for near-instant messages

    clearInterval(gameInterval);
    gameInterval = setInterval(checkIncomingInvite, 2000); // 2s invite check
  }

  window.showChatList = function () {
    currentFriend = null;
    localStorage.removeItem('currentFriend'); // clear saved chat
    emojiQueue = []; updatePreview();
    window.speechSynthesis.cancel();
    clearInterval(pollInterval); pollInterval = null;
    clearInterval(gameInterval); gameInterval = null;

    document.getElementById('header').style.display = 'block';
    document.getElementById('chat-window-view').style.display = 'none';
    document.getElementById('chat-list-view').style.display = 'block';
    // Game float stays if a game is in progress
  };

  // =============================================
  // MESSAGES
  // =============================================
  function getMyId() {
    try { return JSON.parse(atob(token.split('.')[1])).id; } catch { return null; }
  }

  async function loadMessages() {
    if (!currentFriend) return;
    try {
      const res = await fetch(`/api/chat/messages/${currentFriend.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      const data = await res.json();
      renderMessages(data.messages || []);
    } catch (e) { console.error(e); }
  }

  function renderMessages(messages) {
    const c = document.getElementById('chatMessages');
    const myId = getMyId();
    const atBottom = c.scrollHeight - c.scrollTop <= c.clientHeight + 60;
    const hint = c.querySelector('.chat-hint');
    c.innerHTML = ''; if (hint) c.appendChild(hint);
    messages.forEach(m => addMessageBubble(m.emoji, m.senderId === myId, c));
    if (atBottom) c.scrollTop = c.scrollHeight;
  }

  function addMessageBubble(emoji, isMine, container) {
    const wrap = document.createElement('div');
    wrap.className = 'message-wrap ' + (isMine ? 'mine' : 'theirs');
    if (!isMine && currentFriend) {
      const av = document.createElement('img');
      av.src = `/assets/avatars/avatar-${currentFriend.avatar ?? 0}.png`;
      av.className = 'msg-avatar';
      wrap.appendChild(av);
    }
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ' + (isMine ? 'bubble-mine' : 'bubble-theirs');
    bubble.textContent = emoji;
    wrap.appendChild(bubble);
    container.appendChild(wrap);
  }

  // =============================================
  // FRIENDS LIST
  // =============================================
  async function loadFriends() {
    try {
      const res = await fetch('/api/auth/friends', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      renderFriends((await res.json()).friends || []);
    } catch (e) { console.error(e); }
  }

  function renderFriends(friends) {
    const el = document.getElementById('chat-list');
    if (!el) return;
    el.innerHTML = '';
    if (!friends.length) {
      el.innerHTML = `
        <p style="text-align:center;color:#888;margin-top:30px">No friends yet!</p>
        <div style="text-align:center;margin-top:12px">
          <button onclick="window.location.href='/pages/friends.html'"
            style="background:linear-gradient(90deg,#ff8a3d,#ff6a2d);color:white;border:none;
                   padding:12px 25px;border-radius:25px;font-weight:bold;cursor:pointer;font-size:16px">
            👥 Add Friends
          </button>
        </div>`;
      return;
    }
    friends.forEach(friend => {
      const card = document.createElement('div');
      card.className = 'chat-card';
      const av = document.createElement('div');
      av.className = 'chat-card-avatar';
      const img = document.createElement('img');
      img.src = `/assets/avatars/avatar-${friend.avatar ?? 0}.png`;
      img.alt = friend.nickname;
      av.appendChild(img);
      const name = document.createElement('div');
      name.className = 'chat-card-name';
      name.textContent = friend.nickname;
      const btn = document.createElement('button');
      btn.className = 'chat-btn';
      btn.textContent = '💬 Message';
      btn.addEventListener('click', () => openChat(friend));
      card.appendChild(av); card.appendChild(name); card.appendChild(btn);
      el.appendChild(card);
    });
  }

  // =============================================
  // FLOATING GAME WINDOW HELPERS
  // =============================================

  // Show the float window and set a specific state panel
  function showGameFloat(stateId) {
    ['invite','waiting','board','result'].forEach(s => {
      document.getElementById('gf-state-' + s).style.display = 'none';
    });
    document.getElementById('gf-state-' + stateId).style.display = 'block';
    gameFloat.style.display = 'block';

    // Auto-expand when a new state arrives
    setFloatExpanded(true);
  }

  function setFloatExpanded(expanded) {
    gfExpanded = expanded;
    gfPanel.style.display = expanded ? 'block' : 'none';
    gfToggleBtn.textContent = expanded ? '▼' : '▲';
  }

  // Badge = red dot on game button AND on float bar
  function setGameBadge(show) {
    gameBadge.style.display = show ? 'flex' : 'none';
    gfBarBadge.style.display = show ? 'flex' : 'none';
  }

  // Toggle expand/collapse
  gfToggleBtn.addEventListener('click', () => {
    setFloatExpanded(!gfExpanded);
    setGameBadge(false); // clear badge when user opens it
  });

  // Close float entirely
  document.getElementById('gfCloseBtn').addEventListener('click', () => {
    gameFloat.style.display = 'none';
    currentGameId = null;
    setGameBadge(false);
  });

  // =============================================
  // GAME — SEND INVITE (🎮 button)
  // =============================================
  document.getElementById('gameBtn').addEventListener('click', async () => {
    if (!currentFriend) return;
    try {
      const r = await fetch('/api/chat/game/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ opponentId: currentFriend.id })
      });
      if (!r.ok) { alert((await r.json()).message); return; }
      const data = await r.json();
      // data.game._id is now the Chat document _id (used as gameId in all game routes)
      currentGameId = data.game._id;

      document.getElementById('gfBarTitle').textContent = 'Tic-Tac-Toe';
      document.getElementById('gfWaitingText').textContent =
        `Waiting for ${currentFriend.nickname} to accept…`;
      showGameFloat('waiting');
      pollForAccept();
    } catch (e) { console.error(e); }
  });

  // Poll after sending invite.
  // Checks the invite doc directly so we can tell the difference between
  // "still waiting" (status=invited) and "declined" (status=declined).
  // Gives the opponent up to 2 minutes to respond before timing out.
  function pollForAccept() {
    const id = currentGameId;
    const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
    const started = Date.now();

    const iv = setInterval(async () => {
      // Stop if the game id changed (user cancelled or new game started)
      if (!id || currentGameId !== id) { clearInterval(iv); return; }

      // Time out after 2 minutes
      if (Date.now() - started > TIMEOUT_MS) {
        clearInterval(iv);
        document.getElementById('gfResultEmoji').textContent = '⏰';
        document.getElementById('gfResultTitle').textContent = 'Invite Expired';
        currentGameId = null;
        setGameBadge(true);
        showGameFloat('result');
        return;
      }

      try {
        // Check the invite status directly
        const res = await fetch(`/api/chat/game/invite-status/${id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return; // network blip — keep waiting
        const data = await res.json();
        const game = data.game;

        if (!game) return; // doc missing — keep waiting, may be a race

        if (game.status === 'active') {
          clearInterval(iv);
          currentGameId = game._id;
          renderBoard(game);
          document.getElementById('gfBarTitle').textContent = 'Tic-Tac-Toe ▶';
          showGameFloat('board');
          startBoardPolling();
          return;
        }

        if (game.status === 'declined') {
          clearInterval(iv);
          document.getElementById('gfResultEmoji').textContent = '😔';
          document.getElementById('gfResultTitle').textContent = 'Invite Declined';
          currentGameId = null;
          setGameBadge(true);
          showGameFloat('result');
        }
        // status === 'invited' → still waiting, do nothing and keep polling
      } catch (e) { console.error(e); }
    }, 1000); // check every 1s
  }

  // =============================================
  // GAME — CHECK FOR INCOMING INVITE (background poll)
  // =============================================
  async function checkIncomingInvite() {
    if (!currentFriend || currentGameId) return;
    try {
      const res = await fetch(`/api/chat/game/pending/${currentFriend.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.game) {
        currentGameId = data.game._id;
        document.getElementById('gfInviterText').textContent =
          `${currentFriend.nickname} wants to play Tic-Tac-Toe! 🎮`;
        document.getElementById('gfBarTitle').textContent = 'Game Invite!';
        setGameBadge(true);  // red dot appears
        showGameFloat('invite');
      }
    } catch (e) { console.error(e); }
  }

  // Accept
  document.getElementById('gfAcceptBtn').addEventListener('click', async () => {
    if (!currentGameId) return;
    try {
      const r = await fetch('/api/chat/game/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ gameId: currentGameId, accept: true })
      });
      const data = await r.json();
      setGameBadge(false);
      renderBoard(data.game);
      document.getElementById('gfBarTitle').textContent = 'Tic-Tac-Toe ▶';
      showGameFloat('board');
      startBoardPolling();
    } catch (e) { console.error(e); }
  });

  // Decline
  document.getElementById('gfDeclineBtn').addEventListener('click', async () => {
    if (!currentGameId) return;
    await fetch('/api/chat/game/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ gameId: currentGameId, accept: false })
    }).catch(() => {});
    currentGameId = null;
    setGameBadge(false);
    gameFloat.style.display = 'none';
  });

  // =============================================
  // GAME — BOARD
  // =============================================
  function renderBoard(game) {
    const myId = getMyId();
    const boardEl = document.getElementById('gameBoard');
    const turnEl  = document.getElementById('gfTurnLabel');
    const isMyTurn = game.currentTurn === myId;

    turnEl.textContent = isMyTurn ? '🟢 Your turn!' : `⏳ ${currentFriend ? currentFriend.nickname + "'s" : "Their"} turn…`;
    turnEl.style.color = isMyTurn ? '#34c759' : '#ff8a3d';

    boardEl.innerHTML = '';
    game.board.forEach((cell, i) => {
      const btn = document.createElement('button');
      btn.className = 'board-cell';
      btn.textContent = cell === 'X' ? '✕' : cell === 'O' ? '○' : '';
      if (cell) { btn.classList.add('taken', cell === 'X' ? 'cell-x' : 'cell-o'); }
      if (!cell && isMyTurn && game.status === 'active') {
        btn.addEventListener('click', () => makeMove(i));
      } else {
        btn.disabled = true;
      }
      boardEl.appendChild(btn);
    });
  }

  // Keep a single persistent board polling interval stored here
  // so we never accidentally start two at once.
  let boardPollIv = null;

  // Start (or restart) polling the game board every 1s.
  // Runs continuously until the game ends or the game id changes —
  // no more stopping when it's "my turn", because the opponent needs
  // to see my move reflected immediately too.
  function startBoardPolling() {
    // Clear any existing board poll first
    if (boardPollIv) { clearInterval(boardPollIv); boardPollIv = null; }

    const id = currentGameId;
    boardPollIv = setInterval(async () => {
      if (!id || currentGameId !== id) {
        clearInterval(boardPollIv); boardPollIv = null; return;
      }
      try {
        const res = await fetch(`/api/chat/game/active/${currentFriend.id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        // No game found at all — stop polling
        if (!data.game) { clearInterval(boardPollIv); boardPollIv = null; return; }

        // Game finished — show result to BOTH players regardless of who moved last
        if (data.game.status === 'finished') {
          clearInterval(boardPollIv); boardPollIv = null;
          showResult(data.game);
          return;
        }

        // Game still active — update the board
        renderBoard(data.game);

        // Show badge if window is collapsed and it just became my turn
        if (data.game.currentTurn === getMyId() && !gfExpanded) {
          setGameBadge(true);
        }
      } catch (e) { console.error(e); }
    }, 1000); // poll every 1s — fast enough to feel real-time
  }

  async function makeMove(cellIndex) {
    if (!currentGameId) return;
    try {
      const r = await fetch('/api/chat/game/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ gameId: currentGameId, cellIndex })
      });
      const data = await r.json();
      if (!r.ok) { alert(data.message); return; }
      if (data.game.status === 'finished') {
        showResult(data.game);
      } else {
        renderBoard(data.game);
        startBoardPolling(); // wait for opponent
      }
    } catch (e) { console.error(e); }
  }

  // =============================================
  // GAME — RESULT
  // =============================================
  function showResult(game) {
    const myId = getMyId();
    let emoji, title;
    if (game.winner === 'draw')      { emoji = '🤝'; title = "It's a Draw!"; }
    else if (game.winner === myId)   { emoji = '🏆'; title = 'You Win! 🎉'; }
    else                             { emoji = '😅'; title = 'You Lose!'; }

    document.getElementById('gfResultEmoji').textContent = emoji;
    document.getElementById('gfResultTitle').textContent = title;
    currentGameId = null;
    setGameBadge(true); // notify user game ended
    showGameFloat('result');
  }

  document.getElementById('gfPlayAgainBtn').addEventListener('click', () => {
    setGameBadge(false);
    gameFloat.style.display = 'none';
    // Re-trigger invite
    document.getElementById('gameBtn').click();
  });

  document.getElementById('gfDismissBtn').addEventListener('click', () => {
    setGameBadge(false);
    gameFloat.style.display = 'none';
    currentGameId = null;
  });

  // =============================================
  // INIT — always start on the friends list
  // =============================================
  localStorage.removeItem('currentFriend'); // clear any saved chat from a previous visit
  loadFriends();
});