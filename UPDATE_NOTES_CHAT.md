# Update Notes

## What's New

### Chat Page — Full Rework

**Emoji Messaging**
- Messages are now composed by tapping multiple emojis before sending
- Preview bar shows selected emojis before you hit Send
- Clear button to reset selection

**Read Aloud**
- Reads the full chat history aloud using text-to-speech
- Labels each message: "You sent" or "[Friend] sent"

**Tic-Tac-Toe Mini Game**
- Click the 🎮 button to invite a friend to play
- Game runs as a floating mini-window — chat stays usable while playing
- Red dot badge appears when you receive an invite or it's your turn
- Opponent can accept or decline the invite
- Invite stays open for up to 2 minutes before expiring
- Play Again option after each game

### New Files
- `models/Game.js` — game state model
- `routes/chat.js` — chat + game API routes

### Updated Files
- `public/pages/chat.html`
- `public/js/pages/chat.js`
- `public/css/pages/chat.css`
- `index.js` — registered new chat route

## How to Run
Make sure your `.env` file is in the project root, then:
```
npm install
node index.js
```
