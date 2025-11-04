'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface Integration {
  id: string;
  name: string;
  type: 'mcp-server' | 'github' | 'cicd' | 'webhook' | 'api';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  description: string;
  lastSync: Date;
  config: IntegrationConfig;
  metrics: IntegrationMetrics;
}

interface IntegrationConfig {
  endpoint?: string;
  apiKey?: string;
  webhookUrl?: string;
  repoUrl?: string;
  branch?: string;
  syncInterval?: number;
  enabled: boolean;
}

interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastError?: string;
  uptime: number;
}

interface MCPServer {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'error';
  endpoint: string;
  version: string;
  lastHeartbeat: Date;
  requestCount: number;
}

interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  defaultBranch: string;
  lastPush: Date;
  webhooksConfigured: boolean;
  cicdEnabled: boolean;
}

interface WebhookEvent {
  id: string;
  source: string;
  event: string;
  payload: any;
  timestamp: Date;
  processed: boolean;
  response: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function IntegrationsHub() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [showNewIntegration, setShowNewIntegration] = useState(false);

  // Real-time integration data
  const { data: integrationData, error } = useSWR('/api/integrations', fetcher, { 
    refreshInterval: 5000 
  });
  const { data: mcpData } = useSWR('/api/integrations/mcp-servers', fetcher, {
    refreshInterval: 10000
  });

  useEffect(() => {
    // Mock integrations data
    const mockIntegrations: Integration[] = [
      {
        id: '1',
        name: 'GitHub Enterprise',
        type: 'github',
        status: 'connected',
        description: 'Source code management and CI/CD integration',
        lastSync: new Date(Date.now() - 2 * 60 * 1000),
        config: {
          endpoint: 'https://api.github.com',
          repoUrl: 'https://github.com/benton-county/terrafusion',
          branch: 'main',
          syncInterval: 300,
          enabled: true
        },
        metrics: {
          totalRequests: 1247,
          successfulRequests: 1235,
          failedRequests: 12,
          averageResponseTime: 145,
          uptime: 99.2
        }
      },
      {
        id: '2',
        name: 'Azure DevOps CI/CD',
        type: 'cicd',
        status: 'connected',
        description: 'Continuous integration and deployment pipeline',
        lastSync: new Date(Date.now() - 1 * 60 * 1000),
        config: {
          endpoint: 'https://dev.azure.com/benton-county',
          apiKey: '***masked***',
          enabled: true
        },
        metrics: {
          totalRequests: 834,
          successfulRequests: 820,
          failedRequests: 14,
          averageResponseTime: 230,
          uptime: 98.9
        }
      },
      {
        id: '3',
        name: 'Pylance MCP Server',
        type: 'mcp-server',
        status: 'connected',
        description: 'Python language server for advanced code analysis',
        lastSync: new Date(Date.now() - 30 * 1000),
        config: {
          endpoint: 'mcp://pylance',
          syncInterval: 60,
          enabled: true
        },
        metrics: {
          totalRequests: 2456,
          successfulRequests: 2445,
          failedRequests: 11,
          averageResponseTime: 85,
          uptime: 99.8
        }
      },
      {
        id: '4',
        name: 'Notification Webhooks',
        type: 'webhook',
        status: 'connected',
        description: 'Real-time event notifications to external systems',
        lastSync: new Date(Date.now() - 5 * 60 * 1000),
        config: {
          webhookUrl: 'https://hooks.slack.com/services/...',
          enabled: true
        },
        metrics: {
          totalRequests: 567,
          successfulRequests: 563,
          failedRequests: 4,
          averageResponseTime: 320,
          uptime: 99.5
        }
      }
    ];

    const mockMcpServers: MCPServer[] = [
      {
        id: 'mcp-1',
        name: 'Pylance MCP Server',
        description: 'Advanced Python language server with code analysis capabilities',
        capabilities: ['syntax-check', 'imports-analysis', 'refactoring', 'code-execution'],
        status: 'online',
        endpoint: 'mcp://pylance',
        version: '2024.1.1',
        lastHeartbeat: new Date(Date.now() - 30 * 1000),
        requestCount: 2456
      },
      {
        id: 'mcp-2',
        name: 'Microsoft Docs MCP',
        description: 'Official Microsoft documentation search and retrieval',
        capabilities: ['docs-search', 'docs-fetch', 'content-analysis'],
        status: 'online',
        endpoint: 'mcp://microsoft-docs',
        version: '1.0.0',
        lastHeartbeat: new Date(Date.now() - 45 * 1000),
        requestCount: 1834
      },
      {
        id: 'mcp-3',
        name: 'GitKraken MCP Server',
        description: 'Git operations and repository management',
        capabilities: ['git-operations', 'branch-management', 'pr-management'],
        status: 'online',
        endpoint: 'mcp://gitkraken',
        version: '3.2.1',
        lastHeartbeat: new Date(Date.now() - 15 * 1000),
        requestCount: 945
      }
    ];

    const mockGithubRepos: GitHubRepository[] = [
      {
        id: 'repo-1',
        name: 'terrafusion-os',
        fullName: 'benton-county/terrafusion-os',
        description: 'TerraFusion Operating System - Complete government infrastructure',
        private: true,
        defaultBranch: 'main',
        lastPush: new Date(Date.now() - 15 * 60 * 1000),
        webhooksConfigured: true,
        cicdEnabled: true
      },
      {
        id: 'repo-2',
        name: 'terra-levy-system',
        fullName: 'benton-county/terra-levy-system',
        description: 'Property tax management and levy calculation system',
        private: true,
        defaultBranch: 'main',
        lastPush: new Date(Date.now() - 2 * 60 * 60 * 1000),
        webhooksConfigured: true,
        cicdEnabled: true
      }
    ];

    const mockWebhookEvents: WebhookEvent[] = [
      {
        id: 'event-1',
        source: 'GitHub',
        event: 'push',
        payload: { branch: 'main', commits: 3, author: 'sarah.chen@county.gov' },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        processed: true,
        response: 'CI/CD pipeline triggered successfully'
      },
      {
        id: 'event-2',
        source: 'Azure DevOps',
        event: 'deployment.completed',
        payload: { environment: 'staging', status: 'success', duration: '2m 15s' },
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        processed: true,
        response: 'Notification sent to team'
      }
    ];

    setIntegrations(mockIntegrations);
    setMcpServers(mockMcpServers);
    setGithubRepos(mockGithubRepos);
    setWebhookEvents(mockWebhookEvents);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online': return '#28a745';
      case 'disconnected':
      case 'offline': return '#6c757d';
      case 'error': return '#dc3545';
      case 'configuring': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online': return '🟢';
      case 'disconnected':
      case 'offline': return '⚫';
      case 'error': return '🔴';
      case 'configuring': return '🟡';
      default: return '❓';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mcp-server': return '🔌';
      case 'github': return '🐙';
      case 'cicd': return '🚀';
      case 'webhook': return '🪝';
      case 'api': return '⚡';
      default: return '🔗';
    }
  };

