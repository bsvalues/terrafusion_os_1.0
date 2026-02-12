import React, { createContext, useState, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext();

/**
 * Authentication Provider Component
 * Manages user authentication state and provides login/logout functionality
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Check if there's a valid auth token in localStorage
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      // If no token, user is not logged in
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Validate token and get user info
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Token is invalid or expired
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Token is valid, set current user
      const data = await response.json();
      setCurrentUser(data.user);
      
    } catch (err) {
      console.error('Auth check error:', err);
      // On error, assume user is not authenticated
      localStorage.removeItem('authToken');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // For development, use a mock login if the API is not available
      if (process.env.NODE_ENV === 'development' && 
          (email === 'demo@terrafusionpro.com' && password === 'demo1234')) {
        
        const mockUser = {
          id: 'user-1',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@terrafusionpro.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('authToken', 'mock-token-for-development');
        setCurrentUser(mockUser);
        setLoading(false);
        return { success: true, user: mockUser };
      }
      
      // Real API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Login failed');
        return { success: false, error: data.message };
      }
      
      // Store token and user data
      localStorage.setItem('authToken', data.token);
      setCurrentUser(data.user);
      
      return { success: true, user: data.user };
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return { success: false, error: data.message };
      }
      
      // Auto login after successful registration
      localStorage.setItem('authToken', data.token);
      setCurrentUser(data.user);
      
      return { success: true, user: data.user };
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    return { success: true };
  };
  
  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Password reset request failed');
        return { success: false, error: data.message };
      }
      
      return { success: true, message: data.message };
      
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Password reset failed');
        return { success: false, error: data.message };
      }
      
      return { success: true, message: data.message };
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        return { success: false, error: 'Authentication required' };
      }
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Profile update failed');
        return { success: false, error: data.message };
      }
      
      // Update current user data
      setCurrentUser(prev => ({
        ...prev,
        ...userData
      }));
      
      return { success: true, user: data.user || { ...currentUser, ...userData } };
      
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        return { success: false, error: 'Authentication required' };
      }
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Password change failed');
        return { success: false, error: data.message };
      }
      
      return { success: true, message: data.message };
      
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Return auth context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    isAuthenticated: !!currentUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;