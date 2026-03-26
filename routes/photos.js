const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const Photo = require('../models/Photo');
const User = require('../models/User');

// Simple token auth (copied style from auth.js)
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

// Multer storage to public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

// POST /api/photos - upload one or many photos
router.post('/', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files uploaded' });

    const saved = [];

    for (const f of req.files) {
      const url = `/uploads/${f.filename}`; // served from express.static('public')
      const p = new Photo({ ownerId: req.user.id, filename: f.filename, url });
      await p.save();
      saved.push(p);
    }

    res.status(201).json({ photos: saved });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ message: 'Could not upload photos' });
  }
});

// GET /api/photos - public feed (latest first)
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 }).limit(200);

    // attach owner summary
    const items = await Promise.all(photos.map(async ph => {
      const user = await User.findById(ph.ownerId).catch(() => null);
      return {
        id: ph._id,
        url: ph.url,
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

// GET /api/photos/mine - authenticated user's photos
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const photos = await Photo.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    const items = photos.map(ph => ({ id: ph._id, url: ph.url, createdAt: ph.createdAt }));
    res.json({ photos: items });
  } catch (err) {
    console.error('My photos error', err);
    res.status(500).json({ message: 'Could not load user photos' });
  }
});

module.exports = router;
