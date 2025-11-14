import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = not logged in
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axiosInstance.get('/user/profile')
        .then(res => {
          setUser({
            id: res.data._id || res.data.id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role || 'user'
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser({
      ...userData,
      role: userData.role || 'user'
    });
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const logoutWithServer = async () => {
    try {
      await axiosInstance.post('/user/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await fetch('http://localhost:5000/user/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to send OTP');
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await fetch('http://localhost:5000/user/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid OTP');
      return data;
    } catch (error) {
      throw new Error(error.message || 'Invalid OTP');
    }
  };

  const updatePassword = async (email, otp, newPassword) => {
    try {
      const response = await fetch('http://localhost:5000/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update password');
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update password');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, logoutWithServer, resetPassword, verifyOtp, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
