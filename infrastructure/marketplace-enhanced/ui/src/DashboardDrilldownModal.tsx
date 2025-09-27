import React from 'react';
import './DashboardDrilldownModal.css';

export function DashboardDrilldownModal({plugin, onClose}) {
  const [tab, setTab] = React.useState('overview');
  if (!plugin) return null;
  return (
    <div className="tf-modal-overlay"><div className="tf-modal"><div className="tf-modal-header"><h2>{plugin.name} <span className="tf-badge tf-badge-version">{plugin.version}</span></h2><button className="tf-modal-close" onClick={onClose} aria-label="Close">×</button></div><div className="tf-modal-tabs">{['overview','errors','uptime','changelog','logs'].map(t => (<button key={t} className={tab===t ? 'active' : ''} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>))}</div><div className="tf-modal-content">{tab==='overview' && (<div><p><strong>Owner:</strong> {plugin.owner}</p><p><strong>Status:</strong> {plugin.healthy ? '🟢 Healthy' : '🔴 Unhealthy'}</p><p><strong>Tags:</strong> {plugin.tags?.join(', ')}</p><p><strong>Categories:</strong> {plugin.categories?.join(', ')}</p><p><strong>Launches:</strong> {plugin.launchCount}</p><p><strong>Uptime:</strong> {plugin.uptime !== null ? `${(plugin.uptime * 100).toFixed(1)}%` : '—'}</p></div>)}
          {tab==='errors' && (<div><ul>{plugin.errors.map((e,i) => (<li key={i}>{e}</li>))}</ul>{plugin.errorTrend && plugin.errorTrend.length > 0 && (<div className="tf-error-trend">{/* Chart placeholder; integrate recharts/LineChart here */}<pre>{JSON.stringify(plugin.errorTrend, null, 2)}</pre></div>)}<button className="tf-btn tf-btn-export" onClick={()=>{/* export errors as CSV */}}>Export Errors</button></div>)}
          {tab==='uptime' && (<div>{/* Uptime chart placeholder */}<p>Uptime last 24h: {plugin.uptime !== null ? `${(plugin.uptime * 100).toFixed(1)}%` : '—'}</p></div>)}
          {tab==='changelog' && (<ul>{plugin.changelog.map((line,i) => (<li key={i}>{line}</li>))}</ul>)}
          {tab==='logs' && (<div><pre>{plugin.logs ? plugin.logs.join('\n') : 'No logs.'}</pre></div>)}</div><div className="tf-modal-footer"><><button className="tf-btn tf-btn-admin" onClick={()=>{/* admin actions */}}>Admin Actions</button><button
</>
className="tf-btn tf-btn-close" onClick={onClose}>Close</button></div></div></div>
  );
}
