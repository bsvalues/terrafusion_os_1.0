import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Zap, 
  Lock,
  Globe,
  Target,
  TrendingUp,
  Clock,
  Users,
  Database,
  Wifi,
  Server,
  Brain
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import './SecurityDashboard.css';

interface SecurityMetrics {
  threatsDetected: number;
  threatsNeutralized: number;
  activeMonitoring: number;
  systemHealth: number;
  quantumSecurity: string;
  aiAgents: number;
  incidentsToday: number;
  responseTime: string;
}

interface ThreatData {
  time: string;
  threats: number;
  blocked: number;
  investigated: number;
}

interface SecurityEvent {
  id: string;
  type: 'threat' | 'incident' | 'alert' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  status: 'active' | 'investigating' | 'resolved';
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatsDetected: 2847293,
    threatsNeutralized: 2847293,
    activeMonitoring: 15847,
    systemHealth: 99.8,
    quantumSecurity: 'ACTIVE',
    aiAgents: 15847,
    incidentsToday: 0,
    responseTime: '0.3ms'
  });

  const [threatData] = useState<ThreatData[]>([
    { time: '00:00', threats: 142, blocked: 142, investigated: 8 },
    { time: '04:00', threats: 89, blocked: 89, investigated: 12 },
    { time: '08:00', threats: 234, blocked: 234, investigated: 15 },
    { time: '12:00', threats: 178, blocked: 178, investigated: 9 },
    { time: '16:00', threats: 156, blocked: 156, investigated: 11 },
    { time: '20:00', threats: 203, blocked: 203, investigated: 7 },
    { time: '24:00', threats: 98, blocked: 98, investigated: 5 }
  ]);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'success',
      severity: 'low',
      title: 'Quantum Encryption Updated',
      description: 'All quantum security protocols successfully updated and verified',
      timestamp: new Date().toISOString(),
      source: 'Quantum Security Module',
      status: 'resolved'
    },
    {
      id: '2',
      type: 'alert',
      severity: 'medium',
      title: 'Unusual Network Pattern',
      description: 'AI detected anomalous traffic pattern from external source',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      source: 'AI Threat Detection',
      status: 'investigating'
    },
    {
      id: '3',
      type: 'success',
      severity: 'low',
      title: 'Security Scan Complete',
      description: 'Full system security scan completed - no threats detected',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      source: 'Security Scanner',
      status: 'resolved'
    }
  ]);

  const threatDistribution = [
    { name: 'Malware', value: 45, color: '#ff4444' },
    { name: 'Phishing', value: 30, color: '#ffaa00' },
    { name: 'Intrusion', value: 15, color: '#00ffaa' },
    { name: 'DDoS', value: 10, color: '#0099ff' }
  ];

  const systemComponents = [
    { name: 'Network Security', status: 'optimal', value: 100 },
    { name: 'Endpoint Protection', status: 'optimal', value: 99.9 },
    { name: 'Data Encryption', status: 'optimal', value: 100 },
    { name: 'Access Control', status: 'optimal', value: 99.8 },
    { name: 'Quantum Defense', status: 'optimal', value: 100 },
    { name: 'AI Monitoring', status: 'optimal', value: 99.9 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        threatsDetected: prev.threatsDetected + Math.floor(Math.random() * 3),
        threatsNeutralized: prev.threatsNeutralized + Math.floor(Math.random() * 3),
        activeMonitoring: 15847 + Math.floor(Math.random() * 100 - 50)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ffaa00';
      case 'medium': return '#0099ff';
      case 'low': return '#44ff44';
      default: return '#666666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#ff4444';
      case 'investigating': return '#ffaa00';
      case 'resolved': return '#44ff44';
      default: return '#666666';
    }
  };

  return (
    <div className="security-dashboard">
      {/* Critical Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card threats">
          <div className="metric-header">
            <Shield className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Threats Neutralized</div>
              <div className="metric-subtitle">Total Protection</div>
            </div>
          </div>
          <div className="metric-value">{metrics.threatsNeutralized.toLocaleString()}</div>
          <div className="metric-trend positive">
            <TrendingUp size={16} />
            <span>100% Success Rate</span>
          </div>
        </div>

        <div className="metric-card monitoring">
          <div className="metric-header">
            <Eye className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Active Monitoring</div>
              <div className="metric-subtitle">AI Agents Online</div>
            </div>
          </div>
          <div className="metric-value">{metrics.activeMonitoring.toLocaleString()}</div>
          <div className="metric-trend positive">
            <Activity size={16} />
            <span>Real-time Protection</span>
          </div>
        </div>

        <div className="metric-card quantum">
          <div className="metric-header">
            <Zap className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Quantum Security</div>
              <div className="metric-subtitle">Advanced Protection</div>
            </div>
          </div>
          <div className="metric-value">{metrics.quantumSecurity}</div>
          <div className="metric-trend positive">
            <Lock size={16} />
            <span>Quantum Encrypted</span>
          </div>
        </div>

        <div className="metric-card response">
          <div className="metric-header">
            <Clock className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Response Time</div>
              <div className="metric-subtitle">Average Detection</div>
            </div>
          </div>
          <div className="metric-value">{metrics.responseTime}</div>
          <div className="metric-trend positive">
            <Target size={16} />
            <span>Ultra-fast Response</span>
          </div>
        </div>
      </div>

      {/* Security Analytics Section */}
      <div className="analytics-section">
        <div className="analytics-left">
          {/* Threat Timeline */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>24-Hour Threat Activity</h3>
              <div className="chart-legend">
                <span className="legend-item">
                  <div className="legend-color" style={{ background: '#0099ff' }}></div>
                  Threats Detected
                </span>
                <span className="legend-item">
                  <div className="legend-color" style={{ background: '#44ff44' }}></div>
                  Threats Blocked
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={threatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid #0099ff',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="threats" 
                  stroke="#0099ff" 
                  fill="rgba(0,153,255,0.3)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#44ff44" 
                  fill="rgba(68,255,68,0.3)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* System Health Matrix */}
          <div className="system-health">
            <h3>Security Component Status</h3>
            <div className="health-grid">
              {systemComponents.map((component, index) => (
                <div key={index} className="health-item">
                  <div className="health-info">
                    <div className="health-name">{component.name}</div>
                    <div className="health-value">{component.value}%</div>
                  </div>
                  <div className="health-bar">
                    <div 
                      className="health-fill" 
                      style={{ 
                        width: `${component.value}%`,
                        background: component.value > 99 ? '#44ff44' : 
                                  component.value > 95 ? '#ffaa00' : '#ff4444'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-right">
          {/* Threat Distribution */}
          <div className="threat-distribution">
            <h3>Threat Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* AI Security Agents */}
          <div className="ai-agents-status">
            <h3>AI Security Agents</h3>
            <div className="agents-grid">
              <div className="agent-category">
                <Brain className="agent-icon" />
                <div className="agent-info">
                  <div className="agent-name">Threat Detection AI</div>
                  <div className="agent-count">4,892 Agents</div>
                  <div className="agent-status active">Active</div>
                </div>
              </div>
              <div className="agent-category">
                <Shield className="agent-icon" />
                <div className="agent-info">
                  <div className="agent-name">Defense Coordination</div>
                  <div className="agent-count">2,145 Agents</div>
                  <div className="agent-status active">Active</div>
                </div>
              </div>
              <div className="agent-category">
                <Eye className="agent-icon" />
                <div className="agent-info">
                  <div className="agent-name">Monitoring Systems</div>
                  <div className="agent-count">6,234 Agents</div>
                  <div className="agent-status active">Active</div>
                </div>
              </div>
              <div className="agent-category">
                <Zap className="agent-icon" />
                <div className="agent-info">
                  <div className="agent-name">Quantum Security</div>
                  <div className="agent-count">2,576 Agents</div>
                  <div className="agent-status active">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Events Feed */}
      <div className="events-section">
        <div className="events-header">
          <h3>Live Security Events</h3>
          <div className="events-controls">
            <button className="events-filter active">All Events</button>
            <button className="events-filter">Critical</button>
            <button className="events-filter">Threats</button>
            <button className="events-filter">Incidents</button>
          </div>
        </div>
        <div className="events-feed">
          {securityEvents.map(event => (
            <div key={event.id} className={`event-item ${event.type}`}>
              <div className="event-indicator">
                <div 
                  className="event-severity" 
                  style={{ background: getSeverityColor(event.severity) }}
                ></div>
              </div>
              <div className="event-content">
                <div className="event-header">
                  <div className="event-title">{event.title}</div>
                  <div className="event-meta">
                    <span className="event-source">{event.source}</span>
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="event-description">{event.description}</div>
                <div className="event-footer">
                  <div 
                    className="event-status" 
                    style={{ color: getStatusColor(event.status) }}
                  >
                    {event.status.toUpperCase()}
                  </div>
                  <div className="event-severity-badge" style={{ background: getSeverityColor(event.severity) }}>
                    {event.severity.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Status Bar */}
      <div className="status-bar">
        <div className="status-group">
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>All Systems Operational</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>Quantum Protection Active</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>AI Agents Online</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>Global Monitoring Active</span>
          </div>
        </div>
        <div className="last-updated">
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;