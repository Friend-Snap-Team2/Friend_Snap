const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  data: {
    type: String,    // Base64 encoded image
    required: true
  },
  mimetype: {
    type: String,    // e.g. image/jpeg
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Photo', photoSchema);