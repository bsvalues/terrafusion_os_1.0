import React, { useEffect, useState } from 'react';
import { DashboardDrilldownModal } from './DashboardDrilldownModal';
import { DashboardExportButton } from './DashboardExportButton';
import { DashboardAdminActions } from './DashboardAdminActions';
import { DashboardAuditLogModal } from './DashboardAuditLogModal';
import './DashboardDrilldownModal.css';

// TypeScript interfaces
interface PluginAnalytics {
  id: string;
  name: string;
  version?: string;
  healthy: boolean;
  launchCount: number;
  lastLaunched?: string;
  uptime: number | null;
  errors: string[];
  errorTrend: { timestamp: string; count: number }[];
  onboarding: string[];
  tags?: string[];
  categories?: string[];
  owner?: string;
  changelog?: string[];
  logs?: string[];
}

export function DashboardPage() {
  const [plugins, setPlugins] = useState<PluginAnalytics[]>([]);
  const [selected, setSelected] = useState<PluginAnalytics|null>(null);
  const [auditLog, setAuditLog] = useState<any>(null);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    // Step 1: Load plugin IDs and metadata from sidebar.json
    fetch('/sidebar.json')
      .then(r => r.json())
      .then(async (sidebar) => {
        const ids = sidebar.map((p: any) => p.id);
        // Step 2: Fetch all analytics endpoints in parallel
        const [
          health,
          usage,
          errors,
          uptime,
          errorTrends,
          onboarding
        ] = await Promise.all([
          fetch('/api/plugin-health', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(ids) }).then(r=>r.json()),
          fetch('/api/plugin-usage-stats').then(r=>r.json()),
          fetch('/api/plugin-errors', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(ids) }).then(r=>r.json()),
          fetch('/api/plugin-uptime', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(ids) }).then(r=>r.json()),
          fetch('/api/plugin-error-trends', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(ids) }).then(r=>r.json()),
          fetch('/api/plugin-onboarding', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(ids) }).then(r=>r.json())
        ]);
        // Step 3: Merge by plugin ID
        const merged: PluginAnalytics[] = sidebar.map((meta: any) => {
          const id = meta.id;
          const usageStats = usage.find((u: any) => u.pluginId === id) || {};
          return {
            id,
            name: meta.name,
            version: meta.version || '',
            healthy: typeof health[id] === 'boolean' ? health[id] : true,
            launchCount: usageStats.count || 0,
            lastLaunched: usageStats.lastLaunched,
            uptime: uptime[id] ?? null,
            errors: errors[id] || [],
            errorTrend: errorTrends[id] || [],
            onboarding: onboarding[id] || [],
            tags: meta.tags,
            categories: meta.categories,
            owner: meta.owner,
            changelog: meta.changelog,
            logs: meta.logs
          };
        });
        setPlugins(merged);
      });
  }, []);

  const handleAdminAction = (action: string, plugin: PluginAnalytics) => {
    if (action === 'audit') {
      // Fetch audit log for plugin
      fetch(`/api/plugin-audit-log/${plugin.id}`).then(r=>r.json()).then(logs => {
        setAuditLog(logs);
        setShowAudit(true);
      });
    } else {
      // POST to admin endpoint for disable/restart/promote
      fetch(`/api/plugin-admin-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: plugin.id })
      }).then(()=>window.location.reload());
    }
  };

  return (
    <div className="tf-dashboard-page">
      <div className="tf-dashboard-header"><>

        <h1>Terrafusion Plugin Analytics</h1>
        <DashboardExportButton
</>
plugins={plugins} />
      </div>
      <table className="tf-dashboard-table">
        <thead>
          <tr>
            <th>Name</th><th>Version</th><th>Status</th><th>Launches</th><th>Uptime</th><th>Errors</th><th>Owner</th><th>Admin</th>
          </tr>
        </thead>
        <tbody>
          {plugins.map(plugin => (
            <tr key={plugin.id} onClick={()=>setSelected(plugin)}><>

              <td>{plugin.name}</td>
              <td
</>
</>>{plugin.version}</td><>

              <td>{plugin.healthy ? '🟢' : '🔴'}</td>
              <td
</>
</>>{plugin.launchCount}</td><>

              <td>{plugin.uptime !== null ? (plugin.uptime*100).toFixed(1)+'%' : '—'}</td>
              <td
</>
</>>{plugin.errors?.length || 0}</td><>

              <td>{plugin.owner}</td>
              <td
</>
onClick={e=>e.stopPropagation()}><DashboardAdminActions plugin={plugin} onAction={handleAdminAction} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && <DashboardDrilldownModal plugin={selected} onClose={()=>setSelected(null)} />}
      {showAudit && <DashboardAuditLogModal plugin={selected} logs={auditLog} onClose={()=>setShowAudit(false)} />}
    </div>
  );
}
