const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const queryRoutes = require('./routes/queryRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');
const mlRoutes = require('./routes/mlRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const getRedisClient = require('./config/redis');
const { initializeMLService } = require('./services/mlService');
require('./services/aiService'); // Import to run startup validation

const app = express();

// Initialize services
getRedisClient();
initializeMLService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/queries', queryRoutes);
app.use('/api/optimize', optimizationRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/connections', connectionRoutes);

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
