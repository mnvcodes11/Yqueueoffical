import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore session from localStorage and verify it's still valid
  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem('yqueue_user');
      const token = localStorage.getItem('yqueue_token');

      if (storedUser && token) {
        try {
          const res = await authService.getMe();
          setUser(res.user);
        } catch (err) {
          localStorage.removeItem('yqueue_token');
          localStorage.removeItem('yqueue_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    localStorage.setItem('yqueue_token', res.token);
    localStorage.setItem('yqueue_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const signup = async (data) => {
    const res = await authService.signup(data);
    localStorage.setItem('yqueue_token', res.token);
    localStorage.setItem('yqueue_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('yqueue_token');
    localStorage.removeItem('yqueue_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
