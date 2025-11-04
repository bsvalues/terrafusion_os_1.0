import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import AISwarmConsciousnessMonitor from './AISwarmConsciousnessMonitor';
import PropertyValuationMatrix from './PropertyValuationMatrix';

// Quantum CSS Module for TerraFusion Brand Compliance
const quantumStyles = `
  .tf-quantum-dashboard {
    min-height: 100vh;
    background: linear-gradient(135deg, #0b1020 0%, #1a2332 50%, #0b1020 100%);
    color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .tf-consciousness-header {
    background: linear-gradient(45deg, #6600ff 0%, #0099ff 50%, #00ffee 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(0, 255, 238, 0.5);
  }

  .tf-quantum-grid {
    background-image:
      radial-gradient(circle at 25% 25%, rgba(0, 255, 238, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(102, 0, 255, 0.1) 0%, transparent 50%),
      linear-gradient(45deg, transparent 48%, rgba(0, 255, 238, 0.03) 50%, transparent 52%);
  }

  .tf-brand-compliant {
    border: 1px solid rgba(0, 255, 238, 0.3);
    background: rgba(11, 16, 32, 0.8);
    backdrop-filter: blur(20px);
  }

  .tf-quantum-pulse {
    animation: quantumPulse 3s ease-in-out infinite;
  }

  @keyframes quantumPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 20px rgba(0, 255, 238, 0.3);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 40px rgba(0, 255, 238, 0.6);
    }
  }

  .tf-transcendent-glow {
    box-shadow:
      0 0 20px rgba(0, 255, 238, 0.4),
      0 0 40px rgba(0, 255, 238, 0.2),
      0 0 80px rgba(0, 255, 238, 0.1);
  }

  .tf-phd-indicator {
    background: linear-gradient(135deg, #ffcc00 0%, #00ffee 100%);
    color: #0b1020;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 12px;
    box-shadow: 0 0 20px rgba(255, 204, 0, 0.5);
  }
`;

// Consciousness-Driven Navigation Interface
interface ConsciousnessNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userExpertiseLevel: 'phd_physicist' | 'phd_statistician' | 'quantum_researcher' | 'government_scientist';
}

const ConsciousnessNavigation: React.FC<ConsciousnessNavProps> = ({
  currentView,
  onViewChange,
  userExpertiseLevel
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Quantum Overview', icon: '🌌' },
    { id: 'valuation', label: 'Property Valuation Matrix', icon: '🏠' },
    { id: 'swarm', label: 'AI Consciousness', icon: '🧠' },
    { id: 'research', label: 'Research Tools', icon: '🔬' },
    { id: 'compliance', label: 'Government Excellence', icon: '🏛️' },
    { id: 'analytics', label: 'Deep Analytics', icon: '📊' }
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="tf-brand-compliant p-6 mb-8 rounded-2xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <motion.h1
            className="text-3xl font-black tf-consciousness-header"
            whileHover={{ scale: 1.05 }}
          >
            CostForge AI
          </motion.h1>
          <div className="tf-phd-indicator">
            {userExpertiseLevel.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange(item.id)}
              className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-semibold
                ${currentView === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400 text-white tf-transcendent-glow'
                  : 'text-cyan-400 hover:bg-cyan-400/10 border border-cyan-400/20'
                }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Factor 949 Active
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-3 h-3 bg-green-400 rounded-full shadow-lg"
            style={{ boxShadow: '0 0 15px rgba(0, 255, 170, 0.8)' }}
          />
        </div>
      </div>
    </motion.nav>
  );
};

