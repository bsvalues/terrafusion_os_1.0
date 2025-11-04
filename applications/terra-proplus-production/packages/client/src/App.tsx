import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar toggleSidebar={toggleSidebar} />
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          
          <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
            <div className="p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/deployments" element={<div>Deployments Page</div>} />
                <Route path="/pipelines" element={<div>Pipelines Page</div>} />
                <Route path="/monitoring" element={<div>Monitoring Page</div>} />
                <Route path="/settings" element={<div>Settings Page</div>} />
                <Route path="*" element={<div>Page Not Found</div>} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;