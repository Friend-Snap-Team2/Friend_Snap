const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Chat    = require('../models/Chat');

// =====================================
// HELPERS
// =====================================

/** Sorted pair so [A,B] and [B,A] always resolve to the same document. */
function pair(a, b) { return [a, b].sort(); }

/** Deterministic key for a chat between two users */
function chatKey(userA, userB) {
  return [userA, userB].sort().join('_'); // always same order
}

/**
 * Find or create the single Chat document for two users.
 * Using findOneAndUpdate with upsert:true avoids a race-condition
 * that would exist with a separate find → create flow.
 */
async function getOrCreateChat(userA, userB) {
  const participants = [userA, userB].sort();
  const chatKey = participants.join('_'); // unique key for this chat

  try {
    // try to find or create chat atomically
    let chat = await Chat.findOneAndUpdate(
      { chatKey },
      { $setOnInsert: { participants, chatKey } },
      { upsert: true, returnDocument: 'after' } // use 'after' instead of deprecated 'new'
    );

    if (!chat) {
      // fallback if race condition occurs
      chat = await Chat.findOne({ chatKey });
      if (!chat) {
        chat = await Chat.create({ participants, chatKey });
      }
    }

    return chat;
  } catch (err) {
    console.error('getOrCreateChat error:', err);
    throw err;
  }
}

/** Tic-Tac-Toe win detection */
function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

// =====================================
// AUTH MIDDLEWARE
// =====================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ message: 'Missing authorization header' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ message: 'Invalid authorization format' });
  try {
    req.user = jwt.verify(parts[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// =====================================================================
// MESSAGES
// =====================================================================

// POST /api/chat/send
// Body: { receiverId, emoji }
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, emoji } = req.body;
    if (!receiverId || !emoji)
      return res.status(400).json({ message: 'Missing receiverId or emoji' });

    // get or create the chat safely
    let chat = await getOrCreateChat(req.user.id, receiverId);

    if (!chat) {
      // fallback: manually create a chat if null for some reason
      const participants = [req.user.id, receiverId].sort();
      const chatKey = participants.join('_');
      chat = await Chat.create({ participants, chatKey });
    }

    // add the message
    chat.messages.push({ senderId: req.user.id, emoji });
    await chat.save();

    const saved = chat.messages[chat.messages.length - 1];
    res.status(201).json({ message: 'Message sent', data: saved });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Could not send message' });
  }
});

// GET /api/chat/messages/:friendId
router.get('/messages/:friendId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ participants: pair(req.user.id, req.params.friendId) });
    // Return the senderId alongside each message so the frontend can
    // still tell "mine vs theirs" — same shape as the old Message documents.
    const messages = (chat?.messages || []).map(m => ({
      _id:       m._id,
      senderId:  m.senderId,
      emoji:     m.emoji,
      createdAt: m.createdAt
    }));
    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Could not load messages' });
  }
});

// =====================================================================
// GAME — INVITE
// =====================================================================

// POST /api/chat/game/invite
// Body: { opponentId }
router.post('/game/invite', authenticateToken, async (req, res) => {
  try {
    const { opponentId } = req.body;
    if (!opponentId) return res.status(400).json({ message: 'Missing opponentId' });

    const chat = await getOrCreateChat(req.user.id, opponentId);

    // Reset / overwrite the embedded game with a fresh invite
    chat.game = {
      playerX:     req.user.id,   // inviter plays X
      playerO:     opponentId,
      board:        Array(9).fill(null),
      currentTurn: req.user.id,
      status:      'invited',
      winner:      null,
      updatedAt:   new Date()
    };
    chat.markModified('game');
    await chat.save();

    res.status(201).json({ game: { ...chat.game.toObject(), _id: chat._id } });
  } catch (err) {
    console.error('Game invite error:', err);
    res.status(500).json({ message: 'Could not create game invite' });
  }
});

// =====================================================================
// GAME — CHECK PENDING INVITE
// =====================================================================

