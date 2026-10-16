import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      const token = localStorage.getItem('habitToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest('/api/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('habitToken');
      } finally {
        setLoading(false);
      }
    }
    loadCurrentUser();
  }, []);

  function saveSession(data) {
    localStorage.setItem('habitToken', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('habitToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
