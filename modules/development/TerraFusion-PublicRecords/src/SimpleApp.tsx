import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SimpleApp: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Auto-login for dev mode
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
      const devUser = {
        id: 'dev-user',
        name: 'Dev User',
        email: 'dev@terrafusion.gov',
        type: 'government',
        permissions: ['admin', 'dev']
      };
      setUser(devUser);
      localStorage.setItem('tfpr_user', JSON.stringify(devUser));
    } else {
      const saved = localStorage.getItem('tfpr_user');
      if (saved) setUser(JSON.parse(saved));
    }
  }, []);

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8"><>

              <h1 className="text-3xl font-bold">User Dashboard</h1>
              <button
</>
                onClick={() => setShowDashboard(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to App
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg"><>

                <h3 className="text-lg font-semibold text-blue-900">Applications</h3>
                <p
</> className="text-3xl font-bold text-blue-600 mt-2">5</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg"><>

                <h3 className="text-lg font-semibold text-green-900">Payments</h3>
                <p
</> className="text-3xl font-bold text-green-600 mt-2">$1,825</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg"><>

                <h3 className="text-lg font-semibold text-purple-900">Documents</h3>
                <p
</> className="text-3xl font-bold text-purple-600 mt-2">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Dev Mode Bar */}
      {user?.permissions?.includes('dev') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 text-center"
        >
          <span className="font-bold">🚀 DEV MODE ACTIVE</span> • 
          <span> {user.name}</span> • 
          <button
            onClick={() => setShowDashboard(true)}
            className="underline ml-4"
          >
            Dashboard
          </button>
          • 
          <button
            onClick={() => alert('Document Viewer Demo')}
            className="underline ml-4"
          >
            Test Document
          </button>
          • 
          <button
            onClick={() => alert('Payment Processor Demo')}
            className="underline ml-4"
          >
            Test Payment
          </button>
        </motion.div>
      )}

      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        ><>

          <h1 className="text-6xl font-bold text-white mb-4">
            Terrafusion Public Records
          </h1>
          <p
</> className="text-2xl text-purple-200">
            Benton County • 94,149 parcels • 206,873 citizens
          </p>
        </motion.div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        {/* Search Box */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <input
              type="text"
              placeholder="Search any public record..."
              className="w-full px-6 py-4 rounded-lg text-lg bg-white/90 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white"
          ><>

            <h3 className="text-xl font-bold mb-2">📝 Permit Applications</h3>
            <p
</> className="text-white/80">Apply for permits online with our 5-step wizard</p>
            <button className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30">
              Apply Now →
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white"
          ><>

            <h3 className="text-xl font-bold mb-2">💳 Payment Processing</h3>
            <p
</> className="text-white/80">Secure online payments for all fees and services</p>
            <button className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30">
              Pay Online →
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white"
          ><>

            <h3 className="text-xl font-bold mb-2">📄 Document Viewer</h3>
            <p
</> className="text-white/80">View documents with AI-powered OCR extraction</p>
            <button className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30">
              View Docs →
            </button>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-12">
          <div className="text-center"><>

            <div className="text-3xl font-bold text-white">0.001s</div>
            <div
</> className="text-sm text-purple-200">Search Speed</div>
          </div>
          <div className="text-center"><>

            <div className="text-3xl font-bold text-white">379M×</div>
            <div
</> className="text-sm text-purple-200">Faster than Legacy</div>
          </div>
          <div className="text-center"><>

            <div className="text-3xl font-bold text-white">$0</div>
            <div
</> className="text-sm text-purple-200">Installation Cost</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-12 text-purple-200"><>

        <p className="text-2xl mb-2">Your competitors are still writing RFPs.</p>
        <p
</> className="text-3xl font-bold text-white">We've already won.</p>
      </footer>
    </div>
  );
};

export default SimpleApp;