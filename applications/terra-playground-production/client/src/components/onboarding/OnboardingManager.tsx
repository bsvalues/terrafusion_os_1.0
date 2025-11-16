import React, { useEffect, useState } from 'react';
import SimplifiedLanding from './SimplifiedLanding';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the user's first visit
    const hasVisited = localStorage.getItem('terrafusion_first_visit');
    const userRole = localStorage.getItem('terrafusion_user_role');

    // Show onboarding if user hasn't visited before or hasn't selected a role
    if (hasVisited === null || hasVisited === 'true' || !userRole) {
      setShowOnboarding(true);
    }

    setIsLoading(false);
  }, []);

  const handleUserTypeSelect = (role: string) => {
    // Store user preferences
    localStorage.setItem('terrafusion_user_role', role);
    localStorage.setItem('terrafusion_first_visit', 'false');
    localStorage.setItem('terrafusion_onboarding_completed', 'true');

    // Set user preferences based on role
    const rolePreferences = {
      assessor: {
        defaultPage: '/dashboard',
        showTutorials: true,
        complexity: 'intermediate',
        favoriteFeatures: ['property-search', 'valuation-tools', 'reports'],
      },
      administrator: {
        defaultPage: '/dashboard',
        showTutorials: false,
        complexity: 'advanced',
        favoriteFeatures: ['dashboard', 'team-management', 'analytics'],
      },
      analyst: {
        defaultPage: '/dashboard',
        showTutorials: true,
        complexity: 'advanced',
        favoriteFeatures: ['analytics', 'data-visualization', 'reports'],
      },
      appraiser: {
        defaultPage: '/gis',
        showTutorials: true,
        complexity: 'intermediate',
        favoriteFeatures: ['gis-mapping', 'field-tools', 'market-analysis'],
      },
      new: {
        defaultPage: '/dashboard?tutorial=true',
        showTutorials: true,
        complexity: 'beginner',
        favoriteFeatures: ['guided-tours', 'help-center', 'tutorials'],
      },
    };

    const preferences =
      rolePreferences[role as keyof typeof rolePreferences] || rolePreferences.new;
    localStorage.setItem('terrafusion_user_preferences', JSON.stringify(preferences));

    setShowOnboarding(false);
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem('terrafusion_first_visit', 'false');
    localStorage.setItem('terrafusion_onboarding_completed', 'skipped');
    setShowOnboarding(false);
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><>

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
</> className="text-gray-600">Loading Terrafusion...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <SimplifiedLanding onUserTypeSelect={handleUserTypeSelect} />;
  }

  // Show main app for returning users
  return <>{children}</>;
};

export default OnboardingManager;
