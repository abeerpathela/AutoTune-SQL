require('dotenv').config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const BACKEND_URL = (process.env.BACKEND_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL || `${BACKEND_URL}/api/v1/auth/github/callback`;

module.exports = {
  PORT,
  BACKEND_URL,
  FRONTEND_URL,
  GITHUB_CALLBACK_URL,
  githubCallbackURL: GITHUB_CALLBACK_URL,
};
