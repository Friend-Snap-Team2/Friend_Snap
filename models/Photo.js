const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  caption: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);
