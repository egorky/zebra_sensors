import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const { timestamp } = JSON.parse(authData);
      const now = new Date().getTime();
      // Check if it's been more than 1 hour (3600 * 1000 milliseconds)
      if (now - timestamp < 3600 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('auth');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const login = (username, password) => {
    const appUsername = import.meta.env.VITE_APP_USERNAME;
    const appPassword = import.meta.env.VITE_APP_PASSWORD;

    if (username === appUsername && password === appPassword) {
      const authData = {
        isAuthenticated: true,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
