import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import NewDashboard from '../../pages/new-dashboard';

interface RoleBasedDashboardProps {
  userRole?: string;
  showTutorial?: boolean;
}

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = () => {
  const [match, params] = useRoute('/dashboard');
  const [location] = useLocation();
  const [userRole, setUserRole] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Get user role from localStorage or URL params
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const roleFromUrl = urlParams.get('role');
    const tutorialFromUrl = urlParams.get('tutorial') === 'true';
    const demoFromUrl = urlParams.get('demo') === 'true';

    const storedRole = localStorage.getItem('terrafusion_user_role');
    const currentRole = roleFromUrl || storedRole || 'new';

    setUserRole(currentRole);
    setShowTutorial(tutorialFromUrl || currentRole === 'new');
    setShowWelcome(roleFromUrl !== null || demoFromUrl);

    // Update stored role if changed
    if (roleFromUrl && roleFromUrl !== storedRole) {
      localStorage.setItem('terrafusion_user_role', roleFromUrl);
    }
  }, [location]);

  const getRoleWelcomeMessage = (role: string) => {
    const messages = {
      assessor: {
        title: 'Welcome, Property Assessor!',
        description: 'Your dashboard shows key metrics for property valuations and assessments.',
        quickActions: [
          { label: 'Search Properties', action: () => (window.location.href = '/land-records') },
          { label: 'Run Valuation', action: () => (window.location.href = '/improvements') },
          { label: 'View Reports', action: () => (window.location.href = '/property-stories') },
        ],
      },
      administrator: {
        title: 'Welcome, Administrator!',
        description: 'Monitor operations, view performance metrics, and manage your team.',
        quickActions: [
          { label: 'View Team Performance', action: () => (window.location.href = '/team-agents') },
          { label: 'System Settings', action: () => (window.location.href = '/extensions') },
          { label: 'Analytics Dashboard', action: () => (window.location.href = '/data-lineage') },
        ],
      },
      analyst: {
        title: 'Welcome, Data Analyst!',
        description: 'Dive into property data with advanced analytics and visualization tools.',
        quickActions: [
          { label: 'Data Visualization', action: () => (window.location.href = '/data-lineage') },
          { label: 'Property Trends', action: () => (window.location.href = '/property-stories') },
          { label: 'Export Reports', action: () => (window.location.href = '/imports') },
        ],
      },
      appraiser: {
        title: 'Welcome, Property Appraiser!',
        description: 'Use GIS tools and field data to conduct thorough property evaluations.',
        quickActions: [
          { label: 'Open GIS Map', action: () => (window.location.href = '/gis') },
          { label: 'Field Tools', action: () => (window.location.href = '/fields') },
          { label: 'Market Analysis', action: () => (window.location.href = '/property-stories') },
        ],
      },
      new: {
        title: 'Welcome to Terrafusion!',
        description: "Let's get you started with a quick tour of the key features.",
        quickActions: [
          { label: 'Take Interactive Tour', action: () => setShowTutorial(true) },
          {
            label: 'Explore Sample Data',
            action: () => (window.location.href = '/property-stories'),
          },
          { label: 'View Help Center', action: () => (window.location.href = '/extensions') },
        ],
      },
    };

    return messages[role as keyof typeof messages] || messages.new;
  };

  const roleMessage = getRoleWelcomeMessage(userRole);

  return (
    <div className="relative">
      {/* Role-based Welcome Banner */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 mb-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1"><>

              <h2 className="text-2xl font-bold mb-2">{roleMessage.title}</h2>
              <p
</> className="text-blue-100 mb-4">{roleMessage.description}</p>

              <div className="flex flex-wrap gap-3">
                {roleMessage.quickActions.map((action /* , index */) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowWelcome(false)}
              className="text-white hover:text-gray-200 text-xl font-bold ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4"><>

              <h3 className="text-xl font-bold">Quick Tutorial</h3>
              <button
</>
                onClick={() => setShowTutorial(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3"><>

                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div
</>><>

                  <h4 className="font-semibold">Dashboard Overview</h4>
                  <p
</> className="text-gray-600 text-sm">
                    The dashboard shows key metrics and recent activity for your role.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3"><>

                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div
</>><>

                  <h4 className="font-semibold">Navigation Menu</h4>
                  <p
</> className="text-gray-600 text-sm">
                    Use the left sidebar to access different features and tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3"><>

                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div
</>><>

                  <h4 className="font-semibold">Search & Filters</h4>
                  <p
</> className="text-gray-600 text-sm">
                    Look for the search icon to quickly find properties and data.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3"><>

                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div
</>><>

                  <h4 className="font-semibold">Need Help?</h4>
                  <p
</> className="text-gray-600 text-sm">
                    Look for the help icon (?) throughout the interface for contextual assistance.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between"><>

              <button
                onClick={() => setShowTutorial(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip Tutorial
              </button>
              <button
</>
                onClick={() => {
                  setShowTutorial(false);
                  // Could trigger an interactive walkthrough here
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Interactive Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Bubble for New Users */}
      {userRole === 'new' && !showTutorial && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowTutorial(true)}
            className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-xl animate-pulse"
            title="Need help? Click for tutorial"
          >
            ?
          </button>
        </div>
      )}

      {/* Main Dashboard Content */}
      <NewDashboard />
    </div>
  );
};

export default RoleBasedDashboard;
