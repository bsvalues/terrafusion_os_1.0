/**
 * TerraFusion OS — Companion Panel
 *
 * TerraPilot + TerraMuse as a first-class OS system service.
 *
 * This is NOT a window. It is shell chrome — always rendered, never destroyed.
 * It slides in from the right edge of the screen via CSS transform.
 * The operator summons it with Ctrl+\ or the dock button, not by "launching" anything.
 *
 * The panel is context-aware: it reads activeParcelId, activeSuite, and activeTab
 * from the companion context bus (companionStore) which is written by other parts
 * of the OS as the operator navigates.
 *
 * @module components/companion/CompanionPanel
 */

import React from 'react';
import { Bot, ChevronRight } from 'lucide-react';
import { useCompanionStore } from '../../stores/companionStore';
import { PilotConsoleContent } from '../../pages/PilotConsoleContent';
import { Z } from '../../shell/desktop/zIndex';

// ============================================================================
// Pull Tab — always visible on the right edge, even when panel is closed
// ============================================================================

const PullTab: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({ isOpen, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label={isOpen ? 'Collapse TerraPilot panel' : 'Expand TerraPilot panel'}
    aria-expanded={isOpen}
    style={{
      position: 'fixed',
      right: isOpen ? 380 : 0,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: Z.companionPanel + 1,
      transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRadius: '8px 0 0 8px',
      width: 24,
      height: 64,
      background: 'hsl(226 58% 55% / 0.85)',
      backdropFilter: 'blur(8px)',
      border: '1px solid hsl(226 58% 70% / 0.3)',
      borderRight: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0,
    }}
  >
    <Bot
      size={13}
      style={{
        color: 'hsl(226 80% 92%)',
        flexShrink: 0,
      }}
    />
  </button>
);

// ============================================================================
// Context Chip — shows active parcel / suite in the panel header
// ============================================================================

const ContextChip: React.FC<{
  label: string;
  hue: string;
}> = ({ label, hue }) => (
  <span
    style={{
      fontSize: 10,
      padding: '2px 6px',
      borderRadius: 4,
      background: `hsl(${hue} / 0.15)`,
      color: `hsl(${hue})`,
      fontFamily: 'ui-monospace, monospace',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: 130,
      flexShrink: 0,
    }}
  >
    {label}
  </span>
);

// ============================================================================
// Panel Header
// ============================================================================

const PanelHeader: React.FC<{
  activeParcelId: string | null;
  activeSuite: string | null;
  onClose: () => void;
}> = ({ activeParcelId, activeSuite, onClose }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      borderBottom: '1px solid hsl(var(--tf-border) / 0.15)',
      flexShrink: 0,
    }}
  >
    <Bot size={15} style={{ color: 'hsl(226 58% 65%)', flexShrink: 0 }} />

    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: 'hsl(var(--tf-text))',
        textTransform: 'uppercase',
      }}
    >
      TerraPilot
    </span>

    <span
      style={{
        fontSize: 10,
        color: 'hsl(var(--tf-text) / 0.4)',
        letterSpacing: '0.06em',
      }}
    >
      · MUSE
    </span>

    {/* Context chips — auto-populated by OS context bus */}
    <div style={{ flex: 1, display: 'flex', gap: 4, overflow: 'hidden', minWidth: 0 }}>
      {activeParcelId && (
        <ContextChip label={activeParcelId} hue="226 58% 71%" />
      )}
      {activeSuite && !activeParcelId && (
        <ContextChip label={activeSuite} hue="var(--tf-accent-hs) 50%" />
      )}
    </div>

    <button
      onClick={onClose}
      aria-label="Close TerraPilot panel"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'hsl(var(--tf-text) / 0.4)',
        padding: 4,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <ChevronRight size={15} />
    </button>
  </div>
);

// ============================================================================
// CompanionPanel — root export
// ============================================================================

export const CompanionPanel: React.FC = () => {
  const { isOpen, open: _open, close, toggle, activeParcelId, activeSuite } =
    useCompanionStore();

  return (
    <>
      <PullTab isOpen={isOpen} onToggle={toggle} />

      <div
        role="complementary"
        aria-label="TerraPilot companion"
        aria-hidden={!isOpen}
        style={{
          position: 'fixed',
          right: 0,
          top: 48,    // below the top system bar (h-12 = 48px)
          bottom: 84, // above the floating dock (68px height + 16px bottom gap)
          width: 380,
          zIndex: Z.companionPanel,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          background: 'hsl(var(--tf-surface-dark-hs, 226 30%) 9%)',
          borderLeft: '1px solid hsl(var(--tf-border) / 0.2)',
          boxShadow: isOpen ? '-8px 0 32px hsl(226 58% 10% / 0.4)' : 'none',
          overflow: 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <PanelHeader
          activeParcelId={activeParcelId}
          activeSuite={activeSuite}
          onClose={close}
        />

        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <PilotConsoleContent />
        </div>
      </div>
    </>
  );
};

export default CompanionPanel;
