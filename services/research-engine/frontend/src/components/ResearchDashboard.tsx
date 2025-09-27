import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Activity, 
  Zap, 
  TrendingUp, 
  Users, 
  Brain, 
  FileText, 
  Target,
  Timer,
  Layers,
  Network,
  BarChart3,
  PieChart,
  ArrowRight,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Cpu,
  Globe
} from 'lucide-react';
import './ResearchDashboard.css';

interface ResearchMetrics {
  totalResearch: number;
  activeAgents: number;
  completedTasks: number;
  dataProcessed: string;
  avgProcessingTime: string;
  successRate: number;
  aiInsights: number;
  researchProjects: number;
}

interface ActiveResearch {
  id: string;
  title: string;
  type: 'autonomous' | 'guided' | 'collaborative';
  status: 'running' | 'paused' | 'completing';
  progress: number;
  assignedAgents: number;
  estimatedCompletion: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIAgent {
  id: string;
  name: string;
  type: 'researcher' | 'analyst' | 'coordinator' | 'specialist';
  status: 'active' | 'idle' | 'busy' | 'offline';
  currentTask: string;
  efficiency: number;
  tasksCompleted: number;
}

const ResearchDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ResearchMetrics>({
    totalResearch: 0,
    activeAgents: 0,
    completedTasks: 0,
    dataProcessed: '0 TB',
    avgProcessingTime: '0ms',
    successRate: 0,
    aiInsights: 0,
    researchProjects: 0
  });

  const [activeResearch, setActiveResearch] = useState<ActiveResearch[]>([]);
  const [topAgents, setTopAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching research metrics and data
    const fetchDashboardData = async () => {
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1500));

        setMetrics({
          totalResearch: 847,
          activeAgents: 156,
          completedTasks: 12892,
          dataProcessed: '2.7 TB',
          avgProcessingTime: '340ms',
          successRate: 94.7,
          aiInsights: 3421,
          researchProjects: 89
        });

        setActiveResearch([
          {
            id: 'res_001',
            title: 'Autonomous Climate Data Analysis',
            type: 'autonomous',
            status: 'running',
            progress: 67,
            assignedAgents: 12,
            estimatedCompletion: '2h 15m',
            priority: 'high'
          },
          {
            id: 'res_002',
            title: 'Government Policy Impact Study',
            type: 'guided',
            status: 'running',
            progress: 34,
            assignedAgents: 8,
            estimatedCompletion: '4h 30m',
            priority: 'medium'
          },
          {
            id: 'res_003',
            title: 'Multi-Source Data Correlation',
            type: 'collaborative',
            status: 'completing',
            progress: 91,
            assignedAgents: 15,
            estimatedCompletion: '45m',
            priority: 'high'
          },
          {
            id: 'res_004',
            title: 'Predictive Modeling Framework',
            type: 'autonomous',
            status: 'paused',
            progress: 23,
            assignedAgents: 6,
            estimatedCompletion: '6h 20m',
            priority: 'low'
          }
        ]);

