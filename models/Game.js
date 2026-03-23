const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // The two players
  playerX: { type: String, required: true }, // user id of X (inviter)
  playerO: { type: String, required: true }, // user id of O (invitee)

  // 9-cell board: null = empty, 'X' or 'O'
  board: {
    type: [String],
    default: [null,null,null, null,null,null, null,null,null]
  },

  // Whose turn it is
  currentTurn: { type: String }, // stores user id

  // Game lifecycle: 'invited' | 'declined' | 'active' | 'finished'
  status: { type: String, default: 'invited' },

  // Winner user id, or 'draw', or null if not finished
  winner: { type: String, default: null },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
