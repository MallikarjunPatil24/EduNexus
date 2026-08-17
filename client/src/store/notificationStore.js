import { create } from 'zustand';
import io from 'socket.io-client';
import { SERVER_BASE_URL } from '../api/client';

const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  return import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;
};

const SOCKET_URL = getSocketURL();

export const useNotificationStore = create((set, get) => ({
  socket: null,
  notifications: [],
  unreadCount: 0,

  initSocket: (user) => {
    if (get().socket) return; // Socket already active

    const socketConn = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketConn.on('connect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Socket connected to server');
      }
      
      if (user) {
        socketConn.emit('join_user', user._id);
        socketConn.emit('join_role', user.role);
      }
    });

    // Listen for real-time notifications
    socketConn.on('notification', (notif) => {
      set((state) => ({
        notifications: [notif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });

    set({ socket: socketConn });
  },

  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  disconnect: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null, notifications: [], unreadCount: 0 });
    }
  }
}));
