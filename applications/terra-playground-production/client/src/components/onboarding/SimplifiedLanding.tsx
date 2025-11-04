import React, { useState } from 'react';
import { useLocation } from 'wouter';

interface UserRole {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

interface SimplifiedLandingProps {
  onUserTypeSelect: (role: string) => void;
}

const SimplifiedLanding: React.FC<SimplifiedLandingProps> = ({ onUserTypeSelect }) => {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string>('');

  const userRoles: UserRole[] = [
    {
      id: 'assessor',
      title: 'Property Assessor',
      description: 'I evaluate properties and determine their value for tax purposes',
      icon: '🏢',
      path: '/dashboard?role=assessor',
    },
    {
      id: 'administrator',
      title: 'County Administrator',
      description: 'I manage operations and oversee the assessment process',
      icon: '👔',
      path: '/dashboard?role=administrator',
    },
    {
      id: 'analyst',
      title: 'Data Analyst',
      description: 'I analyze property data and create reports',
      icon: '📊',
      path: '/dashboard?role=analyst',
    },
    {
      id: 'appraiser',
      title: 'Property Appraiser',
      description: 'I conduct detailed property evaluations and market analysis',
      icon: '🗺️',
      path: '/gis?welcome=true',
    },
    {
      id: 'new',
      title: 'New User',
      description: "I'm new to property assessment and want to learn",
      icon: '🌟',
      path: '/dashboard?tutorial=true',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role.id);
    onUserTypeSelect(role.id);

    // Store user preference
    localStorage.setItem('terrafusion_user_role', role.id);
    localStorage.setItem('terrafusion_first_visit', 'false');

    // Navigate to appropriate page
    setLocation(role.path);
  };

  const handleSkip = () => {
    localStorage.setItem('terrafusion_first_visit', 'false');
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12"><>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Terrafusion</h1>
          <p
</> className="text-xl text-gray-600 mb-8">
            The modern platform for property intelligence and assessment
          </p>

          {/* Key benefits */}
          <div className="flex justify-center space-x-8 text-sm text-gray-700 mb-8">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Easy to learn
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              AI-powered
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Secure & reliable
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-8"><>

          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Tell us about your role so we can personalize your experience
          </h2>

          <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRoles.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border border-gray-200 text-left"
              >
                <div className="flex items-start space-x-4"><>

                  <div className="text-3xl">{role.icon}</div>
                  <div
</>><>

                    <h3 className="font-semibold text-gray-900 mb-2">{role.title}</h3>
                    <p
</> className="text-sm text-gray-600">{role.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Start Options */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8"><>

          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Or jump right in with these quick options:
          </h3>
          <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setLocation('/gis')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            ><>

              <div className="text-lg mb-2">🗺️</div>
              <div
</> className="font-medium">Explore the Map</div>
              <div className="text-sm text-gray-600">Interactive property mapping</div>
            </button>

            <button
              onClick={() => setLocation('/property-stories')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            ><>

              <div className="text-lg mb-2">📖</div>
              <div
</> className="font-medium">View Sample Reports</div>
              <div className="text-sm text-gray-600">See what Terrafusion can do</div>
            </button>

            <button
              onClick={() => setLocation('/dashboard?demo=true')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            ><>

              <div className="text-lg mb-2">🚀</div>
              <div
</> className="font-medium">Interactive Demo</div>
              <div className="text-sm text-gray-600">Try features with sample data</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 underline text-sm"
          >
            Skip setup and go directly to the main dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLanding;
