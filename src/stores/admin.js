import { defineStore } from 'pinia';
import { storage } from '../lib/storage.js';

const KEY = 'unseen-admin';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || typeof saved.adminId !== 'string' || !UUID_RE.test(saved.adminId)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return saved;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export const useAdmin = defineStore('admin', {
  state: () => {
    const saved = load();
    return {
      adminId: saved?.adminId || null,
      adminName: saved?.adminName || null,
      adminEmail: saved?.adminEmail || null,
    };
  },
  getters: {
    loggedIn: (s) => Boolean(s.adminId),
  },
  actions: {
    persist() {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          adminId: this.adminId,
          adminName: this.adminName,
          adminEmail: this.adminEmail,
        }),
      );
    },
    async login(username, password) {
      const result = await storage.adminLogin(username, password);
      if (!result) throw new Error('Ungültige Zugangsdaten');
      this.adminId = result.id;
      this.adminName = result.username;
      this.adminEmail = result.email;
      this.persist();
      return result;
    },

    async register(username, email, password) {
      const result = await storage.adminRegister(username, email, password);
      this.adminId = result.id;
      this.adminName = result.username;
      this.adminEmail = result.email;
      this.persist();
      return result;
    },
    logout() {
      this.adminId = null;
      this.adminName = null;
      this.adminEmail = null;
      localStorage.removeItem(KEY);
    },
  },
});