  const testIntegration = async (integrationId: string) => {
    console.log('Testing integration:', integrationId);
    // Simulate integration test
  };

  const syncIntegration = async (integrationId: string) => {
    console.log('Syncing integration:', integrationId);
    // Simulate sync operation
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
            🔗 Advanced Integrations Hub
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d' }}>
            MCP servers, GitHub, CI/CD, and external system integrations • {integrations.filter(i => i.status === 'connected').length}/{integrations.length} connected
          </p>
        </div>
        
        <button
          onClick={() => setShowNewIntegration(true)}
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
          ➕ Add Integration
        </button>
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
          { id: 'overview', name: 'Overview', icon: '📊' },
          { id: 'mcp-servers', name: 'MCP Servers', icon: '🔌' },
          { id: 'github', name: 'GitHub', icon: '🐙' },
          { id: 'cicd', name: 'CI/CD', icon: '🚀' },
          { id: 'webhooks', name: 'Webhooks', icon: '🪝' }
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
            {/* Integration Status Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              {integrations.map(integration => (
                <div key={integration.id} style={{
                  border: `2px solid ${getStatusColor(integration.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(integration.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{getTypeIcon(integration.type)}</span>
                      <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {integration.name}
                      </h3>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      background: getStatusColor(integration.status),
                      color: 'white',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      <span>{getStatusIcon(integration.status)}</span>
                      <span>{integration.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: 14,
                    color: '#6c757d',
                    lineHeight: 1.4
                  }}>
                    {integration.description}
                  </p>

                  {/* Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    marginBottom: 12
                  }}>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#28a745' }}>
                        {integration.metrics.uptime.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Uptime</div>
                    </div>
                    <div style={{
                      padding: 8,
                      background: '#f8f9fa',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#007bff' }}>
                        {integration.metrics.averageResponseTime}ms
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>Avg Response</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => testIntegration(integration.id)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      🧪 Test
                    </button>
                    <button
                      onClick={() => syncIntegration(integration.id)}
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
                      🔄 Sync
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
                📈 Recent Integration Activity
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {webhookEvents.slice(0, 5).map(event => (
                  <div key={event.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    border: '1px solid #dee2e6',
                    borderRadius: 6,
                    background: event.processed ? '#f8f9fa' : '#fff3cd'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16 }}>{event.processed ? '✅' : '⏳'}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
                          {event.source} • {event.event}
                        </div>
                        <div style={{ fontSize: 12, color: '#6c757d' }}>
                          {event.response}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#6c757d' }}>
                      {event.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mcp-servers' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              🔌 Model Context Protocol Servers
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {mcpServers.map(server => (
                <div key={server.id} style={{
                  border: `2px solid ${getStatusColor(server.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  background: `${getStatusColor(server.status)}08`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {server.name}
                      </h4>
                      <p style={{ margin: '4px 0 8px 0', fontSize: 14, color: '#6c757d' }}>
                        {server.description}
                      </p>
                      <div style={{ fontSize: 12, color: '#6c757d' }}>
                        <strong>Version:</strong> {server.version} • <strong>Endpoint:</strong> {server.endpoint}
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: getStatusColor(server.status),
                      color: 'white',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      <span>{getStatusIcon(server.status)}</span>
                      <span>{server.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginBottom: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>
                        Capabilities:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {server.capabilities.map(cap => (
                          <span key={cap} style={{
                            padding: '2px 6px',
                            background: '#007bff',
                            color: 'white',
                            borderRadius: 10,
                            fontSize: 10
                          }}>
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#007bff' }}>
                        {server.requestCount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>
                        Total Requests
                      </div>
                      <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                        Last heartbeat: {Math.floor((Date.now() - server.lastHeartbeat.getTime()) / 1000)}s ago
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              🐙 GitHub Repositories
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {githubRepos.map(repo => (
                <div key={repo.id} style={{
                  border: '2px solid #28a745',
                  borderRadius: 8,
                  padding: 16,
                  background: '#28a74508'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                        {repo.fullName}
                      </h4>
                      <p style={{ margin: '4px 0 8px 0', fontSize: 14, color: '#6c757d' }}>
                        {repo.description}
                      </p>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6c757d' }}>
                        <span><strong>Branch:</strong> {repo.defaultBranch}</span>
                        <span><strong>Private:</strong> {repo.private ? 'Yes' : 'No'}</span>
                        <span><strong>Last Push:</strong> {repo.lastPush.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      {repo.webhooksConfigured && (
                        <span style={{
                          padding: '4px 8px',
                          background: '#28a745',
                          color: 'white',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600
                        }}>
                          🪝 Webhooks
                        </span>
                      )}
                      {repo.cicdEnabled && (
                        <span style={{
                          padding: '4px 8px',
                          background: '#007bff',
                          color: 'white',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600
                        }}>
                          🚀 CI/CD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#2c3e50' }}>
              🪝 Webhook Events
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {webhookEvents.map(event => (
                <div key={event.id} style={{
                  padding: 16,
                  border: '1px solid #dee2e6',
                  borderRadius: 6,
                  background: event.processed ? 'white' : '#fff3cd'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16 }}>{event.processed ? '✅' : '⏳'}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#2c3e50' }}>
                          {event.source} • {event.event}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 12, color: '#6c757d' }}>
                      {event.timestamp.toLocaleString()}
                    </div>
                  </div>

                  <div style={{
                    padding: 12,
                    background: '#f8f9fa',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    marginBottom: 8
                  }}>
                    <strong>Payload:</strong> {JSON.stringify(event.payload, null, 2)}
                  </div>

                  <div style={{ fontSize: 14, color: '#28a745' }}>
                    <strong>Response:</strong> {event.response}
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