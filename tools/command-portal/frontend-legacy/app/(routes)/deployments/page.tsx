'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface DeploymentPipeline {
  id: string;
  name: string;
  workspace: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'cancelled';
  stages: DeploymentStage[];
  currentStage: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  triggeredBy: string;
  version: string;
  environment: string;
}

interface DeploymentStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  logs: string[];
  artifacts: Artifact[];
  approvals?: Approval[];
}

interface Artifact {
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Approval {
  id: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: Date;
  comment?: string;
}

interface DeploymentConfig {
  workspace: string;
  environment: string;
  version: string;
  rollbackEnabled: boolean;
  blueGreenDeployment: boolean;
  canaryPercentage?: number;
  approvalRequired: boolean;
  approvers: string[];
  healthChecks: HealthCheck[];
}

interface HealthCheck {
  name: string;
  url: string;
  expected: string;
  timeout: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DeploymentOrchestrator() {
  const [activeDeployments, setActiveDeployments] = useState<DeploymentPipeline[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentPipeline[]>([]);
  const [showNewDeployment, setShowNewDeployment] = useState(false);
  const [newDeploymentConfig, setNewDeploymentConfig] = useState<Partial<DeploymentConfig>>({});

  // Real-time deployment data
  const { data: deployments, error } = useSWR('/api/deployments/active', fetcher, { 
    refreshInterval: 2000 
  });
  const { data: history } = useSWR('/api/deployments/history', fetcher, {
    refreshInterval: 10000
  });

  useEffect(() => {
    // Mock active deployments
    const mockDeployments: DeploymentPipeline[] = [
      {
        id: '1',
        name: 'Terra Levy Production Deploy',
        workspace: 'terra-levy',
        status: 'running',
        currentStage: 2,
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        triggeredBy: 'Sarah Chen',
        version: '2.1.2',
        environment: 'production',
        stages: [
          {
            id: '1-1',
            name: 'Build & Test',
            status: 'success',
            startTime: new Date(Date.now() - 5 * 60 * 1000),
            endTime: new Date(Date.now() - 3 * 60 * 1000),
            duration: 120,
            logs: [
              '✓ Code compilation successful',
              '✓ Unit tests passed (98% coverage)',
              '✓ Integration tests passed',
              '✓ Security scan completed - No issues'
            ],
            artifacts: [
              { name: 'terra-levy.zip', type: 'application', size: 15728640, url: '/artifacts/terra-levy.zip' }
            ]
          },
          {
            id: '1-2',
            name: 'Staging Deployment',
            status: 'running',
            startTime: new Date(Date.now() - 3 * 60 * 1000),
            logs: [
              '⏳ Deploying to staging environment...',
              '✓ Database migration completed',
              '⏳ Application deployment in progress...'
            ],
            artifacts: []
          },
          {
            id: '1-3',
            name: 'Production Approval',
            status: 'pending',
            logs: [],
            artifacts: [],
            approvals: [
              {
                id: 'app-1',
                approver: 'Mike Rodriguez',
                status: 'pending'
              },
              {
                id: 'app-2',
                approver: 'Emily Johnson',
                status: 'pending'
              }
            ]
          },
          {
            id: '1-4',
            name: 'Production Deployment',
            status: 'pending',
            logs: [],
            artifacts: []
          }
        ]
      },
      {
        id: '2',
        name: 'Backend API Hotfix',
        workspace: 'backend',
        status: 'running',
        currentStage: 1,
        startTime: new Date(Date.now() - 2 * 60 * 1000),
        triggeredBy: 'Auto-Trigger (Security Alert)',
        version: '1.8.3',
        environment: 'production',
        stages: [
          {
            id: '2-1',
            name: 'Critical Patch Build',
            status: 'running',
            startTime: new Date(Date.now() - 2 * 60 * 1000),
            logs: [
              '⚠️ Critical security patch detected',
              '⏳ Fast-track deployment initiated',
              '✓ Security vulnerability patched',
              '⏳ Building emergency release...'
            ],
            artifacts: []
          },
          {
            id: '2-2',
            name: 'Immediate Deploy',
            status: 'pending',
            logs: [],
            artifacts: []
          }
        ]
      }
    ];

    const mockHistory: DeploymentPipeline[] = [
      {
        id: '3',
        name: 'OS Platform Update',
        workspace: 'os-platform',
        status: 'success',
        currentStage: 3,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        duration: 1800,
        triggeredBy: 'Emily Johnson',
        version: '3.2.0',
        environment: 'production',
        stages: []
      },
      {
        id: '4',
        name: 'Terra Bank Rollback',
        workspace: 'terra-bank',
        status: 'success',
        currentStage: 2,
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        duration: 600,
        triggeredBy: 'Auto-Rollback (Health Check Failed)',
        version: '1.4.2',
        environment: 'production',
        stages: []
      }
    ];

    setActiveDeployments(mockDeployments);
    setDeploymentHistory(mockHistory);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'running': return '#007bff';
      case 'failed': return '#dc3545';
      case 'pending': return '#6c757d';
      case 'cancelled': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'running': return '⏳';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      case 'cancelled': return '⏹️';
      default: return '❓';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const triggerDeployment = async (config: DeploymentConfig) => {
    // Simulate deployment trigger
    console.log('Triggering deployment:', config);
    setShowNewDeployment(false);
    setNewDeploymentConfig({});
  };

  const approveDeployment = async (deploymentId: string, stageId: string, approvalId: string) => {
    // Simulate approval
    console.log('Approving deployment:', { deploymentId, stageId, approvalId });
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
            🚀 Deployment Orchestrator
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d' }}>
            Intelligent deployment pipeline management • {activeDeployments.length} active deployments
          </p>
        </div>
        
        <button
          onClick={() => setShowNewDeployment(true)}
          style={{
            padding: '12px 24px',
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
          🚀 New Deployment
        </button>
      </div>

      {/* Active Deployments */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 24
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#2c3e50' }}>
            🔴 Active Deployments
          </h2>
          <div style={{
            background: activeDeployments.length > 0 ? '#28a745' : '#6c757d',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600
          }}>
            {activeDeployments.length}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {activeDeployments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 18, marginBottom: 8 }}>No Active Deployments</div>
              <div style={{ fontSize: 14 }}>All systems are stable and up to date</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {activeDeployments.map(deployment => (
                <div key={deployment.id} style={{
                  border: `2px solid ${getStatusColor(deployment.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(deployment.status)}08`
                }}>
                  {/* Deployment Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, color: '#2c3e50' }}>
                        {deployment.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: '#6c757d' }}>
                          Workspace: <strong>{deployment.workspace}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: '#6c757d' }}>
                          Version: <strong>{deployment.version}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: '#6c757d' }}>
                          Environment: <strong>{deployment.environment}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: '#6c757d' }}>
                          Triggered by: <strong>{deployment.triggeredBy}</strong>
                        </span>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      background: getStatusColor(deployment.status),
                      color: 'white',
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      <span>{getStatusIcon(deployment.status)}</span>
                      <span>{deployment.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    background: '#e9ecef',
                    height: 8,
                    borderRadius: 4,
                    marginBottom: 16,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: getStatusColor(deployment.status),
                      height: '100%',
                      width: `${(deployment.currentStage / deployment.stages.length) * 100}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>

                  {/* Deployment Stages */}
                  <div style={{ display: 'grid', gap: 12 }}>
                    {deployment.stages.map((stage, index) => (
                      <div key={stage.id} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: 12,
                        background: index <= deployment.currentStage ? 'white' : '#f8f9fa',
                        borderRadius: 6,
                        border: '1px solid #dee2e6',
                        opacity: index > deployment.currentStage ? 0.6 : 1
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: getStatusColor(stage.status),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          marginRight: 12,
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                          }}>
                            <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                              {stage.name}
                            </h4>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              color: getStatusColor(stage.status),
                              fontWeight: 600
                            }}>
                              <span>{getStatusIcon(stage.status)}</span>
                              <span>{stage.status.toUpperCase()}</span>
                            </div>
                          </div>

                          {stage.logs.length > 0 && (
                            <div style={{
                              background: '#000',
                              color: '#00ff00',
                              padding: 8,
                              borderRadius: 4,
                              fontSize: 12,
                              fontFamily: 'monospace',
                              marginBottom: 8,
                              maxHeight: 120,
                              overflowY: 'auto'
                            }}>
                              {stage.logs.map((log, logIndex) => (
                                <div key={logIndex}>{log}</div>
                              ))}
                            </div>
                          )}

                          {stage.approvals && stage.approvals.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                                Approvals Required:
                              </div>
                              {stage.approvals.map(approval => (
                                <div key={approval.id} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '4px 8px',
                                  background: '#f8f9fa',
                                  borderRadius: 4,
                                  marginBottom: 4
                                }}>
                                  <span style={{ fontSize: 12 }}>{approval.approver}</span>
                                  <button
                                    onClick={() => approveDeployment(deployment.id, stage.id, approval.id)}
                                    disabled={approval.status !== 'pending'}
                                    style={{
                                      padding: '2px 8px',
                                      background: approval.status === 'pending' ? '#28a745' : '#6c757d',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 4,
                                      fontSize: 10,
                                      cursor: approval.status === 'pending' ? 'pointer' : 'not-allowed'
                                    }}
                                  >
                                    {approval.status === 'pending' ? 'Approve' : approval.status}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {stage.duration && (
                            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                              Duration: {formatDuration(stage.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deployment History */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #dee2e6'
        }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#2c3e50' }}>
            📊 Recent Deployments
          </h2>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {deploymentHistory.map(deployment => (
              <div key={deployment.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                border: '1px solid #dee2e6',
                borderRadius: 6,
                background: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16 }}>{getStatusIcon(deployment.status)}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
                      {deployment.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6c757d' }}>
                      {deployment.workspace} • {deployment.version} • {deployment.triggeredBy}
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#6c757d' }}>
                    {deployment.endTime?.toLocaleTimeString()}
                  </div>
                  {deployment.duration && (
                    <div style={{ fontSize: 11, color: getStatusColor(deployment.status) }}>
                      {formatDuration(deployment.duration)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Deployment Modal */}
      {showNewDeployment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 20, color: '#2c3e50' }}>
              🚀 New Deployment
            </h3>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Workspace
                </label>
                <select
                  value={newDeploymentConfig.workspace || ''}
                  onChange={(e) => setNewDeploymentConfig(prev => ({ ...prev, workspace: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #dee2e6',
                    borderRadius: 4
                  }}
                >
                  <option value="">Select workspace...</option>
                  <option value="terra-levy">Terra Levy</option>
                  <option value="terra-bank">Terra Bank</option>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="os-platform">OS Platform</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Environment
                </label>
                <select
                  value={newDeploymentConfig.environment || ''}
                  onChange={(e) => setNewDeploymentConfig(prev => ({ ...prev, environment: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #dee2e6',
                    borderRadius: 4
                  }}
                >
                  <option value="">Select environment...</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Version
                </label>
                <input
                  type="text"
                  value={newDeploymentConfig.version || ''}
                  onChange={(e) => setNewDeploymentConfig(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., 2.1.2"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #dee2e6',
                    borderRadius: 4
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 24
            }}>
              <button
                onClick={() => setShowNewDeployment(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => triggerDeployment(newDeploymentConfig as DeploymentConfig)}
                disabled={!newDeploymentConfig.workspace || !newDeploymentConfig.environment}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  opacity: (!newDeploymentConfig.workspace || !newDeploymentConfig.environment) ? 0.5 : 1
                }}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}