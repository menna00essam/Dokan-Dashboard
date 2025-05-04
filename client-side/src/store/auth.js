
// useAuthStore.js
import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    pendingEmail: null,
    user: null 
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role
  },
  actions: {
    setToken(token) { 
      console.log('setToken called with token:', token)
      this.token = token;
      localStorage.setItem('token', token);
      this.setUserFromToken(token); 
    },
    setPendingEmail(email) {
      this.pendingEmail = email;
    },
    clearPendingEmail() {
      this.pendingEmail = null;
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },
    setUserFromToken(token) {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          this.user = {
            id: decodedToken._id, 
            email: decodedToken.email,
            role: decodedToken.role
          };
        } catch (error) {
          console.error('Error decoding token:', error);
          this.logout();
        }
      } else {
        this.user = null;
      }
    },
    loadUserFromStorage() {
      const token = localStorage.getItem('token');
      if (token && !this.user) {
        this.setUserFromToken(token);
      }
    }
  }
});