/**
 * TransparencyLayerWidget Component
 * Control progressive disclosure layer (Surface → Hint → Depth → Expert)
 */

import React from 'react';
import type { TransparencyLayer } from '../hooks/useTransparencyEngine';

interface TransparencyLayerWidgetProps {
  layer: TransparencyLayer;
  onLayerChange: (layer: TransparencyLayer) => void;
  onElevate: () => void;
  onReduce: () => void;
}

export const TransparencyLayerWidget: React.FC<TransparencyLayerWidgetProps> = ({
  layer,
  onLayerChange,
  onElevate,
  onReduce,
}) => {
  const layers: TransparencyLayer[] = ['surface', 'hint', 'depth', 'expert'];

  const getLayerIcon = (l: TransparencyLayer): string => {
    switch (l) {
      case 'surface':
        return '🌊';
      case 'hint':
        return '💡';
      case 'depth':
        return '🔬';
      case 'expert':
        return '🧠';
    }
  };

  const getLayerDescription = (l: TransparencyLayer): string => {
    switch (l) {
      case 'surface':
        return 'Minimal UI - High-level summaries only';
      case 'hint':
        return 'Moderate detail - Grouped by service';
      case 'depth':
        return 'Full timeline + metrics';
      case 'expert':
        return 'Complete system log + decision trail';
    }
  };

  return (
    <div className="transparency-layer-widget">
      <div className="layer-controls">
        <button className="control-btn" onClick={onReduce} title="Reduce transparency">
          ◀
        </button>

        <div className="layer-display">
          <div className="layer-icon">{getLayerIcon(layer)}</div>
          <div className="layer-info">
            <div className="layer-name">{(layer ?? 'hint').toUpperCase()}</div>
            <div className="layer-desc">{getLayerDescription(layer)}</div>
          </div>
        </div>

        <button className="control-btn" onClick={onElevate} title="Increase transparency">
          ▶
        </button>
      </div>

      <div className="layer-selector">
        {layers.map(l => (
          <button
            key={l}
            className={`layer-option ${layer === l ? 'active' : ''}`}
            onClick={() => onLayerChange(l)}
            title={getLayerDescription(l)}
          >
            <span className="layer-option-icon">{getLayerIcon(l)}</span>
            <span className="layer-option-name">{l}</span>
          </button>
        ))}
      </div>

      <style>{`
        .transparency-layer-widget {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .layer-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 0.5rem;
          border: 1px solid rgba(0, 255, 255, 0.3);
        }

        .control-btn {
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }

        .layer-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .layer-icon {
          font-size: 2rem;
        }

        .layer-info {
          flex: 1;
        }

        .layer-name {
          font-size: 1rem;
          font-weight: 600;
          color: #00ffff;
          margin-bottom: 0.25rem;
        }

        .layer-desc {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .layer-selector {
          display: flex;
          gap: 0.5rem;
        }

        .layer-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem;
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s;
        }

        .layer-option:hover {
          background: rgba(0, 255, 255, 0.1);
          border-color: rgba(0, 255, 255, 0.4);
        }

        .layer-option.active {
          background: rgba(0, 255, 255, 0.2);
          border-color: #00ffff;
          color: #fff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }

        .layer-option-icon {
          font-size: 1.5rem;
        }

        .layer-option-name {
          font-size: 0.75rem;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
};
