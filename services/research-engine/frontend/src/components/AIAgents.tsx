import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Brain, 
  Zap, 
  Activity, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Cpu,
  Network,
  Database,
  Code,
  FileText,
  Globe,
  Layers,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import './AIAgents.css';

interface AIAgent {
  id: string;
  name: string;
  type: 'researcher' | 'analyst' | 'coordinator' | 'specialist' | 'explorer' | 'validator';
  status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
  currentTask: string;
  efficiency: number;
  tasksCompleted: number;
  uptime: string;
  memory: number;
  cpu: number;
  capabilities: string[];
  specialization: string;
  version: string;
  lastActivity: string;
  totalProcessed: string;
  successRate: number;
}

interface AgentDeployment {
  name: string;
  type: string;
  specialization: string;
  autoStart: boolean;
  priority: 'high' | 'medium' | 'low';
}

const AIAgents: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('efficiency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [deployment, setDeployment] = useState<AgentDeployment>({
    name: '',
    type: 'researcher',
    specialization: '',
    autoStart: true,
    priority: 'medium'
  });

  useEffect(() => {
    // Simulate fetching AI agents data
    const fetchAgents = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockAgents: AIAgent[] = [
          {
            id: 'agent_001',
            name: 'Research-Alpha-7',
            type: 'researcher',
            status: 'active',
            currentTask: 'Climate Data Collection',
            efficiency: 97.8,
            tasksCompleted: 1247,
            uptime: '15d 7h 23m',
            memory: 78,
            cpu: 45,
            capabilities: ['Data Mining', 'Pattern Recognition', 'Natural Language Processing'],
            specialization: 'Environmental Research',
            version: 'v2.3.1',
            lastActivity: '2 minutes ago',
            totalProcessed: '2.4 TB',
            successRate: 98.2
          },
          {
            id: 'agent_002',
            name: 'Analyst-Beta-12',
            type: 'analyst',
            status: 'busy',
            currentTask: 'Statistical Pattern Analysis',
            efficiency: 94.2,
            tasksCompleted: 896,
            uptime: '8d 12h 45m',
            memory: 65,
            cpu: 72,
            capabilities: ['Statistical Analysis', 'Data Visualization', 'Predictive Modeling'],
            specialization: 'Government Analytics',
            version: 'v1.8.9',
            lastActivity: '5 minutes ago',
            totalProcessed: '1.8 TB',
            successRate: 96.7
          },
          {
            id: 'agent_003',
            name: 'Coordinator-Gamma-3',
            type: 'coordinator',
            status: 'active',
            currentTask: 'Multi-Agent Task Orchestration',
            efficiency: 96.5,
            tasksCompleted: 2341,
            uptime: '22d 3h 15m',
            memory: 82,
            cpu: 38,
            capabilities: ['Task Management', 'Resource Allocation', 'Agent Communication'],
            specialization: 'System Coordination',
            version: 'v3.1.2',
            lastActivity: '1 minute ago',
            totalProcessed: '4.2 TB',
            successRate: 99.1
          },
          {
            id: 'agent_004',
            name: 'Specialist-Delta-9',
            type: 'specialist',
            status: 'active',
            currentTask: 'Deep Learning Model Training',
            efficiency: 98.9,
            tasksCompleted: 567,
            uptime: '5d 18h 32m',
            memory: 91,
            cpu: 89,
            capabilities: ['Machine Learning', 'Neural Networks', 'AI Model Training'],
            specialization: 'AI Development',
            version: 'v4.0.1',
            lastActivity: '30 seconds ago',
            totalProcessed: '892 GB',
            successRate: 99.6
          },
          {
            id: 'agent_005',
            name: 'Explorer-Epsilon-6',
            type: 'explorer',
            status: 'idle',
            currentTask: 'Standby',
            efficiency: 91.3,
            tasksCompleted: 734,
            uptime: '11d 9h 41m',
            memory: 23,
            cpu: 15,
            capabilities: ['Web Scraping', 'API Integration', 'Data Discovery'],
            specialization: 'Data Exploration',
            version: 'v2.7.3',
            lastActivity: '1 hour ago',
            totalProcessed: '1.3 TB',
            successRate: 94.8
          },
          {
            id: 'agent_006',
            name: 'Validator-Zeta-11',
            type: 'validator',
            status: 'error',
            currentTask: 'Error Recovery',
            efficiency: 87.6,
            tasksCompleted: 445,
            uptime: '2d 14h 22m',
            memory: 56,
            cpu: 12,
            capabilities: ['Data Validation', 'Quality Assurance', 'Error Detection'],
            specialization: 'Quality Control',
            version: 'v1.9.4',
            lastActivity: '15 minutes ago',
            totalProcessed: '678 GB',
            successRate: 97.3
          }
        ];

        setAgents(mockAgents);
        setFilteredAgents(mockAgents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setLoading(false);
      }
    };

    fetchAgents();

    // Set up real-time updates
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        memory: Math.max(10, Math.min(95, agent.memory + (Math.random() - 0.5) * 10)),
        cpu: Math.max(5, Math.min(95, agent.cpu + (Math.random() - 0.5) * 15)),
        efficiency: Math.max(80, Math.min(100, agent.efficiency + (Math.random() - 0.5) * 2))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.currentTask.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      const matchesType = typeFilter === 'all' || agent.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort agents
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'efficiency':
          aValue = a.efficiency;
          bValue = b.efficiency;
          break;
        case 'tasks':
          aValue = a.tasksCompleted;
          bValue = b.tasksCompleted;
          break;
        case 'uptime':
          aValue = a.uptime;
          bValue = b.uptime;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'memory':
          aValue = a.memory;
          bValue = b.memory;
          break;
        case 'cpu':
          aValue = a.cpu;
          bValue = b.cpu;
          break;
        default:
          aValue = a.efficiency;
          bValue = b.efficiency;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredAgents(filtered);
  }, [agents, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="status-icon active" />;
      case 'busy':
        return <Zap className="status-icon busy" />;
      case 'idle':
        return <Clock className="status-icon idle" />;
      case 'error':
        return <AlertCircle className="status-icon error" />;
      default:
        return <CheckCircle className="status-icon offline" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'researcher':
        return '🔬';
      case 'analyst':
        return '📊';
      case 'coordinator':
        return '🎯';
      case 'specialist':
        return '🧠';
      case 'explorer':
        return '🌐';
      case 'validator':
        return '✅';
      default:
        return '⚙️';
    }
  };

  const handleAgentAction = (agentId: string, action: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        switch (action) {
          case 'start':
            return { ...agent, status: 'active' as const };
          case 'pause':
            return { ...agent, status: 'idle' as const };
          case 'stop':
            return { ...agent, status: 'offline' as const };
          case 'restart':
            return { ...agent, status: 'active' as const, currentTask: 'Initializing...' };
          default:
            return agent;
        }
      }
      return agent;
    }));
  };

  const handleDeployAgent = () => {
    const newAgent: AIAgent = {
      id: `agent_${Date.now()}`,
      name: deployment.name || `Agent-${Date.now()}`,
      type: deployment.type as any,
      status: deployment.autoStart ? 'active' : 'idle',
      currentTask: deployment.autoStart ? 'Initializing...' : 'Standby',
      efficiency: 85 + Math.random() * 10,
      tasksCompleted: 0,
      uptime: '0d 0h 0m',
      memory: 20 + Math.random() * 30,
      cpu: 10 + Math.random() * 20,
      capabilities: ['Basic Operations', 'Data Processing'],
      specialization: deployment.specialization || 'General Purpose',
      version: 'v1.0.0',
      lastActivity: 'Just deployed',
      totalProcessed: '0 MB',
      successRate: 100
    };

    setAgents(prev => [...prev, newAgent]);
    setShowDeployModal(false);
    setDeployment({
      name: '',
      type: 'researcher',
      specialization: '',
      autoStart: true,
      priority: 'medium'
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <div className="ai-agents loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading AI Agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-agents">
      {/* Header Controls */}
      <div className="agents-header">
        <div className="header-info">
          <h2>
            <Brain className="header-icon" />
            AI Agent Management
          </h2>
          <div className="agent-summary">
            <span className="summary-item">
              <Users size={16} />
              {agents.length} Total Agents
            </span>
            <span className="summary-item">
              <Activity size={16} />
              {agents.filter(a => a.status === 'active').length} Active
            </span>
            <span className="summary-item">
              <Zap size={16} />
              {agents.filter(a => a.status === 'busy').length} Busy
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="deploy-btn"
            onClick={() => setShowDeployModal(true)}
          >
            <Plus size={16} />
            Deploy New Agent
          </button>
          <button className="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="agents-controls">
        <div className="search-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search agents by name, task, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <Filter size={16} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="busy">Busy</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="researcher">Researcher</option>
              <option value="analyst">Analyst</option>
              <option value="coordinator">Coordinator</option>
              <option value="specialist">Specialist</option>
              <option value="explorer">Explorer</option>
              <option value="validator">Validator</option>
            </select>
          </div>

          <div className="sort-group">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="efficiency">Efficiency</option>
              <option value="tasks">Tasks Completed</option>
              <option value="uptime">Uptime</option>
              <option value="name">Name</option>
              <option value="memory">Memory Usage</option>
              <option value="cpu">CPU Usage</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={toggleSortOrder}
            >
              {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="agents-grid">
        {filteredAgents.map(agent => (
          <div 
            key={agent.id} 
            className={`agent-card ${agent.status} ${selectedAgent === agent.id ? 'selected' : ''}`}
            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
          >
            <div className="agent-card-header">
              <div className="agent-identity">
                <div className="agent-avatar">
                  <span className="type-icon">{getTypeIcon(agent.type)}</span>
                </div>
                <div className="agent-info">
                  <h3 className="agent-name">{agent.name}</h3>
                  <div className="agent-meta">
                    <span className="agent-type">{agent.type}</span>
                    <span className="agent-version">{agent.version}</span>
                  </div>
                </div>
              </div>
              
              <div className="agent-status-section">
                {getStatusIcon(agent.status)}
                <span className="status-text">{agent.status}</span>
              </div>
            </div>

            <div className="agent-card-body">
              <div className="current-task">
                <FileText size={14} />
                <span>{agent.currentTask}</span>
              </div>

              <div className="agent-specialization">
                <Target size={14} />
                <span>{agent.specialization}</span>
              </div>

              <div className="agent-metrics-grid">
                <div className="metric-item">
                  <div className="metric-label">Efficiency</div>
                  <div className="metric-value efficiency">{agent.efficiency.toFixed(1)}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Tasks</div>
                  <div className="metric-value">{agent.tasksCompleted.toLocaleString()}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Uptime</div>
                  <div className="metric-value">{agent.uptime}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Success Rate</div>
                  <div className="metric-value success">{agent.successRate.toFixed(1)}%</div>
                </div>
              </div>

              <div className="resource-usage">
                <div className="resource-item">
                  <div className="resource-label">
                    <Cpu size={14} />
                    CPU: {agent.cpu}%
                  </div>
                  <div className="resource-bar">
                    <div 
                      className="resource-fill cpu"
                      style={{ width: `${agent.cpu}%` }}
                    ></div>
                  </div>
                </div>
                <div className="resource-item">
                  <div className="resource-label">
                    <Database size={14} />
                    Memory: {agent.memory}%
                  </div>
                  <div className="resource-bar">
                    <div 
                      className="resource-fill memory"
                      style={{ width: `${agent.memory}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {selectedAgent === agent.id && (
                <div className="agent-details">
                  <div className="capabilities">
                    <h4>Capabilities</h4>
                    <div className="capability-tags">
                      {agent.capabilities.map((capability, index) => (
                        <span key={index} className="capability-tag">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="performance-stats">
                    <div className="stat-row">
                      <span>Total Processed:</span>
                      <span>{agent.totalProcessed}</span>
                    </div>
                    <div className="stat-row">
                      <span>Last Activity:</span>
                      <span>{agent.lastActivity}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="agent-card-footer">
              <div className="agent-actions">
                {agent.status === 'offline' || agent.status === 'error' ? (
                  <button 
                    className="action-btn start"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgentAction(agent.id, 'start');
                    }}
                  >
                    <Play size={14} />
                    Start
                  </button>
                ) : agent.status === 'idle' ? (
                  <button 
                    className="action-btn start"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgentAction(agent.id, 'start');
                    }}
                  >
                    <Play size={14} />
                    Activate
                  </button>
                ) : (
                  <button 
                    className="action-btn pause"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgentAction(agent.id, 'pause');
                    }}
                  >
                    <Pause size={14} />
                    Pause
                  </button>
                )}
                
                <button 
                  className="action-btn restart"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agent.id, 'restart');
                  }}
                >
                  <RefreshCw size={14} />
                  Restart
                </button>
                
                <button 
                  className="action-btn stop"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agent.id, 'stop');
                  }}
                >
                  <Square size={14} />
                  Stop
                </button>
                
                <button className="action-btn config">
                  <Settings size={14} />
                  Config
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="no-agents">
          <Brain size={64} />
          <h3>No agents found</h3>
          <p>Try adjusting your search criteria or deploy a new agent.</p>
        </div>
      )}

      {/* Deploy Agent Modal */}
      {showDeployModal && (
        <div className="modal-overlay">
          <div className="deploy-modal">
            <div className="modal-header">
              <h3>Deploy New AI Agent</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDeployModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Agent Name</label>
                <input
                  type="text"
                  placeholder="Enter agent name..."
                  value={deployment.name}
                  onChange={(e) => setDeployment(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Agent Type</label>
                <select
                  value={deployment.type}
                  onChange={(e) => setDeployment(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="researcher">Researcher</option>
                  <option value="analyst">Analyst</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="specialist">Specialist</option>
                  <option value="explorer">Explorer</option>
                  <option value="validator">Validator</option>
                </select>
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  placeholder="Enter specialization area..."
                  value={deployment.specialization}
                  onChange={(e) => setDeployment(prev => ({ ...prev, specialization: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select
                  value={deployment.priority}
                  onChange={(e) => setDeployment(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={deployment.autoStart}
                    onChange={(e) => setDeployment(prev => ({ ...prev, autoStart: e.target.checked }))}
                  />
                  Auto-start agent after deployment
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeployModal(false)}
              >
                Cancel
              </button>
              <button 
                className="deploy-btn"
                onClick={handleDeployAgent}
              >
                <Plus size={16} />
                Deploy Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;