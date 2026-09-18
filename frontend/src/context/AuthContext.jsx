import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rp_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('rp_access_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('rp_refresh_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize & verify auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rp_access_token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me/`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('rp_user', JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          console.warn('Auth verification network error:', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Save tokens and user data synchronously to localStorage and React state
  const saveAuthData = (tokenData, userData) => {
    localStorage.setItem('rp_access_token', tokenData.access);
    localStorage.setItem('rp_refresh_token', tokenData.refresh);
    localStorage.setItem('rp_user', JSON.stringify(userData));
    setAccessToken(tokenData.access);
    setRefreshToken(tokenData.refresh);
    setUser(userData);
  };

  // Standard Login handler (Customer / General Login)
  const login = async (mobileOrUsername, password) => {
    try {
      // 1. First attempt login via customer endpoint
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileOrUsername, password }),
      });

      const data = await res.json();

      if (res.ok) {
        saveAuthData(data.tokens, data.user);
        return { success: true, user: data.user };
      }

      // 2. If customer login fails, attempt admin endpoint as fallback
      const adminRes = await fetch(`${API_BASE_URL}/auth/admin/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: mobileOrUsername.trim(), password }),
      });

      const adminData = await adminRes.json();

      if (adminRes.ok) {
        saveAuthData(adminData.tokens, adminData.user);
        return { success: true, user: adminData.user };
      }

      throw new Error(data.error || adminData.error || 'Login failed. Please check your credentials.');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Dedicated Admin Login handler
  const adminLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Admin authentication failed.');
      }

      saveAuthData(data.tokens, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Signup handler
  const signup = async (formData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMsg = 'Registration failed.';
        if (data.mobile_number) errorMsg = data.mobile_number[0];
        else if (data.confirm_password) errorMsg = data.confirm_password;
        else if (data.password) errorMsg = data.password[0];
        else if (data.name) errorMsg = data.name[0];
        else if (data.address) errorMsg = data.address[0];
        else if (typeof data === 'object') errorMsg = Object.values(data).flat().join(' ');

        throw new Error(errorMsg);
      }

      saveAuthData(data.tokens, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update Profile handler
  const updateProfile = async (updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update profile.');

      const updatedUser = {
        ...user,
        name: data.profile.name,
        mobile_number: data.profile.mobile_number,
        address: data.profile.address,
      };

      setUser(updatedUser);
      localStorage.setItem('rp_user', JSON.stringify(updatedUser));
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('rp_access_token');
    localStorage.removeItem('rp_refresh_token');
    localStorage.removeItem('rp_user');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        saveAuthData,
        login,
        adminLogin,
        signup,
        updateProfile,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
