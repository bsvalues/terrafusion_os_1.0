/**
 * TerraFusionPro - Register Page
 * Allows new users to create an account
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../components/layout/NotificationCenter';

/**
 * RegisterPage Component
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  const { register, error: authError } = useAuth();
  const notifications = useNotifications();
  const navigate = useNavigate();
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Check password strength when password changes
    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
  };
  
  // Evaluate password strength
  const evaluatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    // Calculate password strength
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Set strength label
    if (strength < 3) {
      setPasswordStrength('weak');
    } else if (strength < 5) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };
  
  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!passwordStrength) return null;
    
    return (
      <div className={`password-strength ${passwordStrength}`}>
        <div className="strength-bar"></div>
        <div className="strength-label">{passwordStrength}</div>
      </div>
    );
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.firstName || !formData.lastName) {
      notifications.error('Please enter your full name');
      return;
    }
    
    if (!formData.email) {
      notifications.error('Please enter your email address');
      return;
    }
    
    if (!formData.password) {
      notifications.error('Please enter a password');
      return;
    }
    
    if (formData.password.length < 8) {
      notifications.error('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      notifications.error('Passwords do not match');
      return;
    }
    
    if (!formData.agreeTerms) {
      notifications.error('You must agree to the terms and conditions');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Register new user
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      // Redirect to login with success message
      navigate('/auth/login', { 
        replace: true,
        state: { message: 'Registration successful! Please sign in with your new account.' }
      });
    } catch (error) {
      console.error('Registration failed:', error);
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
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">
            Join TerraFusionPro to streamline your real estate valuation
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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
            {renderPasswordStrength()}
            <div className="password-requirements">
              <p>Password must:</p>
              <ul>
                <li className={formData.password.length >= 8 ? 'met' : ''}>
                  Be at least 8 characters long
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                  Include at least one uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'met' : ''}>
                  Include at least one number
                </li>
                <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'met' : ''}>
                  Include at least one special character
                </li>
              </ul>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="password-mismatch">
                Passwords do not match
              </div>
            )}
          </div>
          
          <div className="form-group form-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                required
              />
              <span className="checkbox-text">
                I agree to the{' '}
                <Link to="/terms" className="auth-link">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="auth-link">Privacy Policy</Link>
              </span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <div className="auth-links">
            <span>Already have an account?</span>
            <Link to="/auth/login" className="login-link">
              Sign In
            </Link>
          </div>
        </form>
        
        <div className="auth-divider">
          <span>or sign up with</span>
        </div>
        
        <div className="auth-social-buttons">
          <button type="button" className="social-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <span>Sign up with GitHub</span>
          </button>
          
          <button type="button" className="social-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
            <span>Sign up with Facebook</span>
          </button>
          
          <button type="button" className="social-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
            <span>Sign up with Twitter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;