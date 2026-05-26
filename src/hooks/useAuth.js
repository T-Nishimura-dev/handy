import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_PASSWORD } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('handy_auth');
    if (saved === 'ok') setIsLoggedIn(true);
  }, []);

  const login = (password) => {
    if (password === APP_PASSWORD) {
      sessionStorage.setItem('handy_auth', 'ok');
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('handy_auth');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
