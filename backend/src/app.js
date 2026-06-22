const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { FRONTEND_URL, JWT_SECRET } = require('./config/env');
const logger = require('./config/logger');

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

getRedisClient();
initializeMLService();

app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

if (logger.shouldLogHttp()) {
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});

app.use('/api', apiLimiter);
app.use(express.json());
app.use(
  session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academy', protect, academyRoutes);
app.use('/api/v1/certificates', certRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/queries', protect, queryRoutes);
app.use('/api/queries', protect, queryRoutes);
app.use('/api/optimize', protect, optimizationRoutes);
app.use('/api/ml', protect, mlRoutes);
app.use('/api/connections', protect, connectionRoutes);

app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
