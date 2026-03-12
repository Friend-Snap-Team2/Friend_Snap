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
  db.users.push(userData);
  writeDB(db);
  return userData;
}

module.exports = {
  getUsers,
  findUserByNickname,
  findUserById,
  createUser
};