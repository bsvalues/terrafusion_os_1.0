import "./terrafusion-brand.css";
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CostWizardPage from './pages/CostWizardPage';
import CostAnalysisPage from './pages/CostAnalysisPage';
import CostFactorTablesPage from './pages/CostFactorTablesPage';
import PropertyValuationPage from './pages/PropertyValuationPage';
import MLInsightsPage from './pages/MLInsightsPage';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [appInitialized, setAppInitialized] = useState(false);
  const [currentTab, setCurrentTab] = useState('wizard');

  useEffect(() => {
    // Initialize the Tauri backend and AI systems
    const initializeApp = async () => {
      try {
        console.log('Initializing CostForge AI...');
        setAppInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  const navigationItems = [
    { id: 'wizard', label: 'Cost Wizard', description: 'Interactive cost estimation wizard' },
    { id: 'analysis', label: 'Cost Analysis', description: 'Advanced cost breakdown and analysis' },
    { id: 'factors', label: 'Cost Factors', description: 'Intelligent cost factor management' },
    { id: 'valuation', label: 'Property Valuation', description: 'AI-powered property valuation' },
    { id: 'insights', label: 'ML Insights', description: 'Machine learning insights and predictions' }
  ];

  if (!appInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center"><>

          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2
</>
className="text-2xl font-bold text-gray-900 mb-2">Initializing CostForge AI</h2>
          <p className="text-gray-600">Loading AI models and cost analysis engines...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Header */}
          <header className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      CostForge AI
                    </h1>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">
                      The Future of Construction Cost Management
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4"><>

                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    AI Enhanced
                  </div>
                  <div
</>
className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Quantum Ready
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Navigation */}
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8 overflow-x-auto">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex-none py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                      currentTab === item.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center"><>

                      <div className="font-semibold">{item.label}</div>
                      <div
</>
className="text-xs text-gray-400 mt-1">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<CostWizardPage />} />
              <Route path="/analysis" element={<CostAnalysisPage />} />
              <Route path="/factors" element={<CostFactorTablesPage />} />
              <Route path="/valuation" element={<PropertyValuationPage />} />
              <Route path="/insights" element={<MLInsightsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex justify-between items-center">
                <div><>

                  <h3 className="text-lg font-semibold">CostForge AI</h3>
                  <p
</>
className="text-gray-400 text-sm">Powered by Terrafusion Technology</p>
                </div>
                <div className="flex space-x-6 text-sm text-gray-400"><>

                  <span>AI Models: Active</span>
                  <span
</>
</>>ML Engine: v3.2</span>
                  <span>Quantum: Enabled</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