// GET /api/chat/game/pending/:friendId
// Returns a pending invite FROM friendId TO me
router.get('/game/pending/:friendId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ participants: pair(req.user.id, req.params.friendId) });
    if (
      chat?.game?.status === 'invited' &&
      chat.game.playerO === req.user.id
    ) {
      return res.json({ game: { ...chat.game.toObject(), _id: chat._id } });
    }
    res.json({ game: null });
  } catch (err) {
    res.status(500).json({ message: 'Could not check pending invite' });
  }
});

// =====================================================================
// GAME — INVITE STATUS (polled by the inviter while waiting)
// =====================================================================

// GET /api/chat/game/invite-status/:chatId
router.get('/game/invite-status/:chatId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.json({ game: null });
    if (chat.game.playerX !== req.user.id)
      return res.status(403).json({ message: 'Not your invite' });
    res.json({ game: { ...chat.game.toObject(), _id: chat._id } });
  } catch (err) {
    res.status(500).json({ message: 'Could not check invite status' });
  }
});

// =====================================================================
// GAME — RESPOND (accept / decline)
// =====================================================================

// POST /api/chat/game/respond
// Body: { gameId, accept: true|false }
// NOTE: gameId here is the Chat document _id (same as before from the frontend)
router.post('/game/respond', authenticateToken, async (req, res) => {
  try {
    const { gameId, accept } = req.body;
    const chat = await Chat.findById(gameId);
    if (!chat) return res.status(404).json({ message: 'Chat / game not found' });
    if (chat.game.playerO !== req.user.id)
      return res.status(403).json({ message: 'Not your invite' });
    if (chat.game.status !== 'invited')
      return res.status(400).json({ message: 'Invite already handled' });

    chat.game.status    = accept ? 'active' : 'declined';
    chat.game.updatedAt = new Date();
    chat.markModified('game');
    await chat.save();

    res.json({ game: { ...chat.game.toObject(), _id: chat._id } });
  } catch (err) {
    console.error('Game respond error:', err);
    res.status(500).json({ message: 'Could not respond to invite' });
  }
});

// =====================================================================
// GAME — ACTIVE GAME STATE (polled while game is in progress)
// =====================================================================

// GET /api/chat/game/active/:friendId
router.get('/game/active/:friendId', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ participants: pair(req.user.id, req.params.friendId) });
    if (!chat || !['active', 'finished'].includes(chat.game?.status)) {
      return res.json({ game: null });
    }
    res.json({ game: { ...chat.game.toObject(), _id: chat._id } });
  } catch (err) {
    res.status(500).json({ message: 'Could not load game' });
  }
});

// =====================================================================
// GAME — MAKE A MOVE
// =====================================================================

// POST /api/chat/game/move
// Body: { gameId, cellIndex }
router.post('/game/move', authenticateToken, async (req, res) => {
  try {
    const { gameId, cellIndex } = req.body;
    const chat = await Chat.findById(gameId);
    if (!chat)                          return res.status(404).json({ message: 'Game not found' });
    const game = chat.game;
    if (game.status !== 'active')       return res.status(400).json({ message: 'Game is not active' });
    if (game.currentTurn !== req.user.id) return res.status(403).json({ message: 'Not your turn' });
    if (game.board[cellIndex] != null)  return res.status(400).json({ message: 'Cell already taken' });

    // Place the mark
    const mark = game.playerX === req.user.id ? 'X' : 'O';
    game.board[cellIndex] = mark;
    game.updatedAt        = new Date();

    const winMark = checkWinner(game.board);
    const isDraw  = !winMark && game.board.every(c => c !== null);

    if (winMark) {
      game.status = 'finished';
      game.winner = req.user.id;
    } else if (isDraw) {
      game.status = 'finished';
      game.winner = 'draw';
    } else {
      game.currentTurn = game.playerX === req.user.id ? game.playerO : game.playerX;
    }

    chat.markModified('game');
    await chat.save();

    res.json({ game: { ...chat.game.toObject(), _id: chat._id } });
  } catch (err) {
    console.error('Game move error:', err);
    res.status(500).json({ message: 'Could not make move' });
  }
});

module.exports = router;