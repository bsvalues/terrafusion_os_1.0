/**
 * TerraFusion Suite Tile
 *
 * Individual suite card with on-brand styling.
 * Uses design tokens from shell-tokens.css.
 */

import React from 'react';
import { SuiteManifest } from '../suites/types';

interface SuiteTileProps {
  suite: SuiteManifest;
  onOpen?: (id: string) => void;
  onShowDetails?: (id: string) => void;
}

export const SuiteTile: React.FC<SuiteTileProps> = ({ suite, onOpen, onShowDetails }) => {
  const handleOpenClick = () => {
    onOpen?.(suite.id);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails?.(suite.id);
  };

  return (
    <article
      className='tf-card suite-tile terra-glass quantum-hover'
      style={
        {
          cursor: 'pointer',
          transition: 'all var(--tf-transition-base)',
          borderColor: suite.accentColor || 'var(--tf-color-primary)',
          boxShadow: `0 0 20px ${suite.accentColor || 'rgba(0, 255, 255, 0.2)'}33`,
          '--suite-accent': suite.accentColor || 'var(--tf-color-primary)',
        } as React.CSSProperties
      }
      onClick={handleOpenClick}
    >
      {/* Header with icon and title */}
      <header
        className='suite-tile-header'
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--tf-space-3)',
          marginBottom: 'var(--tf-space-4)',
        }}
      >
        <div
          className='suite-icon'
          style={{
            fontSize: 'var(--tf-text-4xl)',
            lineHeight: 1,
          }}
        >
          {suite.icon}
        </div>

        <div
          className='suite-title-block'
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <h2
            style={{
              fontSize: 'var(--tf-text-xl)',
              fontWeight: 'var(--tf-weight-semibold)',
              color: 'var(--tf-color-text-primary)',
              marginBottom: 'var(--tf-space-2)',
              lineHeight: 'var(--tf-leading-tight)',
            }}
          >
            {suite.label}
          </h2>

          <span
            className={`suite-level suite-level-${suite.level.toLowerCase()}`}
            style={{
              display: 'inline-block',
              fontSize: 'var(--tf-text-xs)',
              fontWeight: 'var(--tf-weight-medium)',
              padding: 'var(--tf-space-1) var(--tf-space-2)',
              borderRadius: 'var(--tf-radius-sm)',
              backgroundColor: `rgba(${suite.accentColor ? suite.accentColor.replace('#', '') : '0, 217, 255'}, 0.1)`,
              color: suite.accentColor || 'var(--tf-color-primary)',
              border: `1px solid ${suite.accentColor || 'var(--tf-color-primary)'}33`,
            }}
          >
            {suite.level}
          </span>
        </div>
      </header>

      {/* Description */}
      <p
        className='suite-description'
        style={{
          fontSize: 'var(--tf-text-sm)',
          color: 'var(--tf-color-text-secondary)',
          lineHeight: 'var(--tf-leading-relaxed)',
          marginBottom: 'var(--tf-space-4)',
        }}
      >
        {suite.description}
      </p>

      {/* Metadata */}
      <div
        className='suite-meta'
        style={{
          display: 'flex',
          gap: 'var(--tf-space-4)',
          marginBottom: 'var(--tf-space-4)',
          fontSize: 'var(--tf-text-xs)',
          color: 'var(--tf-color-text-tertiary)',
        }}
      >
        <span>📦 {suite.webApps.length + suite.nativeModules.length} Apps</span>
        <span>🔌 {suite.engines.length} Engines</span>
        <span>🤖 {suite.aiAgents.length} Agents</span>
        {suite.hotSwappable && (
          <span
            style={{
              color: suite.accentColor || 'var(--tf-color-primary)',
              fontWeight: 'var(--tf-weight-medium)',
            }}
          >
            ⚡ Hot-swap
          </span>
        )}
      </div>

      {/* Actions */}
      <footer
        className='suite-actions'
        style={{
          display: 'flex',
          gap: 'var(--tf-space-3)',
          paddingTop: 'var(--tf-space-4)',
          borderTop: '1px solid var(--tf-color-border)',
        }}
      >
        <button
          type='button'
          className='tf-btn tf-btn-primary'
          style={{
            flex: 1,
            backgroundColor: suite.accentColor || 'var(--tf-color-primary)',
            borderColor: suite.accentColor || 'var(--tf-color-primary)',
          }}
          onClick={handleOpenClick}
        >
          Open Suite
        </button>
        <button
          type='button'
          className='tf-btn tf-btn-secondary'
          style={{
            minWidth: 'auto',
            padding: '0 var(--tf-space-3)',
          }}
          onClick={handleDetailsClick}
          title='Show how this works'
        >
          ℹ️
        </button>
      </footer>
    </article>
  );
};
