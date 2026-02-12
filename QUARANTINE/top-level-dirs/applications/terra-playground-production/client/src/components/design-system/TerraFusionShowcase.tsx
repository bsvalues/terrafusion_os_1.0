import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  SplashScreen,
  AuthModal,
  NotificationToast,
  DashboardCard,
} from '@/components/ui/terrafusion';
import { BarChart3, Users, Activity, Database  } from '@mui/icons-material';

export default function TerraFusionShowcase() {
  const [showSplash, setShowSplash] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [activeTab, setActiveTab] = useState<string>('splash');

  const handleShowToast = (type: 'success' | 'error' | 'info') => {
    setToastType(type);
    setShowToast(true);
  };

  const renderComponent = () => {
    switch (activeTab) {
      case 'splash':
        return showSplash ? (
          <SplashScreen moduleName="Property Assessment" onComplete={() => setShowSplash(false)} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-tf-dark-blue rounded-lg"><>

            <h2 className="text-xl font-bold mb-4 text-white">Module Splash Screen</h2>
            <Button
</>
              onClick={() => setShowSplash(true)}
              className="bg-tf-primary hover:bg-tf-secondary text-tf-dark-blue"
            >
              Show Splash Screen
            </Button>
          </div>
        );
      case 'auth':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-tf-dark-blue rounded-lg"><>

            <h2 className="text-xl font-bold mb-4 text-white">Auth / Login Modal</h2>
            <Button
</>
              onClick={() => setShowAuth(true)}
              className="bg-tf-primary hover:bg-tf-secondary text-tf-dark-blue"
            >
              Show Auth Modal
            </Button>
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
              onSubmit={(email, password) => {
                setShowAuth(false);
                handleShowToast('success');
              }}
            />
          </div>
        );
      case 'toast':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-tf-dark-blue rounded-lg"><>

            <h2 className="text-xl font-bold mb-4 text-white">Notification Toast</h2>
            <div
</> className="flex space-x-3 mb-8"><>

              <Button
                onClick={() => handleShowToast('success')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Success Toast
              </Button>
              <Button
</>
                onClick={() => handleShowToast('error')}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Error Toast
              </Button>
              <Button
                onClick={() => handleShowToast('info')}
                className="bg-tf-primary hover:bg-tf-secondary text-tf-dark-blue"
              >
                Info Toast
              </Button>
            </div>
            {showToast && (
              <NotificationToast
                type={toastType}
                title={
                  toastType === 'success'
                    ? 'Success!'
                    : toastType === 'error'
                      ? 'Error'
                      : 'Information'
                }
                message={
                  toastType === 'success'
                    ? 'Operation completed successfully!'
                    : toastType === 'error'
                      ? 'An error occurred while processing your request.'
                      : "Here's some important information for you."
                }
                onClose={() => setShowToast(false)}
              />
            )}
          </div>
        );
      case 'dashboard':
        return (
          <div className="p-8 bg-tf-dark-blue rounded-lg"><>

            <h2 className="text-xl font-bold mb-6 text-white">Analytics Dashboard Cards</h2>
            <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard
                title="System Uptime"
                metric="98.7%"
                description="Last 30 days"
                trend={{ value: 2.4, isPositive: true }}
                icon={<Activity size={20} />}
              />
              <DashboardCard
                title="Active Users"
                metric="1,245"
                description="Current sessions"
                trend={{ value: 12.7, isPositive: true }}
                icon={<Users size={20} />}
              />
              <DashboardCard
                title="Database Load"
                metric="42%"
                description="Average CPU usage"
                trend={{ value: 5.3, isPositive: false }}
                icon={<Database size={20} />}
              />
              <DashboardCard
                title="Daily Assessments"
                metric="376"
                description="Completed today"
                trend={{ value: 8.9, isPositive: true }}
                icon={<BarChart3 size={20} />}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-tf-dark-blue">
      <header className="bg-tf-dark-blue border-b border-tf-primary/20 p-6 flex items-center">
        <div className="w-10 h-10 mr-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-tf-primary"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Terrafusion Design System</h1>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'splash', label: 'Splash Screen' },
            { id: 'auth', label: 'Auth Modal' },
            { id: 'toast', label: 'Toast' },
            { id: 'dashboard', label: 'Dashboard Cards' },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'bg-tf-primary text-tf-dark-blue hover:bg-tf-secondary'
                  : 'text-tf-primary border-tf-primary/30 hover:bg-tf-primary/10 hover:text-tf-primary'
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="mt-8">{renderComponent()}</div>
      </main>
    </div>
  );
}
