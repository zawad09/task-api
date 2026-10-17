require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 500).json({
    status: connected ? 'ok' : 'error',
    database: connected ? 'connected' : 'unreachable',
  });
});

// TEMPORARY (remove on Day 3): create a user so you have an id to test with
app.post('/dev/seed-user', async (req, res, next) => {
  try {
    const user = await User.create({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      passwordHash: 'temporary',
    });
    res.status(201).json({ id: user._id });
  } catch (err) {
    next(err);
  }
});

app.use('/api/tasks', taskRoutes);

// 404 for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Central error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
