import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { normalizeRole, isAdminRole } from '../constants/authRoles';
import { getAppUsersFromEnv } from '../auth/appUsersFromEnv';
import { isBackendConfigured, backendLogin } from '../services/backendApi';

const AuthContext = createContext(null);

const AUTH_KEY = 'auth';
const SESSION_MS = 3600 * 1000;

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.mode === 'backend') {
      if (!data.token || !data.expiresAt || now >= data.expiresAt) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
      return {
        mode: 'backend',
        role: normalizeRole(data.role || 'admin'),
        username: data.username || '',
        token: data.token,
      };
    }

    if (data.timestamp && now - data.timestamp < SESSION_MS) {
      return {
        mode: 'env',
        role: normalizeRole(data.role || 'admin'),
        username: data.username || '',
      };
    }
    localStorage.removeItem(AUTH_KEY);
    return null;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(() => normalizeRole('admin'));
  const [username, setUsername] = useState('');
  const [authMode, setAuthMode] = useState(() => (isBackendConfigured() ? 'backend' : 'env'));

  const applyStored = useCallback(() => {
    const stored = readStoredAuth();
    if (stored) {
      setIsAuthenticated(true);
      setRole(stored.role);
      setUsername(stored.username);
      setAuthMode(stored.mode);
    } else {
      setIsAuthenticated(false);
      setRole(normalizeRole('admin'));
      setUsername('');
      setAuthMode(isBackendConfigured() ? 'backend' : 'env');
    }
  }, []);

  useEffect(() => {
    applyStored();
  }, [applyStored]);

  const isAdmin = useMemo(() => isAdminRole(role), [role]);

  const login = async (user, password) => {
    if (isBackendConfigured()) {
      try {
        const data = await backendLogin(user, password);
        const expiresInSec = Number(data.expiresIn) || 86400;
        const expiresAt = Date.now() + expiresInSec * 1000;
        const authData = {
          mode: 'backend',
          token: data.token,
          expiresAt,
          role: normalizeRole(data.user?.role),
          username: data.user?.username || user,
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        setIsAuthenticated(true);
        setRole(authData.role);
        setUsername(authData.username);
        setAuthMode('backend');
        return true;
      } catch {
        return false;
      }
    }

    const users = getAppUsersFromEnv();
    const match = users.find((u) => u.username === user && u.password === password);
    if (!match) {
      return false;
    }
    const authData = {
      mode: 'env',
      isAuthenticated: true,
      timestamp: Date.now(),
      role: match.role,
      username: match.username,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    setIsAuthenticated(true);
    setRole(match.role);
    setUsername(match.username);
    setAuthMode('env');
    return true;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setRole(normalizeRole('admin'));
    setUsername('');
    setAuthMode(isBackendConfigured() ? 'backend' : 'env');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, username, isAdmin, authMode, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
