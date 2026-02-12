'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  useEffect(() => {
    if (window.electron) {
      window.electron.send('app-ready');
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white">Terrafusion Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 shadow-lg"
          >
<>
            <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
            <div
</> className="space-y-4">
              <div className="flex justify-between items-center">
<>
                <span className="text-gray-400">Active Projects</span>
                <span
</> className="text-white font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
<>
                <span className="text-gray-400">Completed Tasks</span>
                <span
</> className="text-white font-medium">48</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6 shadow-lg"
          >
<>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div
</> className="space-y-4">
              <div className="text-gray-400">
<>
                <p>Project "City Center" updated</p>
                <p
</> className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <div className="text-gray-400">
<>
                <p>New task assigned</p>
                <p
</> className="text-sm text-gray-500">4 hours ago</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 shadow-lg"
          >
<>
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div
</> className="space-y-4">
<>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                New Project
              </button>
              <button
</> className="w-full bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
                View Reports
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 