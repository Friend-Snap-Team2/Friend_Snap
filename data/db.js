const User = require('../models/User');

// Get all users
async function getUsers() {
  return await User.find();
}

// Find a single user by their nickname
async function findUserByNickname(nickname) {
  return await User.findOne({ nickname: nickname });
}

// Find a single user by their ID
async function findUserById(id) {
  return await User.findById(id);
}

// Save a new user to the database
async function createUser(userData) {
  // ensure blocked list exists for new users
  if (!userData.blocked) userData.blocked = [];
  const user = new User(userData);
  return await user.save();
}

// Update an existing user by id with partial data
async function updateUser(id, updates) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true } // returns the updated document rather than the old one
  );
  return user || null;
}

module.exports = {
  getUsers,
  findUserByNickname,
  findUserById,
  createUser,
  updateUser
};