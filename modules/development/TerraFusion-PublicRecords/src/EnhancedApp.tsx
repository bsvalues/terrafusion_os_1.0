import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Bell, FileText, CreditCard, Home, Calendar,
  DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp,
  Download, Upload, Eye, Brain, Zap, Shield, LogOut, X,
  ChevronRight, MapPin, Phone, Mail, Building, Star
 } from '@mui/icons-material';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  type: 'citizen' | 'government';
  permissions: string[];
}

interface Application {
  id: string;
  type: string;
  status: 'draft' | 'submitted' | 'review' | 'approved' | 'rejected';
  address: string;
  date: Date;
  fee: number;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  date: Date;
}

const EnhancedApp: React.FC = () => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'permit' | 'search' | 'documents'>('home');
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<string>('');

  // Auto-login for dev mode
  useEffect(() => {
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
      const devUser: User = {
        id: 'dev-001',
        name: 'Dev User',
        email: 'dev@terrafusion.gov',
        type: 'government',
        permissions: ['admin', 'dev', 'approve']
      };
      setUser(devUser);
      localStorage.setItem('tfpr_user', JSON.stringify(devUser));
      
      // Load sample data
      loadSampleData();
    } else {
      const saved = localStorage.getItem('tfpr_user');
      if (saved) {
        setUser(JSON.parse(saved));
        loadUserData();
      }
    }
  }, []);

  const loadSampleData = () => {
    setApplications([
      {
        id: 'APP-001',
        type: 'Building Permit',
        status: 'review',
        address: '123 Main St, Kennewick',
        date: new Date('2024-01-10'),
        fee: 450
      },
      {
        id: 'APP-002',
        type: 'Business License',
        status: 'approved',
        address: '456 Commerce Ave',
        date: new Date('2024-01-05'),
        fee: 125
      }
    ]);

    setNotifications([
      { id: '1', message: 'Permit APP-001 under review', unread: true },
      { id: '2', message: 'Payment received for APP-002', unread: false }
    ]);
  };

  const loadUserData = () => {
    const apps = localStorage.getItem('tfpr_applications');
    if (apps) setApplications(JSON.parse(apps));
    
    const notifs = localStorage.getItem('tfpr_notifications');
    if (notifs) setNotifications(JSON.parse(notifs));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Simulate search results
    const results: SearchResult[] = [
      {
        id: '1',
        type: 'permit',
        title: `Building Permit - ${query}`,
        description: 'Construction permit for residential property',
        date: new Date()
      },
      {
        id: '2',
        type: 'property',
        title: `Property Record - ${query}`,
        description: 'Parcel information and tax records',
        date: new Date()
      },
      {
        id: '3',
        type: 'document',
        title: `Public Document - ${query}`,
        description: 'City council meeting minutes',
        date: new Date()
      }
    ];
    setSearchResults(results);
    setCurrentView('search');
  };

  const submitPermitApplication = (permitType: string, formData: any) => {
    const newApp: Application = {
      id: `APP-${Date.now()}`,
      type: permitType,
      status: 'submitted',
      address: formData.address,
      date: new Date(),
      fee: calculatePermitFee(permitType)
    };

    const updatedApps = [...applications, newApp];
    setApplications(updatedApps);
    localStorage.setItem('tfpr_applications', JSON.stringify(updatedApps));

    // Add notification
    const notif = {
      id: Date.now().toString(),
      message: `${permitType} application submitted!`,
      unread: true
    };
    setNotifications([notif, ...notifications]);

    // Show payment screen
    setShowPayment(true);
  };

  const calculatePermitFee = (type: string): number => {
    const fees: Record<string, number> = {
      'Building Permit': 450,
      'Electrical Permit': 200,
      'Plumbing Permit': 175,
      'Fence Permit': 125,
      'Deck Permit': 250
    };
    return fees[type] || 100;
  };

  const processPayment = (amount: number) => {
    console.log(`Processing payment of $${amount}`);
    setShowPayment(false);
    alert(`Payment of $${amount} processed successfully!`);
    setCurrentView('dashboard');
  };

  // Components
  const Header = () => (
    <header className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4"><>

            <h1 
              className="text-2xl font-bold cursor-pointer"
              onClick={() => setCurrentView('home')}
            >
              Terrafusion
            </h1>
            <nav
</> className="hidden md:flex gap-4"><>

              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-1 rounded ${currentView === 'home' ? 'bg-white/20' : ''}`}
              >
                Home
              </button>
              <button
</>
                onClick={() => setCurrentView('search')}
                className={`px-3 py-1 rounded ${currentView === 'search' ? 'bg-white/20' : ''}`}
              >
                Search
              </button>
              <button
                onClick={() => setCurrentView('permit')}
                className={`px-3 py-1 rounded ${currentView === 'permit' ? 'bg-white/20' : ''}`}
              >
                Permits
              </button>
              {user && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-1 rounded ${currentView === 'dashboard' ? 'bg-white/20' : ''}`}
                >
                  Dashboard
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="relative p-2">
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => n.unread).length > 0 && (<>

                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
                <div
</> className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    setUser(null);
                    localStorage.removeItem('tfpr_user');
                    setCurrentView('home');
                  }}
                  className="p-2"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  const HomePage = () => (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      ><>

        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Benton County Public Records
        </h1>
        <p
</> className="text-xl text-gray-600">
          94,149 parcels • 206,873 citizens • Everything indexed
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search permits, properties, documents..."
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {[
          { icon: FileText, label: 'Apply for Permit', action: () => setCurrentView('permit') },
          { icon: Search, label: 'Search Records', action: () => setCurrentView('search') },
          { icon: CreditCard, label: 'Pay Fees', action: () => setShowPayment(true) },
          { icon: Calendar, label: 'Schedule Inspection', action: () => alert('Coming soon!') }
        ].map((item, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            onClick={item.action}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <item.icon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">{item.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-12">
        <div className="text-center"><>

          <div className="text-3xl font-bold text-purple-600">0.001s</div>
          <div
</> className="text-gray-600">Search Speed</div>
        </div>
        <div className="text-center"><>

          <div className="text-3xl font-bold text-purple-600">379M×</div>
          <div
</> className="text-gray-600">Faster</div>
        </div>
        <div className="text-center"><>

          <div className="text-3xl font-bold text-purple-600">$0</div>
          <div
</> className="text-gray-600">Setup Cost</div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Applications', value: applications.length, color: 'blue' },
          { label: 'In Review', value: applications.filter(a => a.status === 'review').length, color: 'yellow' },
          { label: 'Approved', value: applications.filter(a => a.status === 'approved').length, color: 'green' },
          { label: 'Total Fees', value: `$${applications.reduce((sum, a) => sum + a.fee, 0)}`, color: 'purple' }
        ].map((stat, i) => (
          <div key={i} className={`bg-${stat.color}-50 p-6 rounded-xl`}><>

            <p className={`text-${stat.color}-900 font-semibold`}>{stat.label}</p>
            <p
</> className={`text-3xl font-bold text-${stat.color}-600 mt-2`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-lg p-6"><>

        <h3 className="text-xl font-semibold text-gray-900 mb-4">My Applications</h3>
        <div
</> className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="font-semibold text-gray-900">{app.type}</p>
                  <p
</> className="text-sm text-gray-600">
                    {app.address} • {app.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right"><>

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                    app.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                  <p
</> className="text-sm text-gray-600 mt-1">${app.fee}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PermitView = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      permitType: '',
      address: '',
      description: '',
      value: ''
    });

    const permitTypes = [
      { id: 'building', name: 'Building Permit', fee: 450 },
      { id: 'electrical', name: 'Electrical Permit', fee: 200 },
      { id: 'plumbing', name: 'Plumbing Permit', fee: 175 },
      { id: 'fence', name: 'Fence Permit', fee: 125 },
      { id: 'deck', name: 'Deck Permit', fee: 250 }
    ];

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Apply for Permit</h2>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > s ? <CheckCircle className="w-6 h-6" /> : s}
              </div>
              {s < 3 && <div className={`w-32 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div><>

              <h3 className="text-xl font-semibold mb-6">Select Permit Type</h3>
              <div
</> className="space-y-3">
                {permitTypes.map((permit) => (
                  <button
                    key={permit.id}
                    onClick={() => {
                      setFormData({ ...formData, permitType: permit.name });
                      setSelectedPermit(permit.name);
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      formData.permitType === permit.name
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between"><>

                      <span className="font-semibold">{permit.name}</span>
                      <span
</> className="text-gray-600">${permit.fee}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.permitType}
                className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div><>

              <h3 className="text-xl font-semibold mb-6">Property Information</h3>
              <div
</> className="space-y-4">
                <div><>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address
                  </label>
                  <input
</>
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="123 Main St, Kennewick, WA"
                  />
                </div>
                <div><>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <textarea
</>
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe your project..."
                  />
                </div>
                <div><>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Project Value
                  </label>
                  <input
</>
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6"><>

                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
</>
                  onClick={() => setStep(3)}
                  disabled={!formData.address || !formData.description}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div><>

              <h3 className="text-xl font-semibold mb-6">Review & Submit</h3>
              <div
</> className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between"><>

                  <span className="text-gray-600">Permit Type:</span>
                  <span
</> className="font-semibold">{formData.permitType}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-gray-600">Property:</span>
                  <span
</> className="font-semibold">{formData.address}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-gray-600">Project Value:</span>
                  <span
</> className="font-semibold">${formData.value}</span>
                </div>
                <div className="flex justify-between pt-3 border-t"><>

                  <span className="text-gray-600">Permit Fee:</span>
                  <span
</> className="font-bold text-lg">${calculatePermitFee(formData.permitType)}</span>
                </div>
              </div>
              <div className="flex gap-4 mt-6"><>

                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
</>
                  onClick={() => {
                    submitPermitApplication(formData.permitType, formData);
                    alert('Application submitted! Redirecting to payment...');
                  }}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SearchView = () => (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Search Results</h2>
      
      {searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((result) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div><>

                  <h3 className="text-xl font-semibold text-gray-900">{result.title}</h3>
                  <p
</> className="text-gray-600 mt-1">{result.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {result.date.toLocaleDateString()} • Type: {result.type}
                  </p>
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No results found. Try searching for something.</p>
        </div>
      )}
    </div>
  );

  const LoginModal = () => (
    <AnimatePresence>
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full"
          ><>

            <h2 className="text-2xl font-bold mb-6">Sign In</h2>
            <div
</> className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border rounded-lg"
              /><>

              <button
                onClick={() => {
                  const newUser: User = {
                    id: Date.now().toString(),
                    name: 'John Doe',
                    email: 'john@example.com',
                    type: 'citizen',
                    permissions: []
                  };
                  setUser(newUser);
                  localStorage.setItem('tfpr_user', JSON.stringify(newUser));
                  setShowLogin(false);
                }}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Sign In
              </button>
              <button
</>
                onClick={() => setShowLogin(false)}
                className="w-full py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const PaymentModal = () => (
    <AnimatePresence>
      {showPayment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full"
          ><>

            <h2 className="text-2xl font-bold mb-6">Payment</h2>
            <div
</> className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg"><>

                <p className="text-gray-600">Amount Due:</p>
                <p
</> className="text-3xl font-bold text-gray-900">
                  ${selectedPermit ? calculatePermitFee(selectedPermit) : 100}
                </p>
              </div>
              <input
                type="text"
                placeholder="Card Number"
                className="w-full px-4 py-3 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="px-4 py-3 border rounded-lg"
                /><>

                <input
                  type="text"
                  placeholder="CVV"
                  className="px-4 py-3 border rounded-lg"
                />
              </div>
              <button
</>
                onClick={() => {
                  processPayment(selectedPermit ? calculatePermitFee(selectedPermit) : 100);
                }}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Pay Now
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="w-full py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dev Mode Bar */}
      {user?.permissions?.includes('dev') && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 text-center text-sm">
          <span className="font-bold">🚀 DEV MODE</span> • 
          All features unlocked • 
          <button onClick={() => setCurrentView('dashboard')} className="underline ml-2">
            Dashboard
          </button>
        </div>
      )}

      <Header />

      <main>
        {currentView === 'home' && <HomePage />}
        {currentView === 'dashboard' && user && <DashboardView />}
        {currentView === 'permit' && <PermitView />}
        {currentView === 'search' && <SearchView />}
      </main>

      <LoginModal />
      <PaymentModal />

      {/* Notifications Toast */}
      <AnimatePresence>
        {notifications.filter(n => n.unread).slice(0, 3).map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 bg-white rounded-lg shadow-lg p-4"
            style={{ top: `${80 + i * 70}px` }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" /><>

              <p className="text-sm">{notif.message}</p>
              <button
</>
                onClick={() => {
                  setNotifications(notifications.map(n => 
                    n.id === notif.id ? { ...n, unread: false } : n
                  ));
                }}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedApp;