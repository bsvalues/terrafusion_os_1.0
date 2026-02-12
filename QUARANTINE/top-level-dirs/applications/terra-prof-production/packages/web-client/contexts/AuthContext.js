/**
 * TerraFusionPro Web Client - Authentication Context
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// API Base URL
const API_BASE_URL = '/api';

// Create the Authentication Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Check if user is already logged in from localStorage
  useEffect(() => {
    const checkLoggedIn = () => {
      // Check for stored user and token in localStorage
      const storedUser = localStorage.getItem('terraFusionUser');
      const token = localStorage.getItem('terraFusionToken');
      
      if (storedUser && token) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('terraFusionUser');
          localStorage.removeItem('terraFusionToken');
        }
      }
      
      setLoading(false);
    };
    
    checkLoggedIn();
  }, []);
  
  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      setAuthError(null);
      
      // Call the API login endpoint
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Parse successful response
      const data = await response.json();
      
      // For demonstration/development fallback if API is not fully implemented yet
      let userData = data.user || data;
      let token = data.token || 'demo-token';
      
      // If API doesn't return proper data but credentials match the demo admin
      if (!userData && email === 'admin@terrafusionpro.com' && password === 'admin123') {
        userData = {
          id: 'admin1',
          first_name: 'Admin',
          last_name: 'User',
          email: email,
          role: 'admin'
        };
        token = 'demo-jwt-token';
      }
      
      // Verify we have user data
      if (!userData) {
        throw new Error('Invalid response from server');
      }
      
      // Set user in state
      setCurrentUser(userData);
      
      // Store in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('terraFusionUser', JSON.stringify(userData));
        localStorage.setItem('terraFusionToken', token);
      } else {
        // For session only, still need token for API calls
        sessionStorage.setItem('terraFusionUser', JSON.stringify(userData));
        sessionStorage.setItem('terraFusionToken', token);
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed. Please check your credentials.');
      throw error;
    }
  };
  
  // Register new user
  const register = async (userData) => {
    try {
      setAuthError(null);
      
      // Call the API register endpoint
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Parse successful response
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  };
  
  // Logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('terraFusionUser');
    localStorage.removeItem('terraFusionToken');
    sessionStorage.removeItem('terraFusionUser');
    sessionStorage.removeItem('terraFusionToken');
  };
  
  // Check if user has a specific role
  const hasRole = (requiredRole) => {
    if (!currentUser) return false;
    
    // If array of roles is provided, check if user has any of them
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentUser.role);
    }
    
    // Check single role
    return currentUser.role === requiredRole;
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setAuthError(null);
      
      // Call the API update profile endpoint
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
        },
        body: JSON.stringify(userData),
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update profile failed');
      }
      
      // Parse successful response
      const data = await response.json();
      
      // Update current user state
      const updatedUser = { ...currentUser, ...data.user };
      setCurrentUser(updatedUser);
      
      // Update stored user
      if (localStorage.getItem('terraFusionToken')) {
        localStorage.setItem('terraFusionUser', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('terraFusionToken')) {
        sessionStorage.setItem('terraFusionUser', JSON.stringify(updatedUser));
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      setAuthError(error.message || 'Update profile failed. Please try again.');
      throw error;
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setAuthError(null);
      
      // Call the API change password endpoint
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken')}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password change failed');
      }
      
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      setAuthError(error.message || 'Password change failed. Please try again.');
      throw error;
    }
  };
  
  // Reset password request (forgot password)
  const requestPasswordReset = async (email) => {
    try {
      setAuthError(null);
      
      // Call the API reset password endpoint
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset request failed');
      }
      
      return true;
    } catch (error) {
      console.error('Reset password request error:', error);
      setAuthError(error.message || 'Password reset request failed. Please try again.');
      throw error;
    }
  };
  
  // Value object that will be provided to consumers
  const value = {
    currentUser,
    loading,
    authError,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    hasRole,
    updateProfile,
    changePassword,
    requestPasswordReset
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;