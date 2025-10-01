import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './TestExecution.css';

interface TestLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  source: string;
}

interface RunningTest {
  id: string;
  suiteId: string;
  suiteName: string;
  testName: string;
  status: 'queued' | 'running' | 'passed' | 'failed' | 'skipped';
  startTime: string;
  duration: number;
  progress: number;
  output?: string;
  error?: string;
}

interface ExecutionMetrics {
  totalTests: number;
  completedTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  currentlyRunning: number;
  avgDuration: number;
  estimatedTimeRemaining: number;
}

interface PerformanceData {
  timestamp: string;
  testsPerSecond: number;
  memoryUsage: number;
  cpuUsage: number;
}

const TestExecution: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [runningTests, setRunningTests] = useState<RunningTest[]>([]);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [metrics, setMetrics] = useState<ExecutionMetrics>({
    totalTests: 0,
    completedTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    currentlyRunning: 0,
    avgDuration: 0,
    estimatedTimeRemaining: 0
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);
  const [executionConfig, setExecutionConfig] = useState({
    parallel: true,
    maxConcurrency: 4,
    stopOnFailure: false,
    generateReport: true,
    notifyOnComplete: true
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logsRef = useRef<HTMLDivElement>(null);

  const availableSuites = [
    { id: 'suite-001', name: 'TerraFusion Core API Tests', tests: 456 },
    { id: 'suite-002', name: 'Frontend Component Tests', tests: 789 },
    { id: 'suite-003', name: 'Integration Tests', tests: 234 },
    { id: 'suite-004', name: 'Performance Tests', tests: 145 },
    { id: 'suite-005', name: 'Security Tests', tests: 167 },
    { id: 'suite-006', name: 'E2E Browser Tests', tests: 89 }
  ];

  useEffect(() => {
    if (isExecuting) {
      simulateTestExecution();
    }
  }, [isExecuting]);

  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const simulateTestExecution = () => {
    const totalTests = selectedSuites.reduce((sum, suiteId) => {
      const suite = availableSuites.find(s => s.id === suiteId);
      return sum + (suite?.tests || 0);
    }, 0);

    setMetrics(prev => ({ ...prev, totalTests, completedTests: 0, passedTests: 0, failedTests: 0, skippedTests: 0 }));

    // Simulate test execution
    let testIndex = 0;
    const executeTest = () => {
      if (testIndex >= totalTests || !isExecuting) {
        setIsExecuting(false);
        addLog('success', 'Test execution completed', 'ExecutionEngine');
        return;
      }

      const suiteId = selectedSuites[Math.floor(testIndex / 100)];
      const suite = availableSuites.find(s => s.id === suiteId);
      
      if (!suite) return;

      const testId = `test-${Date.now()}-${testIndex}`;
      const testName = `Test case ${testIndex + 1}`;

      // Add test to running queue
      const newTest: RunningTest = {
        id: testId,
        suiteId: suiteId,
        suiteName: suite.name,
        testName: testName,
        status: 'running',
        startTime: new Date().toISOString(),
        duration: 0,
        progress: 0
      };

      setRunningTests(prev => [...prev, newTest]);
      addLog('info', `Starting ${testName} in ${suite.name}`, 'TestRunner');

      // Simulate test execution
      const duration = Math.random() * 3000 + 500; // 0.5-3.5 seconds
      const willFail = Math.random() < 0.1; // 10% failure rate

      setTimeout(() => {
        const status = willFail ? 'failed' : 'passed';
        
        setRunningTests(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status, duration: Math.floor(duration), progress: 100 }
            : test
        ));

        setMetrics(prev => ({
          ...prev,
          completedTests: prev.completedTests + 1,
          passedTests: status === 'passed' ? prev.passedTests + 1 : prev.passedTests,
          failedTests: status === 'failed' ? prev.failedTests + 1 : prev.failedTests,
          currentlyRunning: Math.max(0, prev.currentlyRunning - 1)
        }));

        if (willFail) {
          addLog('error', `${testName} failed: Assertion error`, 'TestRunner');
        } else {
          addLog('success', `${testName} passed`, 'TestRunner');
        }

        // Remove from running tests after a delay
        setTimeout(() => {
          setRunningTests(prev => prev.filter(test => test.id !== testId));
        }, 2000);
      }, duration);

      testIndex++;
      
      // Continue with next test
      if (executionConfig.parallel && runningTests.length < executionConfig.maxConcurrency) {
        setTimeout(executeTest, Math.random() * 500 + 100);
      } else if (!executionConfig.parallel) {
        setTimeout(executeTest, duration + 100);
      }
    };

    // Start initial tests
    for (let i = 0; i < Math.min(executionConfig.maxConcurrency, totalTests); i++) {
      setTimeout(executeTest, i * 200);
    }

    // Update performance metrics
    const performanceInterval = setInterval(() => {
      if (!isExecuting) {
        clearInterval(performanceInterval);
        return;
      }

      const newPerformanceData: PerformanceData = {
        timestamp: new Date().toLocaleTimeString(),
        testsPerSecond: Math.random() * 10 + 5,
        memoryUsage: Math.random() * 30 + 40,
        cpuUsage: Math.random() * 50 + 25
      };

      setPerformanceData(prev => [...prev.slice(-20), newPerformanceData]);
    }, 2000);
  };

  const addLog = (level: TestLog['level'], message: string, source: string) => {
    const newLog: TestLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      source
    };

    setLogs(prev => [...prev, newLog]);
  };

  const startExecution = () => {
    if (selectedSuites.length === 0) {
      addLog('warn', 'No test suites selected for execution', 'ExecutionEngine');
      return;
    }

    setIsExecuting(true);
    setLogs([]);
    setRunningTests([]);
    setPerformanceData([]);
    addLog('info', 'Starting test execution...', 'ExecutionEngine');
    addLog('info', `Selected suites: ${selectedSuites.length}`, 'ExecutionEngine');
    addLog('info', `Configuration: Parallel=${executionConfig.parallel}, Max Concurrency=${executionConfig.maxConcurrency}`, 'ExecutionEngine');
  };

  const stopExecution = () => {
    setIsExecuting(false);
    addLog('warn', 'Test execution stopped by user', 'ExecutionEngine');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      default: return '📝';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success': return '#00ff88';
      case 'error': return '#ff3333';
      case 'warn': return '#ffaa00';
      case 'info': return '#0099ff';
      case 'debug': return '#888888';
      default: return '#ffffff';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return '--';
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  const calculateProgress = () => {
    if (metrics.totalTests === 0) return 0;
    return (metrics.completedTests / metrics.totalTests) * 100;
  };

  return (
    <div className="test-execution">
      
      {/* Header */}
      <div className="execution-header">
        <div className="header-content">
          <h1>Test Execution</h1>
          <p>Real-time test execution monitoring and control</p>
        </div>
        <div className="execution-controls">
          {!isExecuting ? (
            <button 
              className="start-btn"
              onClick={startExecution}
              disabled={selectedSuites.length === 0}
            >
              <span className="btn-icon">▶️</span>
              <span>Start Execution</span>
            </button>
          ) : (
            <button 
              className="stop-btn"
              onClick={stopExecution}
            >
              <span className="btn-icon">⏹️</span>
              <span>Stop Execution</span>
            </button>
          )}
          <button 
            className="clear-btn"
            onClick={clearLogs}
          >
            <span className="btn-icon">🗑️</span>
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      <div className="execution-content">
        
        {/* Configuration Panel */}
        <div className="config-panel">
          <h3>Execution Configuration</h3>
          
          <div className="config-section">
            <h4>Test Suites</h4>
            <div className="suites-selection">
              {availableSuites.map(suite => (
                <label key={suite.id} className="suite-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSuites.includes(suite.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSuites(prev => [...prev, suite.id]);
                      } else {
                        setSelectedSuites(prev => prev.filter(id => id !== suite.id));
                      }
                    }}
                    disabled={isExecuting}
                  />
                  <span className="checkbox-label">
                    {suite.name} ({suite.tests} tests)
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h4>Execution Options</h4>
            <div className="config-options">
              <label className="config-option">
                <input
                  type="checkbox"
                  checked={executionConfig.parallel}
                  onChange={(e) => setExecutionConfig(prev => ({ ...prev, parallel: e.target.checked }))}
                  disabled={isExecuting}
                />
                <span>Parallel Execution</span>
              </label>
              
              <div className="config-input">
                <label>Max Concurrency:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={executionConfig.maxConcurrency}
                  onChange={(e) => setExecutionConfig(prev => ({ ...prev, maxConcurrency: parseInt(e.target.value) }))}
                  disabled={isExecuting || !executionConfig.parallel}
                />
              </div>

              <label className="config-option">
                <input
                  type="checkbox"
                  checked={executionConfig.stopOnFailure}
                  onChange={(e) => setExecutionConfig(prev => ({ ...prev, stopOnFailure: e.target.checked }))}
                  disabled={isExecuting}
                />
                <span>Stop on First Failure</span>
              </label>

              <label className="config-option">
                <input
                  type="checkbox"
                  checked={executionConfig.generateReport}
                  onChange={(e) => setExecutionConfig(prev => ({ ...prev, generateReport: e.target.checked }))}
                  disabled={isExecuting}
                />
                <span>Generate Report</span>
              </label>

              <label className="config-option">
                <input
                  type="checkbox"
                  checked={executionConfig.notifyOnComplete}
                  onChange={(e) => setExecutionConfig(prev => ({ ...prev, notifyOnComplete: e.target.checked }))}
                  disabled={isExecuting}
                />
                <span>Notify on Completion</span>
              </label>
            </div>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="metrics-dashboard">
          <h3>Execution Metrics</h3>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">🧪</span>
                <span className="metric-title">Total Tests</span>
              </div>
              <div className="metric-value">{metrics.totalTests}</div>
              <div className="metric-subtitle">Selected for execution</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">✅</span>
                <span className="metric-title">Completed</span>
              </div>
              <div className="metric-value">{metrics.completedTests}</div>
              <div className="metric-subtitle">{metrics.totalTests > 0 ? ((metrics.completedTests / metrics.totalTests) * 100).toFixed(1) : 0}% done</div>
            </div>

            <div className="metric-card success">
              <div className="metric-header">
                <span className="metric-icon">🎉</span>
                <span className="metric-title">Passed</span>
              </div>
              <div className="metric-value">{metrics.passedTests}</div>
              <div className="metric-subtitle">Successful tests</div>
            </div>

            <div className="metric-card failed">
              <div className="metric-header">
                <span className="metric-icon">❌</span>
                <span className="metric-title">Failed</span>
              </div>
              <div className="metric-value">{metrics.failedTests}</div>
              <div className="metric-subtitle">Need attention</div>
            </div>

            <div className="metric-card running">
              <div className="metric-header">
                <span className="metric-icon">🔄</span>
                <span className="metric-title">Running</span>
              </div>
              <div className="metric-value">{runningTests.filter(t => t.status === 'running').length}</div>
              <div className="metric-subtitle">Currently executing</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">⏱️</span>
                <span className="metric-title">Progress</span>
              </div>
              <div className="metric-value">{calculateProgress().toFixed(1)}%</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="execution-panels">
          
          {/* Running Tests */}
          <div className="panel running-tests-panel">
            <div className="panel-header">
              <h3>Running Tests ({runningTests.length})</h3>
              <div className="panel-actions">
                <span className={`status-indicator ${isExecuting ? 'active' : 'inactive'}`}>
                  {isExecuting ? '🟢 Active' : '🔴 Idle'}
                </span>
              </div>
            </div>
            
            <div className="running-tests-list">
              {runningTests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⏸️</div>
                  <div className="empty-text">No tests currently running</div>
                </div>
              ) : (
                runningTests.map(test => (
                  <div key={test.id} className={`running-test ${test.status}`}>
                    <div className="test-info">
                      <div className="test-header">
                        <span className="test-status">
                          {test.status === 'running' ? '🔄' : 
                           test.status === 'passed' ? '✅' : 
                           test.status === 'failed' ? '❌' : '⏳'}
                        </span>
                        <span className="test-name">{test.testName}</span>
                        <span className="test-duration">{formatDuration(test.duration)}</span>
                      </div>
                      <div className="test-suite">{test.suiteName}</div>
                      {test.status === 'running' && (
                        <div className="test-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${test.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {test.error && (
                        <div className="test-error">
                          <span className="error-icon">⚠️</span>
                          <span className="error-text">{test.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Monitor */}
          <div className="panel performance-panel">
            <div className="panel-header">
              <h3>Performance Monitor</h3>
            </div>
            
            <div className="performance-charts">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.7)" />
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
                      dataKey="testsPerSecond"
                      stackId="1"
                      stroke="#0099ff"
                      fill="rgba(0, 153, 255, 0.3)"
                      name="Tests/sec"
                    />
                    <Area
                      type="monotone"
                      dataKey="cpuUsage"
                      stackId="2"
                      stroke="#00ff88"
                      fill="rgba(0, 255, 136, 0.3)"
                      name="CPU %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <div className="empty-icon">📊</div>
                  <div className="empty-text">No performance data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Execution Logs */}
          <div className="panel logs-panel">
            <div className="panel-header">
              <h3>Execution Logs ({logs.length})</h3>
              <div className="panel-actions">
                <label className="auto-scroll-toggle">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  <span>Auto-scroll</span>
                </label>
              </div>
            </div>
            
            <div className="logs-container" ref={logsRef}>
              {logs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <div className="empty-text">No logs available</div>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`log-entry ${log.level}`}>
                    <span className="log-timestamp">{formatTime(log.timestamp)}</span>
                    <span 
                      className="log-level"
                      style={{ color: getLogColor(log.level) }}
                    >
                      {getLogIcon(log.level)}
                    </span>
                    <span className="log-source">[{log.source}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExecution;