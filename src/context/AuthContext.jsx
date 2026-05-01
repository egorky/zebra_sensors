import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { normalizeRole, isAdminRole } from '../constants/authRoles';
import { getAppUsersFromEnv } from '../auth/appUsersFromEnv';

const AuthContext = createContext(null);

const AUTH_KEY = 'auth';
const SESSION_MS = 3600 * 1000;

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const now = Date.now();
    if (!data.timestamp || now - data.timestamp >= SESSION_MS) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    const role = normalizeRole(data.role || 'admin');
    return { role, username: data.username || '' };
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(() => normalizeRole('admin'));
  const [username, setUsername] = useState('');

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setIsAuthenticated(true);
      setRole(stored.role);
      setUsername(stored.username);
    } else {
      setIsAuthenticated(false);
      setRole(normalizeRole('admin'));
      setUsername('');
    }
  }, []);

  const isAdmin = useMemo(() => isAdminRole(role), [role]);

  const login = (user, password) => {
    const users = getAppUsersFromEnv();
    const match = users.find((u) => u.username === user && u.password === password);
    if (!match) {
      return false;
    }
    const authData = {
      isAuthenticated: true,
      timestamp: Date.now(),
      role: match.role,
      username: match.username,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    setIsAuthenticated(true);
    setRole(match.role);
    setUsername(match.username);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setRole(normalizeRole('admin'));
    setUsername('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, username, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
