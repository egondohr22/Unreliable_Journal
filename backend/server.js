require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const route = req.path;

  const queryParams = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : '';

  let bodyParams = '';
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    bodyParams = Object.keys(sanitizedBody).length > 0 ? JSON.stringify(sanitizedBody) : '';
  }

  const params = queryParams || bodyParams;
  const logMessage = params
    ? `${timestamp} - ${method} ${route} ${params}`
    : `${timestamp} - ${method} ${route}`;

  console.log(logMessage);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/user', userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');

  const { cleanupAllTimers } = require('./services/noteModificationService');
  cleanupAllTimers();

  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
