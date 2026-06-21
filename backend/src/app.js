const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
require('dotenv').config();

const queryRoutes = require('./routes/queryRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');
const mlRoutes = require('./routes/mlRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const authRoutes = require('./routes/authRoutes');
const academyRoutes = require('./routes/academyRoutes');
const certRoutes = require('./routes/certRoutes');
const adminRoutes = require('./routes/adminRoutes');
const getRedisClient = require('./config/redis');
const { initializeMLService } = require('./services/mlService');
const { protect } = require('./middleware/auth');
require('./config/passport');
require('./services/aiService');

const app = express();

// Initialize services
getRedisClient();
initializeMLService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(session({ secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key', resave: false, saveUninitialized: false }));
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes — public auth + health only; everything else requires JWT
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academy', protect, academyRoutes);
app.use('/api/v1/certificates', certRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/queries', protect, queryRoutes);
app.use('/api/queries', protect, queryRoutes);
app.use('/api/optimize', protect, optimizationRoutes);
app.use('/api/ml', protect, mlRoutes);
app.use('/api/connections', protect, connectionRoutes);

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
