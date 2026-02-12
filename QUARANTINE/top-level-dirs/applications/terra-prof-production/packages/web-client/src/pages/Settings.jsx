import React, { useState, useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

/**
 * Settings Component
 * User and application settings
 */
const Settings = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  
  const [activeTab, setActiveTab] = useState('account');
  const [accountSettings, setAccountSettings] = useState({
    email: 'current.user@example.com',
    notifyOnReportCompletion: true,
    notifyOnFormSubmission: true,
    notifyOnMentions: true,
    notifyOnPropertyChanges: false
  });
  
  const [applicationSettings, setApplicationSettings] = useState({
    theme: theme,
    defaultDashboard: 'summary',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    language: 'en-US'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    lastPasswordChange: '2023-03-01T12:00:00Z'
  });
  
  // Handle account settings changes
  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle application settings changes
  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationSettings(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update theme context if theme is changed
    if (name === 'theme') {
      setTheme(value);
    }
  };
  
  // Handle security settings changes
  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      
      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-navigation">
          <nav className="settings-tabs">
            <button 
              className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button 
              className={`settings-tab ${activeTab === 'application' ? 'active' : ''}`}
              onClick={() => setActiveTab('application')}
            >
              Application
            </button>
            <button 
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button 
              className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              API Access
            </button>
            <button 
              className={`settings-tab ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              Billing
            </button>
          </nav>
        </div>
        
        {/* Settings Content */}
        <div className="settings-content">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="settings-panel">
              <h2>Account Settings</h2>
              
              <form className="settings-form">
                <div className="form-section">
                  <h3>Profile Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={accountSettings.email}
                      onChange={handleAccountChange}
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="changePassword">Password</label>
                    <button
                      type="button"
                      id="changePassword"
                      className="btn btn-outline"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Notification Preferences</h3>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="notifyOnReportCompletion"
                      name="notifyOnReportCompletion"
                      checked={accountSettings.notifyOnReportCompletion}
                      onChange={handleAccountChange}
                    />
                    <label htmlFor="notifyOnReportCompletion">
                      Notify me when a report is completed
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="notifyOnFormSubmission"
                      name="notifyOnFormSubmission"
                      checked={accountSettings.notifyOnFormSubmission}
                      onChange={handleAccountChange}
                    />
                    <label htmlFor="notifyOnFormSubmission">
                      Notify me when a form is submitted
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="notifyOnMentions"
                      name="notifyOnMentions"
                      checked={accountSettings.notifyOnMentions}
                      onChange={handleAccountChange}
                    />
                    <label htmlFor="notifyOnMentions">
                      Notify me when I'm mentioned in comments
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="notifyOnPropertyChanges"
                      name="notifyOnPropertyChanges"
                      checked={accountSettings.notifyOnPropertyChanges}
                      onChange={handleAccountChange}
                    />
                    <label htmlFor="notifyOnPropertyChanges">
                      Notify me when a property is updated
                    </label>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button type="button" className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Application Settings */}
          {activeTab === 'application' && (
            <div className="settings-panel">
              <h2>Application Settings</h2>
              
              <form className="settings-form">
                <div className="form-section">
                  <h3>Display Preferences</h3>
                  
                  <div className="form-group">
                    <label htmlFor="theme">Theme</label>
                    <select
                      id="theme"
                      name="theme"
                      value={applicationSettings.theme}
                      onChange={handleApplicationChange}
                      className="form-control"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Preference</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="defaultDashboard">Default Dashboard</label>
                    <select
                      id="defaultDashboard"
                      name="defaultDashboard"
                      value={applicationSettings.defaultDashboard}
                      onChange={handleApplicationChange}
                      className="form-control"
                    >
                      <option value="summary">Summary</option>
                      <option value="analytics">Analytics</option>
                      <option value="properties">Properties</option>
                      <option value="reports">Reports</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Regional Settings</h3>
                  
                  <div className="form-group">
                    <label htmlFor="dateFormat">Date Format</label>
                    <select
                      id="dateFormat"
                      name="dateFormat"
                      value={applicationSettings.dateFormat}
                      onChange={handleApplicationChange}
                      className="form-control"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="timezone">Timezone</label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={applicationSettings.timezone}
                      onChange={handleApplicationChange}
                      className="form-control"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="language">Language</label>
                    <select
                      id="language"
                      name="language"
                      value={applicationSettings.language}
                      onChange={handleApplicationChange}
                      className="form-control"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-ES">Spanish</option>
                      <option value="fr-FR">French</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button type="button" className="btn btn-outline">
                    Reset to Defaults
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <h2>Security Settings</h2>
              
              <form className="settings-form">
                <div className="form-section">
                  <h3>Account Security</h3>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="twoFactorEnabled"
                      name="twoFactorEnabled"
                      checked={securitySettings.twoFactorEnabled}
                      onChange={handleSecurityChange}
                    />
                    <label htmlFor="twoFactorEnabled">
                      Enable Two-Factor Authentication
                    </label>
                  </div>
                  
                  <div className="info-group">
                    <span className="info-label">Last Password Change:</span>
                    <span className="info-value">
                      {formatDate(securitySettings.lastPasswordChange)}
                    </span>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Session Settings</h3>
                  
                  <div className="form-group">
                    <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                    <select
                      id="sessionTimeout"
                      name="sessionTimeout"
                      value={securitySettings.sessionTimeout}
                      onChange={handleSecurityChange}
                      className="form-control"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="240">4 hours</option>
                    </select>
                  </div>
                  
                  <div className="button-group">
                    <button type="button" className="btn btn-danger">
                      Log Out All Other Sessions
                    </button>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button type="button" className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Other tabs would display placeholder content */}
          {(activeTab === 'api' || activeTab === 'billing') && (
            <div className="settings-panel placeholder">
              <h2>{activeTab === 'api' ? 'API Access' : 'Billing'}</h2>
              <p className="placeholder-text">
                This section is under development. Coming soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;