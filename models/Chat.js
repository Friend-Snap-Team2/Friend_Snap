const mongoose = require('mongoose');

// ── Embedded message ──────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  senderId:  { type: String, required: true },
  emoji:     { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

// ── Embedded game (Tic-Tac-Toe) ───────────────────────────────────────────────
const gameSchema = new mongoose.Schema({
  playerX:     { type: String, default: null },   // user id of X (inviter)
  playerO:     { type: String, default: null },   // user id of O (invitee)
  board:       { type: [String], default: () => Array(9).fill(null) },
  currentTurn: { type: String,  default: null },  // user id whose turn it is
  // 'idle' | 'invited' | 'declined' | 'active' | 'finished'
  status:      { type: String,  default: 'idle' },
  winner:      { type: String,  default: null },  // user id, 'draw', or null
  updatedAt:   { type: Date,    default: Date.now }
}, { _id: false }); // no separate _id needed — game lives inside the chat doc

// ── Chat document ─────────────────────────────────────────────────────────────
const chatSchema = new mongoose.Schema({
  participants: {
    type: [String],
    required: true,
    validate: { validator: v => v.length === 2, message: 'A chat must have exactly 2 participants' }
  },

  chatKey: {
    type: String,
    required: true,   // MUST be set
    unique: true      // unique identifier for a chat between two users
  },

  messages: { type: [messageSchema], default: [] },
  game: { type: gameSchema, default: () => ({}) }
}, { timestamps: true });

// Remove old participants index (optional)
// chatSchema.index({ participants: 1 }); // you can leave it if you want, just not unique

// REMOVE this line if you already have `unique: true` above
// chatSchema.index({ chatKey: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);