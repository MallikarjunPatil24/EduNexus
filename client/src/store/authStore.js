import { create } from 'zustand';
import client from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  profile: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await client.post('/auth/login', { email, password });
      
      // Store token in memory and local storage
      localStorage.setItem('user', JSON.stringify(data));
      
      set({ user: data, loading: false });
      
      // Load user profile details
      await get().fetchProfile();
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  fetchProfile: async () => {
    set({ loading: true });
    try {
      const { data } = await client.get('/auth/profile');
      set({ profile: data.profileDetails, loading: false });
    } catch (err) {
      console.error('Error fetching profile:', err);
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await client.post('/auth/logout');
    } catch (err) {
      console.error('Logout API Error:', err);
    } finally {
      localStorage.removeItem('user');
      set({ user: null, profile: null, error: null });
    }
  },

  initialize: async () => {
    const cachedUser = get().user;
    if (cachedUser) {
      await get().fetchProfile();
    }
  }
}));
