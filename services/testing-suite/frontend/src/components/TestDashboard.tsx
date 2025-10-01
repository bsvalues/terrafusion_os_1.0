import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import './TestDashboard.css';

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: number;
  executionTime: number;
  successRate: number;
}

interface TestSuite {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  tests: number;
  passed: number;
  failed: number;
  duration: number;
  coverage: number;
  lastRun: string;
}

interface TestTrend {
  date: string;
  passed: number;
  failed: number;
  coverage: number;
  duration: number;
}

const TestDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<TestMetrics>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    coverage: 0,
    executionTime: 0,
    successRate: 0
  });

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testTrends, setTestTrends] = useState<TestTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Update every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock metrics data
      setMetrics({
        totalTests: 2847,
        passedTests: 2654,
        failedTests: 89,
        skippedTests: 104,
        coverage: 94.2,
        executionTime: 1847,
        successRate: 93.2
      });

      // Mock test suites
      setTestSuites([
        {
          id: 'suite-001',
          name: 'TerraFusion Core API Tests',
          status: 'passed',
          tests: 456,
          passed: 442,
          failed: 14,
          duration: 312,
          coverage: 96.8,
          lastRun: '2024-09-14T14:23:45Z'
        },
        {
          id: 'suite-002',
          name: 'Frontend Component Tests',
          status: 'running',
          tests: 789,
          passed: 745,
          failed: 12,
          duration: 0,
          coverage: 91.4,
          lastRun: '2024-09-14T14:25:12Z'
        },
        {
          id: 'suite-003',
          name: 'Integration Tests',
          status: 'failed',
          tests: 234,
          passed: 198,
          failed: 36,
          duration: 567,
          coverage: 88.7,
          lastRun: '2024-09-14T14:18:33Z'
        },
        {
          id: 'suite-004',
          name: 'Performance Tests',
          status: 'passed',
          tests: 145,
          passed: 145,
          failed: 0,
          duration: 892,
          coverage: 95.3,
          lastRun: '2024-09-14T14:20:18Z'
        },
        {
          id: 'suite-005',
          name: 'Security Tests',
          status: 'pending',
          tests: 167,
          passed: 0,
          failed: 0,
          duration: 0,
          coverage: 0,
          lastRun: ''
        },
        {
          id: 'suite-006',
          name: 'E2E Browser Tests',
          status: 'passed',
          tests: 89,
          passed: 87,
          failed: 2,
          duration: 1234,
          coverage: 78.9,
          lastRun: '2024-09-14T14:15:45Z'
        }
      ]);

      // Mock trend data
      setTestTrends([
        { date: '09-10', passed: 2598, failed: 102, coverage: 93.8, duration: 1920 },
        { date: '09-11', passed: 2612, failed: 98, coverage: 94.1, duration: 1856 },
        { date: '09-12', passed: 2634, failed: 94, coverage: 94.3, duration: 1798 },
        { date: '09-13', passed: 2645, failed: 91, coverage: 94.0, duration: 1823 },
        { date: '09-14', passed: 2654, failed: 89, coverage: 94.2, duration: 1847 }
      ]);

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#00ff88';
      case 'failed': return '#ff3333';
      case 'running': return '#0099ff';
      case 'pending': return '#ffaa00';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Not run';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const pieData = [
    { name: 'Passed', value: metrics.passedTests, color: '#00ff88' },
    { name: 'Failed', value: metrics.failedTests, color: '#ff3333' },
    { name: 'Skipped', value: metrics.skippedTests, color: '#ffaa00' }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading test dashboard...</div>
      </div>
    );
  }

  return (
    <div className="test-dashboard">
      
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Test Dashboard</h1>
          <p>Real-time testing metrics and quality assurance overview</p>
          <div className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchDashboardData}>
            <span className="btn-icon">🔄</span>
            <span>Refresh</span>
          </button>
          <button className="export-btn">
            <span className="btn-icon">📊</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🧪</span>
            <span className="metric-title">Total Tests</span>
          </div>
          <div className="metric-value">{metrics.totalTests.toLocaleString()}</div>
          <div className="metric-subtitle">Test cases executed</div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <span className="metric-icon">✅</span>
            <span className="metric-title">Success Rate</span>
          </div>
          <div className="metric-value">{metrics.successRate.toFixed(1)}%</div>
          <div className="metric-subtitle">{metrics.passedTests} passed</div>
        </div>

        <div className="metric-card coverage">
          <div className="metric-header">
            <span className="metric-icon">📈</span>
            <span className="metric-title">Code Coverage</span>
          </div>
          <div className="metric-value">{metrics.coverage.toFixed(1)}%</div>
          <div className="metric-subtitle">Lines covered</div>
        </div>

        <div className="metric-card duration">
          <div className="metric-header">
            <span className="metric-icon">⏱️</span>
            <span className="metric-title">Execution Time</span>
          </div>
          <div className="metric-value">{formatDuration(metrics.executionTime)}</div>
          <div className="metric-subtitle">Total runtime</div>
        </div>

        <div className="metric-card failed">
          <div className="metric-header">
            <span className="metric-icon">❌</span>
            <span className="metric-title">Failed Tests</span>
          </div>
          <div className="metric-value">{metrics.failedTests}</div>
          <div className="metric-subtitle">Need attention</div>
        </div>

        <div className="metric-card skipped">
          <div className="metric-header">
            <span className="metric-icon">⏭️</span>
            <span className="metric-title">Skipped Tests</span>
          </div>
          <div className="metric-value">{metrics.skippedTests}</div>
          <div className="metric-subtitle">Not executed</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        
        {/* Test Results Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Test Results Distribution</h3>
            <div className="chart-subtitle">Current test run results</div>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Tests']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Test Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Test Success Trends</h3>
            <div className="chart-subtitle">Last 5 days performance</div>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={testTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #0099ff',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="passed"
                  stackId="1"
                  stroke="#00ff88"
                  fill="rgba(0, 255, 136, 0.3)"
                  name="Passed Tests"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ff3333"
                  fill="rgba(255, 51, 51, 0.3)"
                  name="Failed Tests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coverage Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Coverage & Performance</h3>
            <div className="chart-subtitle">Coverage percentage and execution time</div>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={testTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                <YAxis yAxisId="coverage" orientation="left" stroke="rgba(255,255,255,0.7)" />
                <YAxis yAxisId="duration" orientation="right" stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #0099ff',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  yAxisId="coverage"
                  type="monotone"
                  dataKey="coverage"
                  stroke="#0099ff"
                  strokeWidth={3}
                  dot={{ fill: '#0099ff', strokeWidth: 2, r: 6 }}
                  name="Coverage %"
                />
                <Line
                  yAxisId="duration"
                  type="monotone"
                  dataKey="duration"
                  stroke="#ffaa00"
                  strokeWidth={3}
                  dot={{ fill: '#ffaa00', strokeWidth: 2, r: 6 }}
                  name="Duration (s)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Test Suites Status */}
      <div className="suites-section">
        <div className="section-header">
          <h2>Test Suites Status</h2>
          <div className="section-subtitle">Current status of all test suites</div>
        </div>
        
        <div className="suites-grid">
          {testSuites.map(suite => (
            <div key={suite.id} className={`suite-card ${suite.status}`}>
              <div className="suite-header">
                <div className="suite-title">
                  <span className="suite-icon">{getStatusIcon(suite.status)}</span>
                  <span className="suite-name">{suite.name}</span>
                </div>
                <div 
                  className="suite-status"
                  style={{ color: getStatusColor(suite.status) }}
                >
                  {suite.status.toUpperCase()}
                </div>
              </div>
              
              <div className="suite-metrics">
                <div className="suite-metric">
                  <span className="metric-label">Tests:</span>
                  <span className="metric-value">{suite.tests}</span>
                </div>
                <div className="suite-metric">
                  <span className="metric-label">Passed:</span>
                  <span className="metric-value passed">{suite.passed}</span>
                </div>
                <div className="suite-metric">
                  <span className="metric-label">Failed:</span>
                  <span className="metric-value failed">{suite.failed}</span>
                </div>
                <div className="suite-metric">
                  <span className="metric-label">Coverage:</span>
                  <span className="metric-value">{suite.coverage.toFixed(1)}%</span>
                </div>
                <div className="suite-metric">
                  <span className="metric-label">Duration:</span>
                  <span className="metric-value">{formatDuration(suite.duration)}</span>
                </div>
                <div className="suite-metric">
                  <span className="metric-label">Last Run:</span>
                  <span className="metric-value">{formatTimeAgo(suite.lastRun)}</span>
                </div>
              </div>
              
              <div className="suite-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${suite.tests > 0 ? (suite.passed / suite.tests) * 100 : 0}%`,
                      background: getStatusColor(suite.status)
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {suite.tests > 0 ? ((suite.passed / suite.tests) * 100).toFixed(1) : 0}% Success
                </div>
              </div>
              
              <div className="suite-actions">
                <button className="suite-action" disabled={suite.status === 'running'}>
                  <span className="action-icon">▶️</span>
                  <span>Run</span>
                </button>
                <button className="suite-action">
                  <span className="action-icon">📄</span>
                  <span>Report</span>
                </button>
                <button className="suite-action">
                  <span className="action-icon">⚙️</span>
                  <span>Config</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;