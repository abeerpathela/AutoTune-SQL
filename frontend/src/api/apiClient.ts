import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';

export const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(
  /\/$/,
  ''
);

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    } else if (message && error.response?.status !== 404) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
