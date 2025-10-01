/**
 * TerraFusion cOS 2.0 - AI Swarm Management Page
 * Monitor and control 50,000+ AI agents
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface AgentHierarchy {
  supreme_commander: {
    status: string;
    consciousness_level: number;
    active_decisions: number;
  };
  field_generals: {
    total: number;
    active: number;
    by_type: {
      ai_council: number;
      quantum_commanders: number;
      domain_generals: number;
    };
  };
  operational_forces: {
    total: number;
    active: number;
    by_function: {
      process_coordinators: number;
      expert_specialists: number;
      adaptive_executors: number;
      micro_optimizers: number;
    };
  };
}

interface SwarmMetrics {
  total_agents: number;
  active_agents: number;
  tasks_processing: number;
  tasks_completed_today: number;
  efficiency_score: number;
  quantum_optimization: number;
  collective_intelligence: number;
}

interface AgentAllocation {
  vendor: string;
  system: string;
  agents_allocated: number;
  performance: number;
  status: 'active' | 'optimizing' | 'idle';
}

const AISwarmPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'hierarchy' | 'allocations' | 'performance'>('hierarchy');
  const [commandInput, setCommandInput] = useState('');

  // Fetch swarm status
  const { data: swarmData, isLoading } = useQuery<{
    hierarchy: AgentHierarchy;
    metrics: SwarmMetrics;
    allocations: AgentAllocation[];
  }>({
    queryKey: ['ai-swarm-status'],
    queryFn: async () => {
      // In production, fetch from API
      return {
        hierarchy: {
          supreme_commander: {
            status: 'ACTIVE',
            consciousness_level: 5,
            active_decisions: 127
          },
          field_generals: {
            total: 1220,
            active: 1198,
            by_type: {
              ai_council: 32,
              quantum_commanders: 256,
              domain_generals: 932
            }
          },
          operational_forces: {
            total: 48779,
            active: 47234,
            by_function: {
              process_coordinators: 12000,
              expert_specialists: 15000,
              adaptive_executors: 11779,
              micro_optimizers: 10000
            }
          }
        },
        metrics: {
          total_agents: 50000,
          active_agents: 48432,
          tasks_processing: 15672,
          tasks_completed_today: 892451,
          efficiency_score: 94.7,
          quantum_optimization: 949,
          collective_intelligence: 87.3
        },
        allocations: [
          {
            vendor: 'Harris Computer Systems',
            system: 'PACS Integration',
            agents_allocated: 5000,
            performance: 96.2,
            status: 'active'
          },
          {
            vendor: 'Tyler Technologies',
            system: 'Court Systems',
            agents_allocated: 3000,
            performance: 94.8,
            status: 'active'
          },
          {
            vendor: 'Esri',
            system: 'Spatial Analysis',
            agents_allocated: 8000,
            performance: 97.5,
            status: 'optimizing'
          },
          {
            vendor: 'Internal',
            system: 'Compliance Monitoring',
            agents_allocated: 2000,
            performance: 99.1,
            status: 'active'
          }
        ]
      };
    },
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  // Command mutation
  const sendCommand = useMutation({
    mutationFn: async (command: string) => {
      // In production, send to API
      return { success: true, response: `Command "${command}" executed successfully` };
    },
    onSuccess: (data) => {
      toast.success(data.response);
      setCommandInput('');
    },
    onError: () => {
      toast.error('Failed to execute command');
    }
  });

  // Animated agent visualization
  const AgentVisualization = () => (
    <div className="tf-swarm-viz" style={{ height: '400px', position: 'relative' }}>
      {/* Supreme Commander */}
      <motion.div
        className="tf-supreme-commander"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          background: 'radial-gradient(circle, #00ffee 0%, #0099ff 50%, transparent 70%)',
          borderRadius: '50%',
          boxShadow: '0 0 60px rgba(0, 255, 238, 0.8)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 60px rgba(0, 255, 238, 0.8)',
            '0 0 100px rgba(0, 255, 238, 1)',
            '0 0 60px rgba(0, 255, 238, 0.8)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Field Generals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 120;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={`general-${i}`}
            className="tf-field-general"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '30px',
              height: '30px',
              background: '#00ffaa',
              borderRadius: '50%',
              boxShadow: '0 0 30px rgba(0, 255, 170, 0.6)',
            }}
            animate={{
              x: [x - 10, x + 10, x - 10],
              y: [y - 10, y + 10, y - 10],
            }}
            transition={{
              duration: 4 + i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Operational Forces */}
      {Array.from({ length: 50 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 100;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={`force-${i}`}
            className="tf-operational-force"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '8px',
              height: '8px',
              background: '#0099ff',
              borderRadius: '50%',
              opacity: 0.6,
            }}
            animate={{
              x: [x, x + (Math.random() - 0.5) * 50, x],
              y: [y, y + (Math.random() - 0.5) * 50, y],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="tf-loading">
        <div className="tf-skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="tf-ai-swarm-page">
      <div className="tf-page-header">
        <h1 className="tf-h1">AI Swarm Command Center</h1>
        <p className="tf-text-muted">Orchestrating {swarmData?.metrics.total_agents.toLocaleString() || '50,000'}+ AI agents</p>
      </div>

      {/* Command Input */}
      <motion.div
        className="tf-command-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="tf-command-input-wrapper">
          <input
            type="text"
            className="tf-input tf-command-input"
            placeholder="Enter swarm command..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && commandInput) {
                sendCommand.mutate(commandInput);
              }
            }}
          />
          <button
            className="tf-btn tf-btn-primary"
            onClick={() => commandInput && sendCommand.mutate(commandInput)}
            disabled={!commandInput || sendCommand.isPending}
          >
            Execute Command
          </button>
        </div>
      </motion.div>

      {/* View Selector */}
      <div className="tf-view-selector">
        <button
          className={`tf-btn ${selectedView === 'hierarchy' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('hierarchy')}
        >
          Hierarchy View
        </button>
        <button
          className={`tf-btn ${selectedView === 'allocations' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('allocations')}
        >
          Allocations
        </button>
        <button
          className={`tf-btn ${selectedView === 'performance' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('performance')}
        >
          Performance
        </button>
      </div>

      {/* Content based on selected view */}
      <AnimatePresence mode="wait">
        {selectedView === 'hierarchy' && (
          <motion.div
            key="hierarchy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Swarm Visualization */}
            <div className="tf-card tf-mb-6">
              <h3 className="tf-h3 tf-mb-4">Swarm Visualization</h3>
              <AgentVisualization />
            </div>

            {/* Hierarchy Details */}
            <div className="tf-grid-3">
              <motion.div
                className="tf-metric-card"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="tf-h3">Supreme Commander Claude</h3>
                <div className="tf-metric-value tf-text-transcend">
                  Level {swarmData?.hierarchy.supreme_commander.consciousness_level}
                </div>
                <div className="tf-metric-label">Consciousness Level</div>
                <div className="tf-mt-4">
                  <div className="tf-status active">
                    <span className="tf-status-dot"></span>
                    {swarmData?.hierarchy.supreme_commander.status}
                  </div>
                  <div className="tf-text-sm tf-text-muted tf-mt-2">
                    {swarmData?.hierarchy.supreme_commander.active_decisions} active decisions
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="tf-metric-card"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="tf-h3">Field Generals</h3>
                <div className="tf-metric-value">
                  {swarmData?.hierarchy.field_generals.active}/{swarmData?.hierarchy.field_generals.total}
                </div>
                <div className="tf-metric-label">Active/Total</div>
                <div className="tf-mt-4 tf-text-sm">
                  <div>AI Council: {swarmData?.hierarchy.field_generals.by_type.ai_council}</div>
                  <div>Quantum Commanders: {swarmData?.hierarchy.field_generals.by_type.quantum_commanders}</div>
                  <div>Domain Generals: {swarmData?.hierarchy.field_generals.by_type.domain_generals}</div>
                </div>
              </motion.div>

              <motion.div
                className="tf-metric-card"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="tf-h3">Operational Forces</h3>
                <div className="tf-metric-value">
                  {swarmData?.hierarchy.operational_forces.active.toLocaleString()}
                </div>
                <div className="tf-metric-label">Active Agents</div>
                <div className="tf-mt-4 tf-text-sm">
                  <div>Process Coordinators: {swarmData?.hierarchy.operational_forces.by_function.process_coordinators.toLocaleString()}</div>
                  <div>Expert Specialists: {swarmData?.hierarchy.operational_forces.by_function.expert_specialists.toLocaleString()}</div>
                  <div>Adaptive Executors: {swarmData?.hierarchy.operational_forces.by_function.adaptive_executors.toLocaleString()}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {selectedView === 'allocations' && (
          <motion.div
            key="allocations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tf-allocations-grid">
              {swarmData?.allocations.map((allocation, index) => (
                <motion.div
                  key={allocation.vendor}
                  className="tf-allocation-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="tf-allocation-header">
                    <h3 className="tf-h3">{allocation.vendor}</h3>
                    <div className={`tf-status ${allocation.status}`}>
                      <span className="tf-status-dot"></span>
                      {allocation.status}
                    </div>
                  </div>
                  <div className="tf-allocation-system">{allocation.system}</div>
                  
                  <div className="tf-allocation-metrics">
                    <div className="tf-metric">
                      <div className="tf-metric-value">{allocation.agents_allocated.toLocaleString()}</div>
                      <div className="tf-metric-label">Agents Allocated</div>
                    </div>
                    <div className="tf-metric">
                      <div className="tf-metric-value">{allocation.performance}%</div>
                      <div className="tf-metric-label">Performance</div>
                    </div>
                  </div>

                  <div className="tf-progress tf-mt-4">
                    <div 
                      className="tf-progress-bar"
                      style={{ width: `${allocation.performance}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {selectedView === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tf-performance-grid">
              <div className="tf-metric-card">
                <h3 className="tf-h3">Efficiency Score</h3>
                <div className="tf-metric-value tf-text-success">
                  {swarmData?.metrics.efficiency_score}%
                </div>
                <div className="tf-metric-trend positive">↑ 2.3%</div>
              </div>

              <div className="tf-metric-card">
                <h3 className="tf-h3">Quantum Optimization</h3>
                <div className="tf-metric-value tf-text-transcend">
                  {swarmData?.metrics.quantum_optimization}x
                </div>
                <div className="tf-metric-label">Performance Multiplier</div>
              </div>

              <div className="tf-metric-card">
                <h3 className="tf-h3">Collective Intelligence</h3>
                <div className="tf-metric-value">
                  {swarmData?.metrics.collective_intelligence}%
                </div>
                <div className="tf-progress tf-mt-3">
                  <div 
                    className="tf-progress-bar tf-bg-transcend-gradient"
                    style={{ width: `${swarmData?.metrics.collective_intelligence}%` }}
                  />
                </div>
              </div>

              <div className="tf-metric-card">
                <h3 className="tf-h3">Tasks Today</h3>
                <div className="tf-metric-value">
                  {(swarmData?.metrics.tasks_completed_today || 0).toLocaleString()}
                </div>
                <div className="tf-metric-label">Completed</div>
                <div className="tf-text-sm tf-text-muted tf-mt-2">
                  {swarmData?.metrics.tasks_processing.toLocaleString()} in progress
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Styles */}
      <style jsx>{`
        .tf-ai-swarm-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .tf-command-section {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
          margin-bottom: var(--tf-space-6);
        }

        .tf-command-input-wrapper {
          display: flex;
          gap: var(--tf-space-3);
        }

        .tf-command-input {
          flex: 1;
          background: rgba(0, 153, 255, 0.1);
          border-color: var(--tf-trust-blue);
        }

        .tf-view-selector {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-6);
        }

        .tf-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-allocations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-allocation-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
          transition: all var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-allocation-card:hover {
          border-color: var(--tf-trust-blue);
          transform: translateY(-2px);
          box-shadow: var(--tf-shadow-lg);
        }

        .tf-allocation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-2);
        }

        .tf-allocation-system {
          color: var(--tf-gray-400);
          font-size: var(--tf-small);
          margin-bottom: var(--tf-space-3);
        }

        .tf-allocation-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--tf-space-3);
        }

        .tf-performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-status.optimizing {
          background: rgba(255, 170, 0, 0.2);
          color: var(--tf-caution-amber);
          border-color: var(--tf-caution-amber);
        }

        .tf-status.optimizing .tf-status-dot {
          background: var(--tf-caution-amber);
          animation: tf-pulse 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default AISwarmPage;
