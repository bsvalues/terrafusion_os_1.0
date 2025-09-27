import React, { useState, useEffect } from 'react';
import './Diagnostics.css';

interface DiagnosticTest {
  id: string;
  name: string;
  category: 'system' | 'network' | 'storage' | 'performance' | 'security';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  description: string;
  duration: number;
  lastRun: string;
  details?: string;
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number;
  issues: string[];
  recommendations: string[];
}

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  source: string;
  message: string;
  details?: any;
}

const Diagnostics: React.FC = () => {
  const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTest[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<LogEntry[]>([]);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDiagnosticData();
  }, []);

  const fetchDiagnosticData = async () => {
    try {
      // Mock diagnostic tests data
      const mockTests: DiagnosticTest[] = [
        {
          id: 'sys_cpu',
          name: 'CPU Performance Test',
          category: 'system',
          status: 'passed',
          description: 'Verify CPU utilization and performance metrics',
          duration: 2.3,
          lastRun: '5 minutes ago',
          details: 'CPU utilization average: 23.4%, Peak: 67.2%'
        },
        {
          id: 'sys_memory',
          name: 'Memory Usage Analysis',
          category: 'system',
          status: 'warning',
          description: 'Check memory consumption and potential leaks',
          duration: 1.8,
          lastRun: '5 minutes ago',
          details: 'Memory usage: 78.3% - Consider optimization'
        },
        {
          id: 'net_connectivity',
          name: 'Network Connectivity',
          category: 'network',
          status: 'passed',
          description: 'Test network connectivity and latency',
          duration: 3.1,
          lastRun: '3 minutes ago',
          details: 'All endpoints responding, Average latency: 12ms'
        },
        {
          id: 'net_bandwidth',
          name: 'Bandwidth Test',
          category: 'network',
          status: 'failed',
          description: 'Measure available network bandwidth',
          duration: 15.7,
          lastRun: '8 minutes ago',
          details: 'Bandwidth below expected threshold: 45Mbps vs 100Mbps expected'
        },
        {
          id: 'stor_disk_health',
          name: 'Disk Health Check',
          category: 'storage',
          status: 'passed',
          description: 'Verify disk integrity and SMART status',
          duration: 4.2,
          lastRun: '10 minutes ago',
          details: 'All disks healthy, No bad sectors detected'
        },
        {
          id: 'stor_space',
          name: 'Storage Space Analysis',
          category: 'storage',
          status: 'warning',
          description: 'Check available storage space',
          duration: 0.8,
          lastRun: '2 minutes ago',
          details: 'Primary volume at 82% capacity'
        },
        {
          id: 'perf_response_time',
          name: 'API Response Time',
          category: 'performance',
          status: 'passed',
          description: 'Measure API endpoint response times',
          duration: 5.5,
          lastRun: '1 minute ago',
          details: 'Average response time: 6.7ms (Target: <10ms)'
        },
        {
          id: 'perf_throughput',
          name: 'System Throughput',
          category: 'performance',
          status: 'passed',
          description: 'Test system processing capacity',
          duration: 12.3,
          lastRun: '15 minutes ago',
          details: 'Throughput: 1,247 req/sec (Target: >1,000 req/sec)'
        },
        {
          id: 'sec_firewall',
          name: 'Firewall Configuration',
          category: 'security',
          status: 'passed',
          description: 'Verify firewall rules and security policies',
          duration: 3.8,
          lastRun: '30 minutes ago',
          details: 'All security policies active and properly configured'
        },
        {
          id: 'sec_certificates',
          name: 'SSL Certificate Validation',
          category: 'security',
          status: 'warning',
          description: 'Check SSL certificate validity and expiration',
          duration: 2.1,
          lastRun: '1 hour ago',
          details: 'Certificate expires in 28 days - renewal recommended'
        }
      ];

      const mockHealth: SystemHealth = {
        overall: 'good',
        score: 82,
        issues: [
          'Memory usage approaching 80% threshold',
          'Network bandwidth below expected performance',
          'Primary storage volume at 82% capacity',
          'SSL certificate expires in 28 days'
        ],
        recommendations: [
          'Consider memory optimization or upgrade',
          'Investigate network bottlenecks',
          'Plan storage expansion or cleanup',
          'Schedule SSL certificate renewal',
          'Implement automated monitoring alerts'
        ]
      };

      const mockLogs: LogEntry[] = [
        {
          timestamp: '2024-01-15 14:35:22',
          level: 'info',
          source: 'DiagnosticEngine',
          message: 'Starting comprehensive system diagnostics'
        },
        {
          timestamp: '2024-01-15 14:35:25',
          level: 'info',
          source: 'CPUTest',
          message: 'CPU performance test completed successfully'
        },
        {
          timestamp: '2024-01-15 14:35:27',
          level: 'warn',
          source: 'MemoryTest',
          message: 'Memory usage at 78.3% - optimization recommended'
        },
        {
          timestamp: '2024-01-15 14:35:30',
          level: 'info',
          source: 'NetworkTest',
          message: 'Network connectivity test passed'
        },
        {
          timestamp: '2024-01-15 14:35:45',
          level: 'error',
          source: 'BandwidthTest',
          message: 'Bandwidth test failed - performance below threshold',
          details: { expected: '100Mbps', actual: '45Mbps' }
        },
        {
          timestamp: '2024-01-15 14:35:50',
          level: 'info',
          source: 'DiskHealth',
          message: 'Disk health check completed - all disks healthy'
        },
        {
          timestamp: '2024-01-15 14:35:51',
          level: 'warn',
          source: 'StorageSpace',
          message: 'Primary volume at 82% capacity'
        },
        {
          timestamp: '2024-01-15 14:36:05',
          level: 'info',
          source: 'ResponseTime',
          message: 'API response time test completed successfully'
        }
      ];

      setDiagnosticTests(mockTests);
      setSystemHealth(mockHealth);
      setDiagnosticLogs(mockLogs);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch diagnostic data:', error);
      setIsLoading(false);
    }
  };

  const runDiagnostics = async (testIds?: string[]) => {
    setRunningDiagnostics(true);
    
    // Simulate running diagnostics
    const testsToRun = testIds || diagnosticTests.map(t => t.id);
    
    for (const testId of testsToRun) {
      setDiagnosticTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status: 'running' } : test
      ));
      
      // Simulate test duration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Random test result
      const results = ['passed', 'warning', 'failed'];
      const randomResult = results[Math.floor(Math.random() * results.length)] as DiagnosticTest['status'];
      
      setDiagnosticTests(prev => prev.map(test => 
        test.id === testId ? { 
          ...test, 
          status: randomResult,
          lastRun: 'Just now',
          duration: Math.random() * 10 + 0.5
        } : test
      ));
    }
    
    setRunningDiagnostics(false);
    await fetchDiagnosticData(); // Refresh all data
  };

  const getStatusColor = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'failed': return '#ff3333';
      case 'running': return '#0099ff';
      case 'pending': return '#888888';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'warning': return '⚠️';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#00ff88';
      case 'good': return '#00ffaa';
      case 'fair': return '#ffaa00';
      case 'poor': return '#ff6666';
      case 'critical': return '#ff3333';
      default: return '#888888';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return '#888888';
      case 'info': return '#0099ff';
      case 'warn': return '#ffaa00';
      case 'error': return '#ff6666';
      case 'fatal': return '#ff3333';
      default: return '#888888';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return '⚙️';
      case 'network': return '🌐';
      case 'storage': return '💾';
      case 'performance': return '⚡';
      case 'security': return '🛡️';
      default: return '📋';
    }
  };

  const filteredTests = selectedCategory === 'all' 
    ? diagnosticTests 
    : diagnosticTests.filter(test => test.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="diagnostics-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Initializing diagnostic systems...</div>
      </div>
    );
  }

  return (
    <div className="diagnostics">
      
      <div className="diagnostics-header">
        <h1>System Diagnostics</h1>
        <p className="diagnostics-subtitle">Comprehensive system analysis and health monitoring</p>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="health-overview">
          <div className="health-score">
            <div className="score-circle">
              <div 
                className="score-fill"
                style={{
                  background: `conic-gradient(${getHealthColor(systemHealth.overall)} ${systemHealth.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                }}
              >
                <div className="score-inner">
                  <div className="score-value">{systemHealth.score}</div>
                  <div className="score-label">Health Score</div>
                </div>
              </div>
            </div>
            <div className="health-status">
              <div 
                className="status-badge"
                style={{color: getHealthColor(systemHealth.overall)}}
              >
                {systemHealth.overall.toUpperCase()}
              </div>
            </div>
          </div>
          
          <div className="health-details">
            <div className="health-section">
              <h4>⚠️ Issues Detected ({systemHealth.issues.length})</h4>
              <ul className="issues-list">
                {systemHealth.issues.map((issue, index) => (
                  <li key={index} className="issue-item">{issue}</li>
                ))}
              </ul>
            </div>
            
            <div className="health-section">
              <h4>💡 Recommendations ({systemHealth.recommendations.length})</h4>
              <ul className="recommendations-list">
                {systemHealth.recommendations.map((rec, index) => (
                  <li key={index} className="recommendation-item">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Controls */}
      <div className="diagnostic-controls">
        <div className="control-section">
          <label>Filter by category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="system">System</option>
            <option value="network">Network</option>
            <option value="storage">Storage</option>
            <option value="performance">Performance</option>
            <option value="security">Security</option>
          </select>
        </div>
        
        <div className="action-buttons">
          <button 
            className="run-all-btn"
            onClick={() => runDiagnostics()}
            disabled={runningDiagnostics}
          >
            {runningDiagnostics ? '🔄 Running...' : '🚀 Run All Tests'}
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchDiagnosticData}
            disabled={runningDiagnostics}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Diagnostic Tests Grid */}
      <div className="diagnostic-tests">
        <div className="tests-grid">
          {filteredTests.map(test => (
            <div key={test.id} className={`test-card ${test.status}`}>
              <div className="test-header">
                <div className="test-info">
                  <span className="test-category">{getCategoryIcon(test.category)}</span>
                  <span className="test-name">{test.name}</span>
                </div>
                <div className="test-status">
                  <span className="status-icon">{getStatusIcon(test.status)}</span>
                  <span 
                    className="status-text"
                    style={{color: getStatusColor(test.status)}}
                  >
                    {test.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="test-content">
                <p className="test-description">{test.description}</p>
                
                <div className="test-metrics">
                  <div className="metric">
                    <span className="metric-label">Duration:</span>
                    <span className="metric-value">{test.duration.toFixed(1)}s</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Last Run:</span>
                    <span className="metric-value">{test.lastRun}</span>
                  </div>
                </div>
                
                {test.details && (
                  <div className="test-details">
                    <strong>Details:</strong> {test.details}
                  </div>
                )}
              </div>
              
              <div className="test-actions">
                <button 
                  className="run-test-btn"
                  onClick={() => runDiagnostics([test.id])}
                  disabled={runningDiagnostics || test.status === 'running'}
                >
                  {test.status === 'running' ? 'Running...' : 'Run Test'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Logs */}
      <div className="diagnostic-logs">
        <div className="logs-header">
          <h3>Diagnostic Logs</h3>
          <button className="clear-logs-btn">🗑️ Clear Logs</button>
        </div>
        
        <div className="logs-container">
          {diagnosticLogs.map((log, index) => (
            <div key={index} className={`log-entry ${log.level}`}>
              <div className="log-timestamp">{log.timestamp}</div>
              <div 
                className="log-level"
                style={{color: getLogLevelColor(log.level)}}
              >
                [{log.level.toUpperCase()}]
              </div>
              <div className="log-source">[{log.source}]</div>
              <div className="log-message">{log.message}</div>
              {log.details && (
                <div className="log-details">
                  {JSON.stringify(log.details, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Diagnostics;