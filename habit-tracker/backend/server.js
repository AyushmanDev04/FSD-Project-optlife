require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/completions', require('./routes/completions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/data', require('./routes/data'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'This record already exists. Edit the existing one instead.' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid data was sent to the server' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
