import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface ProjectStats {
  totalProjects: number;
  activeBuilds: number;
  successRate: number;
  lastDeployment: string;
}

interface BuildMetrics {
  buildTime: string;
  testCoverage: number;
  codeQuality: string;
  securityScore: number;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: string;
}

const Dashboard: React.FC = () => {
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeBuilds: 0,
    successRate: 0,
    lastDeployment: 'Never'
  });

  const [buildMetrics, setBuildMetrics] = useState<BuildMetrics>({
    buildTime: '0s',
    testCoverage: 0,
    codeQuality: 'Unknown',
    securityScore: 0
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 'Disconnected'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual endpoints
      const [statsResponse, metricsResponse, healthResponse] = await Promise.all([
        fetch('/api/rust-dev/projects/stats'),
        fetch('/api/rust-dev/build/metrics'),
        fetch('/api/rust-dev/system/health')
      ]);

      // Mock data for now - replace with actual API responses
      setProjectStats({
        totalProjects: 12,
        activeBuilds: 3,
        successRate: 94.7,
        lastDeployment: '2 hours ago'
      });

      setBuildMetrics({
        buildTime: '2m 34s',
        testCoverage: 87.3,
        codeQuality: 'Excellent',
        securityScore: 92
      });

      setSystemHealth({
        cpu: 23.5,
        memory: 67.2,
        disk: 45.8,
        network: 'Connected'
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsLoading(false);
    }
  };

  const getHealthStatus = (value: number) => {
    if (value < 50) return 'healthy';
    if (value < 80) return 'warning';
    return 'critical';
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return '#00ff88';
      case 'good': return '#00ffaa';
      case 'fair': return '#ffaa00';
      case 'poor': return '#ff3333';
      default: return '#888888';
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Preparing transcendence…</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Rust Development Engine</h1>
        <p className="dashboard-subtitle">DevOps automation and build orchestration</p>
      </div>

      {/* Quick Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">🦀</div>
          <div className="stat-content">
            <div className="stat-value">{projectStats.totalProjects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{projectStats.activeBuilds}</div>
            <div className="stat-label">Building Now</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{projectStats.successRate}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{projectStats.lastDeployment}</div>
            <div className="stat-label">Last Deploy</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* Build Metrics */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Build Metrics</h3>
            <div className="panel-status transcendence-complete"></div>
          </div>
          <div className="panel-content">
            <div className="metric-item">
              <div className="metric-label">Average Build Time</div>
              <div className="metric-value">{buildMetrics.buildTime}</div>
              <div className="metric-trend">📈 12% faster</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Test Coverage</div>
              <div className="metric-value">{buildMetrics.testCoverage}%</div>
              <div className="metric-progress">
                <div 
                  className="progress-fill" 
                  style={{width: `${buildMetrics.testCoverage}%`}}
                ></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Code Quality</div>
              <div 
                className="metric-value" 
                style={{color: getQualityColor(buildMetrics.codeQuality)}}
              >
                {buildMetrics.codeQuality}
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Security Score</div>
              <div className="metric-value">{buildMetrics.securityScore}/100</div>
              <div className="metric-progress">
                <div 
                  className="progress-fill security" 
                  style={{width: `${buildMetrics.securityScore}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>System Health</h3>
            <div className={`panel-status ${getHealthStatus(Math.max(systemHealth.cpu, systemHealth.memory, systemHealth.disk))}`}></div>
          </div>
          <div className="panel-content">
            <div className="health-item">
              <div className="health-label">CPU Usage</div>
              <div className="health-bar">
                <div 
                  className={`health-fill ${getHealthStatus(systemHealth.cpu)}`}
                  style={{width: `${systemHealth.cpu}%`}}
                ></div>
              </div>
              <div className="health-value">{systemHealth.cpu}%</div>
            </div>
            <div className="health-item">
              <div className="health-label">Memory</div>
              <div className="health-bar">
                <div 
                  className={`health-fill ${getHealthStatus(systemHealth.memory)}`}
                  style={{width: `${systemHealth.memory}%`}}
                ></div>
              </div>
              <div className="health-value">{systemHealth.memory}%</div>
            </div>
            <div className="health-item">
              <div className="health-label">Disk Space</div>
              <div className="health-bar">
                <div 
                  className={`health-fill ${getHealthStatus(systemHealth.disk)}`}
                  style={{width: `${systemHealth.disk}%`}}
                ></div>
              </div>
              <div className="health-value">{systemHealth.disk}%</div>
            </div>
            <div className="health-item">
              <div className="health-label">Network</div>
              <div className={`network-status ${systemHealth.network.toLowerCase()}`}>
                {systemHealth.network}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-panel activity-panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
            <button className="refresh-btn" onClick={fetchDashboardData}>
              🔄 Refresh
            </button>
          </div>
          <div className="panel-content">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon success">✅</div>
                <div className="activity-content">
                  <div className="activity-title">Build completed: terrafusion-core</div>
                  <div className="activity-time">2 minutes ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon warning">⚠️</div>
                <div className="activity-content">
                  <div className="activity-title">Test coverage below threshold: auth-service</div>
                  <div className="activity-time">15 minutes ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon success">🚀</div>
                <div className="activity-content">
                  <div className="activity-title">Deployment successful: production</div>
                  <div className="activity-time">2 hours ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon info">📦</div>
                <div className="activity-content">
                  <div className="activity-title">New dependency: tokio v1.35.0</div>
                  <div className="activity-time">4 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary">
            <span className="action-icon">🔨</span>
            New Build
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">📊</span>
            View Reports
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">⚙️</span>
            Configure
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">📝</span>
            View Logs
          </button>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;