// server.js
// Node.js backend for Scholieren Chat (public chat + account system)

const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage (replace with DB for production)
const users = [];
const messages = [];
let onlineCount = 0;

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Vul alles in.' });
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Gebruiker bestaat al.' });
  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash });
  res.json({ success: true });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'Onjuiste gegevens.' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Onjuiste gegevens.' });
  res.json({ success: true });
});
// Root endpoint
app.get('/', (req, res) => {
  res.send('Scholierenchat backend draait!');
});
// Socket.io for public chat
io.on('connection', (socket) => {
  onlineCount++;
  io.emit('online-count', onlineCount);
  socket.emit('init', messages);
  socket.on('public-message', (msg) => {
    messages.push(msg);
    io.emit('public-message', msg);
  });
  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online-count', onlineCount);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
