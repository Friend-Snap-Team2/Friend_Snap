const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Game = require('../models/Game');

// =====================================
// AUTH MIDDLEWARE
// =====================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Missing authorization header' });
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

// =====================================
// WINNING COMBINATIONS
// =====================================
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
// MESSAGES — POST /api/chat/send
// =====================================
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, emoji } = req.body;
    if (!receiverId || !emoji)
      return res.status(400).json({ message: 'Missing receiverId or emoji' });

    const message = new Message({ senderId: req.user.id, receiverId, emoji });
    const saved = await message.save();
    res.status(201).json({ message: 'Message sent', data: saved });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Could not send message' });
  }
});

// =====================================
// MESSAGES — GET /api/chat/messages/:friendId
// =====================================
router.get('/messages/:friendId', authenticateToken, async (req, res) => {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: friendId },
        { senderId: friendId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Could not load messages' });
  }
});

// =====================================
// GAME — POST /api/chat/game/invite
// Creates a new game invite
// Body: { opponentId }
// =====================================
router.post('/game/invite', authenticateToken, async (req, res) => {
  try {
    const { opponentId } = req.body;
    if (!opponentId) return res.status(400).json({ message: 'Missing opponentId' });

    // Cancel any previous active/invited game between these two players
    await Game.deleteMany({
      status: { $in: ['invited', 'active'] },
      $or: [
        { playerX: req.user.id, playerO: opponentId },
        { playerX: opponentId, playerO: req.user.id }
      ]
    });

    const game = new Game({
      playerX: req.user.id,   // inviter plays X
      playerO: opponentId,    // invitee plays O
      currentTurn: req.user.id,
      status: 'invited'
    });
    await game.save();
    res.status(201).json({ game });
  } catch (err) {
    console.error('Game invite error:', err);
    res.status(500).json({ message: 'Could not create game invite' });
  }
});

// =====================================
// GAME — GET /api/chat/game/pending/:friendId
// Checks for a pending invite FROM friendId TO me
// =====================================
router.get('/game/pending/:friendId', authenticateToken, async (req, res) => {
  try {
    const game = await Game.findOne({
      playerX: req.params.friendId,
      playerO: req.user.id,
      status: 'invited'
    });
    res.json({ game: game || null });
  } catch (err) {
    res.status(500).json({ message: 'Could not check pending invite' });
  }
});


// =====================================
// GAME — GET /api/chat/game/invite-status/:gameId
// Returns the current status of a specific game invite.
// Used by the inviter to poll without falsely treating
// "still waiting" as "declined".
// =====================================
router.get('/game/invite-status/:gameId', authenticateToken, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.json({ game: null });
    if (game.playerX !== req.user.id)
      return res.status(403).json({ message: 'Not your invite' });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ message: 'Could not check invite status' });
  }
});

// =====================================
// GAME — POST /api/chat/game/respond
// Accept or decline an invite
// Body: { gameId, accept: true|false }
// =====================================
router.post('/game/respond', authenticateToken, async (req, res) => {
  try {
    const { gameId, accept } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    if (game.playerO !== req.user.id)
      return res.status(403).json({ message: 'Not your invite' });
    if (game.status !== 'invited')
      return res.status(400).json({ message: 'Invite already handled' });

    game.status = accept ? 'active' : 'declined';
    game.updatedAt = new Date();
    await game.save();
    res.json({ game });
  } catch (err) {
    console.error('Game respond error:', err);
    res.status(500).json({ message: 'Could not respond to invite' });
  }
});

// =====================================
// GAME — GET /api/chat/game/active/:friendId
// Returns the active game between me and friendId
// =====================================
router.get('/game/active/:friendId', authenticateToken, async (req, res) => {
  try {
    const myId = req.user.id;
    const game = await Game.findOne({
      status: 'active',
      $or: [
        { playerX: myId, playerO: req.params.friendId },
        { playerX: req.params.friendId, playerO: myId }
      ]
    });
    res.json({ game: game || null });
  } catch (err) {
    res.status(500).json({ message: 'Could not load game' });
  }
});

// =====================================
// GAME — POST /api/chat/game/move
// Make a move on the board
// Body: { gameId, cellIndex }
// =====================================
router.post('/game/move', authenticateToken, async (req, res) => {
  try {
    const { gameId, cellIndex } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    if (game.status !== 'active') return res.status(400).json({ message: 'Game is not active' });
    if (game.currentTurn !== req.user.id) return res.status(403).json({ message: 'Not your turn' });
    if (game.board[cellIndex] !== null && game.board[cellIndex] !== undefined)
      return res.status(400).json({ message: 'Cell already taken' });

    // Place the mark
    const mark = game.playerX === req.user.id ? 'X' : 'O';
    game.board[cellIndex] = mark;
    game.updatedAt = new Date();

    // Check for winner
    const winMark = checkWinner(game.board);
    const isDraw = !winMark && game.board.every(c => c !== null);

    if (winMark) {
      game.status = 'finished';
      game.winner = req.user.id; // the one who just moved wins
    } else if (isDraw) {
      game.status = 'finished';
      game.winner = 'draw';
    } else {
      // Switch turns
      game.currentTurn = game.playerX === req.user.id ? game.playerO : game.playerX;
    }

    // markModified needed for mixed arrays in Mongoose
    game.markModified('board');
    await game.save();
    res.json({ game });
  } catch (err) {
    console.error('Game move error:', err);
    res.status(500).json({ message: 'Could not make move' });
  }
});

module.exports = router;
