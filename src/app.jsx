const express = require('express');

const env = require('./config/env.jsx');
const authRoutes = require('./routes/authRoutes.jsx');
const clientRoutes = require('./routes/clientRoutes.jsx');
const chatRoutes = require('./routes/chatRoutes.jsx');
const userRoutes = require('./routes/userRoutes.jsx');
const processRoutes = require('./routes/processRoutes.jsx');
const { buildAllowedOrigins, corsMiddleware } = require('./middlewares/cors.jsx');
const errorHandler = require('./middlewares/errorHandler.jsx');

const app = express();

app.use(corsMiddleware({
  allowedOrigins: buildAllowedOrigins(env.corsAllowedOrigins),
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/processes', processRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
