const app = require('./app');
const { PORT, API_BASE_URL } = require('./config/env');
const logger = require('./config/logger');

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API base URL: ${API_BASE_URL}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use.`);
    logger.error('Stop the existing process or set PORT to a different value.');
    logger.error('OAuth requires API_BASE_URL to match your GitHub app callback URL.');
    process.exit(1);
  }

  logger.error('Server error:', err);
  process.exit(1);
});