        setTopAgents([
          {
            id: 'agent_001',
            name: 'Research-Alpha-7',
            type: 'researcher',
            status: 'active',
            currentTask: 'Data Collection',
            efficiency: 97.8,
            tasksCompleted: 1247
          },
          {
            id: 'agent_002',
            name: 'Analyst-Beta-12',
            type: 'analyst',
            status: 'busy',
            currentTask: 'Pattern Analysis',
            efficiency: 94.2,
            tasksCompleted: 896
          },
          {
            id: 'agent_003',
            name: 'Coordinator-Gamma-3',
            type: 'coordinator',
            status: 'active',
            currentTask: 'Task Orchestration',
            efficiency: 96.5,
            tasksCompleted: 2341
          },
          {
            id: 'agent_004',
            name: 'Specialist-Delta-9',
            type: 'specialist',
            status: 'active',
            currentTask: 'Deep Learning',
            efficiency: 98.9,
            tasksCompleted: 567
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalResearch: prev.totalResearch + Math.floor(Math.random() * 3),
        completedTasks: prev.completedTasks + Math.floor(Math.random() * 5),
        avgProcessingTime: `${Math.floor(Math.random() * 100 + 300)}ms`
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <Activity className="status-icon running" />;
      case 'paused':
        return <Clock className="status-icon paused" />;
      case 'completing':
        return <CheckCircle className="status-icon completing" />;
      case 'busy':
        return <Zap className="status-icon busy" />;
      case 'idle':
        return <Timer className="status-icon idle" />;
      default:
        return <AlertCircle className="status-icon offline" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#feca57';
      case 'low':
        return '#48dbfb';
      default:
        return '#ffffff';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'autonomous':
        return '🤖';
      case 'guided':
        return '🧭';
      case 'collaborative':
        return '👥';
      case 'researcher':
        return '🔬';
      case 'analyst':
        return '📊';
      case 'coordinator':
        return '🎯';
      case 'specialist':
        return '🧠';
      default:
        return '⚙️';
    }
  };

  if (loading) {
    return (
      <div className="research-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Research Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="research-dashboard">
      {/* Header Stats */}
      <div className="dashboard-header">
        <div className="header-stats">
          <div className="stat-card primary">
            <div className="stat-icon">
              <Search />
            </div>
            <div className="stat-content">
              <div className="stat-value">{metrics.totalResearch.toLocaleString()}</div>
              <div className="stat-label">Total Research</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <Users />
            </div>
            <div className="stat-content">
              <div className="stat-value">{metrics.activeAgents}</div>
              <div className="stat-label">Active AI Agents</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <Target />
            </div>
            <div className="stat-content">
              <div className="stat-value">{metrics.completedTasks.toLocaleString()}</div>
              <div className="stat-label">Completed Tasks</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <Database />
            </div>
            <div className="stat-content">
              <div className="stat-value">{metrics.dataProcessed}</div>
              <div className="stat-label">Data Processed</div>
            </div>
          </div>

          <div className="stat-card accent">
            <div className="stat-icon">
              <TrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-value">{metrics.successRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>

          <div className="stat-card secondary">
            <div className="stat-icon">
              <Brain />
            </div>
            <div className="stat-content">
              <div className="stat-value">{metrics.aiInsights.toLocaleString()}</div>
              <div className="stat-label">AI Insights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="content-grid">
          {/* Active Research */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>
                <Activity className="section-icon" />
                Active Research Projects
              </h3>
              <button className="view-all-btn">
                View All <ArrowRight size={16} />
              </button>
            </div>
            <div className="research-list">
              {activeResearch.map(research => (
                <div key={research.id} className={`research-item ${research.status}`}>
                  <div className="research-header">
                    <div className="research-info">
                      <div className="research-title">
                        <span className="type-icon">{getTypeIcon(research.type)}</span>
                        {research.title}
                      </div>
                      <div className="research-meta">
                        <span className="research-type">{research.type}</span>
                        <span 
                          className="research-priority"
                          style={{ borderColor: getPriorityColor(research.priority) }}
                        >
                          {research.priority}
                        </span>
                      </div>
                    </div>
                    <div className="research-status">
                      {getStatusIcon(research.status)}
                      <span className="status-text">{research.status}</span>
                    </div>
                  </div>
                  <div className="research-progress">
                    <div className="progress-info">
                      <span>Progress: {research.progress}%</span>
                      <span>ETA: {research.estimatedCompletion}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${research.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="research-agents">
                    <Users size={14} />
                    <span>{research.assignedAgents} agents assigned</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing AI Agents */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>
                <Brain className="section-icon" />
                Top Performing AI Agents
              </h3>
              <button className="view-all-btn">
                Manage Agents <ArrowRight size={16} />
              </button>
            </div>
            <div className="agents-list">
              {topAgents.map(agent => (
                <div key={agent.id} className={`agent-item ${agent.status}`}>
                  <div className="agent-header">
                    <div className="agent-info">
                      <div className="agent-name">
                        <span className="agent-icon">{getTypeIcon(agent.type)}</span>
                        {agent.name}
                      </div>
                      <div className="agent-type">{agent.type}</div>
                    </div>
                    <div className="agent-status">
                      {getStatusIcon(agent.status)}
                      <span className="status-text">{agent.status}</span>
                    </div>
                  </div>
                  <div className="agent-details">
                    <div className="current-task">
                      <FileText size={14} />
                      <span>{agent.currentTask}</span>
                    </div>
                    <div className="agent-metrics">
                      <div className="metric">
                        <span className="metric-label">Efficiency:</span>
                        <span className="metric-value">{agent.efficiency}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Tasks:</span>
                        <span className="metric-value">{agent.tasksCompleted.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Performance Analytics */}
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h3>
                <BarChart3 className="section-icon" />
                Research Performance Analytics
              </h3>
              <div className="analytics-controls">
                <select className="time-selector">
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                <button className="analytics-btn">
                  <Settings size={16} />
                  Configure
                </button>
              </div>
            </div>
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="card-header">
                  <h4>Research Throughput</h4>
                  <TrendingUp className="card-icon" />
                </div>
                <div className="card-content">
                  <div className="throughput-chart">
                    <div className="chart-placeholder">
                      <PieChart size={80} />
                      <div className="chart-label">Real-time Analytics</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h4>Agent Performance</h4>
                  <Cpu className="card-icon" />
                </div>
                <div className="card-content">
                  <div className="performance-metrics">
                    <div className="metric-row">
                      <span>Avg Processing Time:</span>
                      <span className="metric-highlight">{metrics.avgProcessingTime}</span>
                    </div>
                    <div className="metric-row">
                      <span>Task Success Rate:</span>
                      <span className="metric-highlight">{metrics.successRate}%</span>
                    </div>
                    <div className="metric-row">
                      <span>Active Projects:</span>
                      <span className="metric-highlight">{metrics.researchProjects}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h4>Research Insights</h4>
                  <Network className="card-icon" />
                </div>
                <div className="card-content">
                  <div className="insights-list">
                    <div className="insight-item">
                      <Globe size={16} />
                      <span>Cross-domain correlation detected</span>
                    </div>
                    <div className="insight-item">
                      <Brain size={16} />
                      <span>AI optimization suggested</span>
                    </div>
                    <div className="insight-item">
                      <Layers size={16} />
                      <span>Data patterns identified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="dashboard-footer">
        <div className="quick-actions-grid">
          <button className="quick-action primary">
            <Search size={20} />
            <span>New Research</span>
          </button>
          <button className="quick-action success">
            <Users size={20} />
            <span>Deploy Agents</span>
          </button>
          <button className="quick-action warning">
            <Target size={20} />
            <span>Create Task</span>
          </button>
          <button className="quick-action info">
            <BarChart3 size={20} />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;