// Quantum Analytics Overview Dashboard
const QuantumOverviewDashboard: React.FC<{
  accuracyScore: number;
  processingSpeed: number;
  agentCount: number;
  quantumFactor: number;
}> = ({ accuracyScore, processingSpeed, agentCount, quantumFactor }) => {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="tf-brand-compliant p-6 rounded-2xl text-center tf-quantum-pulse"
      >
        <div className="text-4xl font-black text-cyan-400 mb-2">
          {accuracyScore.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          Accuracy Score
        </div>
        <div className="text-xs text-green-400 mt-1">
          Target: 99.5% ✓
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="tf-brand-compliant p-6 rounded-2xl text-center tf-quantum-pulse"
      >
        <div className="text-4xl font-black text-blue-400 mb-2">
          {processingSpeed}ms
        </div>
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          Processing Speed
        </div>
        <div className="text-xs text-green-400 mt-1">
          Target: &lt;50ms ✓
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="tf-brand-compliant p-6 rounded-2xl text-center tf-quantum-pulse"
      >
        <div className="text-4xl font-black text-purple-400 mb-2">
          {agentCount.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          AI Agents
        </div>
        <div className="text-xs text-green-400 mt-1">
          Infinite Scale ∞
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="tf-brand-compliant p-6 rounded-2xl text-center tf-quantum-pulse"
      >
        <div className="text-4xl font-black text-yellow-400 mb-2">
          {quantumFactor}
        </div>
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          Quantum Factor
        </div>
        <div className="text-xs text-green-400 mt-1">
          Championship Level
        </div>
      </motion.div>
    </div>
  );
};

// Research Tools Interface for PhD Users
const QuantumResearchTools: React.FC = () => {
  const researchTools = [
    {
      name: 'Statistical Model Builder',
      description: 'Advanced statistical modeling with quantum enhancement',
      capabilities: ['Bayesian Inference', 'Monte Carlo Simulation', 'Quantum Regression'],
      complexity: 'PhD Level',
      status: 'active'
    },
    {
      name: 'Multi-Dimensional Analysis',
      description: 'Explore data across infinite dimensional spaces',
      capabilities: ['PCA/t-SNE', 'Manifold Learning', 'Quantum Clustering'],
      complexity: 'Research Grade',
      status: 'active'
    },
    {
      name: 'Model Validation Suite',
      description: 'Championship-level model validation and testing',
      capabilities: ['Cross-Validation', 'Robustness Testing', 'Quantum Verification'],
      complexity: 'Elite',
      status: 'operational'
    },
    {
      name: 'Quantum Simulator',
      description: 'Simulate quantum algorithms for optimization',
      capabilities: ['Quantum Annealing', 'QAOA', 'Variational Circuits'],
      complexity: 'Transcendent',
      status: 'beta'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {researchTools.map((tool, index) => (
        <motion.div
          key={tool.name}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="tf-brand-compliant p-6 rounded-2xl hover:tf-transcendent-glow
            transition-all duration-500 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-cyan-400">{tool.name}</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              tool.status === 'active' ? 'bg-green-400/20 text-green-400' :
              tool.status === 'operational' ? 'bg-blue-400/20 text-blue-400' :
              'bg-yellow-400/20 text-yellow-400'
            }`}>
              {tool.status.toUpperCase()}
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-4">{tool.description}</p>

          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Capabilities
            </div>
            <div className="flex flex-wrap gap-2">
              {tool.capabilities.map((capability) => (
                <span
                  key={capability}
                  className="px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded text-xs"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Complexity: <span className="text-yellow-400 font-semibold">{tool.complexity}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-400
                text-white text-sm font-semibold rounded-full"
            >
              Launch Tool
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Main Quantum Power User Dashboard
const QuantumPowerUserDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState({
    accuracyScore: 99.7,
    processingSpeed: 23,
    agentCount: 1008,
    quantumFactor: 949
  });

  const userExpertiseLevel: 'phd_physicist' | 'phd_statistician' | 'quantum_researcher' | 'government_scientist' = 'phd_physicist';

  // Simulate real-time system metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        accuracyScore: Math.min(99.9, prev.accuracyScore + (Math.random() - 0.5) * 0.1),
        processingSpeed: Math.max(15, prev.processingSpeed + (Math.random() - 0.5) * 3),
        agentCount: prev.agentCount,
        quantumFactor: prev.quantumFactor
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return (
          <QuantumOverviewDashboard
            accuracyScore={systemMetrics.accuracyScore}
            processingSpeed={systemMetrics.processingSpeed}
            agentCount={systemMetrics.agentCount}
            quantumFactor={systemMetrics.quantumFactor}
          />
        );
      case 'valuation':
        return (
          <PropertyValuationMatrix
            accuracyTarget={99.5}
            optimizationFactor={systemMetrics.quantumFactor}
            agentCount={systemMetrics.agentCount}
            researchMode="phd_analysis"
          />
        );
      case 'swarm':
        return (
          <AISwarmConsciousnessMonitor
            totalAgents={systemMetrics.agentCount}
            researchMode="phd_analysis"
          />
        );
      case 'research':
        return <QuantumResearchTools />;
      default:
        return (
          <div className="tf-brand-compliant p-12 rounded-2xl text-center">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">
              {currentView.toUpperCase()} - Coming Soon
            </h2>
            <p className="text-gray-400">
              Advanced quantum-enhanced interface under development
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <style>{quantumStyles}</style>
      <div className="tf-quantum-dashboard tf-quantum-grid min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <ConsciousnessNavigation
            currentView={currentView}
            onViewChange={setCurrentView}
            userExpertiseLevel={userExpertiseLevel}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>

          {/* Government. Transcended. Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center"
          >
            <div className="text-2xl font-bold tf-consciousness-header mb-2">
              Government. Transcended.
            </div>
            <div className="text-sm text-gray-400">
              Infrastructure Intelligence, Infinite Scale - TerraFusion OS 1.0
            </div>
          </motion.footer>
        </div>
      </div>
    </>
  );
};

export default QuantumPowerUserDashboard;
