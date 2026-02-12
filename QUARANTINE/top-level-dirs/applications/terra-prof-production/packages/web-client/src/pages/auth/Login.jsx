import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import NotificationContext from '../../contexts/NotificationContext';

/**
 * Login Component
 * Handles user authentication
 */
const Login = () => {
  const { login, isAuthenticated, error: authError } = useContext(AuthContext);
  const { error: showError } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Display auth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Attempt to login
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Invalid email or password');
        return;
      }
      
      // If login was successful, isAuthenticated will be true
      // and the useEffect above will handle redirection
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      showError('Login failed', { 
        message: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle demo login
  const handleDemoLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Attempt to login with demo credentials
      const result = await login('demo@terrafusionpro.com', 'demo1234');
      
      if (!result.success) {
        setError(result.error || 'Demo login failed');
        return;
      }
      
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Demo login failed. Please try again.');
      showError('Demo login failed', { 
        message: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page login-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your TerraFusionPro account</p>
        </div>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="form-control"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Demo Login
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
      
      <div className="auth-info">
        <div className="info-content">
          <h2>TerraFusionPro Platform</h2>
          <p>Advanced real estate appraisal and analysis tools for professionals.</p>
          
          <ul className="feature-list">
            <li>Comprehensive property appraisal tools</li>
            <li>Advanced market analysis</li>
            <li>Seamless form management</li>
            <li>Professional reporting</li>
            <li>AI-driven insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;