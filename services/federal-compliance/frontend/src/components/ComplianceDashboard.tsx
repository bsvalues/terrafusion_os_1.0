import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Scale,
  BookOpen,
  Eye,
  Target,
  BarChart3,
  Users,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2
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
  AreaChart,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import './ComplianceDashboard.css';

interface ComplianceMetrics {
  overallScore: number;
  totalRegulations: number;
  activeAudits: number;
  violations: number;
  remediationTime: string;
  fismaStatus: string;
  nistLevel: string;
  fedRampStatus: string;
}

interface ComplianceFramework {
  name: string;
  score: number;
  status: 'compliant' | 'minor-issues' | 'major-issues' | 'critical';
  lastAudit: string;
  controls: number;
  implemented: number;
}

interface Violation {
  id: string;
  framework: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  discoveredDate: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'resolved';
  assignee: string;
}

const ComplianceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    overallScore: 98.9,
    totalRegulations: 15642,
    activeAudits: 847,
    violations: 23,
    remediationTime: '4.2 hours',
    fismaStatus: 'FULLY_COMPLIANT',
    nistLevel: 'ADVANCED',
    fedRampStatus: 'AUTHORIZED'
  });

  const [frameworks] = useState<ComplianceFramework[]>([
    {
      name: 'FISMA',
      score: 99.4,
      status: 'compliant',
      lastAudit: '2025-09-08',
      controls: 847,
      implemented: 844
    },
    {
      name: 'NIST Cybersecurity Framework',
      score: 96.7,
      status: 'compliant',
      lastAudit: '2025-08-25',
      controls: 2847,
      implemented: 2831
    },
    {
      name: 'FedRAMP',
      score: 98.2,
      status: 'compliant',
      lastAudit: '2025-08-15',
      controls: 1247,
      implemented: 1245
    },
    {
      name: 'SOX Compliance',
      score: 94.8,
      status: 'minor-issues',
      lastAudit: '2025-09-01',
      controls: 324,
      implemented: 319
    },
    {
      name: 'HIPAA',
      score: 97.3,
      status: 'compliant',
      lastAudit: '2025-08-30',
      controls: 164,
      implemented: 162
    },
    {
      name: 'Section 508',
      score: 92.1,
      status: 'minor-issues',
      lastAudit: '2025-09-05',
      controls: 89,
      implemented: 85
    }
  ]);

  const [violations] = useState<Violation[]>([
    {
      id: '1',
      framework: 'SOX',
      severity: 'medium',
      title: 'Financial Data Access Log Retention',
      description: 'Financial system access logs not retained for required 7-year period',
      discoveredDate: '2025-09-10',
      dueDate: '2025-09-24',
      status: 'in-progress',
      assignee: 'Security Team Alpha'
    },
    {
      id: '2',
      framework: 'Section 508',
      severity: 'low',
      title: 'Web Accessibility Compliance',
      description: 'Minor accessibility issues in government portal forms',
      discoveredDate: '2025-09-12',
      dueDate: '2025-09-26',
      status: 'open',
      assignee: 'Web Development Team'
    },
    {
      id: '3',
      framework: 'NIST',
      severity: 'low',
      title: 'Password Policy Update',
      description: 'Password complexity requirements need minor adjustment',
      discoveredDate: '2025-09-08',
      dueDate: '2025-09-22',
      status: 'in-progress',
      assignee: 'IAM Team'
    }
  ]);

  const complianceTrends = [
    { month: 'Mar', score: 96.2, violations: 45, audits: 234 },
    { month: 'Apr', score: 97.1, violations: 38, audits: 267 },
    { month: 'May', score: 97.8, violations: 32, audits: 289 },
    { month: 'Jun', score: 98.3, violations: 28, audits: 312 },
    { month: 'Jul', score: 98.6, violations: 25, audits: 334 },
    { month: 'Aug', score: 98.9, violations: 23, audits: 347 },
    { month: 'Sep', score: 98.9, violations: 23, audits: 347 }
  ];

  const frameworkDistribution = [
    { name: 'FISMA', value: 35, color: '#0099ff' },
    { name: 'NIST', value: 25, color: '#00ffaa' },
    { name: 'FedRAMP', value: 20, color: '#ffd700' },
    { name: 'SOX', value: 10, color: '#ff6b6b' },
    { name: 'Other', value: 10, color: '#a8a8a8' }
  ];

  const riskLevels = [
    { name: 'Low Risk', value: 85, fill: '#44ff44' },
    { name: 'Medium Risk', value: 12, fill: '#ffaa00' },
    { name: 'High Risk', value: 3, fill: '#ff4444' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeAudits: 847 + Math.floor(Math.random() * 10 - 5),
        violations: Math.max(20, 23 + Math.floor(Math.random() * 6 - 3))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#44ff44';
      case 'minor-issues': return '#ffaa00';
      case 'major-issues': return '#ff6b6b';
      case 'critical': return '#ff4444';
      default: return '#666666';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffaa00';
      case 'low': return '#44ff44';
      default: return '#666666';
    }
  };

  const getViolationStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ff6b6b';
      case 'in-progress': return '#ffaa00';
      case 'resolved': return '#44ff44';
      default: return '#666666';
    }
  };

  return (
    <div className="compliance-dashboard">
      {/* Key Compliance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card overall-score">
          <div className="metric-header">
            <Shield className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Overall Compliance Score</div>
              <div className="metric-subtitle">Government Standards</div>
            </div>
          </div>
          <div className="metric-value">{metrics.overallScore}%</div>
          <div className="metric-trend positive">
            <TrendingUp size={16} />
            <span>+0.3% This Month</span>
          </div>
        </div>

        <div className="metric-card regulations">
          <div className="metric-header">
            <BookOpen className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Regulations Tracked</div>
              <div className="metric-subtitle">Federal Standards</div>
            </div>
          </div>
          <div className="metric-value">{metrics.totalRegulations.toLocaleString()}</div>
          <div className="metric-trend positive">
            <Scale size={16} />
            <span>11 Frameworks Active</span>
          </div>
        </div>

        <div className="metric-card audits">
          <div className="metric-header">
            <Eye className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Active Audits</div>
              <div className="metric-subtitle">Ongoing Reviews</div>
            </div>
          </div>
          <div className="metric-value">{metrics.activeAudits}</div>
          <div className="metric-trend neutral">
            <Calendar size={16} />
            <span>Scheduled Reviews</span>
          </div>
        </div>

        <div className="metric-card violations">
          <div className="metric-header">
            <AlertTriangle className="metric-icon" />
            <div className="metric-info">
              <div className="metric-title">Open Violations</div>
              <div className="metric-subtitle">Require Attention</div>
            </div>
          </div>
          <div className="metric-value">{metrics.violations}</div>
          <div className="metric-trend positive">
            <Target size={16} />
            <span>-67% vs Last Year</span>
          </div>
        </div>
      </div>

      {/* Compliance Analytics Section */}
      <div className="analytics-section">
        <div className="analytics-left">
          {/* Compliance Trends */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>Compliance Trends (6 Months)</h3>
              <div className="chart-legend">
                <span className="legend-item">
                  <div className="legend-color" style={{ background: '#0099ff' }}></div>
                  Compliance Score
                </span>
                <span className="legend-item">
                  <div className="legend-color" style={{ background: '#ff6b6b' }}></div>
                  Violations
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={complianceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#666" />
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
                  dataKey="score" 
                  stroke="#0099ff" 
                  fill="rgba(0,153,255,0.3)" 
                  strokeWidth={3}
                />
                <Bar dataKey="violations" fill="#ff6b6b" opacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Framework Compliance Status */}
          <div className="frameworks-status">
            <h3>Regulatory Framework Status</h3>
            <div className="frameworks-grid">
              {frameworks.map((framework, index) => (
                <div key={index} className="framework-item">
                  <div className="framework-header">
                    <div className="framework-name">{framework.name}</div>
                    <div className="framework-score">{framework.score}%</div>
                  </div>
                  <div className="framework-details">
                    <div className="detail-item">
                      <span className="detail-label">Controls:</span>
                      <span className="detail-value">{framework.implemented}/{framework.controls}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Audit:</span>
                      <span className="detail-value">{framework.lastAudit}</span>
                    </div>
                  </div>
                  <div className="framework-status">
                    <div 
                      className="status-indicator" 
                      style={{ background: getStatusColor(framework.status) }}
                    ></div>
                    <span className="status-text">{framework.status.replace('-', ' ').toUpperCase()}</span>
                  </div>
                  <div className="framework-progress">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${framework.score}%`,
                        background: getStatusColor(framework.status)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-right">
          {/* Framework Distribution */}
          <div className="framework-distribution">
            <h3>Framework Coverage Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={frameworkDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {frameworkDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Assessment */}
          <div className="risk-assessment">
            <h3>Current Risk Assessment</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                data={riskLevels}
              >
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Legend 
                  iconSize={10} 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Certification Status */}
          <div className="certification-status">
            <h3>Government Certifications</h3>
            <div className="certifications-list">
              <div className="certification-item">
                <CheckCircle2 className="cert-icon valid" />
                <div className="cert-info">
                  <div className="cert-name">FISMA Authorization</div>
                  <div className="cert-status">Valid until 2026-09-08</div>
                </div>
              </div>
              <div className="certification-item">
                <CheckCircle2 className="cert-icon valid" />
                <div className="cert-info">
                  <div className="cert-name">FedRAMP High</div>
                  <div className="cert-status">Valid until 2026-08-15</div>
                </div>
              </div>
              <div className="certification-item">
                <Award className="cert-icon pending" />
                <div className="cert-info">
                  <div className="cert-name">ISO 27001</div>
                  <div className="cert-status">Renewal in progress</div>
                </div>
              </div>
              <div className="certification-item">
                <CheckCircle2 className="cert-icon valid" />
                <div className="cert-info">
                  <div className="cert-name">NIST CSF Level 4</div>
                  <div className="cert-status">Assessed 2025-08-25</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violations and Remediation */}
      <div className="violations-section">
        <div className="violations-header">
          <h3>Open Violations & Remediation</h3>
          <div className="violations-controls">
            <button className="violations-filter active">All Violations</button>
            <button className="violations-filter">Critical</button>
            <button className="violations-filter">High Priority</button>
            <button className="violations-filter">Overdue</button>
          </div>
        </div>
        <div className="violations-list">
          {violations.map(violation => (
            <div key={violation.id} className="violation-item">
              <div className="violation-severity">
                <div 
                  className="severity-indicator" 
                  style={{ background: getSeverityColor(violation.severity) }}
                ></div>
              </div>
              <div className="violation-content">
                <div className="violation-header">
                  <div className="violation-title">{violation.title}</div>
                  <div className="violation-meta">
                    <span className="violation-framework">{violation.framework}</span>
                    <span className="violation-due">Due: {violation.dueDate}</span>
                  </div>
                </div>
                <div className="violation-description">{violation.description}</div>
                <div className="violation-footer">
                  <div className="violation-assignee">Assigned to: {violation.assignee}</div>
                  <div 
                    className="violation-status" 
                    style={{ color: getViolationStatusColor(violation.status) }}
                  >
                    {violation.status.replace('-', ' ').toUpperCase()}
                  </div>
                  <div className="violation-severity-badge" style={{ background: getSeverityColor(violation.severity) }}>
                    {violation.severity.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Government Status Bar */}
      <div className="government-status-bar">
        <div className="status-group">
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>FISMA Compliant</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>FedRAMP Authorized</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>NIST Framework Active</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>Continuous Monitoring</span>
          </div>
        </div>
        <div className="last-audit">
          Last Full Audit: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;