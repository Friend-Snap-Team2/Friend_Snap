const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../data/db');

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