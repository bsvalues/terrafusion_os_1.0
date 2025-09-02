import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Bell, User, Camera, Mic, MapPin, 
  FileText, Calendar, DollarSign, AlertCircle, 
  CheckCircle, Clock, TrendingUp, Sparkles, ArrowRight 
 } from '@mui/icons-material';

interface MobileViewProps {
  onSearch?: (query: string) => void;
}

export const CitizenMobile: React.FC<MobileViewProps> = ({ onSearch }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate push notifications
    setNotifications([
      {
        id: '1',
        type: 'urgent',
        title: 'Bulk Trash Tomorrow',
        message: 'Put items curbside by 7 AM',
        time: '2 min ago',
        icon: '🗑️'
      },
      {
        id: '2',
        type: 'info',
        title: 'Permit Approved!',
        message: 'Your deck permit #2024-1892 approved',
        time: '1 hour ago',
        icon: '✅'
      },
      {
        id: '3',
        type: 'alert',
        title: 'Water Service',
        message: 'Maintenance on your street Tuesday',
        time: '3 hours ago',
        icon: '💧'
      }
    ]);

    // Smart quick actions based on user history
    setQuickActions([
      { icon: '🏠', label: 'Check Permit', subtext: 'Status: In Review' },
      { icon: '💰', label: 'Pay Water Bill', subtext: 'Due in 5 days' },
      { icon: '📅', label: 'Council Meeting', subtext: 'Tonight 7 PM' },
      { icon: '🐕', label: 'Renew Pet License', subtext: 'Expires next month' }
    ]);
  }, []);

  const handleVoiceSearch = () => {
    setIsVoiceActive(true);
    // Implement voice recognition
    setTimeout(() => {
      setSearchQuery("When is bulk trash pickup?");
      setIsVoiceActive(false);
      if (onSearch) onSearch("When is bulk trash pickup?");
    }, 2000);
  };

  const handlePhotoSearch = () => {
    // In production, this would open camera
    alert('Camera would open - take photo of building to see all permits');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Status Bar - Make it feel native */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
        <div className="flex justify-between items-center text-xs"><>

          <span>9:41 AM</span>
          <span
</>
</>>Terrafusion</span>
          <div className="flex gap-1"><>

            <span>5G</span>
            <span
</>
</>>100%</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4"
          >
            {/* Header */}
            <div className="mb-6"><>

              <h1 className="text-2xl font-bold text-gray-900">
                Hi, Sarah 👋
              </h1>
              <p
</>
className="text-gray-600 mt-1">
                What do you need today?
              </p>
            </div>

            {/* The One Search Box */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl shadow-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-base outline-none"
                />
                <button onClick={handleVoiceSearch}><>

                  <Mic className={`w-5 h-5 ${isVoiceActive ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                </button>
                <button
</>
onClick={handlePhotoSearch}>
                  <Camera className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </motion.div>

            {/* Smart Quick Actions */}
            <div className="mb-6"><>

              <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
              <div
</>
className="grid grid-cols-2 gap-3">
                {quickActions.map((action /* , index */) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white rounded-xl p-4 shadow-md text-left"
                  ><>

                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div
</>
className="text-sm font-medium text-gray-900">
                      {action.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {action.subtext}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Proactive Insights */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><>

                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Found for You
              </h2>
              <motion
</>
</>.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2"><>

                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div
</>
className="flex-1"><>

                    <p className="text-sm font-medium text-gray-900">
                      You might qualify for property tax reduction
                    </p>
                    <p
</>
className="text-xs text-gray-600 mt-1">
                      Based on recent assessment changes
                    </p>
                    <button className="text-xs text-purple-600 font-medium mt-2">
                      Learn More →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Live County Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center"><>

                <div className="text-xl font-bold text-blue-600">3 min</div>
                <div
</>
className="text-xs text-gray-600">Wait time</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center"><>

                <div className="text-xl font-bold text-green-600">14</div>
                <div
</>
className="text-xs text-gray-600">Permits today</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center"><>

                <div className="text-xl font-bold text-purple-600">94%</div>
                <div
</>
className="text-xs text-gray-600">Satisfaction</div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          ><>

            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            
            <div
</>
className="space-y-3">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl p-4 shadow-md"
                >
                  <div className="flex items-start gap-3"><>

                    <div className="text-2xl">{notif.icon}</div>
                    <div
</>
className="flex-1"><>

                      <p className="font-medium text-gray-900">
                        {notif.title}
                      </p>
                      <p
</>
className="text-sm text-gray-600 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notif.time}
                      </p>
                    </div>
                    {notif.type === 'urgent' && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
            
            {/* Saved Searches */}
            <div className="bg-white rounded-xl p-4 shadow-md mb-4"><>

              <h2 className="font-medium mb-3">Saved Searches</h2>
              <div
</>
className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b"><>

                  <span className="text-sm">Permits on Main St</span>
                  <span
</>
className="text-xs text-blue-600">3 new</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b"><>

                  <span className="text-sm">Council meetings about parks</span>
                  <span
</>
className="text-xs text-gray-400">None</span>
                </div>
              </div>
            </div>

            {/* Your Properties */}
            <div className="bg-white rounded-xl p-4 shadow-md mb-4"><>

              <h2 className="font-medium mb-3">Your Properties</h2>
              <div
</>
className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><>

                    <p className="text-sm font-medium">123 Oak Street</p>
                    <p
</>
className="text-xs text-gray-500">Primary Residence</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl p-4 shadow-md"><>

              <h2 className="font-medium mb-3">Settings</h2>
              <div
</>
className="space-y-3">
                <div className="flex items-center justify-between"><>

                  <span className="text-sm">Push Notifications</span>
                  <div
</>
className="bg-green-500 rounded-full w-12 h-6 relative">
                    <div className="absolute right-1 top-1 bg-white rounded-full w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between"><>

                  <span className="text-sm">Location Services</span>
                  <div
</>
className="bg-green-500 rounded-full w-12 h-6 relative">
                    <div className="absolute right-1 top-1 bg-white rounded-full w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Native Feel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'notifications', icon: Bell, label: 'Alerts', badge: 3 },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{tab.label}</span>
              {tab.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Search Overlay */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Mic className="w-16 h-16 text-red-500 mx-auto mb-4" />
              </motion.div><>

              <p className="text-lg font-medium">Listening...</p>
              <p
</>
className="text-sm text-gray-500 mt-2">
                "When is bulk trash pickup?"
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};