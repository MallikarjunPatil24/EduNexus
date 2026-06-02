import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send HTTP-only cookies
});

// Add request interceptor to attach Bearer token if present in localStorage
client.interceptors.request.use((config) => {
  const cachedUser = localStorage.getItem('user');
  if (cachedUser) {
    const user = JSON.parse(cachedUser);
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default client;
