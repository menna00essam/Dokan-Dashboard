import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    pendingEmail: null,
  }),
  actions: {
    setToken(token) {
      this.token = token;
    },
    setPendingEmail(email) {
      this.pendingEmail = email;
    },
    clearPendingEmail() {
      this.pendingEmail = null;
    },
    logout() {
      this.token = null;
      localStorage.removeItem("token");
    },
  },
});
