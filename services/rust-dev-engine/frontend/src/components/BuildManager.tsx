import React, { useState, useEffect } from 'react';
import './BuildManager.css';

interface Build {
  id: string;
  projectName: string;
  projectId: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: string;
  trigger: 'manual' | 'git-push' | 'scheduled' | 'api';
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  testResults?: {
    passed: number;
    failed: number;
    skipped: number;
    coverage: number;
  };
  artifacts?: string[];
  logs?: string[];
}

interface BuildConfig {
  projectId: string;
  branch: string;
  buildType: 'debug' | 'release';
  runTests: boolean;
  generateDocs: boolean;
  deployAfter: boolean;
}

const BuildManager: React.FC = () => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [activeBuild, setActiveBuild] = useState<Build | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBuild, setShowNewBuild] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('startTime');

  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    projectId: '',
    branch: 'main',
    buildType: 'debug',
    runTests: true,
    generateDocs: false,
    deployAfter: false
  });

  const projects = [
    { id: '1', name: 'terrafusion-core' },
    { id: '2', name: 'auth-service' },
    { id: '3', name: 'data-processor' },
    { id: '4', name: 'config-cli' },
    { id: '5', name: 'property-valuation' }
  ];

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBuilds = async () => {
    try {
      // Mock data for now - replace with actual API
      const mockBuilds: Build[] = [
        {
          id: '1',
          projectName: 'terrafusion-core',
          projectId: '1',
          status: 'running',
          startTime: '2 minutes ago',
          trigger: 'git-push',
          branch: 'main',
          commit: 'a1b2c3d',
          commitMessage: 'Add new authentication middleware',
          author: 'John Doe',
          logs: [
            '[INFO] Build started',
            '[INFO] Fetching dependencies...',
            '[INFO] Compiling terrafusion-core v1.2.3',
            '[INFO] Running tests...'
          ]
        },
        {
          id: '2',
          projectName: 'auth-service',
          projectId: '2',
          status: 'success',
          startTime: '15 minutes ago',
          endTime: '12 minutes ago',
          duration: '3m 24s',
          trigger: 'manual',
          branch: 'feature/oauth2',
          commit: 'e4f5g6h',
          commitMessage: 'Implement OAuth2 integration',
          author: 'Jane Smith',
          testResults: {
            passed: 87,
            failed: 0,
            skipped: 3,
            coverage: 92.5
          },
          artifacts: ['auth-service-0.8.1.tar.gz', 'docs.zip']
        },
        {
          id: '3',
          projectName: 'data-processor',
          projectId: '3',
          status: 'failed',
          startTime: '1 hour ago',
          endTime: '58 minutes ago',
          duration: '2m 15s',
          trigger: 'scheduled',
          branch: 'main',
          commit: 'i7j8k9l',
          commitMessage: 'Optimize data processing pipeline',
          author: 'Bob Wilson',
          testResults: {
            passed: 45,
            failed: 3,
            skipped: 1,
            coverage: 78.3
          }
        },
        {
          id: '4',
          projectName: 'config-cli',
          projectId: '4',
          status: 'pending',
          startTime: 'Queued',
          trigger: 'api',
          branch: 'develop',
          commit: 'm0n1o2p',
          commitMessage: 'Add new configuration options',
          author: 'Alice Johnson'
        },
        {
          id: '5',
          projectName: 'property-valuation',
          projectId: '5',
          status: 'success',
          startTime: '3 hours ago',
          endTime: '2 hours 55 minutes ago',
          duration: '5m 12s',
          trigger: 'git-push',
          branch: 'main',
          commit: 'q3r4s5t',
          commitMessage: 'Update valuation algorithms',
          author: 'Charlie Brown',
          testResults: {
            passed: 156,
            failed: 0,
            skipped: 2,
            coverage: 96.7
          },
          artifacts: ['property-valuation-3.0.1.tar.gz', 'api-docs.html']
        }
      ];

      setBuilds(mockBuilds);
      if (!activeBuild && mockBuilds.length > 0) {
        setActiveBuild(mockBuilds[0]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch builds:', error);
      setIsLoading(false);
    }
  };

  const handleStartBuild = async () => {
    if (!buildConfig.projectId) return;

    try {
      const response = await fetch('/api/rust-dev/builds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildConfig),
      });

      if (response.ok) {
        setShowNewBuild(false);
        setBuildConfig({
          projectId: '',
          branch: 'main',
          buildType: 'debug',
          runTests: true,
          generateDocs: false,
          deployAfter: false
        });
        fetchBuilds();
      }
    } catch (error) {
      console.error('Failed to start build:', error);
    }
  };

  const handleCancelBuild = async (buildId: string) => {
    try {
      await fetch(`/api/rust-dev/builds/${buildId}/cancel`, {
        method: 'POST',
      });
      fetchBuilds();
    } catch (error) {
      console.error('Failed to cancel build:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      case 'cancelled': return '⏹️';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#0099ff';
      case 'success': return '#00ff88';
      case 'failed': return '#ff3333';
      case 'pending': return '#ffaa00';
      case 'cancelled': return '#888888';
      default: return '#888888';
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'git-push': return '📤';
      case 'manual': return '👤';
      case 'scheduled': return '⏰';
      case 'api': return '🔗';
      default: return '📋';
    }
  };

  const filteredBuilds = builds
    .filter(build => filter === 'all' || build.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'startTime':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'project':
          return a.projectName.localeCompare(b.projectName);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="build-manager-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading builds...</div>
      </div>
    );
  }

  return (
    <div className="build-manager">
      
      <div className="build-manager-header">
        <div className="header-left">
          <h1>Build Manager</h1>
          <p className="header-subtitle">Orchestrate and monitor build processes</p>
        </div>
        <button 
          className="new-build-btn"
          onClick={() => setShowNewBuild(true)}
        >
          <span className="btn-icon">🔨</span>
          Start Build
        </button>
      </div>

      {/* Build Stats */}
      <div className="build-stats">
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{builds.filter(b => b.status === 'running').length}</div>
            <div className="stat-label">Running</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{builds.filter(b => b.status === 'success').length}</div>
            <div className="stat-label">Successful</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{builds.filter(b => b.status === 'failed').length}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{builds.filter(b => b.status === 'pending').length}</div>
            <div className="stat-label">Queued</div>
          </div>
        </div>
      </div>

      <div className="build-content">
        
        {/* Build List */}
        <div className="build-list-panel">
          <div className="panel-header">
            <h3>Recent Builds</h3>
            <div className="build-filters">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="build-list">
            {filteredBuilds.map(build => (
              <div 
                key={build.id} 
                className={`build-item ${build.status} ${activeBuild?.id === build.id ? 'active' : ''}`}
                onClick={() => setActiveBuild(build)}
              >
                <div className="build-item-header">
                  <div className="build-info">
                    <span className="project-name">{build.projectName}</span>
                    <span className="build-branch">#{build.branch}</span>
                  </div>
                  <div className="build-status">
                    <span 
                      className="status-icon"
                      style={{ color: getStatusColor(build.status) }}
                    >
                      {getStatusIcon(build.status)}
                    </span>
                  </div>
                </div>

                <div className="build-item-details">
                  <div className="build-commit">
                    <span className="commit-hash">{build.commit}</span>
                    <span className="commit-message">{build.commitMessage}</span>
                  </div>
                  <div className="build-meta">
                    <span className="build-trigger">
                      {getTriggerIcon(build.trigger)} {build.trigger}
                    </span>
                    <span className="build-time">{build.startTime}</span>
                  </div>
                </div>

                {build.status === 'running' && (
                  <div className="build-progress">
                    <div className="progress-bar">
                      <div className="progress-fill running"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Build Details */}
        {activeBuild && (
          <div className="build-details-panel">
            <div className="panel-header">
              <h3>Build Details</h3>
              {activeBuild.status === 'running' && (
                <button 
                  className="cancel-build-btn"
                  onClick={() => handleCancelBuild(activeBuild.id)}
                >
                  Cancel Build
                </button>
              )}
            </div>

            <div className="build-details">
              
              {/* Build Info */}
              <div className="details-section">
                <h4>Build Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Project</span>
                    <span className="info-value">{activeBuild.projectName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Branch</span>
                    <span className="info-value">{activeBuild.branch}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Commit</span>
                    <span className="info-value">{activeBuild.commit}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author</span>
                    <span className="info-value">{activeBuild.author}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trigger</span>
                    <span className="info-value">
                      {getTriggerIcon(activeBuild.trigger)} {activeBuild.trigger}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration</span>
                    <span className="info-value">{activeBuild.duration || 'In progress...'}</span>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              {activeBuild.testResults && (
                <div className="details-section">
                  <h4>Test Results</h4>
                  <div className="test-results">
                    <div className="test-summary">
                      <div className="test-stat passed">
                        <span className="test-count">{activeBuild.testResults.passed}</span>
                        <span className="test-label">Passed</span>
                      </div>
                      <div className="test-stat failed">
                        <span className="test-count">{activeBuild.testResults.failed}</span>
                        <span className="test-label">Failed</span>
                      </div>
                      <div className="test-stat skipped">
                        <span className="test-count">{activeBuild.testResults.skipped}</span>
                        <span className="test-label">Skipped</span>
                      </div>
                    </div>
                    <div className="coverage-info">
                      <span className="coverage-label">Coverage</span>
                      <div className="coverage-bar">
                        <div 
                          className="coverage-fill"
                          style={{ width: `${activeBuild.testResults.coverage}%` }}
                        ></div>
                      </div>
                      <span className="coverage-value">{activeBuild.testResults.coverage}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Artifacts */}
              {activeBuild.artifacts && activeBuild.artifacts.length > 0 && (
                <div className="details-section">
                  <h4>Build Artifacts</h4>
                  <div className="artifacts-list">
                    {activeBuild.artifacts.map((artifact, index) => (
                      <div key={index} className="artifact-item">
                        <span className="artifact-icon">📦</span>
                        <span className="artifact-name">{artifact}</span>
                        <button className="download-btn">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Build Logs */}
              <div className="details-section">
                <h4>Build Logs</h4>
                <div className="logs-container">
                  {activeBuild.logs && activeBuild.logs.length > 0 ? (
                    activeBuild.logs.map((log, index) => (
                      <div key={index} className="log-line">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="no-logs">No logs available</div>
                  )}
                  {activeBuild.status === 'running' && (
                    <div className="log-line streaming">
                      <span className="cursor">▊</span> Streaming logs...
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* New Build Modal */}
      {showNewBuild && (
        <div className="modal-overlay">
          <div className="new-build-modal">
            <div className="modal-header">
              <h2>Start New Build</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewBuild(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={buildConfig.projectId}
                  onChange={(e) => setBuildConfig({...buildConfig, projectId: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={buildConfig.branch}
                    onChange={(e) => setBuildConfig({...buildConfig, branch: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Build Type</label>
                  <select
                    value={buildConfig.buildType}
                    onChange={(e) => setBuildConfig({...buildConfig, buildType: e.target.value as 'debug' | 'release'})}
                    className="form-select"
                  >
                    <option value="debug">Debug</option>
                    <option value="release">Release</option>
                  </select>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={buildConfig.runTests}
                    onChange={(e) => setBuildConfig({...buildConfig, runTests: e.target.checked})}
                  />
                  <span className="checkbox-custom"></span>
                  Run tests
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={buildConfig.generateDocs}
                    onChange={(e) => setBuildConfig({...buildConfig, generateDocs: e.target.checked})}
                  />
                  <span className="checkbox-custom"></span>
                  Generate documentation
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={buildConfig.deployAfter}
                    onChange={(e) => setBuildConfig({...buildConfig, deployAfter: e.target.checked})}
                  />
                  <span className="checkbox-custom"></span>
                  Deploy after successful build
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowNewBuild(false)}
              >
                Cancel
              </button>
              <button 
                className="start-btn"
                onClick={handleStartBuild}
                disabled={!buildConfig.projectId}
              >
                Start Build
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuildManager;