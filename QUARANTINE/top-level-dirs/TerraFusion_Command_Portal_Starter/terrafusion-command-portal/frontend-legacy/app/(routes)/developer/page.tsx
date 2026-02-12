'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface DeveloperTool {
  id: string;
  name: string;
  category: 'debugging' | 'testing' | 'documentation' | 'performance' | 'code-quality' | 'deployment';
  status: 'available' | 'active' | 'error' | 'updating';
  description: string;
  version: string;
  lastUsed?: Date;
  usage: ToolUsageMetrics;
  configuration: any;
}

interface ToolUsageMetrics {
  totalUses: number;
  averageSessionTime: number;
  successRate: number;
  lastWeekUses: number;
  popularFeatures: string[];
}

interface DebugSession {
  id: string;
  workspace: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating' | 'blocked';
  startTime: Date;
  endTime?: Date;
  assignedTo: string;
  logs: DebugLog[];
  stackTrace?: string;
  environment: string;
}

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: string;
  context?: any;
}

interface CodeQualityMetric {
  workspace: string;
  codebaseHealth: number;
  testCoverage: number;
  duplicateCodePercentage: number;
  technicalDebtHours: number;
  vulnerabilities: SecurityVulnerability[];
  lastAnalysis: Date;
  trends: QualityTrend[];
}

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  file: string;
  line: number;
  suggestion: string;
  cve?: string;
}

interface QualityTrend {
  metric: string;
  value: number;
  change: number;
  period: 'day' | 'week' | 'month';
}

interface TestResult {
  workspace: string;
  testSuite: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage: number;
  lastRun: Date;
  failedTests: FailedTest[];
}

interface FailedTest {
  name: string;
  error: string;
  stackTrace: string;
  duration: number;
}

interface PerformanceProfile {
  workspace: string;
  endpoint: string;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  lastProfiled: Date;
}

interface DocumentationItem {
  id: string;
  title: string;
  type: 'api' | 'guide' | 'tutorial' | 'reference' | 'changelog';
  workspace: string;
  status: 'up-to-date' | 'outdated' | 'missing' | 'draft';
  lastUpdated: Date;
  views: number;
  rating: number;
  completeness: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DeveloperExperience() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [developerTools, setDeveloperTools] = useState<DeveloperTool[]>([]);
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([]);
  const [codeQuality, setCodeQuality] = useState<CodeQualityMetric[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceProfiles, setPerformanceProfiles] = useState<PerformanceProfile[]>([]);
  const [documentation, setDocumentation] = useState<DocumentationItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Real-time developer experience data
  const { data: devToolsData, error } = useSWR('/api/developer/tools', fetcher, { 
    refreshInterval: 5000 
  });
  const { data: debugData } = useSWR('/api/developer/debug-sessions', fetcher, {
    refreshInterval: 3000
  });

  useEffect(() => {
    // Mock developer tools data
    const mockDeveloperTools: DeveloperTool[] = [
      {
        id: 'tool-1',
        name: 'Live Code Debugger',
        category: 'debugging',
        status: 'active',
        description: 'Real-time debugging with breakpoints and variable inspection',
        version: '2.4.1',
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        usage: {
          totalUses: 847,
          averageSessionTime: 25.6,
          successRate: 92.3,
          lastWeekUses: 34,
          popularFeatures: ['Breakpoints', 'Variable Watch', 'Call Stack']
        },
        configuration: {
          autoBreakOnExceptions: true,
          logLevel: 'debug',
          sourceMapEnabled: true
        }
      },
      {
        id: 'tool-2',
        name: 'Automated Test Runner',
        category: 'testing',
        status: 'available',
        description: 'Continuous testing with coverage reporting and parallel execution',
        version: '3.1.0',
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        usage: {
          totalUses: 1234,
          averageSessionTime: 8.3,
          successRate: 97.1,
          lastWeekUses: 67,
          popularFeatures: ['Unit Tests', 'Integration Tests', 'Coverage Reports']
        },
        configuration: {
          parallelExecution: true,
          coverageThreshold: 80,
          watchMode: true
        }
      },
      {
        id: 'tool-3',
        name: 'Performance Profiler',
        category: 'performance',
        status: 'available',
        description: 'Advanced performance analysis and optimization recommendations',
        version: '1.8.2',
        lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000),
        usage: {
          totalUses: 345,
          averageSessionTime: 15.7,
          successRate: 89.4,
          lastWeekUses: 12,
          popularFeatures: ['CPU Profiling', 'Memory Analysis', 'Bundle Analysis']
        },
        configuration: {
          samplingRate: 1000,
          includeNodeModules: false,
          trackMemoryLeaks: true
        }
      },
      {
        id: 'tool-4',
        name: 'Code Quality Analyzer',
        category: 'code-quality',
        status: 'active',
        description: 'Static code analysis with security vulnerability detection',
        version: '2.7.3',
        lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000),
        usage: {
          totalUses: 567,
          averageSessionTime: 3.2,
          successRate: 94.8,
          lastWeekUses: 28,
          popularFeatures: ['ESLint Integration', 'Security Scan', 'Duplicate Detection']
        },
        configuration: {
          strictMode: true,
          includeTests: false,
          securityRules: 'recommended'
        }
      }
    ];

    const mockDebugSessions: DebugSession[] = [
      {
        id: 'debug-1',
        workspace: 'terra-levy',
        issue: 'Memory leak in tax calculation service',
        severity: 'high',
        status: 'active',
        startTime: new Date(Date.now() - 45 * 60 * 1000),
        assignedTo: 'Sarah Chen',
        environment: 'staging',
        logs: [
          {
            id: 'log-1',
            timestamp: new Date(Date.now() - 40 * 60 * 1000),
            level: 'error',
            message: 'OutOfMemoryError in TaxCalculationService.calculateLevy()',
            source: 'TaxCalculationService.java:142',
            context: { heapSize: '2GB', usedMemory: '1.8GB' }
          },
          {
            id: 'log-2',
            timestamp: new Date(Date.now() - 35 * 60 * 1000),
            level: 'warn',
            message: 'GC frequency increasing - possible memory leak',
            source: 'JVM Monitor',
            context: { gcFrequency: '12/min', avgGcTime: '2.3s' }
          }
        ],
        stackTrace: `java.lang.OutOfMemoryError: Java heap space
    at com.terra.levy.TaxCalculationService.calculateLevy(TaxCalculationService.java:142)
    at com.terra.levy.PropertyController.calculateTaxes(PropertyController.java:87)`
      },
      {
        id: 'debug-2',
        workspace: 'backend',
        issue: 'API timeout on large data requests',
        severity: 'medium',
        status: 'investigating',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        assignedTo: 'Mike Rodriguez',
        environment: 'production',
        logs: [
          {
            id: 'log-3',
            timestamp: new Date(Date.now() - 90 * 60 * 1000),
            level: 'error',
            message: 'Request timeout after 30s for /api/workspaces/analytics',
            source: 'AnalyticsController.rs:234',
            context: { requestSize: '45MB', timeout: '30s' }
          }
        ]
      }
    ];

    const mockCodeQuality: CodeQualityMetric[] = [
      {
        workspace: 'terra-levy',
        codebaseHealth: 87,
        testCoverage: 84.2,
        duplicateCodePercentage: 3.1,
        technicalDebtHours: 24.5,
        lastAnalysis: new Date(Date.now() - 2 * 60 * 60 * 1000),
        vulnerabilities: [
          {
            id: 'vuln-1',
            severity: 'medium',
            type: 'SQL Injection',
            description: 'Potential SQL injection vulnerability in user input handling',
            file: 'UserService.java',
            line: 156,
            suggestion: 'Use parameterized queries instead of string concatenation',
            cve: 'CVE-2024-1234'
          }
        ],
        trends: [
          { metric: 'codebaseHealth', value: 87, change: 2.3, period: 'week' },
          { metric: 'testCoverage', value: 84.2, change: 1.8, period: 'week' },
          { metric: 'technicalDebt', value: 24.5, change: -3.2, period: 'week' }
        ]
      }
    ];

