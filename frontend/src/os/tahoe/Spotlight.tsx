/**
 * Spotlight Search Component
 * System-wide search interface
 */

import { EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React from 'react';

interface SpotlightProps {
  visible: boolean;
  onClose: () => void;
  onOpenItem: (itemType: string, itemId: string, itemTitle: string) => void;
}

// Search results data
const SEARCH_ITEMS = [
  // Suites
  {
    id: 'assessment',
    type: 'suite',
    icon: 'Database',
    title: 'Assessment Suite',
    subtitle: 'Property assessment and valuation',
  },
  {
    id: 'levy',
    type: 'suite',
    icon: 'Shield',
    title: 'Levy Management',
    subtitle: 'Tax levy operations',
  },
  {
    id: 'gis',
    type: 'suite',
    icon: 'Layers',
    title: 'GIS Platform',
    subtitle: 'Geographic information systems',
  },
  {
    id: 'insights',
    type: 'suite',
    icon: 'Activity',
    title: 'AI Insights',
    subtitle: 'Advanced analytics and reporting',
  },

  // Power apps
  {
    id: 'costforge',
    type: 'app',
    icon: 'Brain',
    title: 'CostForge AI',
    subtitle: 'AI-powered cost estimation',
  },
  {
    id: 'sync',
    type: 'app',
    icon: 'Network',
    title: 'TerraSync',
    subtitle: 'County data synchronization',
  },
  {
    id: 'flow',
    type: 'app',
    icon: 'Zap',
    title: 'WorkFlow Engine',
    subtitle: 'Process automation',
  },
  {
    id: 'analytics',
    type: 'app',
    icon: 'Gauge',
    title: 'Advanced Analytics',
    subtitle: 'Real-time metrics and dashboards',
  },
  {
    id: 'security',
    type: 'app',
    icon: 'Lock',
    title: 'Security Center',
    subtitle: 'System security management',
  },
  {
    id: 'settings',
    type: 'app',
    icon: 'Settings',
    title: 'System Settings',
    subtitle: 'Configure TerraFusion OS',
  },

  // County apps
  {
    id: 'help',
    type: 'app',
    icon: 'Settings',
    title: 'Help & Support',
    subtitle: 'Documentation and assistance',
  },
  {
    id: 'reports',
    type: 'app',
    icon: 'Activity',
    title: 'Reports Portal',
    subtitle: 'Generate and view reports',
  },
];

export function Spotlight({ visible, onClose, onOpenItem }: SpotlightProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter results based on query
  const results = React.useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS.slice(0, 6); // Show top 6 by default

    const lowerQuery = query.toLowerCase();
    return SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  // Focus input when visible
  React.useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [visible]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectItem(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, results, selectedIndex]);

  // Reset selected index when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectItem = (item: (typeof SEARCH_ITEMS)[0]) => {
    onOpenItem(item.type, item.id, item.title);
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      className={`tahoe-spotlight ${visible ? 'tahoe-spotlight-visible' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className='tahoe-spotlight-container'>
        {/* Search Input */}
        <div className='tahoe-spotlight-search'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              borderBottom: results.length > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <span style={{ fontSize: '18px', opacity: 0.5 }}>🔍</span>
            <input
              ref={inputRef}
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search TerraFusion OS...'
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: 'white',
                fontWeight: '400',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className='tahoe-spotlight-results'>
              {results.map((item, index) => (
                <button
                  key={item.id}
                  className={`tahoe-spotlight-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    padding: '12px 20px',
                    background: index === selectedIndex ? 'rgba(0, 204, 204, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                    textAlign: 'left',
                  }}
                >
                  <EliteQuantumIcon
                    iconType={item.icon as any}
                    className='w-8 h-8'
                    glowIntensity={index === selectedIndex ? 'high' : 'low'}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        color: 'white',
                        marginBottom: '2px',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(0, 255, 255, 0.7)',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      padding: '2px 8px',
                      background: 'rgba(0, 255, 255, 0.1)',
                      borderRadius: '4px',
                    }}
                  >
                    {item.type}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query.trim() && results.length === 0 && (
            <div
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Keyboard Hints */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <span>
            <kbd style={kbdStyle}>↑</kbd>
            <kbd style={kbdStyle}>↓</kbd> Navigate
          </span>
          <span>
            <kbd style={kbdStyle}>↵</kbd> Open
          </span>
          <span>
            <kbd style={kbdStyle}>ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  padding: '2px 6px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '3px',
  fontFamily: 'SF Mono, Monaco, monospace',
  marginRight: '4px',
};
