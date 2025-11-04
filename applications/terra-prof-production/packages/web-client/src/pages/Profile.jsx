import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

/**
 * Profile Component
 * User profile information and settings
 */
const Profile = () => {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    title: currentUser?.title || '',
    phone: currentUser?.phone || '',
    bio: currentUser?.bio || '',
    company: currentUser?.company || '',
    avatarUrl: currentUser?.avatarUrl || null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the updateProfile function from the auth context
      await updateProfile(formData);
      
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // If canceling edit, reset form data to current user data
      setFormData({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        email: currentUser?.email || '',
        title: currentUser?.title || '',
        phone: currentUser?.phone || '',
        bio: currentUser?.bio || '',
        company: currentUser?.company || '',
        avatarUrl: currentUser?.avatarUrl || null
      });
      setError(null);
    }
    
    setIsEditing(!isEditing);
  };
  
  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <div className="header-actions">
          <button 
            className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`}
            onClick={toggleEditMode}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          
          {!isEditing && (
            <Link to="/settings" className="btn btn-outline">
              Settings
            </Link>
          )}
        </div>
      </div>
      
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <div className="profile-container">
        {/* Profile Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar">
            {formData.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt={`${formData.firstName} ${formData.lastName}`} 
                className="avatar-image" 
              />
            ) : (
              <div className="avatar-placeholder">
                {formData.firstName?.[0] || ''}{formData.lastName?.[0] || ''}
              </div>
            )}
            
            {isEditing && (
              <button className="change-avatar-btn">
                Change Photo
              </button>
            )}
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-label">Member Since</span>
              <span className="stat-value">{formatDate(currentUser?.createdAt || '2023-01-15')}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Last Active</span>
              <span className="stat-value">{formatDate(currentUser?.lastLogin || '2023-04-22')}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Reports Created</span>
              <span className="stat-value">{currentUser?.reportsCount || 27}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Properties Managed</span>
              <span className="stat-value">{currentUser?.propertiesCount || 42}</span>
            </div>
          </div>
          
          {!isEditing && (
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <ul className="action-links">
                <li>
                  <Link to="/reports/new">Create New Report</Link>
                </li>
                <li>
                  <Link to="/properties/new">Add New Property</Link>
                </li>
                <li>
                  <Link to="/settings/security">Security Settings</Link>
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Profile Main Content */}
        <div className="profile-main">
          {isEditing ? (
            /* Edit Profile Form */
            <form className="edit-profile-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Personal Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h2>Professional Information</h2>
                
                <div className="form-group">
                  <label htmlFor="title">Job Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-control"
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={toggleEditMode}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* View Profile */
            <div className="profile-view">
              <div className="profile-section">
                <h2>Personal Information</h2>
                
                <div className="profile-field">
                  <span className="field-label">Name</span>
                  <span className="field-value">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                
                <div className="profile-field">
                  <span className="field-label">Email</span>
                  <span className="field-value">{formData.email}</span>
                </div>
                
                <div className="profile-field">
                  <span className="field-label">Phone</span>
                  <span className="field-value">
                    {formData.phone || 'Not provided'}
                  </span>
                </div>
              </div>
              
              <div className="profile-section">
                <h2>Professional Information</h2>
                
                <div className="profile-field">
                  <span className="field-label">Title</span>
                  <span className="field-value">
                    {formData.title || 'Not provided'}
                  </span>
                </div>
                
                <div className="profile-field">
                  <span className="field-label">Company</span>
                  <span className="field-value">
                    {formData.company || 'Not provided'}
                  </span>
                </div>
                
                <div className="profile-field bio-field">
                  <span className="field-label">Professional Bio</span>
                  <p className="field-value bio-value">
                    {formData.bio || 'No bio provided'}
                  </p>
                </div>
              </div>
              
              <div className="profile-section">
                <h2>Recent Activity</h2>
                
                <div className="activity-timeline">
                  <div className="activity-item">
                    <span className="activity-icon">📝</span>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-title">Created a Report</span>
                        <span className="activity-time">2 days ago</span>
                      </div>
                      <p className="activity-description">
                        Residential Appraisal Report for 123 Main Street
                      </p>
                    </div>
                  </div>
                  
                  <div className="activity-item">
                    <span className="activity-icon">🏠</span>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-title">Added a Property</span>
                        <span className="activity-time">1 week ago</span>
                      </div>
                      <p className="activity-description">
                        Commercial property at 456 Oak Avenue
                      </p>
                    </div>
                  </div>
                  
                  <div className="activity-item">
                    <span className="activity-icon">📊</span>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-title">Generated Market Analysis</span>
                        <span className="activity-time">2 weeks ago</span>
                      </div>
                      <p className="activity-description">
                        Q1 2023 Market Analysis for Metropolitan Area 042
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;