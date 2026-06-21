const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export const config = {
  backendUrl,
  frontendUrl,
  apiBaseUrl: `${backendUrl}/api`,
  githubOAuthUrl: `${backendUrl}/api/v1/auth/github`,
};
