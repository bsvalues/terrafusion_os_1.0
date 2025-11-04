/**
 * TerraFusionPro Web Client - Header Component
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="navbar">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <img src="/terrafusion-logo.svg" alt="TerraFusionPro Logo" height="40" />
            TerraFusionPro
          </Link>
        </div>
        
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/properties">Properties</Link>
              <Link to="/reports">Reports</Link>
              <Link to="/analysis">Analysis</Link>
              
              <div className="user-dropdown">
                <button className="user-dropdown-toggle">
                  {currentUser?.first_name || 'User'} <span className="caret"></span>
                </button>
                <div className="user-dropdown-menu">
                  <Link to="/profile">Profile</Link>
                  <Link to="/settings">Settings</Link>
                  <hr />
                  <button onClick={handleLogout}>Log Out</button>
                </div>
              </div>
              
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-text">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;