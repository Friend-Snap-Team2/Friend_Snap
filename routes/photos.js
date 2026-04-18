const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');

const Photo = require('../models/Photo');
const User = require('../models/User');

// Use memory storage instead of disk storage
// This keeps the file in memory as a buffer rather than saving to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB limit per image
  }
});

// Token auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Missing authorization header' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// =====================================
// POST /api/photos - upload photos
// =====================================
router.post('/', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const saved = [];

    for (const f of req.files) {
      // Convert buffer to Base64 string
      const base64 = f.buffer.toString('base64');

      // Build a data URL so it can be used directly in an img src
      const dataUrl = `data:${f.mimetype};base64,${base64}`;

      const photo = new Photo({
        ownerId: req.user.id,
        data: dataUrl,
        mimetype: f.mimetype
      });

      await photo.save();
      saved.push({
        id: photo._id,
        url: photo.data,  // return data URL as url so frontend code stays the same
        createdAt: photo.createdAt
      });
    }

    res.status(201).json({ photos: saved });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ message: 'Could not upload photos' });
  }
});

// =====================================
// GET /api/photos - public feed
// =====================================
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 }).limit(50);

    const items = await Promise.all(photos.map(async ph => {
      const user = await User.findById(ph.ownerId).catch(() => null);
      return {
        id: ph._id,
        url: ph.data,   // data URL used directly as img src
        createdAt: ph.createdAt,
        owner: user ? { id: user._id, nickname: user.nickname, avatar: user.avatar ?? 0 } : null
      };
    }));

    res.json({ photos: items });
  } catch (err) {
    console.error('Feed error', err);
    res.status(500).json({ message: 'Could not load photos' });
  }
});

// =====================================
// GET /api/photos/mine - user's own photos
// =====================================
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const photos = await Photo.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    const items = photos.map(ph => ({
      id: ph._id,
      url: ph.data,   // data URL used directly as img src
      createdAt: ph.createdAt
    }));
    res.json({ photos: items });
  } catch (err) {
    console.error('My photos error', err);
    res.status(500).json({ message: 'Could not load user photos' });
  }
});

module.exports = router;