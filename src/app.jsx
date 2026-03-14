const express = require('express');

const authRoutes = require('./routes/authRoutes.jsx');
const userRoutes = require('./routes/userRoutes.jsx');
const processRoutes = require('./routes/processRoutes.jsx');
const errorHandler = require('./middlewares/errorHandler.jsx');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/processes', processRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
