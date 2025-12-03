/**
 * Widget Sidebar Component
 * Right-side widgets panel with glass cards
 */

import { EliteIcons, EliteQuantumIcon } from '@/components/icons/EliteIcons';

export function WidgetSidebar() {
  return (
    <div className='tahoe-widgets'>
      {/* Weather Widget */}
      <div className='tahoe-widget-card'>
        <div className='tahoe-widget-header'>
          <div className='tahoe-widget-title'>
            <EliteIcons.Cloud className='w-5 h-5 text-terra-cyan' />
            <span>Weather</span>
          </div>
        </div>
        <div className='tahoe-widget-content'>
          <div style={{ fontSize: '32px', fontWeight: '300', marginBottom: '8px' }}>72°F</div>
          <div style={{ opacity: 0.7 }}>Partly Cloudy · Richland, WA</div>
        </div>
      </div>

      {/* Calendar Widget */}
      <div className='tahoe-widget-card'>
        <div className='tahoe-widget-header'>
          <div className='tahoe-widget-title'>
            <EliteIcons.Settings className='w-5 h-5 text-terra-cyan' />
            <span>Calendar</span>
          </div>
        </div>
        <div className='tahoe-widget-content'>
          <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '12px' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div style={{ opacity: 0.7, fontSize: '13px' }}>No events scheduled</div>
        </div>
      </div>

      {/* Roll Health Widget */}
      <div className='tahoe-widget-card'>
        <div className='tahoe-widget-header'>
          <div className='tahoe-widget-title'>
            <EliteIcons.Gauge className='w-5 h-5 text-terra-cyan' />
            <span>Roll Health</span>
          </div>
        </div>
        <div className='tahoe-widget-content'>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '24px', fontWeight: '500', color: 'rgba(0, 255, 136, 0.9)' }}>
                99.7%
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Accuracy</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '500', color: 'rgba(0, 204, 204, 0.9)' }}>
                89.2K
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Parcels</div>
            </div>
          </div>
          <div
            style={{
              height: '4px',
              background: 'rgba(0, 204, 204, 0.15)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '99.7%',
                height: '100%',
                background:
                  'linear-gradient(90deg, rgba(0, 204, 204, 0.8), rgba(0, 255, 136, 0.7))',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Infrastructure Intelligence Widget */}
      <div className='tahoe-widget-card'>
        <div className='tahoe-widget-header'>
          <div className='tahoe-widget-title'>
            <EliteIcons.Network className='w-5 h-5 text-terra-cyan' />
            <span>Infrastructure</span>
          </div>
        </div>
        <div className='tahoe-widget-content'>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}
            >
              <span style={{ opacity: 0.7 }}>Harris PACS Sync</span>
              <span style={{ color: 'rgba(0, 255, 136, 0.85)' }}>✓ Active</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}
            >
              <span style={{ opacity: 0.7 }}>AI Swarm</span>
              <span style={{ color: 'rgba(0, 204, 204, 0.85)' }}>1,008 Agents</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}
            >
              <span style={{ opacity: 0.7 }}>System Status</span>
              <span style={{ color: '#00ff88' }}>Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Widget */}
      <div className='tahoe-widget-card'>
        <div className='tahoe-widget-header'>
          <div className='tahoe-widget-title'>
            <EliteIcons.Monitor className='w-5 h-5 text-terra-cyan' />
            <span>System Status</span>
          </div>
        </div>
        <div className='tahoe-widget-content'>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '13px',
            }}
          >
            <div>
              <div style={{ opacity: 0.7, marginBottom: '4px' }}>CPU</div>
              <div style={{ fontWeight: '600' }}>23%</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, marginBottom: '4px' }}>Memory</div>
              <div style={{ fontWeight: '600' }}>6.2 GB</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, marginBottom: '4px' }}>Network</div>
              <div style={{ fontWeight: '600', color: '#00ff88' }}>Active</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, marginBottom: '4px' }}>Uptime</div>
              <div style={{ fontWeight: '600' }}>14d 7h</div>
            </div>
          </div>
        </div>
      </div>

      {/* TerraSphere Status */}
      <div className='tahoe-widget-card'>
        <div className='tahoe-widget-header'>
          <div className='tahoe-widget-title'>
            <EliteQuantumIcon iconType='Brain' className='w-5 h-5' glowIntensity='medium' />
            <span>AI Consciousness</span>
          </div>
        </div>
        <div className='tahoe-widget-content'>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: '200',
                background: 'linear-gradient(135deg, #00ffff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px',
              }}
            >
              949
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Quantum Optimization Factor</div>
          </div>
        </div>
      </div>
    </div>
  );
}
