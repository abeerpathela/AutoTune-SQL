const app = require('./app');
const { PORT, BACKEND_URL } = require('./config/appConfig');

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   API base URL: ${BACKEND_URL}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Stop the existing process or set PORT to a different value.`);
    console.error(`   OAuth requires BACKEND_URL to match your GitHub app callback URL.`);
    process.exit(1);
  }

  console.error(`❌ Server error:`, err);
  process.exit(1);
});
