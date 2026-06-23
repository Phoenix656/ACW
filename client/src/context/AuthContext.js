import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ user_id: decoded.user_id, role: decoded.role, token });
        // set default auth header for axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.warn('Invalid token in storage');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/login', { username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = jwtDecode(token);
    setUser({ user_id: decoded.user_id, role: decoded.role, token });
    return userData;
  };

  const register = async (data) => {
    const res = await axios.post('/api/register', data);
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = jwtDecode(token);
    setUser({ user_id: decoded.user_id, role: decoded.role, token });
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
