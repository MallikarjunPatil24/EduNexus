import axios from 'axios';

// Centralized API configuration (Req #15)
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, default to local server; in production, use relative /api
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};

export const API_BASE_URL = getBaseURL();
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor: Attach JWT Bearer token
client.interceptors.request.use((config) => {
  const cachedUser = localStorage.getItem('user');
  if (cachedUser) {
    try {
      const user = JSON.parse(cachedUser);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Error parsing cached user session:', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: Global error handler (401, 403, 500)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Clear cached user on unauthorized response if not on login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
