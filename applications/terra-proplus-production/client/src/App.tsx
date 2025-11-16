import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Comparables from './pages/Comparables';
import MarketData from './pages/MarketData';
import Settings from './pages/Settings';
import EnhancedAppraisalDashboard from './pages/EnhancedAppraisalDashboard';
import Appraisals from './pages/Appraisals';

// Active navigation indicator component
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <Link 
      to={to} 
      className={`px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white font-medium' 
          : 'text-gray-800 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
};

// App Layout component with navigation
const AppLayout = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-700">Terrafusion Professional</h1>
              </div>
              <nav className="ml-6 flex space-x-2 items-center"><>

                <NavLink to="/">Dashboard</NavLink>
                <NavLink
</> to="/properties">Properties</NavLink><>

                <NavLink to="/appraisals">Appraisals</NavLink>
                <NavLink
</> to="/comparables">Comparables</NavLink><>

                <NavLink to="/market-data">Market Data</NavLink>
                <NavLink
</> to="/settings">Settings</NavLink>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative flex items-center space-x-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <span className="text-sm font-medium leading-none text-white">JD</span>
                </span>
                <span className="text-sm font-medium">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {location.pathname === "/" && (
            <div className="pb-5 border-b border-gray-200 mb-5"><>

              <h2 className="text-2xl font-bold leading-tight text-gray-900">Dashboard</h2>
              <p
</> className="mt-1 text-sm text-gray-500">Manage your real estate appraisal processes</p>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/appraisals" element={<Appraisals />} />
            <Route path="/appraisals/:id" element={<EnhancedAppraisalDashboard />} />
            <Route path="/comparables" element={<Comparables />} />
            <Route path="/market-data" element={<MarketData />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}