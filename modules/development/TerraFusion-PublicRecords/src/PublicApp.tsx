import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Smartphone, Monitor, Bell, BarChart, Search  } from '@mui/icons-material';
import PublicPortal from './PublicPortal';
import { CitizenMobile } from './components/CitizenMobile';
import { ProactiveNotifications } from './components/ProactiveNotifications';
import { TransparencyDashboard } from './components/TransparencyDashboard';

const PublicApp: React.FC = () => {
  const [view, setView] = useState<'portal' | 'mobile' | 'notifications' | 'dashboard'>('portal');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Auto-detect mobile
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If on mobile, show mobile view automatically
  if (isMobile && view === 'portal') {
    return <CitizenMobile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* View Selector Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-purple-600" />
              <div><>

                <h1 className="text-xl font-bold text-gray-900">
                  Terrafusion Public Access
                </h1>
                <p
</> className="text-sm text-gray-600">
                  Government that actually works for you
                </p>
              </div>
            </div>
            
            {/* View Switcher */}
            <div className="hidden md:flex items-center gap-2">
              {[
                { id: 'portal', icon: Monitor, label: 'Portal' },
                { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                { id: 'notifications', icon: Bell, label: 'Alerts' },
                { id: 'dashboard', icon: BarChart, label: 'Dashboard' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    view === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'portal' && (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PublicPortal />
          </motion.div>
        )}
        
        {view === 'mobile' && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto"
          >
            <CitizenMobile />
          </motion.div>
        )}
        
        {view === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProactiveNotifications />
          </motion.div>
        )}
        
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TransparencyDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Quick Access (Always Visible) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl"
          onClick={() => {
            // Open AI search directly
            const searchBox = document.querySelector('input[type="text"]');
            if (searchBox) {
              (searchBox as HTMLInputElement).focus();
            }
          }}
        >
          <Search className="w-6 h-6" />
        </motion.button>
        <div className="absolute -top-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
          Quick Search (⌘K)
        </div>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for quick search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              document.querySelector('input[type="text"]')?.focus();
            }
            // Cmd/Ctrl + / for help
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
              e.preventDefault();
              alert('Help: Just type what you need. We figure out the rest.');
            }
          });
        `
      }} />
    </div>
  );
};

export default PublicApp;