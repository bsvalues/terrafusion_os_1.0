import React, { useEffect, useState } from 'react';

interface PluginHealth {
  [id: string]: boolean;
}
interface Metric {
  name: string;
  labels: { [key: string]: string };
  value: number;
}

export function AgentTelemetryAssistant() {
  const [sidebar, setSidebar] = useState<any[]>([]);
  const [health, setHealth] = useState<PluginHealth>({});
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [actionStatus, setActionStatus] = useState<string>('');
  const [selected, setSelected] = useState<string | null>(null);
  
  // Fetch sidebar/plugins
  useEffect(() => {
    fetch('/sidebar.json').then(r=>r.json()).then(setSidebar);
  }, []);

  // Fetch plugin health every 10s
  useEffect(() => {
    const fetchHealth = () => {
      const ids = sidebar.map(p=>p.id);
      if (!ids.length) return;
      fetch('/api/plugin-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids)
      }).then(r=>r.json()).then(setHealth);
    };
    fetchHealth();
    const t = setInterval(fetchHealth, 10000);
    return () => clearInterval(t);
  }, [sidebar]);

  // Fetch metrics every 10s
  useEffect(() => {
    const fetchMetrics = () => {
      fetch('/api/metrics').then(r=>r.text()).then(txt => {
        // Parse Prometheus text format
        const lines = txt.split('\n');
        const metrics: Metric[] = [];
        let name = '', labels = {}, value = 0;
        for (const line of lines) {
          if (line.startsWith('#') || !line.trim()) continue;
          const match = line.match(/^(\w+)(\{[^}]+\})?\s+([\d.eE+-]+)/);
          if (match) {
            name = match[1];
            labels = {};
            if (match[2]) {
              const l = match[2].slice(1,-1).split(',').map(kv=>kv.split('='));
              l.forEach(([k,v])=>labels[k]=v.replace(/"/g,''));
            }
            value = parseFloat(match[3]);
            metrics.push({ name, labels, value });
          }
        }
        setMetrics(metrics);
      });
    };
    fetchMetrics();
    const t = setInterval(fetchMetrics, 10000);
    return () => clearInterval(t);
  }, []);

  // Fetch audit log for selected plugin
  useEffect(() => {
    if (!selected) return;
    fetch(`/api/plugin-audit-log/${selected}`).then(r=>r.json()).then(setAudit);
  }, [selected]);

  // Admin action handler
  const handleAction = async (action: string, pluginId: string) => {
    setActionStatus('');
    const res = await fetch('/api/plugin-admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: pluginId })
    });
    if (res.ok) setActionStatus(`${action} succeeded for ${pluginId}`);
    else setActionStatus(`${action} failed for ${pluginId}`);
    setTimeout(()=>setActionStatus(''), 3000);
  };

  return (
    <div style={{padding:'2rem'}}><>

      <h2>Agent Telemetry Assistant</h2>
      <table
</>
className="tf-table">
        <thead>
          <tr>
            <th>Plugin</th><th>Health</th><th>Deploys</th><th>Rollbacks</th><th>Restarts</th><th>Actions</th><th>Audit</th>
          </tr>
        </thead>
        <tbody>
          {sidebar.map(plugin => {
            const id = plugin.id;
            const healthy = health[id];
            const deploys = metrics.find(m=>m.name==='plugin_deploy_total' && m.labels.pluginId===id)?.value || 0;
            const rollbacks = metrics.find(m=>m.name==='plugin_rollback_total' && m.labels.pluginId===id)?.value || 0;
            const restarts = metrics.find(m=>m.name==='plugin_launch_total' && m.labels.pluginId===id)?.value || 0;
            return (
              <tr key={id}><>

                <td>{plugin.name}</td>
                <td
</>
</>>{healthy === undefined ? '—' : healthy ? '🟢' : '🔴'}</td><>

                <td>{deploys}</td>
                <td
</>
</>>{rollbacks}</td><>

                <td>{restarts}</td>
                <td
</>
</>>
                  <button onClick={()=>handleAction('deploy',id)}>Deploy</button>{' '}
                  <button onClick={()=>handleAction('rollback',id)}>Rollback</button>{' '}
                  <button onClick={()=>handleAction('restart',id)}>Restart</button>{' '}
                  <button onClick={()=>handleAction('disable',id)}>Disable</button>{' '}
                  <button onClick={()=>handleAction('promote',id)}>Promote</button>
                </td>
                <td>
                  <button onClick={()=>setSelected(id)}>View Audit</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {actionStatus && <div className="tf-action-status">{actionStatus}</div>}
      {selected && (
        <div className="tf-modal-overlay" onClick={()=>setSelected(null)}>
          <div className="tf-modal tf-modal-audit" onClick={e=>e.stopPropagation()}>
            <div className="tf-modal-header"><>

              <h3>Audit Log: {sidebar.find(p=>p.id===selected)?.name || selected}</h3>
              <button
</>
className="tf-modal-close" onClick={()=>setSelected(null)}>×</button>
            </div>
            <div className="tf-modal-content">
              <table className="tf-audit-table">
                <thead>
                  <tr><th>Timestamp</th><th>User</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {audit.length ? audit.map((log,i)=>(
                    <tr key={i}><>

                      <td>{log.timestamp}</td>
                      <td
</>
</>>{log.user}</td>
                      <td>{log.action}</td>
                    </tr>
                  )) : <tr><td colSpan={3}>No audit log entries.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="tf-modal-footer">
              <button className="tf-btn tf-btn-close" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
