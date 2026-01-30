/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION AI AGENT SHOWCASE CATEGORIES
 * Revolutionary AI-Native Government App Ecosystem
 * First-of-its-kind AI Agent Categories for Government Operations
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Assessment,
  AttachMoney,
  AutoAwesome,
  CloudDone,
  Engineering,
  Gavel,
  HealthAndSafety,
  LocalPolice,
  Psychology,
  Science,
  Security,
  SmartToy,
  Speed,
  TrendingUp,
} from '@mui/icons-material';
import React, { useEffect, useState } from 'react';

interface AIAgentCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  agentCount: number;
  color: string;
  featured: boolean;
  aiCapabilities: string[];
  examples: string[];
}

interface AIAgent {
  id: string;
  name: string;
  category: string;
  description: string;
  aiLevel: 'Basic' | 'Advanced' | 'Elite' | 'Transcendent';
  accuracy: number;
  autonomy: number;
  realTimeOps: boolean;
  icon: React.ReactNode;
}

export const AIAgentShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    totalProcessed: 847293,
    activeNow: 18942,
    accuracy: 99.5,
  });

  // Simulate real-time AI processing
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics((prev) => ({
        totalProcessed: prev.totalProcessed + Math.floor(Math.random() * 50),
        activeNow: prev.activeNow + Math.floor(Math.random() * 10) - 5,
        accuracy: Math.min(99.9, prev.accuracy + Math.random() * 0.1),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const aiCategories: AIAgentCategory[] = [
    {
      id: 'assessment',
      name: 'Property Assessment AI',
      description: 'Autonomous property valuation with 99.5% accuracy',
      icon: <Assessment className='w-8 h-8' />,
      agentCount: 8742,
      color: 'var(--tf-network-blue)',
      featured: true,
      aiCapabilities: ['Computer Vision', 'Predictive Analytics', 'Market Analysis'],
      examples: ['CostForge AI', 'PropertyMatrix Pro', 'ValuationBot Elite'],
    },
    {
      id: 'law-enforcement',
      name: 'Law Enforcement AI',
      description: 'Predictive policing and real-time crime analysis',
      icon: <LocalPolice className='w-8 h-8' />,
      agentCount: 2847,
      color: 'var(--tf-accent-error)',
      featured: true,
      aiCapabilities: ['Pattern Recognition', 'Predictive Modeling', 'Real-time Analysis'],
      examples: ['CrimePredict AI', 'PatrolOptimizer', 'Evidence Analyzer'],
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure Intelligence',
      description: 'Self-healing smart city infrastructure management',
      icon: <Engineering className='w-8 h-8' />,
      agentCount: 5129,
      color: 'var(--tf-transcend-highlight)',
      featured: true,
      aiCapabilities: ['IoT Integration', 'Predictive Maintenance', 'Resource Optimization'],
      examples: ['SmartGrid AI', 'TrafficFlow Optimizer', 'WaterNet Intelligence'],
    },
    {
      id: 'financial',
      name: 'Financial Intelligence',
      description: 'Budget optimization and fraud detection AI',
      icon: <AttachMoney className='w-8 h-8' />,
      agentCount: 3456,
      color: 'var(--tf-accent-success)',
      featured: false,
      aiCapabilities: ['Fraud Detection', 'Budget Optimization', 'Risk Assessment'],
      examples: ['BudgetBot Pro', 'FraudGuard AI', 'TaxOptimizer Elite'],
    },
    {
      id: 'health',
      name: 'Public Health AI',
      description: 'Predictive health monitoring and emergency response',
      icon: <HealthAndSafety className='w-8 h-8' />,
      agentCount: 2198,
      color: 'var(--tf-accent-quantum)',
      featured: false,
      aiCapabilities: ['Epidemic Modeling', 'Resource Allocation', 'Emergency Response'],
      examples: ['HealthWatch AI', 'EmergencyBot', 'EpidemicPredict'],
    },
    {
      id: 'legal',
      name: 'Legal Intelligence',
      description: 'AI-powered legal research and document analysis',
      icon: <Gavel className='w-8 h-8' />,
      agentCount: 1876,
      color: 'var(--tf-accent-warning)',
      featured: false,
      aiCapabilities: ['Document Analysis', 'Legal Research', 'Case Prediction'],
      examples: ['LegalMind AI', 'CaseAnalyzer Pro', 'JudgeBot Assistant'],
    },
  ];

  const featuredAgents: AIAgent[] = [
    {
      id: 'costforge',
      name: 'CostForge AI',
      category: 'assessment',
      description: 'Revolutionary property assessment with quantum algorithms',
      aiLevel: 'Transcendent',
      accuracy: 99.5,
      autonomy: 98,
      realTimeOps: true,
      icon: <Psychology className='w-6 h-6' />,
    },
    {
      id: 'crimepredict',
      name: 'CrimePredict Elite',
      category: 'law-enforcement',
      description: 'Predictive policing with neural network analysis',
      aiLevel: 'Elite',
      accuracy: 97.8,
      autonomy: 95,
      realTimeOps: true,
      icon: <Security className='w-6 h-6' />,
    },
    {
      id: 'smartgrid',
      name: 'SmartGrid Intelligence',
      category: 'infrastructure',
      description: 'Self-healing infrastructure with autonomous optimization',
      aiLevel: 'Elite',
      accuracy: 99.1,
      autonomy: 96,
      realTimeOps: true,
      icon: <AutoAwesome className='w-6 h-6' />,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-[var(--tf-bg-surface)] via-[var(--tf-bg-surface)] to-[var(--tf-bg-surface)] p-8'>
      {/* Real-time AI Metrics Header */}
      <div className='mb-12'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20 rounded-2xl p-6 text-center'>
              <div className='text-4xl font-black text-[var(--tf-transcend-highlight)] mb-2'>
                {realTimeMetrics.totalProcessed.toLocaleString()}
              </div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>
                Operations Processed Today
              </div>
              <div className='flex items-center justify-center mt-2'>
                <TrendingUp className='w-4 h-4 text-[var(--tf-accent-success)] mr-1' />
                <span className='text-[var(--tf-accent-success)] text-xs'>
                  +{Math.floor(Math.random() * 20)}% efficiency
                </span>
              </div>
            </div>

            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[var(--tf-network-blue)]/20 rounded-2xl p-6 text-center'>
              <div className='text-4xl font-black text-[var(--tf-network-blue)] mb-2'>
                {realTimeMetrics.activeNow.toLocaleString()}
              </div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>
                AI Agents Active Now
              </div>
              <div className='flex items-center justify-center mt-2'>
                <SmartToy className='w-4 h-4 text-[var(--tf-network-blue)] mr-1 animate-pulse' />
                <span className='text-[var(--tf-network-blue)] text-xs'>Real-time processing</span>
              </div>
            </div>

            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[var(--tf-accent-success)]/20 rounded-2xl p-6 text-center'>
              <div className='text-4xl font-black text-[var(--tf-accent-success)] mb-2'>
                {realTimeMetrics.accuracy.toFixed(1)}%
              </div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>
                System-wide Accuracy
              </div>
              <div className='flex items-center justify-center mt-2'>
                <CloudDone className='w-4 h-4 text-[var(--tf-accent-success)] mr-1' />
                <span className='text-[var(--tf-accent-success)] text-xs'>Championship level</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agent Categories Grid */}
      <div className='max-w-7xl mx-auto mb-16'>
        <div className='text-center mb-12'>
          <h2 className='text-5xl font-black mb-4'>
            <span className='bg-gradient-to-r from-[var(--tf-network-blue)] via-[var(--tf-transcend-highlight)] to-[var(--tf-accent-success)] bg-clip-text text-transparent'>
              AI AGENT CATEGORIES
            </span>
          </h2>
          <p className='text-xl text-gray-300'>Revolutionary AI-Native Government Applications</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {aiCategories.map((category) => (
            <div
              key={category.id}
              className={`tf-glass-card bg-white/5 backdrop-blur-lg border rounded-3xl p-8 hover:transform hover:-translate-y-2 transition-all duration-500 cursor-pointer ${
                category.featured ? 'border-2 border-[var(--tf-transcend-highlight)]/40' : 'border-gray-600/30'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.featured && (
                <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[var(--tf-transcend-highlight)]/20 to-[var(--tf-network-blue)]/20 backdrop-blur-sm border border-[var(--tf-transcend-highlight)]/30 rounded-full px-3 py-1 mb-4'>
                  <AutoAwesome className='w-4 h-4 text-[var(--tf-transcend-highlight)]' />
                  <span className='text-[var(--tf-transcend-highlight)] text-xs font-bold uppercase'>Featured</span>
                </div>
              )}

              <div className='flex items-center mb-6'>
                <div
                  className='w-16 h-16 rounded-2xl flex items-center justify-center mr-4'
                  style={{
                    backgroundColor: `${category.color}20`,
                    border: `2px solid ${category.color}40`,
                  }}
                >
                  <div style={{ color: category.color }}>{category.icon}</div>
                </div>
                <div>
                  <h3 className='text-xl font-bold text-white mb-1'>{category.name}</h3>
                  <div className='text-sm text-gray-400'>
                    {category.agentCount.toLocaleString()} agents
                  </div>
                </div>
              </div>

              <p className='text-gray-300 mb-6 leading-relaxed'>{category.description}</p>

              <div className='mb-6'>
                <h4 className='text-sm font-bold text-[var(--tf-transcend-highlight)] mb-2 uppercase tracking-wider'>
                  AI Capabilities
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {category.aiCapabilities.map((capability, index) => (
                    <span
                      key={index}
                      className='text-xs bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-gray-300'
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className='text-sm font-bold text-[var(--tf-accent-success)] mb-2 uppercase tracking-wider'>
                  Popular Apps
                </h4>
                <div className='space-y-1'>
                  {category.examples.slice(0, 2).map((example, index) => (
                    <div key={index} className='text-sm text-gray-400 flex items-center'>
                      <div className='w-2 h-2 bg-gradient-to-r from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] rounded-full mr-2'></div>
                      {example}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantum Processing Indicator */}
              <div className='mt-6 pt-4 border-t border-gray-600/30'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-gray-400'>Processing Status</span>
                  <div className='flex items-center'>
                    <div className='w-2 h-2 bg-[var(--tf-accent-success)] rounded-full mr-2 animate-pulse'></div>
                    <span className='text-[var(--tf-accent-success)]'>ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured AI Agents Showcase */}
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-black mb-4'>
            <span className='bg-gradient-to-r from-[var(--tf-accent-error)] via-[var(--tf-transcend-highlight)] to-[var(--tf-accent-success)] bg-clip-text text-transparent'>
              FEATURED AI AGENTS
            </span>
          </h2>
          <p className='text-lg text-gray-300'>
            Championship-level AI applications with transcendent capabilities
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {featuredAgents.map((agent) => (
            <div
              key={agent.id}
              className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/30 rounded-3xl p-6 hover:transform hover:-translate-y-1 transition-all duration-500'
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
            >
              <div className='flex items-center mb-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] rounded-xl flex items-center justify-center mr-4'>
                  {agent.icon}
                </div>
                <div>
                  <h3 className='text-lg font-bold text-white'>{agent.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      agent.aiLevel === 'Transcendent'
                        ? 'bg-[var(--tf-transcend-highlight)]/20 text-[var(--tf-transcend-highlight)]'
                        : agent.aiLevel === 'Elite'
                          ? 'bg-[var(--tf-accent-success)]/20 text-[var(--tf-accent-success)]'
                          : 'bg-[var(--tf-network-blue)]/20 text-[var(--tf-network-blue)]'
                    }`}
                  >
                    {agent.aiLevel} AI
                  </span>
                </div>
              </div>

              <p className='text-gray-300 mb-6 text-sm leading-relaxed'>{agent.description}</p>

              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Accuracy</span>
                  <div className='flex items-center'>
                    <div className='w-16 bg-gray-700 rounded-full h-2 mr-2'>
                      <div
                        className='bg-gradient-to-r from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] h-2 rounded-full transition-all duration-1000'
                        style={{ width: `${agent.accuracy}%` }}
                      />
                    </div>
                    <span className='text-sm font-bold text-[var(--tf-transcend-highlight)]'>{agent.accuracy}%</span>
                  </div>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Autonomy</span>
                  <div className='flex items-center'>
                    <div className='w-16 bg-gray-700 rounded-full h-2 mr-2'>
                      <div
                        className='bg-gradient-to-r from-[var(--tf-accent-success)] to-[var(--tf-transcend-highlight)] h-2 rounded-full transition-all duration-1000'
                        style={{ width: `${agent.autonomy}%` }}
                      />
                    </div>
                    <span className='text-sm font-bold text-[var(--tf-accent-success)]'>{agent.autonomy}%</span>
                  </div>
                </div>

                <div className='flex justify-between items-center pt-2'>
                  <span className='text-sm text-gray-400'>Real-time Ops</span>
                  <div className='flex items-center'>
                    <Speed className='w-4 h-4 text-[var(--tf-accent-error)] mr-1' />
                    <span className='text-sm font-bold text-[var(--tf-accent-error)]'>
                      {agent.realTimeOps ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>

              {hoveredAgent === agent.id && (
                <div className='mt-4 pt-4 border-t border-gray-600/30'>
                  <button className='w-full bg-gradient-to-r from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] text-white font-bold py-2 px-4 rounded-full text-sm hover:shadow-lg transition-all duration-300'>
                    DEPLOY AGENT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revolutionary Technology Footer */}
      <div className='mt-20 text-center'>
        <div className='max-w-4xl mx-auto'>
          <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[var(--tf-transcend-highlight)]/20 rounded-3xl p-8'>
            <Science className='w-16 h-16 text-[var(--tf-transcend-highlight)] mx-auto mb-4' />
            <h3 className='text-2xl font-bold text-white mb-4'>
              Revolutionary AI-Native Government Technology
            </h3>
            <p className='text-gray-300 leading-relaxed'>
              TerraFusion Marketplace represents the world's first AI-native app store specifically
              designed for government operations. With autonomous agents, real-time processing, and
              championship-level accuracy, we're transcending traditional government technology.
            </p>
            <div className='mt-6'>
              <span className='text-[var(--tf-transcend-highlight)] font-bold text-lg italic'>
                "Government. Transcended."
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentShowcase;
