import React, { useState } from 'react';
import { Settings,
  User,
  Lock,
  Bell,
  Monitor,
  Database,
  CreditCard,
  FileText,
  Sun,
  Moon,
  Laptop,
  Save,
  AlertCircle
 } from '@mui/icons-material';

type SystemPreference = {
  id: string;
  name: string;
  description: string;
  value: string | boolean | number;
  type: 'toggle' | 'select' | 'text' | 'number';
  options?: string[];
  category: 'appearance' | 'notifications' | 'privacy' | 'system' | 'reports' | 'integrations';
};

type AccountSetting = {
  id: string;
  name: string;
  description?: string;
  value: string;
  type: 'text' | 'email' | 'password' | 'select';
  options?: string[];
  required: boolean;
  editable: boolean;
};

type OrganizationSetting = {
  id: string;
  name: string;
  description?: string;
  value: string;
  type: 'text' | 'email' | 'file' | 'select';
  options?: string[];
  required: boolean;
};

type SettingsFormState = {
  systemPreferences: Record<string, string | boolean | number>;
  accountSettings: Record<string, string>;
  organizationSettings: Record<string, string>;
  hasUnsavedChanges: boolean;
};

const SettingsComponent = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('system');
  
  // System Preferences
  const [systemPreferences, setSystemPreferences] = useState<SystemPreference[]>([
    {
      id: 'theme',
      name: 'Theme',
      description: 'Choose your preferred theme for the application',
      value: 'system',
      type: 'select',
      options: ['light', 'dark', 'system'],
      category: 'appearance'
    },
    {
      id: 'compactMode',
      name: 'Compact Mode',
      description: 'Display more information in less space',
      value: false,
      type: 'toggle',
      category: 'appearance'
    },
    {
      id: 'decimalDisplay',
      name: 'Decimal Display',
      description: 'Number of decimal places to display for numerical values',
      value: 2,
      type: 'select',
      options: ['0', '1', '2', '3', '4'],
      category: 'appearance'
    },
    {
      id: 'emailNotifications',
      name: 'Email Notifications',
      description: 'Receive email notifications for important updates',
      value: true,
      type: 'toggle',
      category: 'notifications'
    },
    {
      id: 'appraisalReminders',
      name: 'Appraisal Reminders',
      description: 'Receive reminders for upcoming appraisal deadlines',
      value: true,
      type: 'toggle',
      category: 'notifications'
    },
    {
      id: 'dataCollection',
      name: 'Usage Data Collection',
      description: 'Allow anonymous usage data collection to improve the product',
      value: true,
      type: 'toggle',
      category: 'privacy'
    },
    {
      id: 'reportFormat',
      name: 'Default Report Format',
      description: 'Choose the default format for generated reports',
      value: 'pdf',
      type: 'select',
      options: ['pdf', 'docx', 'html'],
      category: 'reports'
    },
    {
      id: 'defaultPageSize',
      name: 'Default Page Size',
      description: 'The number of items to show per page in lists',
      value: 25,
      type: 'select',
      options: ['10', '25', '50', '100'],
      category: 'system'
    },
    {
      id: 'autoSave',
      name: 'Auto Save',
      description: 'Automatically save forms while editing',
      value: true,
      type: 'toggle',
      category: 'system'
    },
    {
      id: 'defaultLocation',
      name: 'Default Location',
      description: 'The default location for market analysis and comparables',
      value: 'Austin, TX',
      type: 'text',
      category: 'system'
    },
    {
      id: 'googleMaps',
      name: 'Google Maps Integration',
      description: 'Use Google Maps for location data and visualization',
      value: true,
      type: 'toggle',
      category: 'integrations'
    },
    {
      id: 'mls',
      name: 'MLS Integration',
      description: 'Connect to your local MLS for property data',
      value: false,
      type: 'toggle',
      category: 'integrations'
    }
  ]);
  
  // Account Settings
  const [accountSettings, setAccountSettings] = useState<AccountSetting[]>([
    {
      id: 'email',
      name: 'Email Address',
      value: 'john.smith@example.com',
      type: 'email',
      required: true,
      editable: true
    },
    {
      id: 'firstName',
      name: 'First Name',
      value: 'John',
      type: 'text',
      required: true,
      editable: true
    },
    {
      id: 'lastName',
      name: 'Last Name',
      value: 'Smith',
      type: 'text',
      required: true,
      editable: true
    },
    {
      id: 'phone',
      name: 'Phone Number',
      value: '(555) 123-4567',
      type: 'text',
      required: false,
      editable: true
    },
    {
      id: 'licenseNumber',
      name: 'License Number',
      value: 'APP12345',
      type: 'text',
      required: true,
      editable: true
    },
    {
      id: 'licenseState',
      name: 'License State',
      value: 'TX',
      type: 'select',
      options: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
      required: true,
      editable: true
    },
    {
      id: 'role',
      name: 'Role',
      value: 'Appraiser',
      type: 'text',
      required: true,
      editable: false
    }
  ]);
  
  // Organization Settings
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSetting[]>([
    {
      id: 'orgName',
      name: 'Organization Name',
      value: 'ABC Appraisal Services',
      type: 'text',
      required: true
    },
    {
      id: 'orgEmail',
      name: 'Organization Email',
      value: 'info@abcappraisal.com',
      type: 'email',
      required: true
    },
    {
      id: 'orgPhone',
      name: 'Organization Phone',
      value: '(555) 987-6543',
      type: 'text',
      required: true
    },
    {
      id: 'orgAddress',
      name: 'Address',
      value: '123 Business Ave, Suite 100',
      type: 'text',
      required: true
    },
    {
      id: 'orgCity',
      name: 'City',
      value: 'Austin',
      type: 'text',
      required: true
    },
    {
      id: 'orgState',
      name: 'State',
      value: 'TX',
      type: 'select',
      options: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
      required: true
    },
    {
      id: 'orgZip',
      name: 'ZIP Code',
      value: '78701',
      type: 'text',
      required: true
    },
    {
      id: 'orgLogo',
      name: 'Organization Logo',
      value: 'logo.png',
      type: 'file',
      required: false
    },
    {
      id: 'orgWebsite',
      name: 'Website',
      value: 'https://www.abcappraisal.com',
      type: 'text',
      required: false
    }
  ]);
  
  // Form state
  const [formState, setFormState] = useState<SettingsFormState>({
    systemPreferences: systemPreferences.reduce((acc, pref) => ({ ...acc, [pref.id]: pref.value }), {}),
    accountSettings: accountSettings.reduce((acc, setting) => ({ ...acc, [setting.id]: setting.value }), {}),
    organizationSettings: organizationSettings.reduce((acc, setting) => ({ ...acc, [setting.id]: setting.value }), {}),
    hasUnsavedChanges: false
  });
  
  // Filter system preferences by category
  const getPreferencesByCategory = (category: string) => {
    return systemPreferences.filter(pref => pref.category === category);
  };
  
  // Handle system preference change
  const handleSystemPreferenceChange = (id: string, value: string | boolean | number) => {
    setFormState(prev => ({
      ...prev,
      systemPreferences: {
        ...prev.systemPreferences,
        [id]: value
      },
      hasUnsavedChanges: true
    }));
  };
  
  // Handle account setting change
  const handleAccountSettingChange = (id: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      accountSettings: {
        ...prev.accountSettings,
        [id]: value
      },
      hasUnsavedChanges: true
    }));
  };
  
  // Handle organization setting change
  const handleOrganizationSettingChange = (id: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      organizationSettings: {
        ...prev.organizationSettings,
        [id]: value
      },
      hasUnsavedChanges: true
    }));
  };
  
  // Save settings
  const handleSaveSettings = () => {
    // In a real implementation, this would save to the server
    // Update the systemPreferences state with the new values
    setSystemPreferences(systemPreferences.map(pref => ({
      ...pref,
      value: formState.systemPreferences[pref.id]
    })));
    
    // Update account settings
    setAccountSettings(accountSettings.map(setting => ({
      ...setting,
      value: formState.accountSettings[setting.id]
    })));
    
    // Update organization settings
    setOrganizationSettings(organizationSettings.map(setting => ({
      ...setting,
      value: formState.organizationSettings[setting.id]
    })));
    
    // Clear unsaved changes flag
    setFormState(prev => ({
      ...prev,
      hasUnsavedChanges: false
    }));
    
    // Show success message (in a real implementation)
    alert('Settings saved successfully');
  };
  
  // Reset settings to default
  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset to default settings? This action cannot be undone.')) {
      // Reset to default values (this would be more sophisticated in a real implementation)
      setFormState({
        systemPreferences: systemPreferences.reduce((acc, pref) => ({ ...acc, [pref.id]: pref.value }), {}),
        accountSettings: accountSettings.reduce((acc, setting) => ({ ...acc, [setting.id]: setting.value }), {}),
        organizationSettings: organizationSettings.reduce((acc, setting) => ({ ...acc, [setting.id]: setting.value }), {}),
        hasUnsavedChanges: false
      });
    }
  };
  
  // Render input field based on type
  const renderInputField = (
    type: string, 
    id: string, 
    value: string | boolean | number, 
    onChange: (id: string, value: any) => void,
    options?: string[]
  ) => {
    switch (type) {
      case 'toggle':
        return (
          <div className="relative inline-block w-12 align-middle select-none">
            <input
              type="checkbox"
              id={id}
              checked={Boolean(value)}
              onChange={(e) => onChange(id, e.target.checked)}
              className="sr-only"
            /><>

            <div className={`block h-6 rounded-full transition-colors duration-200 ease-in-out ${Boolean(value) ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div
</> 
              className={`absolute left-0 top-0 bg-white border-2 rounded-full h-6 w-6 transition-transform duration-200 ease-in-out transform ${Boolean(value) ? 'translate-x-6 border-blue-600' : 'translate-x-0 border-gray-200'}`}
            ></div>
          </div>
        );
        
      case 'select':
        return (
          <select
            id={id}
            value={String(value)}
            onChange={(e) => onChange(id, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'text':
      case 'email':
        return (
          <input
            type={type}
            id={id}
            value={String(value)}
            onChange={(e) => onChange(id, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={id}
            value={Number(value)}
            onChange={(e) => onChange(id, Number(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );
        
      case 'file':
        return (
          <div className="flex items-center"><>

            <span className="text-sm text-gray-500 mr-2">{value || 'No file selected'}</span>
            <label
</> className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md cursor-pointer hover:bg-gray-300 text-sm">
              Browse
              <input type="file" className="hidden" onChange={(e) => e.target.files && onChange(id, e.target.files[0].name)} />
            </label>
          </div>
        );
        
      case 'password':
        return (
          <input
            type="password"
            id={id}
            value={String(value)}
            onChange={(e) => onChange(id, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6"><>

          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
            Settings
          </h1>
          <p
</> className="text-gray-600">Configure your preferences and account settings</p>
        </div>
        
        {/* Settings Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Navigation Tabs */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('system')} 
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'system' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              ><>

                <Settings className="inline-block w-4 h-4 mr-2" />
                System
              </button>
              <button
</> 
                onClick={() => setActiveTab('account')} 
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'account' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              ><>

                <User className="inline-block w-4 h-4 mr-2" />
                Account
              </button>
              <button
</> 
                onClick={() => setActiveTab('organization')} 
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'organization' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              ><>

                <Building className="inline-block w-4 h-4 mr-2" />
                Organization
              </button>
              <button
</> 
                onClick={() => setActiveTab('security')} 
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'security' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              ><>

                <Lock className="inline-block w-4 h-4 mr-2" />
                Security
              </button>
              <button
</> 
                onClick={() => setActiveTab('billing')} 
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'billing' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CreditCard className="inline-block w-4 h-4 mr-2" />
                Billing
              </button>
            </nav>
          </div>
          
          {/* System Preferences Tab */}
          {activeTab === 'system' && (
            <div className="p-6">
              <div className="mb-6"><>

                <h2 className="text-lg font-medium text-gray-900 mb-2">System Preferences</h2>
                <p
</> className="text-sm text-gray-500">Configure system-wide preferences and display options.</p>
              </div>
              
              {/* Appearance Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center"><>

                  <Sun className="w-4 h-4 mr-2" />
                  Appearance
                </h3>
                <div
</> className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {getPreferencesByCategory('appearance').map((pref) => (
                    <div key={pref.id} className="flex justify-between items-center">
                      <div><>

                        <label htmlFor={pref.id} className="block text-sm font-medium text-gray-700">
                          {pref.name}
                        </label>
                        <p
</> className="text-xs text-gray-500 mt-1">{pref.description}</p>
                      </div>
                      <div>
                        {renderInputField(
                          pref.type, 
                          pref.id, 
                          formState.systemPreferences[pref.id], 
                          handleSystemPreferenceChange,
                          pref.options
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notifications Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center"><>

                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </h3>
                <div
</> className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {getPreferencesByCategory('notifications').map((pref) => (
                    <div key={pref.id} className="flex justify-between items-center">
                      <div><>

                        <label htmlFor={pref.id} className="block text-sm font-medium text-gray-700">
                          {pref.name}
                        </label>
                        <p
</> className="text-xs text-gray-500 mt-1">{pref.description}</p>
                      </div>
                      <div>
                        {renderInputField(
                          pref.type, 
                          pref.id, 
                          formState.systemPreferences[pref.id], 
                          handleSystemPreferenceChange,
                          pref.options
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Privacy Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center"><>

                  <Lock className="w-4 h-4 mr-2" />
                  Privacy
                </h3>
                <div
</> className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {getPreferencesByCategory('privacy').map((pref) => (
                    <div key={pref.id} className="flex justify-between items-center">
                      <div><>

                        <label htmlFor={pref.id} className="block text-sm font-medium text-gray-700">
                          {pref.name}
                        </label>
                        <p
</> className="text-xs text-gray-500 mt-1">{pref.description}</p>
                      </div>
                      <div>
                        {renderInputField(
                          pref.type, 
                          pref.id, 
                          formState.systemPreferences[pref.id], 
                          handleSystemPreferenceChange,
                          pref.options
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Reports Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center"><>

                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </h3>
                <div
</> className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {getPreferencesByCategory('reports').map((pref) => (
                    <div key={pref.id} className="flex justify-between items-center">
                      <div><>

                        <label htmlFor={pref.id} className="block text-sm font-medium text-gray-700">
                          {pref.name}
                        </label>
                        <p
</> className="text-xs text-gray-500 mt-1">{pref.description}</p>
                      </div>
                      <div>
                        {renderInputField(
                          pref.type, 
                          pref.id, 
                          formState.systemPreferences[pref.id], 
                          handleSystemPreferenceChange,
                          pref.options
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* System Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center"><>

                  <Monitor className="w-4 h-4 mr-2" />
                  System
                </h3>
                <div
</> className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {getPreferencesByCategory('system').map((pref) => (
                    <div key={pref.id} className="flex justify-between items-center">
                      <div><>

                        <label htmlFor={pref.id} className="block text-sm font-medium text-gray-700">
                          {pref.name}
                        </label>
                        <p
</> className="text-xs text-gray-500 mt-1">{pref.description}</p>
                      </div>
                      <div>
                        {renderInputField(
                          pref.type, 
                          pref.id, 
                          formState.systemPreferences[pref.id], 
                          handleSystemPreferenceChange,
                          pref.options
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Integrations Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center"><>

                  <Database className="w-4 h-4 mr-2" />
                  Integrations
                </h3>
                <div
</> className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {getPreferencesByCategory('integrations').map((pref) => (
                    <div key={pref.id} className="flex justify-between items-center">
                      <div><>

                        <label htmlFor={pref.id} className="block text-sm font-medium text-gray-700">
                          {pref.name}
                        </label>
                        <p
</> className="text-xs text-gray-500 mt-1">{pref.description}</p>
                      </div>
                      <div>
                        {renderInputField(
                          pref.type, 
                          pref.id, 
                          formState.systemPreferences[pref.id], 
                          handleSystemPreferenceChange,
                          pref.options
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-4"><>

                <button
                  onClick={handleResetSettings}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset to Defaults
                </button>
                <button
</>
                  onClick={handleSaveSettings}
                  disabled={!formState.hasUnsavedChanges}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    formState.hasUnsavedChanges 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          )}
          
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="p-6">
              <div className="mb-6"><>

                <h2 className="text-lg font-medium text-gray-900 mb-2">Account Settings</h2>
                <p
</> className="text-sm text-gray-500">Manage your personal account information.</p>
              </div>
              
              {/* Profile Section */}
              <div className="mb-8"><>

                <h3 className="text-md font-medium text-gray-700 mb-4">Profile Information</h3>
                
                <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accountSettings.map((setting) => (
                    <div key={setting.id}>
                      <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700 mb-1">
                        {setting.name} {setting.required && <span className="text-red-500">*</span>}
                      </label>
                      {setting.editable ? (
                        renderInputField(
                          setting.type,
                          setting.id,
                          formState.accountSettings[setting.id],
                          handleAccountSettingChange,
                          setting.options
                        )
                      ) : (
                        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-sm">
                          {formState.accountSettings[setting.id]}
                        </div>
                      )}
                      {setting.description && (
                        <p className="mt-1 text-xs text-gray-500">{setting.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={!formState.hasUnsavedChanges}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    formState.hasUnsavedChanges 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  Save Account Information
                </button>
              </div>
            </div>
          )}
          
          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="p-6">
              <div className="mb-6"><>

                <h2 className="text-lg font-medium text-gray-900 mb-2">Organization Settings</h2>
                <p
</> className="text-sm text-gray-500">Manage your organization's information and branding.</p>
              </div>
              
              {/* Organization Details */}
              <div className="mb-8"><>

                <h3 className="text-md font-medium text-gray-700 mb-4">Organization Details</h3>
                
                <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {organizationSettings.map((setting) => (
                    <div key={setting.id}>
                      <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700 mb-1">
                        {setting.name} {setting.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderInputField(
                        setting.type,
                        setting.id,
                        formState.organizationSettings[setting.id],
                        handleOrganizationSettingChange,
                        setting.options
                      )}
                      {setting.description && (
                        <p className="mt-1 text-xs text-gray-500">{setting.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={!formState.hasUnsavedChanges}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    formState.hasUnsavedChanges 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  Save Organization Information
                </button>
              </div>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6">
              <div className="mb-6"><>

                <h2 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h2>
                <p
</> className="text-sm text-gray-500">Manage your account security and authentication options.</p>
              </div>
              
              {/* Password Section */}
              <div className="mb-8"><>

                <h3 className="text-md font-medium text-gray-700 mb-4">Change Password</h3>
                
                <div
</> className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password <span className="text-red-500">*</span>
                    </label><>

                    <input
                      type="password"
                      id="currentPassword"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div
</>>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter a new password"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters and include a number and a special character.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label><>

                    <input
                      type="password"
                      id="confirmPassword"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Confirm your new password"
                    />
                  </div>
                  
                  <div
</> className="pt-4">
                    <button
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Two-Factor Authentication */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4"><>

                  <h3 className="text-md font-medium text-gray-700">Two-Factor Authentication</h3>
                  <span
</> className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Not Enabled</span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6"><>

                  <p className="text-sm text-gray-600 mb-4">
                    Add an additional layer of security to your account by enabling two-factor authentication. When enabled, you'll need to provide a verification code from your phone in addition to your password when signing in.
                  </p>
                  
                  <button
</>
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Enable Two-Factor Authentication
                  </button>
                </div>
              </div>
              
              {/* Session Management */}
              <div><>

                <h3 className="text-md font-medium text-gray-700 mb-4">Active Sessions</h3>
                
                <div
</> className="bg-gray-50 rounded-lg p-6">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div><>

                        <p className="text-sm font-medium text-gray-700">Current Session</p>
                        <p
</> className="text-xs text-gray-500 mt-1">Austin, TX, USA • Chrome on Windows</p>
                        <p className="text-xs text-gray-500">Started: May 20, 2025 at 10:23 AM</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active Now</span>
                    </div>
                  </div>
                  
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div><>

                        <p className="text-sm font-medium text-gray-700">Mobile Device</p>
                        <p
</> className="text-xs text-gray-500 mt-1">Dallas, TX, USA • Safari on iOS</p>
                        <p className="text-xs text-gray-500">Last active: May 19, 2025 at 3:45 PM</p>
                      </div>
                      <button className="text-sm text-red-600 hover:text-red-800">
                        Sign Out
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      className="text-sm text-red-600 font-medium hover:text-red-800"
                    >
                      Sign Out of All Other Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="p-6">
              <div className="mb-6"><>

                <h2 className="text-lg font-medium text-gray-900 mb-2">Billing & Subscription</h2>
                <p
</> className="text-sm text-gray-500">Manage your subscription plan and payment methods.</p>
              </div>
              
              {/* Current Plan */}
              <div className="mb-8"><>

                <h3 className="text-md font-medium text-gray-700 mb-4">Current Plan</h3>
                
                <div
</> className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div><>

                      <p className="text-lg font-semibold text-gray-900">Professional Plan</p>
                      <div
</> className="mt-1 flex items-center"><>

                        <span className="text-2xl font-bold text-gray-900">$99</span>
                        <span
</> className="text-gray-500 ml-1">/month</span>
                      </div><>

                      <p className="text-sm text-gray-600 mt-2">Billing cycle: Monthly</p>
                      <p
</> className="text-sm text-gray-600">Next billing date: June 20, 2025</p>
                    </div>
                    <div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-gray-200 pt-4"><>

                    <h4 className="text-sm font-medium text-gray-700 mb-2">Features included:</h4>
                    <ul
</> className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Unlimited properties and appraisals</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Advanced market analysis</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Team collaboration (up to 5 members)</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Custom report templates</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Priority customer support</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-6 flex items-center space-x-4"><>

                    <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Change Plan
                    </button>
                    <button
</> className="text-sm text-red-600 font-medium hover:text-red-800">
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4"><>

                  <h3 className="text-md font-medium text-gray-700">Payment Methods</h3>
                  <button
</> className="text-sm text-blue-600 font-medium">
                    + Add Payment Method
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-md"><>

                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div
</> className="ml-4"><>

                        <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
                        <p
</> className="text-xs text-gray-500">Expires 12/2025</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">Default</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2"><>

                      <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                      <button
</> className="text-sm text-red-600 hover:text-red-800">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Billing History */}
              <div><>

                <h3 className="text-md font-medium text-gray-700 mb-4">Billing History</h3>
                
                <div
</> className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr><>

                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th><>

                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            May 20, 2025
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Professional Plan - Monthly
                          </td><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            $99.00
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Download</button>
                          </td>
                        </tr>
                        <tr><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Apr 20, 2025
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Professional Plan - Monthly
                          </td><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            $99.00
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Download</button>
                          </td>
                        </tr>
                        <tr><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Mar 20, 2025
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Professional Plan - Monthly
                          </td><>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            $99.00
                          </td>
                          <td
</> className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">Download</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
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

export default SettingsComponent;