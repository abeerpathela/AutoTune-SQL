import { apiBaseUrl } from '../api/apiClient';

const backendUrl = apiBaseUrl.replace(/\/api\/?$/, '');
const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export const config = {
  backendUrl,
  frontendUrl,
  apiBaseUrl,
  githubOAuthUrl: `${backendUrl}/api/v1/auth/github`,
};
