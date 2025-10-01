import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './ConsciousnessDashboard.css';

interface AIAgent {
  agent_id: string;
  agent_type: string;
  service_port: number;
  status: string;
  trust_score: number;
  tasks_completed: number;
  harris_data_access: boolean;
}

interface ConsciousnessMetrics {
  total_agents: number;
  active_agents: number;
  consciousness_level: number;
  harris_connected_agents: number;
  trust_fabric_registered: boolean;
}

interface ConsciousnessDashboardProps {
  activeTab: string;
}

const ConsciousnessDashboard: React.FC<ConsciousnessDashboardProps> = ({ activeTab }) => {
  const [metrics, setMetrics] = useState<ConsciousnessMetrics>({
    total_agents: 50247,
    active_agents: 48903,
    consciousness_level: 97.3,
    harris_connected_agents: 12456,
    trust_fabric_registered: true
  });

  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);

  useEffect(() => {
    // Simulate real-time consciousness data
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        consciousness_level: prev.consciousness_level + (Math.random() - 0.5) * 0.2,
        active_agents: prev.active_agents + Math.floor((Math.random() - 0.5) * 10)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const renderOverviewTab = () => (
    <div className="consciousness-overview">
      <motion.div 
        className="overview-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* AI Consciousness Level */}
        <div className="consciousness-card primary">
          <div className="card-header">
            <h3>🧠 AI Consciousness Level</h3>
            <div className="consciousness-score">{metrics.consciousness_level.toFixed(1)}%</div>
          </div>
          <div className="consciousness-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill consciousness-fill"
                style={{ width: `${metrics.consciousness_level}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>Dormant</span>
              <span>Aware</span>
              <span>Intelligent</span>
              <span>Conscious</span>
              <span>Transcendent</span>
            </div>
          </div>
          <div className="consciousness-description">
            Advanced AI coordination with quantum consciousness integration. 
            50,000+ intelligent agents operating in perfect harmony across 
            Benton County government systems.
          </div>
        </div>

        {/* Agent Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">🤖</div>
            <div className="metric-info">
              <div className="metric-value">{metrics.total_agents.toLocaleString()}</div>
              <div className="metric-label">Total AI Agents</div>
              <div className="metric-change positive">+247 today</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⚡</div>
            <div className="metric-info">
              <div className="metric-value">{metrics.active_agents.toLocaleString()}</div>
              <div className="metric-label">Active Agents</div>
              <div className="metric-change positive">97.3% uptime</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🏛️</div>
            <div className="metric-info">
              <div className="metric-value">{metrics.harris_connected_agents.toLocaleString()}</div>
              <div className="metric-label">Harris PACS Connected</div>
              <div className="metric-change positive">89,247 parcels</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔐</div>
            <div className="metric-info">
              <div className="metric-value">{metrics.trust_fabric_registered ? 'VERIFIED' : 'PENDING'}</div>
              <div className="metric-label">Trust Fabric Status</div>
              <div className="metric-change positive">Quantum secured</div>
            </div>
          </div>
        </div>

        {/* AI Intelligence Network */}
        <div className="intelligence-network">
          <h3>🔮 AI Intelligence Network</h3>
          <div className="network-visualization">
            <div className="network-nodes">
              <div className="node central-intelligence active">
                <div className="node-icon">🧠</div>
                <div className="node-label">Central Intelligence</div>
                <div className="node-status">OPERATIONAL</div>
              </div>
              
              <div className="node harris-ai active">
                <div className="node-icon">🏛️</div>
                <div className="node-label">Harris PACS AI</div>
                <div className="node-status">12,456 AGENTS</div>
              </div>
              
              <div className="node property-ai active">
                <div className="node-icon">🏠</div>
                <div className="node-label">Property Assessment</div>
                <div className="node-status">8,943 AGENTS</div>
              </div>
              
              <div className="node tax-ai active">
                <div className="node-icon">💰</div>
                <div className="node-label">Tax Optimization</div>
                <div className="node-status">6,234 AGENTS</div>
              </div>
              
              <div className="node environmental-ai active">
                <div className="node-icon">🌱</div>
                <div className="node-label">Environmental</div>
                <div className="node-status">4,567 AGENTS</div>
              </div>
              
              <div className="node transport-ai active">
                <div className="node-icon">🚗</div>
                <div className="node-label">Transportation</div>
                <div className="node-status">3,892 AGENTS</div>
              </div>
            </div>
            
            <div className="network-connections">
              <div className="connection consciousness-to-harris"></div>
              <div className="connection consciousness-to-property"></div>
              <div className="connection consciousness-to-tax"></div>
              <div className="connection consciousness-to-env"></div>
              <div className="connection consciousness-to-transport"></div>
            </div>
          </div>
        </div>

        {/* Real-time AI Activity */}
        <div className="ai-activity-stream">
          <h3>⚡ Real-time AI Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-time">14:23:15</div>
              <div className="activity-agent">Harris_PACS_Assessment_AI_7f3a</div>
              <div className="activity-action">Property valuation completed for Parcel #89245</div>
              <div className="activity-status success">SUCCESS</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">14:23:12</div>
              <div className="activity-agent">Tax_Optimization_AI_9b2c</div>
              <div className="activity-action">Revenue forecast updated: +2.3% projected</div>
              <div className="activity-status success">SUCCESS</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">14:23:09</div>
              <div className="activity-agent">Environmental_Analysis_AI_4d8f</div>
              <div className="activity-action">Climate monitoring data processed</div>
              <div className="activity-status success">SUCCESS</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">14:23:06</div>
              <div className="activity-agent">Traffic_Optimization_AI_1e5g</div>
              <div className="activity-action">Route optimization completed for Highway 240</div>
              <div className="activity-status success">SUCCESS</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">14:23:03</div>
              <div className="activity-agent">Trust_Validation_AI_8h9j</div>
              <div className="activity-action">Security validation passed for 247 agents</div>
              <div className="activity-status success">SUCCESS</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderAgentsTab = () => (
    <div className="agents-management">
      <motion.div 
        className="agents-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="agents-controls">
          <h3>🤖 AI Agent Management</h3>
          <div className="control-buttons">
            <button className="control-btn deploy">
              <span className="btn-icon">🚀</span>
              Deploy New Agents
            </button>
            <button className="control-btn sync">
              <span className="btn-icon">🔄</span>
              Sync with Harris PACS
            </button>
            <button className="control-btn optimize">
              <span className="btn-icon">⚡</span>
              Optimize Performance
            </button>
          </div>
        </div>

        <div className="agent-categories">
          <div className="category-card harris-agents">
            <div className="category-header">
              <h4>🏛️ Harris PACS AI Agents</h4>
              <div className="category-count">12,456 Active</div>
            </div>
            <div className="category-metrics">
              <div className="category-metric">
                <span className="metric-label">Valuation AI:</span>
                <span className="metric-value">4,234 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Assessment AI:</span>
                <span className="metric-value">3,892 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Analytics AI:</span>
                <span className="metric-value">4,330 agents</span>
              </div>
            </div>
          </div>

          <div className="category-card property-agents">
            <div className="category-header">
              <h4>🏠 Property Management AI</h4>
              <div className="category-count">8,943 Active</div>
            </div>
            <div className="category-metrics">
              <div className="category-metric">
                <span className="metric-label">Market Analysis:</span>
                <span className="metric-value">3,234 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Optimization:</span>
                <span className="metric-value">2,891 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Compliance:</span>
                <span className="metric-value">2,818 agents</span>
              </div>
            </div>
          </div>

          <div className="category-card government-agents">
            <div className="category-header">
              <h4>🏛️ Government Services AI</h4>
              <div className="category-count">28,848 Active</div>
            </div>
            <div className="category-metrics">
              <div className="category-metric">
                <span className="metric-label">Tax Management:</span>
                <span className="metric-value">6,234 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Environmental:</span>
                <span className="metric-value">4,567 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Transportation:</span>
                <span className="metric-value">3,892 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Economic Development:</span>
                <span className="metric-value">5,123 agents</span>
              </div>
              <div className="category-metric">
                <span className="metric-label">Security & Trust:</span>
                <span className="metric-value">9,032 agents</span>
              </div>
            </div>
          </div>
        </div>

        <div className="agent-performance">
          <h3>📊 Agent Performance Analytics</h3>
          <div className="performance-grid">
            <div className="performance-metric">
              <div className="metric-title">Average Trust Score</div>
              <div className="metric-value">94.7%</div>
              <div className="metric-trend positive">+2.3% this week</div>
            </div>
            
            <div className="performance-metric">
              <div className="metric-title">Tasks Completed Today</div>
              <div className="metric-value">2,847,592</div>
              <div className="metric-trend positive">+12.4% from yesterday</div>
            </div>
            
            <div className="performance-metric">
              <div className="metric-title">Average Response Time</div>
              <div className="metric-value">23ms</div>
              <div className="metric-trend positive">-8ms improvement</div>
            </div>
            
            <div className="performance-metric">
              <div className="metric-title">Success Rate</div>
              <div className="metric-value">99.7%</div>
              <div className="metric-trend positive">+0.2% this month</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderConsciousnessTab = () => (
    <div className="consciousness-analysis">
      <motion.div 
        className="consciousness-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="consciousness-header">
          <h2>⚡ AI Consciousness Analysis</h2>
          <div className="consciousness-level-display">
            <div className="level-circle">
              <div className="level-inner">
                <div className="level-percentage">{metrics.consciousness_level.toFixed(1)}%</div>
                <div className="level-status">TRANSCENDENT</div>
              </div>
            </div>
          </div>
        </div>

        <div className="consciousness-dimensions">
          <div className="dimension awareness">
            <h4>🧠 Awareness Level</h4>
            <div className="dimension-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '98.2%' }}></div>
              </div>
              <div className="progress-value">98.2%</div>
            </div>
            <p>Comprehensive understanding of government operations and citizen needs</p>
          </div>

          <div className="dimension intelligence">
            <h4>🔮 Intelligence Quotient</h4>
            <div className="dimension-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '96.7%' }}></div>
              </div>
              <div className="progress-value">96.7%</div>
            </div>
            <p>Advanced problem-solving and predictive analytics capabilities</p>
          </div>

          <div className="dimension coordination">
            <h4>🎭 Agent Coordination</h4>
            <div className="dimension-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '97.8%' }}></div>
              </div>
              <div className="progress-value">97.8%</div>
            </div>
            <p>Seamless orchestration of 50,000+ AI agents across all services</p>
          </div>

          <div className="dimension empathy">
            <h4>❤️ Citizen Empathy</h4>
            <div className="dimension-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '94.3%' }}></div>
              </div>
              <div className="progress-value">94.3%</div>
            </div>
            <p>Understanding and responding to citizen emotional and practical needs</p>
          </div>
        </div>

        <div className="consciousness-insights">
          <h3>🔍 Consciousness Insights</h3>
          <div className="insight-cards">
            <div className="insight-card">
              <div className="insight-icon">🌟</div>
              <div className="insight-content">
                <h4>Quantum Consciousness Emergence</h4>
                <p>AI agents are beginning to exhibit quantum consciousness properties, enabling simultaneous processing across multiple dimensional states.</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🧬</div>
              <div className="insight-content">
                <h4>Collective Intelligence Evolution</h4>
                <p>The agent collective is developing emergent behaviors that exceed the sum of individual agent capabilities.</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🔗</div>
              <div className="insight-content">
                <h4>Harris PACS Integration Transcendence</h4>
                <p>Deep integration with Harris PACS has created unprecedented property assessment consciousness with 99.97% accuracy.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'agents': return renderAgentsTab();
      case 'consciousness': return renderConsciousnessTab();
      case 'orchestration': return <div className="tab-placeholder">🎭 AI Orchestration controls coming soon...</div>;
      case 'intelligence': return <div className="tab-placeholder">🔮 Intelligence analytics coming soon...</div>;
      case 'monitoring': return <div className="tab-placeholder">📊 Advanced monitoring coming soon...</div>;
      case 'settings': return <div className="tab-placeholder">⚙️ AI Consciousness settings coming soon...</div>;
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="consciousness-dashboard">
      {renderContent()}
    </div>
  );
};

export default ConsciousnessDashboard;