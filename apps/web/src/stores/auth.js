import { defineStore } from 'pinia';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const TOKEN_KEY = 'lsrdf_session';

async function authRequest(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Nao foi possivel concluir a operacao');
  }
  return response.status === 204 ? null : response.json();
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isStaff: (state) => ['staff', 'admin'].includes(state.user?.role),
    isAdmin: (state) => state.user?.role === 'admin',
    isRepresentative: (state) => state.user?.role === 'representative'
  },
  actions: {
    async restore() {
      if (!sessionStorage.getItem(TOKEN_KEY)) {
        this.ready = true;
        return;
      }
      try {
        this.user = await authRequest('/api/auth/me');
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
      } finally {
        this.ready = true;
      }
    },
    saveSession(session) {
      sessionStorage.setItem(TOKEN_KEY, session.token);
      this.user = session.user;
      this.ready = true;
    },
    async login(email, password) {
      const session = await authRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      this.saveSession(session);
    },
    async register(payload) {
      const session = await authRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      this.saveSession(session);
    },
    async loginWithGoogle(credential, privacyAccepted) {
      const session = await authRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, privacyAccepted })
      });
      this.saveSession(session);
    },
    async logout() {
      try {
        await authRequest('/api/auth/logout', { method: 'POST' });
      } finally {
        sessionStorage.removeItem(TOKEN_KEY);
        this.user = null;
      }
    },
    async listUsers() {
      return authRequest('/api/admin/users');
    },
    async updateUser(id, payload) {
      return authRequest(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    }
  }
});
