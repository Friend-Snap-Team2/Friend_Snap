const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat'); // NEW: import chat routes
const photosRoutes = require('./routes/photos');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// make uploads folder accessible under /uploads
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes); // NEW: register chat routes
app.use('/api/photos', photosRoutes);

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB!');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
  });
