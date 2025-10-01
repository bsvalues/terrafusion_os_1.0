import "./terrafusion-brand.css";
import {useState, useEffect} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import {open} from "@tauri-apps/api/shell";
import {Command} from "@tauri-apps/api/shell";
import {appConfigurations, getAppConfig, getAppUrl} from "./appConfig";
import "./App.css";

interface SystemMetrics {cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_status: string;}

interface AppStatus {id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  uptime?: string;
  health_score?: number;}

function App() {const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_status: 'unknown'});
  
  // Initialize app statuses from configuration
  const [appStatuses, setAppStatuses] = useState<AppStatus[]>(
    appConfigurations
      .filter(app => app.id !== '13') // Don't show the control center itself
      .map(app => ({id: app.id,
        name: app.name,
        status: 'stopped' as const,
        port: app.port,
        health_score: 0}))
  );

  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  useEffect(() => {// Initial fetch
    fetchSystemMetrics();
    
    // Set up interval for updates
    const interval = setInterval(async () => {
      await fetchSystemMetrics();}, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);
  
  const fetchSystemMetrics = async () => {try {
      const metrics = await invoke<SystemMetrics>("get_system_metrics");
      setSystemMetrics(metrics);} catch (error) {console.error("Failed to fetch system metrics:", error);
      // Fallback to mock data if Tauri is not available (browser mode)
      setSystemMetrics({
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        disk_usage: Math.random() * 100,
        network_status: 'connected'});
    }
  };

  const handleStartApp = async (appId: string) => {try {
      // First, update the UI to show starting state
      setAppStatuses(prev => prev.map(app => 
        app.id === appId ? { ...app, status: 'running' as const, health_score: 85, uptime: '0m'} : app
      ));
      
      // Call the backend to start the app
      const success = await invoke<boolean>("start_app", {appId});
      
      if (success) {
        // Launch the actual application
        const appUrl = getAppUrl(appId);
        if (appUrl) {
          // Open the app in browser if it has a port
          try {
            await open(appUrl);
            console.log(`Opened ${appId} at ${appUrl}`);
          } catch (error) {
            console.error(`Failed to open app URL: ${appUrl}`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to start app ${appId}:`, error);
      // Revert status on error
      setAppStatuses(prev => prev.map(app => 
        app.id === appId ? {...app, status: 'stopped' as const, health_score: 0} : app
      ));
    }
  };

  const handleStopApp = async (appId: string) => {try {
      const success = await invoke<boolean>("stop_app", { appId});
      if (success) {setAppStatuses(prev =>prev.map(app => 
          app.id === appId ? { ...app, status: 'stopped' as const, health_score: 0, uptime: undefined} : app
        ));
      }
    } catch (error) {
      console.error(`Failed to stop app ${appId}:`, error);
    }
  };

  const getStatusColor = (status: string) => {switch (status) {
      case 'running': return 'var(--tf-secondary)'; // Bright Green
      case 'stopped': return '#94a3b8'; // Muted gray
      case 'error': return '#ef4444'; // Red
      default: return '#666';}
  };

  const runningApps = appStatuses.filter(app => app.status === 'running').length;
  const totalApps = appStatuses.length;
  const systemHealth = Math.round((runningApps / totalApps) * 100);

  return (<div className="dashboard-container"><header className="dashboard-header"><div className="header-brand"><div className="tf-logo"><svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tfGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: 'var(--tf-primary)', stopOpacity: 1}} /><stop offset="100%" style={{ stopColor: 'var(--tf-accent)', stopOpacity: 1}} /></linearGradient></defs><path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="url(#tfGradient)" /><text x="50" y="58" fontSize="28" fontWeight="bold" fill="white" textAnchor="middle">TF</text></svg></div><h1 className="tf-gradient-text">Terrafusion Control Center</h1></div><div className="system-health"><span className="health-indicator" style={{ 
            color: systemHealth >80 ? 'var(--tf-secondary)' : systemHealth > 60 ? '#f59e0b' : '#ef4444'}}>
            System Health: {systemHealth}%</span></div></header><div className="dashboard-grid"><section className="metrics-panel tf-card"><><h2>System Metrics</h2><div
</>

className="metrics-grid"><div className="metric-card"><><div className="metric-label">CPU Usage</div><div
</>

className="metric-value">{systemMetrics.cpu_usage.toFixed(1)}%</div><div className="metric-bar"><div className="metric-fill" style={{ width: `${systemMetrics.cpu_usage}%` }}></div></div></div><div className="metric-card"><><div className="metric-label">Memory Usage</div><div
</>

className="metric-value">{systemMetrics.memory_usage.toFixed(1)}%</div><div className="metric-bar"><div className="metric-fill" style={{ width: `${systemMetrics.memory_usage}%` }}></div></div></div><div className="metric-card"><><div className="metric-label">Disk Usage</div><div
</>

className="metric-value">{systemMetrics.disk_usage.toFixed(1)}%</div><div className="metric-bar"><div className="metric-fill" style={{ width: `${systemMetrics.disk_usage}%` }}></div></div></div><div className="metric-card"><><div className="metric-label">Network</div><div
</>className="metric-value network-status" style={{ color: systemMetrics.network_status === 'connected' ? '#00ff00' : '#ff0000'}}>
                {systemMetrics.network_status}</div></div></div></section><section className="apps-panel tf-card"><h2>Application Status <span className="apps-counter">({runningApps}/{totalApps} Running)</span></h2><div className="apps-grid">{appStatuses.map(app => (<div key={app.id} className={`app-card ${selectedApp === app.id ? 'selected' : ''}`} 
                   onClick={() => setSelectedApp(app.id)}><div className="app-header"><><span className="app-name">{app.name}</span><span
</>className="app-status" style={{ color: getStatusColor(app.status)}}>
                    ●</span></div><div className="app-details"><div>Status: {app.status}</div>{app.port &&<div>Port: {app.port}</div>}
                  {app.uptime && <div>Uptime: {app.uptime}</div>}
                  <div>Health: {app.health_score}%</div></div><div className="app-actions">{app.status !== 'running' ? (<button className="start-btn" onClick={(e) =>{ e.stopPropagation(); handleStartApp(app.id);}}>
                      Start</button>) : (<button className="stop-btn" onClick={(e) =>{ e.stopPropagation(); handleStopApp(app.id);}}>
                      Stop</button>)}</div></div>))}</div></section><section className="controls-panel tf-card"><><h2>Master Controls</h2><div
</>

className="control-buttons"><><button className="control-btn start-all" onClick={async () =>{
              for (const app of appStatuses) {
                if (app.status === 'stopped') {
                  await handleStartApp(app.id);
                  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between starts}
              }
            }}>
              Start All Apps</button><button
</>className="control-btn stop-all" onClick={async () => {
              for (const app of appStatuses) {
                if (app.status === 'running') {
                  await handleStopApp(app.id);}
              }
            }}>
              Stop All Apps</button><button className="control-btn restart-all" onClick={async () => {
              try {
                const restartedApps = await invoke<string[]>("restart_all_apps");
                console.log('Restarted apps:', restartedApps);
                // Update UI to reflect restart
                setAppStatuses(prev =>prev.map(app => ({
                  ...app,
                  status: restartedApps.includes(app.id) ? 'running' as const : app.status,
                  uptime: restartedApps.includes(app.id) ? '0m' : app.uptime})));
              } catch (error) {console.error('Failed to restart all apps:', error);}
            }}>
              Restart All Apps</button><button className="control-btn backup" onClick={async () =>{
              try {
                // This would trigger a backup process
                await invoke("backup_system");
                console.log('System backup initiated');} catch (error) {console.log('Backup command not implemented yet');}
            }}>
              Backup System</button></div><div className="logs-section"><><h3>Recent Activity</h3><div
</>

className="logs-container"><><div className="log-entry">[SUCCESS] TerraAgent: Health check passed</div><div
</>

className="log-entry">[WARNING] PropertyWorkbench: Connection timeout</div><><div className="log-entry">[SUCCESS] CostForgeAI: Processing complete</div><div
</>

className="log-entry">[INFO] System: Memory optimization completed</div><div className="log-entry">[SUCCESS] TerraMiner: Data sync successful</div></div></div></section>{selectedApp && (<section className="app-details-panel tf-card"><><h2>{appStatuses.find(app => app.id === selectedApp)?.name} Details</h2><div
</>

className="detailed-metrics"><div className="detail-card"><><h4>Performance Metrics</h4><div
</></>>Response Time: 45ms</div><><div>Throughput: 1,250 req/min</div><div
</></>>Error Rate: 0.02%</div></div><div className="detail-card"><><h4>Resource Usage</h4><div
</></>>CPU: 12.5%</div><><div>Memory: 256MB</div><div
</></>>Connections: 23</div></div><div className="detail-card"><><h4>Quick Actions</h4><button
</>

className="action-btn" onClick={() => console.log('Configure app:', selectedApp)}>Configure</button><button className="action-btn" onClick={async () => {
                  try {
                    const logs = await invoke<string[]>("get_app_logs", { appId: selectedApp});
                    console.log('App logs:', logs);
                  } catch (error) {console.error('Failed to get logs:', error);}
                }}>View Logs</button><button className="action-btn" onClick={async () => {
                  const app = appStatuses.find(a => a.id === selectedApp);
                  if (app?.status === 'running') {
                    await handleStopApp(selectedApp);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await handleStartApp(selectedApp);}
                }}>Restart</button></div></div></section>)}</div></div>
  );
}

export default App;
