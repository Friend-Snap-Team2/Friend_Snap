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
    const friends = Array.isArray(currentUser.friends) ? currentUser.friends : [];

    const users = allUsers
      .filter(u => 
        u._id.toString() !== req.user.id &&           // exclude self
        !blocked.includes(u._id.toString()) &&         // exclude blocked
        !friends.includes(u._id.toString())            // exclude existing friends
      )
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

    // Add to blocked list
    const blocked = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];
    if (!blocked.includes(id)) {
      blocked.push(id);
    }

    // Remove from friends list
    const friends = Array.isArray(currentUser.friends) ? currentUser.friends : [];
    const updatedFriends = friends.filter(friendId => friendId !== id);

    // Save both updates together
    await db.updateUser(currentUser._id, { blocked, friends: updatedFriends });

    res.json({ message: 'User blocked' });
  } catch (err) {
    console.error('Block error:', err);
    res.status(500).json({ message: 'Could not block user' });
  }
});

// =====================================
// UNBLOCK - POST /api/auth/unblock
// =====================================
router.post('/unblock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Missing user id' });

    const currentUser = await db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blocked = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];
    const updated = blocked.filter(blockedId => blockedId !== id);
    await db.updateUser(currentUser._id, { blocked: updated });

    res.json({ message: 'User unblocked' });
  } catch (err) {
    console.error('Unblock error:', err);
    res.status(500).json({ message: 'Could not unblock user' });
  }
});

// =====================================
// GET BLOCKED - GET /api/auth/blocked
// =====================================
router.get('/blocked', authenticateToken, async (req, res) => {
  try {
    const currentUser = await db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blockedIds = Array.isArray(currentUser.blocked) ? currentUser.blocked : [];

    const blocked = await Promise.all(
      blockedIds.map(id => db.findUserById(id))
    );

    const validBlocked = blocked
      .filter(u => u !== null)
      .map(u => ({ id: u._id, nickname: u.nickname, avatar: u.avatar ?? 0 }));

    res.json({ blocked: validBlocked });
  } catch (err) {
    console.error('Blocked list error:', err);
    res.status(500).json({ message: 'Could not load blocked users' });
  }
});


// =====================================
// ADD FRIEND - POST /api/auth/addfriend
// Body: { id: '<userIdToAdd>' }
// =====================================
router.post('/addfriend', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Missing user id' });

    const target = await db.findUserById(id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const currentUser = await db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'Current user not found' });

    const friends = Array.isArray(currentUser.friends) ? currentUser.friends : [];

    if (!friends.includes(id)) {
      friends.push(id);
      await db.updateUser(currentUser._id, { friends });
    }

    res.json({ message: 'Friend added' });
  } catch (err) {
    console.error('Add friend error:', err);
    res.status(500).json({ message: 'Could not add friend' });
  }
});

// =====================================
// GET FRIENDS - GET /api/auth/friends
// Returns full data for each friend
// =====================================
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const currentUser = await db.findUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];

    // Fetch each friend's data
    const friends = await Promise.all(
      friendIds.map(id => db.findUserById(id))
    );

    // Filter out any null results (deleted accounts etc)
    const validFriends = friends
      .filter(f => f !== null)
      .map(f => ({ id: f._id, nickname: f.nickname, avatar: f.avatar ?? 0 }));

    res.json({ friends: validFriends });
  } catch (err) {
    console.error('Friends list error:', err);
    res.status(500).json({ message: 'Could not load friends' });
  }
});

module.exports = router;