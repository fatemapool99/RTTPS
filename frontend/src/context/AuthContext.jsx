/**
 * RTTPS - Authentication Context & State Provider
 * Manages user credentials, JWT session token, and role authorization helpers.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rttps_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('rttps_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data?.success) {
            setUser(res.data.user);
            localStorage.setItem('rttps_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('rttps_token', newToken);
      localStorage.setItem('rttps_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: res.data?.message || 'Login failed' };
  };

  const register = async (name, email, password, role, phoneNumber, preferredStation) => {
    const res = await authService.register({
      name,
      email,
      password,
      role: role || 'passenger',
      phoneNumber,
      preferredStation
    });

    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('rttps_token', newToken);
      localStorage.setItem('rttps_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: res.data?.message || 'Registration failed' };
  };

  const demoLogin = async (role = 'passenger') => {
    if (role === 'admin') {
      return await login('admin@rttps.com', 'Admin@123');
    }
    return await login('passenger@rttps.com', 'Passenger@123');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rttps_token');
    localStorage.removeItem('rttps_user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    demoLogin,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
