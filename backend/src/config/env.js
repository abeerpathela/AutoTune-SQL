require('dotenv').config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const API_BASE_URL = (process.env.API_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL || `${API_BASE_URL}/api/v1/auth/github/callback`;

module.exports = {
  PORT,
  API_BASE_URL,
  FRONTEND_URL,
  DATABASE_URL,
  REDIS_URL,
  JWT_SECRET,
  GROQ_API_KEY,
  GITHUB_CALLBACK_URL,
  /** @deprecated Use API_BASE_URL */
  BACKEND_URL: API_BASE_URL,
  githubCallbackURL: GITHUB_CALLBACK_URL,
};
