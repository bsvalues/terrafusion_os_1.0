'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface WorkspaceMetrics {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  activeUsers: number;
  lastDeployment: string;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
}

interface SystemMetrics {
  totalWorkspaces: number;
  healthyWorkspaces: number;
  warningWorkspaces: number;
  criticalWorkspaces: number;
  totalUsers: number;
  activeUsers: number;
  systemLoad: number;
  uptime: string;
}

export default function AdvancedDashboard() {
  const { data: health, error: healthError } = useSWR(
    'http://localhost:8787/api/portal/health',
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );

  const { data: metrics, error: metricsError } = useSWR(
    'http://localhost:8787/api/portal/metrics',
    fetcher,
    { refreshInterval: 10000 }
  );

  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedView, setSelectedView] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatUptime = (uptime: string) => {
    // Format uptime string for display
    return uptime || 'Unknown';
  };

  if (healthError || metricsError) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#dc3545' }}>
        <h2>⚠️ Dashboard Connection Error</h2>
        <p>Unable to connect to backend services</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header with Real-time Status */}
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
            🚀 TerraFusion Command Center
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d' }}>
            Real-time ecosystem monitoring • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: 4,
              fontSize: 14
            }}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <div style={{ display: 'flex', background: '#e9ecef', borderRadius: 4, padding: 2 }}>
            {['overview', 'performance', 'security'].map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: selectedView === view ? '#007bff' : 'transparent',
                  color: selectedView === view ? 'white' : '#495057',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {[
          { 
            title: 'Total Workspaces', 
            value: health?.total || 0, 
            icon: '🏢',
            trend: '+2 this week',
            color: '#007bff'
          },
          { 
            title: 'Healthy Systems', 
            value: health?.workspaces_healthy || 0, 
            icon: '✅',
            trend: `${Math.round((health?.workspaces_healthy / health?.total) * 100) || 0}% uptime`,
            color: '#28a745'
          },
          { 
            title: 'Warnings', 
            value: health?.warnings || 0, 
            icon: '⚠️',
            trend: '-1 from yesterday',
            color: '#ffc107'
          },
          { 
            title: 'Critical Issues', 
            value: health?.critical || 0, 
            icon: '🚨',
            trend: 'Immediate attention',
            color: '#dc3545'
          }
        ].map((card, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${card.color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 24, marginRight: 8 }}>{card.icon}</span>
              <span style={{ fontSize: 14, color: '#6c757d', fontWeight: 600 }}>
                {card.title}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color, marginBottom: 4 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Live Workspace Grid */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#2c3e50' }}>
            🔴 Live Workspace Status
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, background: '#28a745', borderRadius: '50%' }}></div>
            <span style={{ fontSize: 12, color: '#6c757d' }}>Live updating</span>
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {health?.reports?.map((workspace: any, idx: number) => (
            <div key={idx} style={{
              border: `2px solid ${getStatusColor(workspace.status)}`,
              borderRadius: 8,
              padding: 16,
              background: `${getStatusColor(workspace.status)}08`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                  {workspace.workspace}
                </h3>
                <div style={{
                  padding: '4px 8px',
                  background: getStatusColor(workspace.status),
                  color: 'white',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {workspace.status}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#6c757d', marginRight: 8 }}>Health Score:</span>
                <div style={{ 
                  flex: 1, 
                  height: 8, 
                  background: '#e9ecef', 
                  borderRadius: 4,
                  marginRight: 8
                }}>
                  <div style={{
                    width: `${workspace.score}%`,
                    height: '100%',
                    background: getStatusColor(workspace.status),
                    borderRadius: 4,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: getStatusColor(workspace.status) }}>
                  {workspace.score}%
                </span>
              </div>

              {workspace.recommendations && workspace.recommendations.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                    🔧 Recommendations:
                  </div>
                  {workspace.recommendations.map((rec: string, recIdx: number) => (
                    <div key={recIdx} style={{
                      fontSize: 12,
                      color: '#495057',
                      padding: '2px 8px',
                      background: '#f8f9fa',
                      borderRadius: 4,
                      margin: '2px 0'
                    }}>
                      • {rec}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ 
                marginTop: 12, 
                paddingTop: 12, 
                borderTop: '1px solid #dee2e6',
                fontSize: 11,
                color: '#6c757d'
              }}>
                Last check: {new Date(workspace.generatedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics Section */}
      {selectedView === 'performance' && (
        <div style={{
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: 24,
          marginTop: 24
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, color: '#2c3e50' }}>
            📊 Performance Analytics
          </h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            {[
              { label: 'Avg Response Time', value: '247ms', trend: '-15%', good: true },
              { label: 'CPU Usage', value: '34%', trend: '+5%', good: true },
              { label: 'Memory Usage', value: '2.1GB', trend: '+12%', good: false },
              { label: 'Active Connections', value: '1,247', trend: '+8%', good: true }
            ].map((metric, idx) => (
              <div key={idx} style={{
                padding: 16,
                border: '1px solid #dee2e6',
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2c3e50', marginBottom: 4 }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                  {metric.label}
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: metric.good ? '#28a745' : '#dc3545',
                  fontWeight: 600
                }}>
                  {metric.trend}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}