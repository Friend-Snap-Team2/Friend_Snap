const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../data/db');

// Middleware to authenticate requests using Bearer token
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
// REGISTER - POST /api/auth/register
// =====================================
router.post('/register', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      return res.status(400).json({ 
        message: 'Please provide a nickname and password' 
      });
    }

    const existingUser = await db.findUserByNickname(nickname);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'That nickname is already taken' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      nickname: nickname,
      password: hashedPassword,
      avatar: req.body.avatar ?? 0,
      createdAt: new Date().toISOString()
    };

    const savedUser = await db.createUser(newUser);

    const token = jwt.sign(
      { id: savedUser._id, nickname: savedUser.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token: token,
      nickname: savedUser.nickname,
      createdAt: savedUser.createdAt,
      avatar: savedUser.avatar
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Something went wrong, please try again' });
  }
});

// =====================================
// LOGIN - POST /api/auth/login
// =====================================
router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      return res.status(400).json({ 
        message: 'Please provide a nickname and password' 
      });
    }

    const user = await db.findUserByNickname(nickname);
    if (!user) {
      return res.status(400).json({ 
        message: 'No account found with that nickname' 
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ 
        message: 'Incorrect password' 
      });
    }

    const token = jwt.sign(
      { id: user._id, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token: token,
      nickname: user.nickname,
      createdAt: user.createdAt,
      avatar: user.avatar ?? 0
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong, please try again' });
  }
});

// =====================================
// SUGGESTIONS - GET /api/auth/suggestions
// =====================================
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const currentUser = await db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blocked = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];

    const allUsers = await db.getUsers();
    const users = allUsers
      .filter(u => u._id.toString() !== req.user.id && !blocked.includes(u._id.toString()))
      .map(u => ({ id: u._id, nickname: u.nickname, createdAt: u.createdAt, avatar: u.avatar ?? 0 }));

    res.json({ users });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ message: 'Could not load suggestions' });
  }
});

// =====================================
// BLOCK - POST /api/auth/block
// =====================================
router.post('/block', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Missing id to block' });

    const target = await db.findUserById(id);
    if (!target) return res.status(404).json({ message: 'Target user not found' });

    const currentUser = await db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blocked = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];
    if (!blocked.includes(id)) {
      blocked.push(id);
      await db.updateUser(currentUser._id, { blocked });
    }

    res.json({ message: 'User blocked' });
  } catch (err) {
    console.error('Block error:', err);
    res.status(500).json({ message: 'Could not block user' });
  }
});

module.exports = router;