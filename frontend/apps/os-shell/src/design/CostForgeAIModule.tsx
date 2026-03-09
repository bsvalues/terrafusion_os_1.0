/**
 * ═══════════════════════════════════════════════════════════════
 * COSTFORGE AI - MODULE INTEGRATION
 * Integration bridge for CostForge AI in TerraFusion OS
 * THE TERRAFUSION WAY - GOVERNMENT-GRADE EXCELLENCE
 * ═══════════════════════════════════════════════════════════════
 */

import React, { Suspense, lazy } from 'react';
import { TerraPanel, TerraSphere } from './TerraFlowEngine';

// Lazy load CostForge AI components for optimal performance
const TerraForgeCostAI = lazy(() =>
  import('./TerraForgeCostAI').then((m) => ({ default: m.default }))
);
const TerraForgeDashboard = lazy(() =>
  import('./TerraForgeDashboard').then((m) => ({ default: m.default }))
);

// Loading component with TerraFusion theming
const CostForgeLoader: React.FC = () => (
  <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
    <div className='text-center'>
      <TerraSphere size='lg' variant='quantum' systemHealth={95} />
      <div className='mt-6'>
        <h2 className='text-xl font-semibold text-white mb-2'>Loading CostForge AI</h2>
        <p className='text-slate-400'>Initializing construction cost intelligence...</p>
        <div className='mt-4 flex justify-center'>
          <div className='w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin'></div>
        </div>
      </div>
    </div>
  </div>
);

// Error boundary for CostForge AI components
class CostForgeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CostForge AI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
          <TerraPanel className='max-w-md'>
            <div className='text-center'>
              <div className='text-red-400 text-4xl mb-4'>⚠️</div>
              <h2 className='text-xl font-semibold text-white mb-2'>CostForge AI Error</h2>
              <p className='text-slate-400 mb-4'>
                An error occurred while loading the CostForge AI module.
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className='px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors'
              >
                Retry
              </button>
            </div>
          </TerraPanel>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * CostForge AI Module Configuration
 */
export const CostForgeAIModule = {
  name: 'CostForge AI',
  id: 'costforge-ai',
  description: 'Revolutionary AI-Powered Construction Cost Intelligence Platform',
  version: '1.0.0',
  category: 'construction',
  permissions: ['cost-analysis', 'market-data', 'ai-estimates', 'compliance-reporting'],
  targetCounties: ['all'], // Available for all counties
  legacySystems: ['CAMA', 'GIS', 'Assessment'],
  entryPoint: CostForgeMain,
  routes: [
    {
      path: '/costforge',
      component: CostForgeMain,
      title: 'CostForge AI Dashboard',
    },
    {
      path: '/costforge/estimator',
      component: () => (
        <CostForgeErrorBoundary>
          <Suspense fallback={<CostForgeLoader />}>
            <TerraForgeCostAI />
          </Suspense>
        </CostForgeErrorBoundary>
      ),
      title: 'AI Cost Estimator',
    },
    {
      path: '/costforge/dashboard',
      component: () => (
        <CostForgeErrorBoundary>
          <Suspense fallback={<CostForgeLoader />}>
            <TerraForgeDashboard />
          </Suspense>
        </CostForgeErrorBoundary>
      ),
      title: 'Advanced Dashboard',
    },
  ],
  quickActions: [
    {
      id: 'new-estimate',
      label: 'New Estimate',
      icon: '🎯',
      action: () => console.debug('Navigate to new estimate'),
      shortcut: 'Ctrl+N',
    },
    {
      id: 'market-data',
      label: 'Market Data',
      icon: '📊',
      action: () => console.debug('Open market data'),
      shortcut: 'Ctrl+M',
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: '🧠',
      action: () => console.debug('Show AI insights'),
      shortcut: 'Ctrl+I',
    },
  ],
  settings: {
    theme: 'quantum',
    aiModel: 'terrafusion-cost-v2',
    updateFrequency: '5min',
    marketDataSource: 'real-time',
  },
};

/**
 * Main CostForge AI Component Router
 */
function CostForgeMain() {
  const currentPath = window.location.pathname;

  // Route to appropriate component based on path
  if (currentPath.includes('/estimator')) {
    return (
      <CostForgeErrorBoundary>
        <Suspense fallback={<CostForgeLoader />}>
          <TerraForgeCostAI />
        </Suspense>
      </CostForgeErrorBoundary>
    );
  }

  if (currentPath.includes('/dashboard')) {
    return (
      <CostForgeErrorBoundary>
        <Suspense fallback={<CostForgeLoader />}>
          <TerraForgeDashboard />
        </Suspense>
      </CostForgeErrorBoundary>
    );
  }

  // Default to dashboard
  return (
    <CostForgeErrorBoundary>
      <Suspense fallback={<CostForgeLoader />}>
        <TerraForgeDashboard />
      </Suspense>
    </CostForgeErrorBoundary>
  );
}

/**
 * CostForge AI Utilities
 */
export const CostForgeUtils = {
  // Format currency values
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format square footage
  formatSquareFeet: (sqft: number): string => {
    return `${sqft.toLocaleString()} sq ft`;
  },

  // Calculate cost per square foot
  calculateCostPerSF: (totalCost: number, squareFeet: number): number => {
    return squareFeet > 0 ? totalCost / squareFeet : 0;
  },

  // Validate estimate data
  validateEstimate: (estimate: any): boolean => {
    return !!(
      estimate?.projectName &&
      estimate?.propertyType &&
      estimate?.specifications?.squareFootage > 0 &&
      estimate?.costs?.total > 0
    );
  },

  // Generate estimate ID
  generateEstimateId: (): string => {
    return `CF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};

/**
 * CostForge AI Hooks
 */
export const useCostForgeAI = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [estimates, setEstimates] = React.useState([]);
  const [marketData, setMarketData] = React.useState(null);

  const generateEstimate = React.useCallback(async (projectData: any) => {
    setIsLoading(true);
    try {
      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const estimate = {
        id: CostForgeUtils.generateEstimateId(),
        ...projectData,
        generated: Date.now(),
        confidence: 85 + Math.random() * 15,
      };

      setEstimates((prev) => [estimate, ...prev]);
      return estimate;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMarketData = React.useCallback(async () => {
    // Simulate market data fetch
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMarketData({
      region: 'Pacific Northwest',
      lastUpdated: Date.now(),
      trends: {
        materials: 5.2,
        labor: 3.8,
        permits: -1.2,
      },
    });
  }, []);

  return {
    isLoading,
    estimates,
    marketData,
    generateEstimate,
    refreshMarketData,
  };
};

// Export main components
export { TerraForgeCostAI, TerraForgeDashboard };
export default CostForgeMain;
