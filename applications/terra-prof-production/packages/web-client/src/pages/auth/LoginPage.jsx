/**
 * TerraFusionPro - Login Page
 * Allows users to authenticate with the application
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../components/layout/NotificationCenter';

/**
 * LoginPage Component
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error: authError, isAuthenticated } = useAuth();
  const notifications = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a message in the location state (e.g., from successful registration)
  useEffect(() => {
    if (location.state?.message) {
      notifications.success(location.state.message);
      
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, notifications]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      notifications.error('Please enter both email and password');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      
      // Redirect will happen in the useEffect above
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img 
            src="/assets/images/terrafusion-logo.svg" 
            alt="TerraFusionPro Logo" 
            className="auth-logo" 
          />
          <h1 className="auth-title">Sign In to TerraFusionPro</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your account
          </p>
        </div>
        
        {authError && (
          <div className="auth-error">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{authError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <div className="form-label-group">
              <label htmlFor="password" className="form-label">Password</label>
              <Link to="/auth/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="form-group form-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-text">Remember me</span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className="auth-links">
            <span>Don't have an account?</span>
            <Link to="/auth/register" className="register-link">
              Create Account
            </Link>
          </div>
        </form>
        
        <div className="auth-divider">
          <span>or continue with</span>
        </div>
        
        <div className="auth-social-buttons">
          <button type="button" className="social-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <span>Continue with GitHub</span>
          </button>
          
          <button type="button" className="social-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
            <span>Continue with Facebook</span>
          </button>
          
          <button type="button" className="social-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
            <span>Continue with Twitter</span>
          </button>
        </div>
        
        <div className="auth-footer">
          <p>
            By signing in, you agree to our{' '}
            <Link to="/terms" className="auth-footer-link">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="auth-footer-link">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;