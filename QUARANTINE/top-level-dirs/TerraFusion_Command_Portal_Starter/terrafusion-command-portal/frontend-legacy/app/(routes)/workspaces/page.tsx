'use client';
import useSWR from 'swr';
const fetcher = (url:string)=>fetch(url).then(r=>r.json());

export default function Workspaces(){
  const { data, isLoading } = useSWR('http://localhost:8787/api/portal/workspaces', fetcher, {
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const workspacesByTier = {
    'Tier 1 - Master': data?.workspaces?.filter((w:any) => w.slug === 'master') || [],
    'Tier 2 - Core Pillars': data?.workspaces?.filter((w:any) => 
      ['backend', 'frontend', 'marketplace', 'os-platform', 'terrafusion-cos'].includes(w.slug)) || [],
    'Tier 3 - Government Portals': data?.workspaces?.filter((w:any) => 
      w.slug?.includes('citizen') || w.slug?.includes('code-enforcement') || w.slug?.includes('public')) || [],
    'Tier 4 - Marketplace Apps': data?.workspaces?.filter((w:any) => 
      w.slug?.startsWith('terra-') || w.slug?.includes('app')) || []
  };

  if (isLoading) {
    return (
      <section>
        <h1>🔄 Loading TerraFusion Workspaces...</h1>
        <p>Connecting to 57 workspace ecosystem...</p>
      </section>
    );
  }

  return (
    <section>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <div>
          <h1>🏗️ TerraFusion Workspace Management</h1>
          <p>57 Workspaces • Real-time Health Monitoring • AI-Powered Development</p>
        </div>
        <div style={{display: 'flex', gap: '12px', fontSize: '14px'}}>
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e'}}></div>
            Healthy
          </span>
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b'}}></div>
            Warning
          </span>
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444'}}></div>
            Critical
          </span>
        </div>
      </div>

      {Object.entries(workspacesByTier).map(([tier, workspaces]) => (
        <div key={tier} style={{marginBottom: '32px'}}>
          <h2 style={{
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            {tier} ({(workspaces as any[]).length})
          </h2>
          
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px'
          }}>
            {(workspaces as any[]).map((w:any)=> (
              <div key={w.slug} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                  <h3 style={{margin: 0, fontSize: '16px', fontWeight: '600'}}>{w.name}</h3>
                  <div style={{
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: getStatusColor(w.status)
                  }}></div>
                </div>
                
                <p style={{margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280'}}>
                  {w.slug} • Team: {w.team_size || 0} • Updated: {w.last_active || 'Recently'}
                </p>
                
                {w.mcp_server && (
                  <p style={{margin: '0 0 12px 0', fontSize: '12px', color: '#059669', background: '#ecfccb', padding: '4px 8px', borderRadius: '4px', display: 'inline-block'}}>
                    🤖 MCP: {w.mcp_server}
                  </p>
                )}
                
                <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                  <button style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    📁 Open Workspace
                  </button>
                  <button style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }} onClick={() => window.open(`/copilot?ws=${w.slug}`, '_blank')}>
                    🤖 AI Assistant
                  </button>
                  {w.status !== 'healthy' && (
                    <button style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>
                      🔧 Fix Issues
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {(workspaces as any[]).length === 0 && (
            <p style={{color: '#6b7280', fontStyle: 'italic'}}>No workspaces in this tier</p>
          )}
        </div>
      ))}
      
      {!data?.workspaces && (
        <div style={{textAlign: 'center', padding: '48px', color: '#6b7280'}}>
          <h3>🔄 Connecting to TerraFusion Backend...</h3>
          <p>Loading workspace data from the ecosystem...</p>
        </div>
      )}
    </section>
  );
}
