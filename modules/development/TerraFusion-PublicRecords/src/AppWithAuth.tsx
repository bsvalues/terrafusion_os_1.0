import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Brain, Globe, TrendingUp, Warning, 
  User, LogIn, FileText, Bell, Shield, Menu, X
 } from '@mui/icons-material';
import { InstantSearch } from './components/InstantSearch';
import { CountyPulse } from './components/CountyPulse';
import { AIInsights } from './components/AIInsights';
import { CompetitorMigration } from './components/CompetitorMigration';
import { ShockAndAwe } from './components/ShockAndAwe';
import { UserAuth } from './components/UserAuth';
import { UserDashboard } from './components/UserDashboard';
import { PermitApplication } from './components/PermitApplication';
import { TransparencyDashboard } from './components/TransparencyDashboard';
import { DocumentViewer } from './components/DocumentViewer';
import { PaymentProcessor } from './components/PaymentProcessor';
import { BentonCountyData } from './data/bentonCounty';
import PublicPortal from './PublicPortal';

interface CountyStatus {
  indexed: number;
  savings: string;
  violations: number;
  efficiency: number;
  lastUpdate: Date;
}

const AppWithAuth: React.FC = () => {
  const [countyStatus, setCountyStatus] = useState<CountyStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMigration, setShowMigration] = useState(false);
  const [aiDiscoveries, setAiDiscoveries] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showPermitApp, setShowPermitApp] = useState(false);
  const [showDocument, setShowDocument] = useState<any>(null);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'government' | 'public' | 'transparency'>('government');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // DEV MODE - Auto-login for development
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev && !localStorage.getItem('tfpr_dev_disabled')) {
      // Auto-create dev user
      const devUser = {
        id: 'dev-user-001',
        email: 'dev@terrafusion.gov',
        name: 'Dev User',
        type: 'government', // Give dev user government access
        address: '123 Dev Street, Kennewick, WA',
        phone: '(509) 555-0100',
        verified: true,
        permissions: ['admin', 'approve', 'review', 'dev'],
        savedSearches: [],
        applications: [],
        notifications: [
          { id: '1', message: 'Dev mode active - All features unlocked', unread: true }
        ]
      };
      
      setCurrentUser(devUser);
      localStorage.setItem('tfpr_user', JSON.stringify(devUser));
      localStorage.setItem('tfpr_session', Date.now().toString());
      console.log('🚀 Dev mode active - Auto-logged in as:', devUser.name);
    } else {
      // Normal session check
      const savedUser = localStorage.getItem('tfpr_user');
      const sessionTime = localStorage.getItem('tfpr_session');
      
      if (savedUser && sessionTime) {
        const sessionAge = Date.now() - parseInt(sessionTime);
        if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hour session
          setCurrentUser(JSON.parse(savedUser));
        } else {
          localStorage.removeItem('tfpr_user');
          localStorage.removeItem('tfpr_session');
        }
      }
    }
    
    // Simulate instant activation
    setTimeout(() => {
      setCountyStatus({
        indexed: BentonCountyData.statistics.totalParcels * 12,
        savings: BentonCountyData.budgetImpact.annualSavings,
        violations: BentonCountyData.aiDiscoveries.length * 3,
        efficiency: 94.2,
        lastUpdate: new Date()
      });
      
      setAiDiscoveries(BentonCountyData.aiDiscoveries.slice(0, 3));
      
      // Load notifications
      setNotifications([
        { id: '1', message: 'New permit approved for 123 Main St', type: 'success', unread: true },
        { id: '2', message: '3 properties match your saved search', type: 'info', unread: true },
        { id: '3', message: 'Building inspection scheduled for tomorrow', type: 'alert', unread: false }
      ]);
    }, 100);
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setShowAuth(false);
    if (user.type === 'government') {
      setViewMode('government');
    }
    
    // Show success notification
    const newNotif = {
      id: Date.now().toString(),
      message: `Welcome back, ${user.name}!`,
      type: 'success',
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowDashboard(false);
    localStorage.removeItem('tfpr_user');
    localStorage.removeItem('tfpr_session');
  };

  const handlePermitSubmit = (application: any) => {
    console.log('Permit submitted:', application);
    setShowPermitApp(false);
    
    // Show success notification
    const newNotif = {
      id: Date.now().toString(),
      message: `Permit application ${application.id} submitted successfully!`,
      type: 'success',
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Show user dashboard ONLY if explicitly requested
  if (showDashboard && currentUser) {
    return (
      <div>
        {/* Add back button to main app */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
          <div className="container mx-auto px-4 flex items-center justify-between"><>

            <button
              onClick={() => setShowDashboard(false)}
              className="flex items-center gap-2 hover:underline"
            >
              ← Back to Main App
            </button>
            <span
</>
className="text-sm">Dev Mode Active</span>
          </div>
        </div>
        <UserDashboard user={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  // Show public portal view
  if (viewMode === 'public') {
    return (
      <div>
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setViewMode('government')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Government Portal
                </button>
              </div>
              <div className="flex items-center gap-4">
                {currentUser ? (
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline">{currentUser.name}</span>
                    </button>
                    <button className="relative p-2">
                      <Bell className="w-5 h-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </button>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className="pt-16">
          <PublicPortal />
        </div>
      </div>
    );
  }

  // Show transparency dashboard
  if (viewMode === 'transparency') {
    return (
      <div>
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setViewMode('government')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Government Portal
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="pt-16">
          <TransparencyDashboard />
        </div>
      </div>
    );
  }

  // Government Portal (default view)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Navigation Bar */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and View Switcher */}
            <div className="flex items-center gap-6"><>

              <h1 className="text-xl font-bold text-white">Terrafusion</h1>
              <div
</>
className="hidden md:flex items-center gap-2"><>

                <button
                  onClick={() => setViewMode('government')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === 'government' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Government
                </button>
                <button
</>

                  onClick={() => setViewMode('public')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === 'public' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Public Portal
                </button>
                <button
                  onClick={() => setViewMode('transparency')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewMode === 'transparency' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Live Data
                </button>
              </div>
            </div>

            {/* Right side - User Actions */}
            <div className="flex items-center gap-4">
              {currentUser ? (
                  <button
                    onClick={() => setShowPermitApp(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  ><>

                    <FileText className="w-4 h-4" />
                    Apply for Permit
                  </button>
                  <button
</>

                    onClick={() => setShowDashboard(true)}
                    className="flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{currentUser.name}</span>
                  </button>
                  <button className="relative p-2 text-white/90 hover:text-white">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>
                  {currentUser.type === 'government' && (
                    <div title="Government Employee">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Register
                </button>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden py-4 border-t border-white/10"
              >
                <div className="flex flex-col gap-2"><>

                  <button
                    onClick={() => { setViewMode('public'); setMobileMenuOpen(false); }}
                    className="text-left px-3 py-2 text-white/90 hover:text-white"
                  >
                    Public Portal
                  </button>
                  <button
</>

                    onClick={() => { setViewMode('transparency'); setMobileMenuOpen(false); }}
                    className="text-left px-3 py-2 text-white/90 hover:text-white"
                  >
                    Live Data Dashboard
                  </button>
                  {currentUser && (
                    <button
                      onClick={() => { setShowPermitApp(true); setMobileMenuOpen(false); }}
                      className="text-left px-3 py-2 text-white/90 hover:text-white"
                    >
                      Apply for Permit
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Dev Mode Indicator */}
      {currentUser?.permissions?.includes('dev') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 text-center text-sm"
        >
          <span className="font-bold">🚀 DEV MODE</span> • 
          <span> Logged in as: {currentUser.name}</span> • 
          <span> All features unlocked</span> • 
          <button
            onClick={() => setShowDashboard(true)}
            className="underline hover:no-underline ml-2"
          >
            Dashboard
          </button>
          • 
          <button
            onClick={() => setShowPermitApp(true)}
            className="underline hover:no-underline ml-2"
          >
            Test Permit App
          </button>
          • 
          <button
            onClick={() => setShowDocument({ 
              id: 'DOC-001', 
              name: 'Sample Building Permit.pdf', 
              type: 'permit',
              size: 245000 
            })}
            className="underline hover:no-underline ml-2"
          >
            Test Document Viewer
          </button>
          • 
          <button
            onClick={() => setShowPayment({ 
              amount: 450, 
              description: 'Building Permit Fee' 
            })}
            className="underline hover:no-underline ml-2"
          >
            Test Payment
          </button>
          • 
          <button
            onClick={() => {
              localStorage.setItem('tfpr_dev_disabled', 'true');
              window.location.reload();
            }}
            className="underline hover:no-underline ml-2"
          >
            Disable Dev Mode
          </button>
        </motion.div>
      )}

      {/* Welcome Message for Regular Users */}
      {currentUser && !currentUser.permissions?.includes('dev') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 text-center"
        ><>

          <span>Welcome back, {currentUser.name}! </span>
          <button
</>

            onClick={() => setShowDashboard(true)}
            className="underline hover:no-underline"
          >
            Go to your dashboard →
          </button>
        </motion.div>
      )}

      {/* The Shock Banner */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <Zap className="w-6 h-6 animate-pulse" /><>

          <span className="text-lg font-bold">
            BENTON COUNTY, WA IS ALREADY INDEXED • {countyStatus?.indexed.toLocaleString()} RECORDS READY • 
            ${countyStatus?.savings} IN ANNUAL SAVINGS IDENTIFIED
          </span>
          <Zap
</>
className="w-6 h-6 animate-pulse" />
        </div>
      </motion.div>

      {/* Main Header */}
      <header className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        ><>

          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Terrafusion Public Records - Benton County
          </h1>
          <p
</>
className="text-2xl text-purple-200">
            {BentonCountyData.statistics.totalParcels.toLocaleString()} parcels • {BentonCountyData.county.population.toLocaleString()} citizens • Already indexed.
          </p>
          <div className="mt-6 flex justify-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
            ><>

              <div className="text-3xl font-bold text-white">0.001s</div>
              <div
</>
className="text-sm text-purple-200">Search Speed</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
            ><>

              <div className="text-3xl font-bold text-white">379M×</div>
              <div
</>
className="text-sm text-purple-200">Faster than Legacy</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
            ><>

              <div className="text-3xl font-bold text-white">$0</div>
              <div
</>
className="text-sm text-purple-200">Installation Cost</div>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* Quick Actions for Users */}
      {currentUser && (
        <section className="container mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
          ><>

            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div
</>
className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowPermitApp(true)}
                className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
              >
                <FileText className="w-8 h-8 mb-2 mx-auto" />
                <div className="text-sm">Apply for Permit</div>
              </button>
              <button
                onClick={() => setShowDashboard(true)}
                className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
              >
                <User className="w-8 h-8 mb-2 mx-auto" />
                <div className="text-sm">My Dashboard</div>
              </button>
              <button
                onClick={() => setViewMode('public')}
                className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
              >
                <Search className="w-8 h-8 mb-2 mx-auto" />
                <div className="text-sm">Search Records</div>
              </button>
              <button
                onClick={() => setViewMode('transparency')}
                className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"
              >
                <TrendingUp className="w-8 h-8 mb-2 mx-auto" />
                <div className="text-sm">Live Data</div>
              </button>
            </div>
          </motion.div>
        </section>
      )}

      {/* The One Search Box */}
      <section className="container mx-auto px-4 py-8">
        <InstantSearch 
          onSearch={setSearchQuery}
          recordCount={countyStatus?.indexed || 0}
        />
      </section>

      {/* AI Discoveries */}
      {aiDiscoveries.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><>

              <Brain className="w-8 h-8 text-purple-400" />
              AI Already Found These Issues
            </h2>
            <AIInsights
</>
discoveries={aiDiscoveries} />
          </motion.div>
        </section>
      )}

      {/* County Pulse Visualization */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><>

            <Globe className="w-8 h-8 text-blue-400" />
            Your County's Real-Time Pulse
          </h2>
          <CountyPulse
</>
/>
        </motion.div>
      </section>

      {/* Competitor Migration Tool */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-xl p-8 backdrop-blur-sm"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><>

            <Warning className="w-8 h-8 text-yellow-400" />
            Migrate from Legacy CAMA Systems Now
          </h2>
          <p
</>
className="text-xl text-white/80 mb-6">
            Migration completes in 60 seconds. During their next sales call.
          </p>
          <button
            onClick={() => setShowMigration(true)}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:scale-105 transition-transform"
          >
            START MIGRATION NOW
          </button>
        </motion.div>
      </section>

      {/* Migration Modal */}
      <AnimatePresence>
        {showMigration && (
          <CompetitorMigration onClose={() => setShowMigration(false)} />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <UserAuth onLogin={handleLogin} onClose={() => setShowAuth(false)} />
        )}
      </AnimatePresence>

      {/* Permit Application Modal */}
      <AnimatePresence>
        {showPermitApp && (
          <PermitApplication 
            user={currentUser}
            onClose={() => setShowPermitApp(false)}
            onSubmit={handlePermitSubmit}
          />
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {showDocument && (
          <DocumentViewer 
            document={showDocument}
            onClose={() => setShowDocument(null)}
            onExtractText={(text) => {
              console.log('Extracted text:', text);
              // Could auto-fill forms with extracted text
            }}
          />
        )}
      </AnimatePresence>

      {/* Payment Processor Modal */}
      <AnimatePresence>
        {showPayment && (
          <PaymentProcessor 
            amount={showPayment.amount}
            description={showPayment.description}
            applicationId={showPayment.applicationId}
            onSuccess={(payment) => {
              console.log('Payment successful:', payment);
              setShowPayment(null);
              // Show success notification
              const newNotif = {
                id: Date.now().toString(),
                message: `Payment of $${payment.amount.toFixed(2)} processed successfully!`,
                type: 'success',
                unread: true
              };
              setNotifications(prev => [newNotif, ...prev]);
            }}
            onCancel={() => setShowPayment(null)}
          />
        )}
      </AnimatePresence>

      {/* The Bottom Line */}
      <footer className="container mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        ><>

          <p className="text-2xl text-purple-200 mb-4">
            Your competitors are still writing RFPs.
          </p>
          <p
</>
className="text-3xl font-bold text-white">
            We've already won.
          </p>
          <div className="mt-8 text-sm text-purple-300">
            Terrafusion • Government. Transcended. • No Permission Needed
          </div>
        </motion.div>
      </footer>

      {/* Shock and Awe Demo Trigger */}
      <ShockAndAwe />
    </div>
  );
};

export default AppWithAuth;