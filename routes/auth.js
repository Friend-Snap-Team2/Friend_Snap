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

    const existingUser = db.findUserByNickname(nickname);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'That nickname is already taken' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      nickname: nickname,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, nickname: newUser.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
    message: 'Account created successfully',
    token: token,
    nickname: newUser.nickname,
    createdAt: newUser.createdAt
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

    const user = db.findUserByNickname(nickname);
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
      { id: user.id, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
    message: 'Logged in successfully',
    token: token,
    nickname: user.nickname,
    createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong, please try again' });
  }

});



module.exports = router;

// =====================================
// SUGGESTIONS - GET /api/auth/suggestions
// Returns list of other users excluding current user and blocked users
// =====================================
router.get('/suggestions', authenticateToken, (req, res) => {
  try {
    const currentUser = db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blocked = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];

    const users = db.getUsers()
      .filter(u => u.id !== req.user.id && !blocked.includes(u.id))
      .map(u => ({ id: u.id, nickname: u.nickname, createdAt: u.createdAt }));

    res.json({ users });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ message: 'Could not load suggestions' });
  }
});

// =====================================
// BLOCK - POST /api/auth/block
// Body: { id: '<userIdToBlock>' }
// Adds the target user id to the current user's blocked list
// =====================================
router.post('/block', authenticateToken, (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Missing id to block' });

    const target = db.findUserById(id);
    if (!target) return res.status(404).json({ message: 'Target user not found' });

    const currentUser = db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blocked = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];
    if (!blocked.includes(id)) {
      blocked.push(id);
      db.updateUser(currentUser.id, { blocked });
    }

    res.json({ message: 'User blocked' });
  } catch (err) {
    console.error('Block error:', err);
    res.status(500).json({ message: 'Could not block user' });
  }
});