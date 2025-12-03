/**
 * Window Manager Component
 * Handles rendering and managing desktop windows
 */

import CostForgeAI from '@/apps/CostForgeAI';
import TerraFlowMinimalTest from '@/apps/TerraFlowMinimalTest';
import { getSuiteById } from '@/suites';
import React from 'react';

export interface DesktopWindow {
  id: string;
  type: 'suite' | 'app' | string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
}

interface WindowManagerProps {
  windows: DesktopWindow[];
  activeWindow: string | null;
  onFocus: (windowId: string) => void;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onMaximize: (windowId: string) => void;
  onUpdateWindow: (windowId: string, updates: Partial<DesktopWindow>) => void;
}

export function WindowManager({
  windows,
  activeWindow,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onUpdateWindow,
}: WindowManagerProps) {
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [resizing, setResizing] = React.useState<string | null>(null);

  // Handle window dragging
  const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
    if ((e.target as HTMLElement).closest('.tahoe-window-titlebar')) {
      const window = windows.find((w) => w.id === windowId);
      if (!window || window.maximized) return;

      setDragging(windowId);
      setDragOffset({
        x: e.clientX - window.x,
        y: e.clientY - window.y,
      });
      onFocus(windowId);
    }
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (dragging) {
        const window = windows.find((w) => w.id === dragging);
        if (!window) return;

        // Update window position
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep window within bounds
        const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 400));
        const boundedY = Math.max(56, Math.min(newY, window.innerHeight - 100));

        onUpdateWindow(dragging, { x: boundedX, y: boundedY });
      }
    },
    [dragging, windows, dragOffset, onUpdateWindow]
  );

  const handleMouseUp = React.useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  React.useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  return (
    <>
      {windows
        .filter((window) => !window.minimized)
        .map((window, index) => (
          <div
            key={window.id}
            className={`tahoe-window ${activeWindow === window.id ? 'active' : ''}`}
            style={{
              left: window.maximized ? 0 : window.x,
              top: window.maximized ? 56 : window.y, // Account for menu bar
              width: window.maximized ? '100%' : window.width,
              height: window.maximized ? 'calc(100vh - 56px)' : window.height,
              zIndex: activeWindow === window.id ? 1000 : 900 + index,
              resize: window.maximized ? 'none' : 'both',
            }}
            onMouseDown={(e) => handleMouseDown(e, window.id)}
            onClick={() => onFocus(window.id)}
          >
            {/* Window Title Bar */}
            <div className='tahoe-window-titlebar'>
              {/* Traffic Light Controls */}
              <div className='tahoe-window-controls'>
                <button
                  className='tahoe-window-control close'
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(window.id);
                  }}
                  title='Close'
                />
                <button
                  className='tahoe-window-control minimize'
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize(window.id);
                  }}
                  title='Minimize'
                />
                <button
                  className='tahoe-window-control maximize'
                  onClick={(e) => {
                    e.stopPropagation();
                    onMaximize(window.id);
                  }}
                  title={window.maximized ? 'Restore' : 'Maximize'}
                />
              </div>

              {/* Window Title */}
              <div className='tahoe-window-title'>{window.title}</div>

              {/* Placeholder for future window controls (like Electron menu) */}
              <div style={{ width: '60px' }} />
            </div>

            {/* Window Content */}
            <div className='tahoe-window-content'>
              <WindowContent window={window} />
            </div>
          </div>
        ))}
    </>
  );
}

// Window Content Renderer
function WindowContent({ window }: { window: DesktopWindow }) {
  // Route to actual suite/app components
  const suite = getSuiteById(window.id);

  // For suite windows
  if (window.type === 'suite' && suite) {
    return (
      <div className='tahoe-window-suite-content'>
        <div className='suite-header'>
          <span className='suite-icon'>{suite.icon}</span>
          <h2>{suite.label}</h2>
          <span className='suite-level'>{suite.level}</span>
        </div>
        <div className='suite-description'>{suite.description}</div>

        <div className='suite-components'>
          {suite.webApps.length > 0 && (
            <div className='component-group'>
              <h3>Web Applications</h3>
              <ul>
                {suite.webApps.map((app) => (
                  <li key={app}>{app}</li>
                ))}
              </ul>
            </div>
          )}

          {suite.nativeModules.length > 0 && (
            <div className='component-group'>
              <h3>Native Modules</h3>
              <ul>
                {suite.nativeModules.map((mod) => (
                  <li key={mod}>{mod}</li>
                ))}
              </ul>
            </div>
          )}

          {suite.engines.length > 0 && (
            <div className='component-group'>
              <h3>Engines</h3>
              <ul>
                {suite.engines.map((eng) => (
                  <li key={eng}>{eng}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For app windows - route to actual components
  if (window.type === 'app') {
    switch (window.id) {
      case 'costforge-ai':
        return <CostForgeAI />;
      case 'terra-flow':
        return <TerraFlowMinimalTest />;
      default:
        return (
          <div className='tahoe-window-app-placeholder'>
            <h2>{window.title}</h2>
            <p>
              App component for <code>{window.id}</code> not yet implemented.
            </p>
          </div>
        );
    }
  }

  // Fallback placeholder
  return (
    <div
      style={{
        padding: '24px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '400',
            color: 'rgba(0, 204, 204, 0.9)',
            margin: 0,
          }}
        >
          {window.title}
        </h2>

        <div
          style={{
            padding: '16px',
            background: 'rgba(0, 204, 204, 0.04)',
            border: '1px solid rgba(0, 204, 204, 0.12)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          <p style={{ margin: '0 0 12px 0' }}>
            This is a placeholder window for <strong>{window.title}</strong>.
          </p>
          <p style={{ margin: 0 }}>
            Window ID:{' '}
            <code
              style={{
                padding: '2px 6px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '3px',
                fontFamily: 'SF Mono, Monaco, monospace',
                fontSize: '12px',
              }}
            >
              {window.id}
            </code>
          </p>
        </div>

        {/* Sample Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: 'var(--terra-cyan)',
                  marginBottom: '8px',
                }}
              >
                {Math.floor(Math.random() * 1000)}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                Sample Metric {i}
              </div>
            </div>
          ))}
        </div>

        {/* Sample Table */}
        <div style={{ marginTop: '24px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '16px',
            }}
          >
            Recent Activity
          </h3>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < 3 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                }}
              >
                <span style={{ fontSize: '14px' }}>Activity Item {i}</span>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
