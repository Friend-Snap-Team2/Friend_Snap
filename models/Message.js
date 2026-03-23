const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // The user who sent the message
  senderId: {
    type: String,
    required: true
  },
  // The user who receives the message
  receiverId: {
    type: String,
    required: true
  },
  // Only emojis are allowed as message content
  emoji: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
