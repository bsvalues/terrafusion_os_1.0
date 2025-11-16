import { useState } from 'react';
import { User, Building, Users, Bell, Shield, Mail, Save  } from '@mui/icons-material';

const Settings = () => {
  // User profile state
  const [profile, setProfile] = useState({
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@example.com',
    role: 'Lead Appraiser',
    phone: '(512) 555-7890',
    company: 'Terrafusion Appraisals',
    licenseNumber: 'TX-APP-12345',
    licenseExpiry: '2026-12-31',
    bio: 'Certified residential and commercial real estate appraiser with over 10 years of experience in the Austin market.'
  });

  // Company settings state
  const [company, setCompany] = useState({
    name: 'Terrafusion Appraisals',
    address: '789 Congress Ave, Suite 500',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    phone: '(512) 555-1000',
    website: 'www.terrafusionappraisals.com',
    email: 'info@terrafusionappraisals.com'
  });

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    appNotifications: true,
    weeklyReports: true,
    newAssignments: true,
    dueDateReminders: true,
    marketUpdates: false
  });

  // Security settings state
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    passwordLastChanged: '2025-02-15',
    sessionTimeout: 30
  });

  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the updated profile to the backend
    console.log('Profile updated:', profile);
    // Show success notification
    alert('Profile updated successfully');
  };

  // Handle company form submission
  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the updated company info to the backend
    console.log('Company updated:', company);
    // Show success notification
    alert('Company information updated successfully');
  };

  // Handle notifications form submission
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the updated notification settings to the backend
    console.log('Notification settings updated:', notifications);
    // Show success notification
    alert('Notification preferences updated successfully');
  };

  // Handle security form submission
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the updated security settings to the backend
    console.log('Security settings updated:', security);
    // Show success notification
    alert('Security settings updated successfully');
  };

  // Handle input changes for profile
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for company
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for notifications
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle security settings changes
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setSecurity(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="space-y-8"><>

      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <nav className="space-y-1">
            <a href="#profile" className="flex items-center px-3 py-2 text-primary-600 bg-primary-50 rounded-md">
              <User className="w-5 h-5 mr-2" />
              <span>Profile</span>
            </a>
            <a href="#company" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
              <Building className="w-5 h-5 mr-2" />
              <span>Company</span>
            </a>
            <a href="#team" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
              <Users className="w-5 h-5 mr-2" />
              <span>Team Members</span>
            </a>
            <a href="#notifications" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
              <Bell className="w-5 h-5 mr-2" />
              <span>Notifications</span>
            </a>
            <a href="#security" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
              <Shield className="w-5 h-5 mr-2" />
              <span>Security</span>
            </a>
          </nav>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          {/* Profile Settings */}
          <section id="profile" className="card">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold">Profile Settings</h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><>

                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
</>
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    className="block w-full border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div><>

                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
</>
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="block w-full border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div><>

                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
</>
                    type="text"
                    id="role"
                    name="role"
                    value={profile.role}
                    onChange={handleProfileChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
</>
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
</>
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={handleProfileChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                    License Expiry
                  </label>
                  <input
</>
                    type="date"
                    id="licenseExpiry"
                    name="licenseExpiry"
                    value={profile.licenseExpiry}
                    onChange={handleProfileChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div><>

                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Bio
                </label>
                <textarea
</>
                  id="bio"
                  name="bio"
                  rows={3}
                  value={profile.bio}
                  onChange={handleProfileChange}
                  className="block w-full border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </button>
              </div>
            </form>
          </section>
          
          {/* Company Settings */}
          <section id="company" className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold">Company Information</h2>
            </div>
            
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><>

                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
</>
                    type="text"
                    id="companyName"
                    name="name"
                    value={company.name}
                    onChange={handleCompanyChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="sm:col-span-2"><>

                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
</>
                    type="text"
                    id="address"
                    name="address"
                    value={company.address}
                    onChange={handleCompanyChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
</>
                    type="text"
                    id="city"
                    name="city"
                    value={company.city}
                    onChange={handleCompanyChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><>

                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
</>
                      type="text"
                      id="state"
                      name="state"
                      value={company.state}
                      onChange={handleCompanyChange}
                      className="block w-full border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div><>

                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
</>
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={company.zipCode}
                      onChange={handleCompanyChange}
                      className="block w-full border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div><>

                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
</>
                    type="tel"
                    id="companyPhone"
                    name="phone"
                    value={company.phone}
                    onChange={handleCompanyChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div><>

                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
</>
                    type="email"
                    id="companyEmail"
                    name="email"
                    value={company.email}
                    onChange={handleCompanyChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="sm:col-span-2"><>

                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
</>
                    type="url"
                    id="website"
                    name="website"
                    value={company.website}
                    onChange={handleCompanyChange}
                    className="block w-full border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Info
                </button>
              </div>
            </form>
          </section>
          
          {/* Notification Settings */}
          <section id="notifications" className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold">Notification Preferences</h2>
            </div>
            
            <form onSubmit={handleNotificationsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5"><>

                    <input
                      id="emailAlerts"
                      name="emailAlerts"
                      type="checkbox"
                      checked={notifications.emailAlerts}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="emailAlerts" className="font-medium">
                      Email Alerts
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5"><>

                    <input
                      id="appNotifications"
                      name="appNotifications"
                      type="checkbox"
                      checked={notifications.appNotifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="appNotifications" className="font-medium">
                      In-App Notifications
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Receive notifications within the application
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5"><>

                    <input
                      id="weeklyReports"
                      name="weeklyReports"
                      type="checkbox"
                      checked={notifications.weeklyReports}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="weeklyReports" className="font-medium">
                      Weekly Summary Reports
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Receive a weekly summary of your completed appraisals and pending tasks
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5"><>

                    <input
                      id="newAssignments"
                      name="newAssignments"
                      type="checkbox"
                      checked={notifications.newAssignments}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="newAssignments" className="font-medium">
                      New Assignment Alerts
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Get notified when you're assigned a new appraisal
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5"><>

                    <input
                      id="dueDateReminders"
                      name="dueDateReminders"
                      type="checkbox"
                      checked={notifications.dueDateReminders}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="dueDateReminders" className="font-medium">
                      Due Date Reminders
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Get reminded of upcoming appraisal deadlines
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5"><>

                    <input
                      id="marketUpdates"
                      name="marketUpdates"
                      type="checkbox"
                      checked={notifications.marketUpdates}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="marketUpdates" className="font-medium">
                      Market Data Updates
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Receive alerts about significant market changes in your areas
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </button>
              </div>
            </form>
          </section>
          
          {/* Security Settings */}
          <section id="security" className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold">Security Settings</h2>
            </div>
            
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div>
                <div className="flex items-start mb-4">
                  <div className="flex items-center h-5"><>

                    <input
                      id="twoFactorAuth"
                      name="twoFactorAuth"
                      type="checkbox"
                      checked={security.twoFactorAuth}
                      onChange={handleSecurityChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </div>
                  <div
</> className="ml-3"><>

                    <label htmlFor="twoFactorAuth" className="font-medium">
                      Two-Factor Authentication
                    </label>
                    <p
</> className="text-gray-500 text-sm">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                
                <div className="mb-4"><>

                  <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                    Session Timeout (minutes)
                  </label>
                  <select
</>
                    id="sessionTimeout"
                    name="sessionTimeout"
                    value={security.sessionTimeout}
                    onChange={handleSecurityChange}
                    className="block w-full border-gray-300 rounded-md"
                  ><>

                    <option value="15">15 minutes</option>
                    <option
</> value="30">30 minutes</option><>

                    <option value="60">1 hour</option>
                    <option
</> value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
                
                <div className="mb-4"><>

                  <h3 className="text-sm font-medium text-gray-700 mb-1">Password</h3>
                  <p
</> className="text-gray-500 text-sm mb-2">
                    Last changed: {new Date(security.passwordLastChanged).toLocaleDateString()}
                  </p>
                  <button type="button" className="btn btn-outline">
                    Change Password
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;