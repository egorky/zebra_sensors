import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { normalizeRole, isAdminRole } from '../constants/authRoles';
import { hasBackendUrl, backendLogin, authChangePassword } from '../services/backendApi';

const AuthContext = createContext(null);

const AUTH_KEY = 'auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const now = Date.now();

    if (!data.token || !data.expiresAt || now >= data.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }

    return {
      role: normalizeRole(data.role || 'admin'),
      username: data.username || '',
      token: data.token,
      mustChangePassword: !!data.mustChangePassword,
    };
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(() => normalizeRole('admin'));
  const [username, setUsername] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const applyStored = useCallback(() => {
    const stored = readStoredAuth();
    if (stored) {
      setIsAuthenticated(true);
      setRole(stored.role);
      setUsername(stored.username);
      setMustChangePassword(!!stored.mustChangePassword);
    } else {
      setIsAuthenticated(false);
      setRole(normalizeRole('admin'));
      setUsername('');
      setMustChangePassword(false);
    }
  }, []);

  useEffect(() => {
    applyStored();
  }, [applyStored]);

  const isAdmin = useMemo(() => isAdminRole(role), [role]);

  const login = async (user, password) => {
    if (!hasBackendUrl()) {
      return false;
    }
    try {
      const data = await backendLogin(user, password);
      const expiresInSec = Number(data.expiresIn) || 86400;
      const expiresAt = Date.now() + expiresInSec * 1000;
      const must = !!data.user?.mustChangePassword;
      const authData = {
        token: data.token,
        expiresAt,
        role: normalizeRole(data.user?.role),
        username: data.user?.username || user,
        mustChangePassword: must,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
      setRole(authData.role);
      setUsername(authData.username);
      setMustChangePassword(must);
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await authChangePassword(currentPassword, newPassword);
      const expiresInSec = Number(data.expiresIn) || 86400;
      const expiresAt = Date.now() + expiresInSec * 1000;
      const must = !!data.user?.mustChangePassword;
      const authData = {
        token: data.token,
        expiresAt,
        role: normalizeRole(data.user?.role),
        username: data.user?.username || username,
        mustChangePassword: must,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setRole(authData.role);
      setUsername(authData.username);
      setMustChangePassword(must);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Error al cambiar la contraseña' };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setRole(normalizeRole('admin'));
    setUsername('');
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        username,
        isAdmin,
        mustChangePassword,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
