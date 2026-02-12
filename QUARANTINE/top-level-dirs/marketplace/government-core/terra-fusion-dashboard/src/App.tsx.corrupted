import "./terrafusion-brand.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_status: string;
}

interface AppStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  uptime?: string;
  health_score?: number;
}

function App() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_status: 'unknown'
  });
  
  const [appStatuses, setAppStatuses] = useState<AppStatus[]>([
    { id: '01', name: 'TerraAgent', status: 'running', port: 3001, uptime: '2h 15m', health_score: 98 },
    { id: '02', name: 'TerraFlow', status: 'running', port: 3002, uptime: '1h 42m', health_score: 95 },
    { id: '03', name: 'WebAuditTracker', status: 'running', port: 3003, uptime: '45m', health_score: 92 },
    { id: '04', name: 'TerraLevy', status: 'stopped', health_score: 0 },
    { id: '05', name: 'TerraMiner', status: 'running', port: 3005, uptime: '3h 22m', health_score: 99 },
    { id: '06', name: 'TerraFusionSync', status: 'running', port: 3006, uptime: '2h 8m', health_score: 94 },
    { id: '07', name: 'GISPRO', status: 'running', port: 3007, uptime: '1h 33m', health_score: 97 },
    { id: '08', name: 'CostForgeAI', status: 'running', port: 3008, uptime: '55m', health_score: 96 },
    { id: '09', name: 'PropertyWorkbench', status: 'error', health_score: 15 },
    { id: '10', name: 'TerraInsight', status: 'running', port: 3010, uptime: '1h 18m', health_score: 93 },
    { id: '12', name: 'TerraFusionAssessor', status: 'stopped', health_score: 0 },
    { id: '13', name: 'Marketplace', status: 'stopped', health_score: 0 },
    { id: '14', name: 'TerraCollections', status: 'stopped', health_score: 0 }
  ]);

  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const metrics = await invoke<SystemMetrics>("get_system_metrics");
        setSystemMetrics(metrics);
      } catch (error) {
        console.error("Failed to fetch system metrics:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartApp = async (appId: string) => {
    try {
      await invoke("start_app", { appId });
      setAppStatuses(prev => prev.map(app => 
        app.id === appId ? { ...app, status: 'running' as const, health_score: 85 } : app
      ));
    } catch (error) {
      console.error(`Failed to start app ${appId}:`, error);
    }
  };

  const handleStopApp = async (appId: string) => {
    try {
      await invoke("stop_app", { appId });
      setAppStatuses(prev => prev.map(app => 
        app.id === appId ? { ...app, status: 'stopped' as const, health_score: 0 } : app
      ));
    } catch (error) {
      console.error(`Failed to stop app ${appId}:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#00ff00';
      case 'stopped': return '#ff9500';
      case 'error': return '#ff0000';
      default: return '#666';
    }
  };

  const runningApps = appStatuses.filter(app => app.status === 'running').length;
  const totalApps = appStatuses.length;
  const systemHealth = Math.round((runningApps / totalApps) * 100);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header"><>

        <h1>Terrafusion Master Control Center</h1>
        <div
</>
className="system-health">
          <span className="health-indicator" style={{ color: systemHealth > 80 ? '#00ff00' : systemHealth > 60 ? '#ff9500' : '#ff0000' }}>
            System Health: {systemHealth}%
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="metrics-panel"><>

          <h2>System Metrics</h2>
          <div
</>
className="metrics-grid">
            <div className="metric-card"><>

              <div className="metric-label">CPU Usage</div>
              <div
</>
className="metric-value">{systemMetrics.cpu_usage.toFixed(1)}%</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${systemMetrics.cpu_usage}%` }}></div>
              </div>
            </div>
            <div className="metric-card"><>

              <div className="metric-label">Memory Usage</div>
              <div
</>
className="metric-value">{systemMetrics.memory_usage.toFixed(1)}%</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${systemMetrics.memory_usage}%` }}></div>
              </div>
            </div>
            <div className="metric-card"><>

              <div className="metric-label">Disk Usage</div>
              <div
</>
className="metric-value">{systemMetrics.disk_usage.toFixed(1)}%</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${systemMetrics.disk_usage}%` }}></div>
              </div>
            </div>
            <div className="metric-card"><>

              <div className="metric-label">Network</div>
              <div
</>
className="metric-value network-status" style={{ color: systemMetrics.network_status === 'connected' ? '#00ff00' : '#ff0000' }}>
                {systemMetrics.network_status}
              </div>
            </div>
          </div>
        </section>

        <section className="apps-panel"><>

          <h2>Application Status ({runningApps}/{totalApps} Running)</h2>
          <div
</>
className="apps-grid">
            {appStatuses.map(app => (
              <div key={app.id} className={`app-card ${selectedApp === app.id ? 'selected' : ''}`} 
                   onClick={() => setSelectedApp(app.id)}>
                <div className="app-header"><>

                  <span className="app-name">{app.name}</span>
                  <span
</>
className="app-status" style={{ color: getStatusColor(app.status) }}>
                    ●
                  </span>
                </div>
                <div className="app-details">
                  <div>Status: {app.status}</div>
                  {app.port && <div>Port: {app.port}</div>}
                  {app.uptime && <div>Uptime: {app.uptime}</div>}
                  <div>Health: {app.health_score}%</div>
                </div>
                <div className="app-actions">
                  {app.status !== 'running' ? (
                    <button className="start-btn" onClick={(e) => { e.stopPropagation(); handleStartApp(app.id); }}>
                      Start
                    </button>
                  ) : (
                    <button className="stop-btn" onClick={(e) => { e.stopPropagation(); handleStopApp(app.id); }}>
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="controls-panel"><>

          <h2>Master Controls</h2>
          <div
</>
className="control-buttons"><>

            <button className="control-btn start-all" onClick={() => console.log('Start All')}>
              Start All Apps
            </button>
            <button
</>
className="control-btn stop-all" onClick={() => console.log('Stop All')}>
              Stop All Apps
            </button><>

            <button className="control-btn restart-all" onClick={() => console.log('Restart All')}>
              Restart All Apps
            </button>
            <button
</>
className="control-btn backup" onClick={() => console.log('Backup')}>
              Backup System
            </button>
          </div>
          
          <div className="logs-section"><>

            <h3>Recent Activity</h3>
            <div
</>
className="logs-container"><>

              <div className="log-entry">TerraAgent: Health check passed</div>
              <div
</>
className="log-entry">PropertyWorkbench: Connection timeout</div><>

              <div className="log-entry">CostForgeAI: Processing complete</div>
              <div
</>
className="log-entry">System: Memory optimization completed</div>
              <div className="log-entry">TerraMiner: Data sync successful</div>
            </div>
          </div>
        </section>

        {selectedApp && (
          <section className="app-details-panel"><>

            <h2>{appStatuses.find(app => app.id === selectedApp)?.name} Details</h2>
            <div
</>
className="detailed-metrics">
              <div className="detail-card"><>

                <h4>Performance Metrics</h4>
                <div
</>
</>>Response Time: 45ms</div><>

                <div>Throughput: 1,250 req/min</div>
                <div
</>
</>>Error Rate: 0.02%</div>
              </div>
              <div className="detail-card"><>

                <h4>Resource Usage</h4>
                <div
</>
</>>CPU: 12.5%</div><>

                <div>Memory: 256MB</div>
                <div
</>
</>>Connections: 23</div>
              </div>
              <div className="detail-card"><>

                <h4>Quick Actions</h4>
                <button
</>
className="action-btn">Configure</button><>

                <button className="action-btn">View Logs</button>
                <button
</>
className="action-btn">Restart</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
