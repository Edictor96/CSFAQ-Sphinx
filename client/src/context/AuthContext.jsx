import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

const STORAGE_KEY = 'rememberMe';

function getStorage() {
  return localStorage.getItem(STORAGE_KEY) === 'true' ? localStorage : sessionStorage;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }, []);

  const loadUser = useCallback(async () => {
    const token = getStorage().getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleTokens = (data, rememberMe = false) => {
    localStorage.setItem(STORAGE_KEY, rememberMe);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', data.accessToken);
    storage.setItem('refreshToken', data.refreshToken);
  };

  const login = async (email, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login', { email, password });
    handleTokens(data, rememberMe);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword: password,
      termsAccepted: true,
    });
    handleTokens(data);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    handleTokens(data, true);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // proceed with local logout even if API call fails
    }
    clearAuth();
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  };

  const resetPassword = async (token, password) => {
    const { data } = await api.put(`/auth/reset-password/${token}`, {
      password,
      confirmPassword: password,
    });
    return data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    forgotPassword,
    resetPassword,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
