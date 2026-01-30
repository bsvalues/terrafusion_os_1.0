/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION WIDGET MANAGER CONTROL PANEL
 * UI for managing widget visibility, arrangement, and settings
 * ═══════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useWidgetManager } from '../contexts/WidgetManagerContext';
import {
  EliteActivityIcon,
  EliteLayersIcon,
  EliteMonitorIcon,
  EliteSettingsIcon,
} from './icons/EliteIcons';
import './WidgetManagerPanel.css';

interface WidgetManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetManagerPanel({ isOpen, onClose }: WidgetManagerPanelProps) {
  const {
    state,
    setArrangementMode,
    setGlobalAutoHide,
    setAutoHideDelay,
    toggleWidgetVisibility,
    resetPositions,
    hideAllWidgets,
    showAllWidgets,
    saveLayout,
    loadLayout,
    getVisibleWidgets,
    getHiddenWidgets,
  } = useWidgetManager();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const visibleWidgets = getVisibleWidgets();
  const hiddenWidgets = getHiddenWidgets();

  if (!isOpen) return null;

  return (
    <div className='quantum-widget-manager-overlay'>
      <div className='quantum-widget-manager-panel'>
        {/* Header */}
        <div className='quantum-manager-header'>
          <div className='quantum-manager-title'>
            <EliteMonitorIcon className='w-5 h-5 text-terra-cyan' />
            <h2>Widget Manager</h2>
          </div>
          <button className='quantum-manager-close' onClick={onClose} title='Close Widget Manager'>
            ✕
          </button>
        </div>

        {/* Quick Actions */}
        <div className='quantum-manager-section'>
          <h3>Quick Actions</h3>
          <div className='quantum-manager-actions'>
            <button
              className={`quantum-action-btn ${state.arrangementMode ? 'active' : ''}`}
              onClick={() => setArrangementMode(!state.arrangementMode)}
              title='Toggle Arrangement Mode'
            >
              <EliteLayersIcon className='w-4 h-4' />
              {state.arrangementMode ? 'Exit Arrange' : 'Arrange'}
            </button>

            <button
              className='quantum-action-btn'
              onClick={showAllWidgets}
              title='Show All Widgets'
            >
              <EliteActivityIcon className='w-4 h-4' />
              Show All
            </button>

            <button
              className='quantum-action-btn'
              onClick={hideAllWidgets}
              title='Hide All Widgets'
            >
              <EliteActivityIcon className='w-4 h-4' />
              Hide All
            </button>

            <button className='quantum-action-btn' onClick={resetPositions} title='Reset Positions'>
              <EliteActivityIcon className='w-4 h-4' />
              Reset
            </button>

            <button
              className='quantum-action-btn success'
              onClick={saveLayout}
              title='Save Current Layout'
            >
              <EliteActivityIcon className='w-4 h-4' />
              Save
            </button>
          </div>
        </div>

        {/* Visible Widgets */}
        <div className='quantum-manager-section'>
          <h3>Visible Widgets ({visibleWidgets.length})</h3>
          <div className='quantum-widget-list'>
            {visibleWidgets.map((widget) => (
              <div key={widget.id} className='quantum-widget-item visible'>
                <div className='quantum-widget-info'>
                  <span className='quantum-widget-name'>{widget.title}</span>
                  <div className='quantum-widget-status'>
                    {widget.isCollapsed && (
                      <EliteActivityIcon className='w-3 h-3 text-orange-400' />
                    )}
                    {widget.autoHide && <EliteActivityIcon className='w-3 h-3 text-amber-400' />}
                  </div>
                </div>
                <button
                  className='quantum-widget-toggle'
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  title='Hide Widget'
                >
                  <EliteActivityIcon className='w-4 h-4' />
                </button>
              </div>
            ))}
            {visibleWidgets.length === 0 && (
              <div className='quantum-empty-state'>No visible widgets</div>
            )}
          </div>
        </div>

        {/* Hidden Widgets */}
        {hiddenWidgets.length > 0 && (
          <div className='quantum-manager-section'>
            <h3>Hidden Widgets ({hiddenWidgets.length})</h3>
            <div className='quantum-widget-list'>
              {hiddenWidgets.map((widget) => (
                <div key={widget.id} className='quantum-widget-item hidden'>
                  <div className='quantum-widget-info'>
                    <span className='quantum-widget-name'>{widget.title}</span>
                  </div>
                  <button
                    className='quantum-widget-toggle'
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    title='Show Widget'
                  >
                    <EliteActivityIcon className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className='quantum-manager-section'>
          <button
            className='quantum-advanced-toggle'
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <EliteSettingsIcon className='w-4 h-4' />
            Advanced Settings
            <span className={`quantum-chevron ${showAdvanced ? 'open' : ''}`}>⌄</span>
          </button>

          {showAdvanced && (
            <div className='quantum-advanced-settings'>
              {/* Global Auto-hide */}
              <div className='quantum-setting-item'>
                <label className='quantum-setting-label'>
                  <input
                    type='checkbox'
                    checked={state.globalAutoHide}
                    onChange={(e) => setGlobalAutoHide(e.target.checked)}
                    className='quantum-checkbox'
                  />
                  <span>Global Auto-hide</span>
                </label>
                <p className='quantum-setting-description'>
                  Automatically hide widgets after inactivity
                </p>
              </div>

              {/* Auto-hide Delay */}
              <div className='quantum-setting-item'>
                <label htmlFor='auto-hide-delay' className='quantum-setting-label'>
                  Auto-hide Delay (seconds)
                </label>
                <input
                  id='auto-hide-delay'
                  type='range'
                  min='1'
                  max='30'
                  value={state.autoHideDelay / 1000}
                  onChange={(e) => setAutoHideDelay(parseInt(e.target.value) * 1000)}
                  className='quantum-range'
                  aria-label='Auto-hide delay in seconds'
                />
                <span className='quantum-range-value'>{state.autoHideDelay / 1000}s</span>
              </div>

              {/* Layout Actions */}
              <div className='quantum-setting-item'>
                <label className='quantum-setting-label'>Layout Management</label>
                <div className='quantum-layout-actions'>
                  <button
                    className='quantum-action-btn sm'
                    onClick={loadLayout}
                    title='Load Saved Layout'
                  >
                    Load Layout
                  </button>
                  <button
                    className='quantum-action-btn sm'
                    onClick={() => {
                      localStorage.removeItem('terrafusion-widget-layout');
                      window.location.reload();
                    }}
                    title='Reset to Default Layout'
                  >
                    Reset Default
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Arrangement Mode Indicator */}
        {state.arrangementMode && (
          <div className='quantum-arrangement-indicator'>
            <EliteLayersIcon className='w-4 h-4' />
            <span>Arrangement Mode Active</span>
            <span className='quantum-pulse'></span>
          </div>
        )}
      </div>
    </div>
  );
}
