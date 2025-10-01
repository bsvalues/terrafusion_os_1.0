import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import './TestSuites.css';

interface TestCase {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  error?: string;
  lastRun: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  tags: string[];
  testCases: TestCase[];
  configuration: {
    timeout: number;
    retries: number;
    parallel: boolean;
    environment: string;
  };
  schedule?: {
    enabled: boolean;
    cron: string;
    lastRun?: string;
    nextRun?: string;
  };
  metrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    coverage: number;
    avgDuration: number;
    successRate: number;
  };
  history: Array<{
    date: string;
    passed: number;
    failed: number;
    duration: number;
  }>;
}

const TestSuites: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTestSuites();
  }, []);

  const fetchTestSuites = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockSuites: TestSuite[] = [
        {
          id: 'suite-001',
          name: 'TerraFusion Core API Tests',
          description: 'Comprehensive tests for core API endpoints and functionality',
          status: 'passed',
          tags: ['api', 'core', 'backend', 'critical'],
          testCases: [
            {
              id: 'test-001',
              name: 'Authentication endpoints',
              status: 'passed',
              duration: 245,
              lastRun: '2024-09-14T14:23:45Z'
            },
            {
              id: 'test-002',
              name: 'User management API',
              status: 'passed',
              duration: 189,
              lastRun: '2024-09-14T14:23:45Z'
            },
            {
              id: 'test-003',
              name: 'Data validation tests',
              status: 'failed',
              duration: 0,
              error: 'Validation schema mismatch',
              lastRun: '2024-09-14T14:23:45Z'
            }
          ],
          configuration: {
            timeout: 30000,
            retries: 3,
            parallel: true,
            environment: 'test'
          },
          schedule: {
            enabled: true,
            cron: '0 */6 * * *',
            lastRun: '2024-09-14T14:23:45Z',
            nextRun: '2024-09-14T20:00:00Z'
          },
          metrics: {
            totalTests: 456,
            passedTests: 442,
            failedTests: 14,
            skippedTests: 0,
            coverage: 96.8,
            avgDuration: 312,
            successRate: 96.9
          },
          history: [
            { date: '09-10', passed: 440, failed: 16, duration: 320 },
            { date: '09-11', passed: 441, failed: 15, duration: 315 },
            { date: '09-12', passed: 442, failed: 14, duration: 312 },
            { date: '09-13', passed: 442, failed: 14, duration: 310 },
            { date: '09-14', passed: 442, failed: 14, duration: 312 }
          ]
        },
        {
          id: 'suite-002',
          name: 'Frontend Component Tests',
          description: 'React component unit tests and integration tests',
          status: 'running',
          tags: ['frontend', 'react', 'components', 'unit'],
          testCases: [
            {
              id: 'test-004',
              name: 'Header component tests',
              status: 'passed',
              duration: 123,
              lastRun: '2024-09-14T14:25:12Z'
            },
            {
              id: 'test-005',
              name: 'Dashboard components',
              status: 'running',
              duration: 0,
              lastRun: '2024-09-14T14:25:12Z'
            }
          ],
          configuration: {
            timeout: 15000,
            retries: 2,
            parallel: false,
            environment: 'test'
          },
          schedule: {
            enabled: false,
            cron: '0 8 * * *'
          },
          metrics: {
            totalTests: 789,
            passedTests: 745,
            failedTests: 12,
            skippedTests: 32,
            coverage: 91.4,
            avgDuration: 156,
            successRate: 94.4
          },
          history: [
            { date: '09-10', passed: 740, failed: 17, duration: 160 },
            { date: '09-11', passed: 742, failed: 15, duration: 158 },
            { date: '09-12', passed: 744, failed: 13, duration: 157 },
            { date: '09-13', passed: 745, failed: 12, duration: 156 },
            { date: '09-14', passed: 745, failed: 12, duration: 156 }
          ]
        },
        {
          id: 'suite-003',
          name: 'Integration Tests',
          description: 'End-to-end integration tests across system components',
          status: 'failed',
          tags: ['integration', 'e2e', 'system', 'critical'],
          testCases: [
            {
              id: 'test-006',
              name: 'User workflow integration',
              status: 'failed',
              duration: 0,
              error: 'Database connection timeout',
              lastRun: '2024-09-14T14:18:33Z'
            }
          ],
          configuration: {
            timeout: 60000,
            retries: 1,
            parallel: false,
            environment: 'staging'
          },
          schedule: {
            enabled: true,
            cron: '0 2 * * *',
            lastRun: '2024-09-14T02:00:00Z',
            nextRun: '2024-09-15T02:00:00Z'
          },
          metrics: {
            totalTests: 234,
            passedTests: 198,
            failedTests: 36,
            skippedTests: 0,
            coverage: 88.7,
            avgDuration: 567,
            successRate: 84.6
          },
          history: [
            { date: '09-10', passed: 195, failed: 39, duration: 580 },
            { date: '09-11', passed: 196, failed: 38, duration: 575 },
            { date: '09-12', passed: 197, failed: 37, duration: 570 },
            { date: '09-13', passed: 198, failed: 36, duration: 567 },
            { date: '09-14', passed: 198, failed: 36, duration: 567 }
          ]
        }
      ];

      setTestSuites(mockSuites);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch test suites:', error);
      setIsLoading(false);
    }
  };

  const runTestSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite || suite.status === 'running') return;

    // Update suite status to running
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: 'running' } : s
    ));

    // Simulate test execution
    setTimeout(() => {
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId ? { ...s, status: 'passed' } : s
      ));
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#00ff88';
      case 'failed': return '#ff3333';
      case 'running': return '#0099ff';
      case 'idle': return '#888888';
      case 'skipped': return '#ffaa00';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'idle': return '⏸️';
      case 'skipped': return '⏭️';
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
    if (!dateString) return 'Never';
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

  const filteredSuites = testSuites.filter(suite => {
    const matchesSearch = suite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suite.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !filterTag || suite.tags.includes(filterTag);
    const matchesStatus = !filterStatus || suite.status === filterStatus;
    
    return matchesSearch && matchesTag && matchesStatus;
  });

  const allTags = Array.from(new Set(testSuites.flatMap(suite => suite.tags)));

  if (isLoading) {
    return (
      <div className="suites-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading test suites...</div>
      </div>
    );
  }

  if (selectedSuite) {
    return (
      <div className="suite-detail">
        <div className="detail-header">
          <button 
            className="back-btn"
            onClick={() => setSelectedSuite(null)}
          >
            <span className="back-icon">←</span>
            <span>Back to Suites</span>
          </button>
          <div className="suite-title-section">
            <h1>{selectedSuite.name}</h1>
            <p>{selectedSuite.description}</p>
          </div>
          <div className="suite-actions">
            <button 
              className="run-btn"
              onClick={() => runTestSuite(selectedSuite.id)}
              disabled={selectedSuite.status === 'running'}
            >
              <span className="btn-icon">▶️</span>
              <span>Run Suite</span>
            </button>
            <button className="config-btn">
              <span className="btn-icon">⚙️</span>
              <span>Configure</span>
            </button>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-grid">
            
            {/* Suite Overview */}
            <div className="detail-card">
              <h3>Suite Overview</h3>
              <div className="overview-metrics">
                <div className="overview-metric">
                  <span className="metric-label">Status:</span>
                  <span 
                    className="metric-value"
                    style={{ color: getStatusColor(selectedSuite.status) }}
                  >
                    {getStatusIcon(selectedSuite.status)} {selectedSuite.status.toUpperCase()}
                  </span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Total Tests:</span>
                  <span className="metric-value">{selectedSuite.metrics.totalTests}</span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Success Rate:</span>
                  <span className="metric-value">{selectedSuite.metrics.successRate.toFixed(1)}%</span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Coverage:</span>
                  <span className="metric-value">{selectedSuite.metrics.coverage.toFixed(1)}%</span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Avg Duration:</span>
                  <span className="metric-value">{formatDuration(selectedSuite.metrics.avgDuration)}</span>
                </div>
              </div>
              
              <div className="tags-section">
                <span className="tags-label">Tags:</span>
                <div className="tags-list">
                  {selectedSuite.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="detail-card">
              <h3>Configuration</h3>
              <div className="config-grid">
                <div className="config-item">
                  <span className="config-label">Timeout:</span>
                  <span className="config-value">{selectedSuite.configuration.timeout / 1000}s</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Retries:</span>
                  <span className="config-value">{selectedSuite.configuration.retries}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Parallel:</span>
                  <span className="config-value">
                    {selectedSuite.configuration.parallel ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="config-item">
                  <span className="config-label">Environment:</span>
                  <span className="config-value">{selectedSuite.configuration.environment}</span>
                </div>
              </div>

              {selectedSuite.schedule && (
                <div className="schedule-section">
                  <h4>Schedule</h4>
                  <div className="schedule-grid">
                    <div className="schedule-item">
                      <span className="schedule-label">Enabled:</span>
                      <span className="schedule-value">
                        {selectedSuite.schedule.enabled ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    {selectedSuite.schedule.enabled && (
                      <>
                        <div className="schedule-item">
                          <span className="schedule-label">Cron:</span>
                          <span className="schedule-value">{selectedSuite.schedule.cron}</span>
                        </div>
                        <div className="schedule-item">
                          <span className="schedule-label">Last Run:</span>
                          <span className="schedule-value">
                            {formatTimeAgo(selectedSuite.schedule.lastRun || '')}
                          </span>
                        </div>
                        <div className="schedule-item">
                          <span className="schedule-label">Next Run:</span>
                          <span className="schedule-value">
                            {selectedSuite.schedule.nextRun ? 
                              new Date(selectedSuite.schedule.nextRun).toLocaleString() : 
                              'Not scheduled'
                            }
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Test History Chart */}
            <div className="detail-card chart-card">
              <h3>Test History</h3>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={selectedSuite.history}>
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
                    <Line
                      type="monotone"
                      dataKey="passed"
                      stroke="#00ff88"
                      strokeWidth={2}
                      dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                      name="Passed Tests"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ff3333"
                      strokeWidth={2}
                      dot={{ fill: '#ff3333', strokeWidth: 2, r: 4 }}
                      name="Failed Tests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="test-cases-section">
            <h3>Test Cases ({selectedSuite.testCases.length})</h3>
            <div className="test-cases-grid">
              {selectedSuite.testCases.map(testCase => (
                <div key={testCase.id} className={`test-case-card ${testCase.status}`}>
                  <div className="test-case-header">
                    <span 
                      className="test-case-status"
                      style={{ color: getStatusColor(testCase.status) }}
                    >
                      {getStatusIcon(testCase.status)}
                    </span>
                    <span className="test-case-name">{testCase.name}</span>
                    <span className="test-case-duration">{formatDuration(testCase.duration)}</span>
                  </div>
                  
                  {testCase.error && (
                    <div className="test-case-error">
                      <span className="error-icon">⚠️</span>
                      <span className="error-text">{testCase.error}</span>
                    </div>
                  )}
                  
                  <div className="test-case-footer">
                    <span className="last-run">Last run: {formatTimeAgo(testCase.lastRun)}</span>
                    <div className="test-case-actions">
                      <button className="test-action">Run</button>
                      <button className="test-action">Debug</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-suites">
      
      {/* Header */}
      <div className="suites-header">
        <div className="header-content">
          <h1>Test Suites</h1>
          <p>Manage and execute test suites across the TerraFusion ecosystem</p>
        </div>
        <div className="header-actions">
          <button 
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">➕</span>
            <span>Create Suite</span>
          </button>
          <button className="import-btn">
            <span className="btn-icon">📁</span>
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search test suites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="filter-select"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="idle">Idle</option>
            <option value="running">Running</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Suites Grid */}
      <div className="suites-grid">
        {filteredSuites.map(suite => (
          <div key={suite.id} className={`suite-card ${suite.status}`}>
            <div className="suite-header">
              <div className="suite-title">
                <span 
                  className="suite-status-icon"
                  style={{ color: getStatusColor(suite.status) }}
                >
                  {getStatusIcon(suite.status)}
                </span>
                <div className="title-content">
                  <h3 className="suite-name">{suite.name}</h3>
                  <p className="suite-description">{suite.description}</p>
                </div>
              </div>
              <div 
                className="suite-status-badge"
                style={{ 
                  color: getStatusColor(suite.status),
                  borderColor: getStatusColor(suite.status)
                }}
              >
                {suite.status.toUpperCase()}
              </div>
            </div>

            <div className="suite-metrics">
              <div className="metric-row">
                <div className="metric">
                  <span className="metric-label">Tests:</span>
                  <span className="metric-value">{suite.metrics.totalTests}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Success:</span>
                  <span className="metric-value success">{suite.metrics.successRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="metric-row">
                <div className="metric">
                  <span className="metric-label">Coverage:</span>
                  <span className="metric-value">{suite.metrics.coverage.toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Duration:</span>
                  <span className="metric-value">{formatDuration(suite.metrics.avgDuration)}</span>
                </div>
              </div>
            </div>

            <div className="suite-tags">
              {suite.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
              {suite.tags.length > 3 && (
                <span className="tag-more">+{suite.tags.length - 3}</span>
              )}
            </div>

            <div className="suite-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${suite.metrics.successRate}%`,
                    background: getStatusColor(suite.status === 'failed' ? 'failed' : 'passed')
                  }}
                ></div>
              </div>
            </div>

            <div className="suite-actions">
              <button 
                className="suite-action primary"
                onClick={() => runTestSuite(suite.id)}
                disabled={suite.status === 'running'}
              >
                <span className="action-icon">▶️</span>
                <span>Run</span>
              </button>
              <button 
                className="suite-action"
                onClick={() => setSelectedSuite(suite)}
              >
                <span className="action-icon">👁️</span>
                <span>View</span>
              </button>
              <button className="suite-action">
                <span className="action-icon">⚙️</span>
                <span>Config</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSuites.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <div className="no-results-text">No test suites found</div>
          <div className="no-results-subtitle">
            Try adjusting your search or filter criteria
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSuites;