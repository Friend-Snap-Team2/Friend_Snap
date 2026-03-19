const fs = require('fs');
const path = require('path');

// Path to the database file
const DB_PATH = path.join(__dirname, 'db.json');

// Read the entire database
function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Write the entire database
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Get all users
function getUsers() {
  const db = readDB();
  return db.users;
}

// Find a single user by their nickname
function findUserByNickname(nickname) {
  const users = getUsers();
  return users.find(user => user.nickname === nickname) || null;
}

// Find a single user by their ID
function findUserById(id) {
  const users = getUsers();
  return users.find(user => user.id === id) || null;
}

// Save a new user to the database
function createUser(userData) {
  const db = readDB();
  // ensure blocked list exists for new users
  if (!userData.blocked) userData.blocked = [];
  db.users.push(userData);
  writeDB(db);
  return userData;
}

// Update an existing user by id with partial data
function updateUser(id, updates) {
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = Object.assign({}, db.users[idx], updates);
  writeDB(db);
  return db.users[idx];
}

module.exports = {
  getUsers,
  findUserByNickname,
  findUserById,
  createUser,
  updateUser
};