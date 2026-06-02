import { create } from 'zustand';
import client from '../api/client';
import { useNotificationStore } from './notificationStore.js';

export const useChatStore = create((set, get) => ({
  contacts: [],
  messages: [],
  activeContact: null,
  loading: false,
  peerTyping: false,

  fetchContacts: async () => {
    set({ loading: true });
    try {
      const { data } = await client.get('/chat/contacts');
      set({ contacts: data, loading: false });
    } catch (err) {
      console.error('Error fetching chat contacts:', err);
      set({ loading: false });
    }
  },

  fetchHistory: async (peerId) => {
    set({ loading: true, messages: [] });
    try {
      const { data } = await client.get(`/chat/history/${peerId}`);
      set({ messages: data, loading: false });
    } catch (err) {
      console.error('Error fetching chat history:', err);
      set({ loading: false });
    }
  },

  setActiveContact: (contact) => {
    set({ activeContact: contact });
    if (contact) {
      get().fetchHistory(contact._id);
    } else {
      set({ messages: [] });
    }
  },

  sendMessage: async (content) => {
    const { activeContact, messages } = get();
    if (!activeContact) return;

    try {
      const { data } = await client.post('/chat/send', {
        receiverId: activeContact._id,
        content
      });

      // Append to local list
      set({ messages: [...messages, data] });

      // Send via Socket.io for real-time delivery
      const socket = useNotificationStore.getState().socket;
      if (socket) {
        socket.emit('send_message', data);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  },

  receiveMessage: (message) => {
    const { activeContact, messages } = get();
    if (activeContact && message.sender === activeContact._id) {
      set({ messages: [...messages, message] });
    } else {
      // Find sender info from contacts and trigger a visual notification bell/toast alert
      const sender = get().contacts.find(c => c._id === message.sender);
      const senderName = sender ? sender.name : 'Teacher/Parent';
      
      useNotificationStore.getState().addNotification({
        title: `Message from ${senderName}`,
        content: message.content,
        type: 'chat',
        createdAt: new Date()
      });
    }
  },

  setPeerTyping: (isTyping) => {
    set({ peerTyping: isTyping });
  }
}));