    const mockTestResults: TestResult[] = [
      {
        workspace: 'terra-levy',
        testSuite: 'Unit Tests',
        totalTests: 245,
        passed: 238,
        failed: 5,
        skipped: 2,
        duration: 12.3,
        coverage: 84.2,
        lastRun: new Date(Date.now() - 30 * 60 * 1000),
        failedTests: [
          {
            name: 'TaxCalculationService.testComplexLevy',
            error: 'AssertionError: Expected 1250.50 but got 1248.75',
            stackTrace: 'at TaxCalculationServiceTest.java:89',
            duration: 0.45
          }
        ]
      }
    ];

    const mockPerformanceProfiles: PerformanceProfile[] = [
      {
        workspace: 'backend',
        endpoint: '/api/workspaces',
        averageResponseTime: 145,
        p95ResponseTime: 320,
        p99ResponseTime: 580,
        throughput: 1247,
        errorRate: 0.8,
        memoryUsage: 65.3,
        cpuUsage: 23.7,
        lastProfiled: new Date(Date.now() - 15 * 60 * 1000)
      }
    ];

    const mockDocumentation: DocumentationItem[] = [
      {
        id: 'doc-1',
        title: 'TerraFusion API Reference',
        type: 'api',
        workspace: 'backend',
        status: 'up-to-date',
        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000),
        views: 1456,
        rating: 4.7,
        completeness: 92
      },
      {
        id: 'doc-2',
        title: 'Deployment Guide',
        type: 'guide',
        workspace: 'all',
        status: 'outdated',
        lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        views: 234,
        rating: 4.2,
        completeness: 78
      }
    ];

    setDeveloperTools(mockDeveloperTools);
    setDebugSessions(mockDebugSessions);
    setCodeQuality(mockCodeQuality);
    setTestResults(mockTestResults);
    setPerformanceProfiles(mockPerformanceProfiles);
    setDocumentation(mockDocumentation);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
      case 'up-to-date':
      case 'resolved': return '#28a745';
      case 'error':
      case 'critical':
      case 'failed': return '#dc3545';
      case 'updating':
      case 'investigating':
      case 'outdated':
      case 'medium': return '#ffc107';
      case 'draft':
      case 'missing': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'available': return '✅';
      case 'error': return '❌';
      case 'updating': return '🔄';
      case 'resolved': return '✅';
      case 'investigating': return '🔍';
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '📋';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'debugging': return '🐛';
      case 'testing': return '🧪';
      case 'documentation': return '📚';
      case 'performance': return '⚡';
      case 'code-quality': return '🔍';
      case 'deployment': return '🚀';
      default: return '🔧';
    }
  };

  const startDebugSession = (workspace: string, issue: string) => {
    console.log('Starting debug session for:', workspace, issue);
    // Simulate starting debug session
  };

  const runTool = (toolId: string) => {
    console.log('Running tool:', toolId);
    // Simulate running developer tool
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  return (
    <div style={{ padding: 16, background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: '16px 24px',
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#2c3e50' }}>
            🛠️ Developer Experience Hub
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d' }}>
            Advanced debugging, testing, performance profiling, and code quality tools • {developerTools.filter(t => t.status === 'active').length} active tools
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => startDebugSession('current', 'New issue')}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🐛 Start Debug Session
          </button>
          <button
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 0
      }}>
        {[
          { id: 'overview', name: 'Tools Overview', icon: '🛠️' },
          { id: 'debugging', name: 'Debug Sessions', icon: '🐛' },
          { id: 'testing', name: 'Test Results', icon: '🧪' },
          { id: 'performance', name: 'Performance', icon: '⚡' },
          { id: 'quality', name: 'Code Quality', icon: '🔍' },
          { id: 'docs', name: 'Documentation', icon: '📚' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px',
              background: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: activeTab === tab.id ? '8px 8px 0 0' : 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600
            }}
          >
            <span>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 24
      }}>
        {activeTab === 'overview' && (
          <div>
            {/* Developer Tools Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              {developerTools.map(tool => (
                <div key={tool.id} style={{
                  border: `2px solid ${getStatusColor(tool.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(tool.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{getCategoryIcon(tool.category)}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                          {tool.name}
                        </h3>
                        <div style={{ fontSize: 12, color: '#6c757d' }}>
                          v{tool.version} • {tool.category}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      background: getStatusColor(tool.status),
                      color: 'white',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      <span>{getStatusIcon(tool.status)}</span>
                      <span>{tool.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: 14,
                    color: '#6c757d',
                    lineHeight: 1.4
                  }}>
                    {tool.description}
                  </p>

                  {/* Usage Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginBottom: 12
                  }}>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#007bff' }}>
                        {tool.usage.totalUses}
                      </div>
                      <div style={{ fontSize: 10, color: '#6c757d' }}>Total Uses</div>
                    </div>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#28a745' }}>
                        {tool.usage.successRate.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 10, color: '#6c757d' }}>Success Rate</div>
                    </div>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#ffc107' }}>
                        {tool.usage.lastWeekUses}
                      </div>
                      <div style={{ fontSize: 10, color: '#6c757d' }}>This Week</div>
                    </div>
                  </div>

                  {/* Popular Features */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>
                      Popular Features:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tool.usage.popularFeatures.map(feature => (
                        <span key={feature} style={{
                          padding: '2px 6px',
                          background: '#007bff',
                          color: 'white',
                          borderRadius: 10,
                          fontSize: 10
                        }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => runTool(tool.id)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      🚀 Launch
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      ⚙️ Configure
                    </button>
                  </div>

                  {tool.lastUsed && (
                    <div style={{ fontSize: 11, color: '#6c757d', marginTop: 8 }}>
                      Last used: {Math.floor((Date.now() - tool.lastUsed.getTime()) / (1000 * 60))} minutes ago
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'debugging' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              🐛 Active Debug Sessions
            </h3>

            {/* Debug Sessions */}
            <div style={{ display: 'grid', gap: 16 }}>
              {debugSessions.map(session => (
                <div key={session.id} style={{
                  border: `2px solid ${getStatusColor(session.severity)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(session.severity)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {session.issue}
                      </h4>
                      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: '#6c757d' }}>
                        <span><strong>Workspace:</strong> {session.workspace}</span>
                        <span><strong>Environment:</strong> {session.environment}</span>
                        <span><strong>Assigned:</strong> {session.assignedTo}</span>
                        <span><strong>Started:</strong> {session.startTime.toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        padding: '4px 8px',
                        background: getStatusColor(session.severity),
                        color: 'white',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        {session.severity.toUpperCase()}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: getStatusColor(session.status),
                        color: 'white',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        <span>{getStatusIcon(session.status)}</span>
                        <span>{session.status.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Logs */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Recent Logs ({session.logs.length}):
                    </div>
                    <div style={{
                      background: '#000',
                      color: '#00ff00',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      maxHeight: 150,
                      overflowY: 'auto'
                    }}>
                      {session.logs.slice(-3).map(log => (
                        <div key={log.id} style={{ marginBottom: 4 }}>
                          <span style={{ color: log.level === 'error' ? '#ff6b6b' : log.level === 'warn' ? '#feca57' : '#00ff00' }}>
                            [{log.timestamp.toLocaleTimeString()}] {log.level.toUpperCase()}:
                          </span> {log.message}
                          <br />
                          <span style={{ color: '#888', fontSize: 10 }}>
                            → {log.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stack Trace */}
                  {session.stackTrace && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Stack Trace:
                      </div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: '#dc3545',
                        maxHeight: 100,
                        overflowY: 'auto'
                      }}>
                        {session.stackTrace}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Investigate
                    </button>
                    <button
                      style={{
                        padding: '6px 12px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Mark Resolved
                    </button>
                    <button
                      style={{
                        padding: '6px 12px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      📋 View Details
                    </button>
                  </div>

                  <div style={{ fontSize: 11, color: '#6c757d', marginTop: 8 }}>
                    Duration: {Math.floor((Date.now() - session.startTime.getTime()) / (1000 * 60))} minutes
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              🧪 Test Results & Coverage
            </h3>

            {/* Test Results */}
            <div style={{ display: 'grid', gap: 16 }}>
              {testResults.map(result => (
                <div key={`${result.workspace}-${result.testSuite}`} style={{
                  border: result.failed > 0 ? '2px solid #dc3545' : '2px solid #28a745',
                  borderRadius: 8,
                  padding: 16,
                  background: result.failed > 0 ? '#dc354508' : '#28a74508'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {result.workspace} - {result.testSuite}
                      </h4>
                      <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                        Last run: {result.lastRun.toLocaleString()} • Duration: {formatDuration(result.duration)}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: result.failed > 0 ? '#dc3545' : '#28a745',
                      color: 'white',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      <span>{result.failed > 0 ? '❌' : '✅'}</span>
                      <span>{result.failed > 0 ? 'FAILED' : 'PASSED'}</span>
                    </div>
                  </div>

                  {/* Test Statistics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12,
                    marginBottom: 12
                  }}>
                    <div style={{
                      padding: 12,
                      background: '#28a745',
                      color: 'white',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{result.passed}</div>
                      <div style={{ fontSize: 11 }}>Passed</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: result.failed > 0 ? '#dc3545' : '#e9ecef',
                      color: result.failed > 0 ? 'white' : '#6c757d',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{result.failed}</div>
                      <div style={{ fontSize: 11 }}>Failed</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: result.skipped > 0 ? '#ffc107' : '#e9ecef',
                      color: result.skipped > 0 ? 'white' : '#6c757d',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{result.skipped}</div>
                      <div style={{ fontSize: 11 }}>Skipped</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: result.coverage >= 80 ? '#28a745' : result.coverage >= 60 ? '#ffc107' : '#dc3545',
                      color: 'white',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{result.coverage.toFixed(1)}%</div>
                      <div style={{ fontSize: 11 }}>Coverage</div>
                    </div>
                  </div>

                  {/* Failed Tests Details */}
                  {result.failedTests.length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#dc3545' }}>
                        Failed Tests:
                      </div>
                      {result.failedTests.map((test, index) => (
                        <div key={index} style={{
                          padding: 12,
                          background: '#fff5f5',
                          border: '1px solid #fed7d7',
                          borderRadius: 6,
                          marginBottom: 8
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                            {test.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#dc3545', marginBottom: 4 }}>
                            {test.error}
                          </div>
                          <div style={{ fontSize: 11, color: '#6c757d', fontFamily: 'monospace' }}>
                            {test.stackTrace}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              ⚡ Performance Profiles
            </h3>

            {/* Performance Profiles */}
            <div style={{ display: 'grid', gap: 16 }}>
              {performanceProfiles.map((profile, index) => (
                <div key={index} style={{
                  border: '2px solid #007bff',
                  borderRadius: 8,
                  padding: 16,
                  background: '#007bff08'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {profile.workspace} - {profile.endpoint}
                      </h4>
                      <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                        Last profiled: {profile.lastProfiled.toLocaleString()}
                      </div>
                    </div>

                    <div style={{
                      padding: '6px 12px',
                      background: profile.errorRate < 1 ? '#28a745' : profile.errorRate < 5 ? '#ffc107' : '#dc3545',
                      color: 'white',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {profile.errorRate.toFixed(1)}% Error Rate
                    </div>
                  </div>

                  {/* Performance Metrics Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 12
                  }}>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#007bff' }}>
                        {profile.averageResponseTime}ms
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Avg Response Time</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#ffc107' }}>
                        {profile.p95ResponseTime}ms
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>P95 Response Time</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#dc3545' }}>
                        {profile.p99ResponseTime}ms
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>P99 Response Time</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#28a745' }}>
                        {profile.throughput.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Requests/min</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#17a2b8' }}>
                        {profile.memoryUsage.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Memory Usage</div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#fd7e14' }}>
                        {profile.cpuUsage.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>CPU Usage</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              🔍 Code Quality Analysis
            </h3>

            {/* Code Quality Metrics */}
            <div style={{ display: 'grid', gap: 16 }}>
              {codeQuality.map((metric, index) => (
                <div key={index} style={{
                  border: '2px solid #28a745',
                  borderRadius: 8,
                  padding: 16,
                  background: '#28a74508'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {metric.workspace} Workspace
                      </h4>
                      <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                        Last analysis: {metric.lastAnalysis.toLocaleString()}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: metric.codebaseHealth >= 80 ? '#28a745' : metric.codebaseHealth >= 60 ? '#ffc107' : '#dc3545'
                    }}>
                      {metric.codebaseHealth}
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginBottom: 16
                  }}>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6
                    }}>
                      <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                        Test Coverage
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#007bff' }}>
                        {metric.testCoverage.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6
                    }}>
                      <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                        Duplicate Code
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#ffc107' }}>
                        {metric.duplicateCodePercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{
                      padding: 12,
                      background: '#f8f9fa',
                      borderRadius: 6
                    }}>
                      <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                        Technical Debt
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#dc3545' }}>
                        {metric.technicalDebtHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>

                  {/* Security Vulnerabilities */}
                  {metric.vulnerabilities.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#dc3545' }}>
                        Security Vulnerabilities ({metric.vulnerabilities.length}):
                      </div>
                      {metric.vulnerabilities.map(vuln => (
                        <div key={vuln.id} style={{
                          padding: 12,
                          background: '#fff5f5',
                          border: '1px solid #fed7d7',
                          borderRadius: 6,
                          marginBottom: 8
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4
                          }}>
                            <strong style={{ fontSize: 14 }}>{vuln.type}</strong>
                            <span style={{
                              padding: '2px 8px',
                              background: getStatusColor(vuln.severity),
                              color: 'white',
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 600
                            }}>
                              {vuln.severity.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                            {vuln.description}
                          </div>
                          <div style={{ fontSize: 11, color: '#6c757d', fontFamily: 'monospace', marginBottom: 4 }}>
                            {vuln.file}:{vuln.line}
                          </div>
                          <div style={{ fontSize: 12, color: '#007bff' }}>
                            💡 {vuln.suggestion}
                          </div>
                          {vuln.cve && (
                            <div style={{ fontSize: 11, color: '#dc3545', marginTop: 4 }}>
                              CVE: {vuln.cve}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quality Trends */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Quality Trends:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                      {metric.trends.map(trend => (
                        <div key={trend.metric} style={{
                          padding: 8,
                          background: trend.change > 0 ? '#d4edda' : '#f8d7da',
                          border: `1px solid ${trend.change > 0 ? '#c3e6cb' : '#f5c6cb'}`,
                          borderRadius: 4
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {trend.metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{trend.value}</span>
                            <span style={{
                              fontSize: 12,
                              color: trend.change > 0 ? '#28a745' : '#dc3545'
                            }}>
                              {trend.change > 0 ? '↗️' : '↘️'} {Math.abs(trend.change).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              📚 Documentation Status
            </h3>

            {/* Documentation Items */}
            <div style={{ display: 'grid', gap: 16 }}>
              {documentation.map(doc => (
                <div key={doc.id} style={{
                  border: `2px solid ${getStatusColor(doc.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(doc.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {doc.title}
                      </h4>
                      <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                        {doc.type.toUpperCase()} • {doc.workspace} • Last updated: {doc.lastUpdated.toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: getStatusColor(doc.status),
                      color: 'white',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      <span>{getStatusIcon(doc.status)}</span>
                      <span>{doc.status.toUpperCase().replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Documentation Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12
                  }}>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#007bff' }}>
                        {doc.views.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Views</div>
                    </div>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#ffc107' }}>
                        {doc.rating.toFixed(1)}★
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Rating</div>
                    </div>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: doc.completeness >= 80 ? '#28a745' : '#dc3545' }}>
                        {doc.completeness}%
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Complete</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}