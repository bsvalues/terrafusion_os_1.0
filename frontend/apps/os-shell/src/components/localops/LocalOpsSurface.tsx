/**
 * TerraFusion OS — LocalOps Surface (WO-LOCALOPS-006.1)
 *
 * The shell-chrome container that mounts the presentational `LocalOpsPanel`
 * into the live Desktop. It owns no LocalOps logic — it wires the panel's
 * controlled visibility and view model to `useLocalOpsStore`, and renders a
 * right-edge pull-tab so an operator can open the panel without a desktop icon,
 * launcher entry, or route (honoring the in-shell-only / no-Router-escape
 * guardrail).
 *
 * Like `CompanionPanel`, this is fixed shell chrome, not a routable window.
 * Z-index comes from the shell z-index authority (`Z.companionPanel`), never a
 * hardcoded value. Colors use design tokens only (`hsl(var(--tf-*))`).
 *
 * @module components/localops/LocalOpsSurface
 */

import React from 'react';
import { Z } from '../../shell/desktop/zIndex';
import { useLocalOpsStore } from '../../stores/localOpsStore';
import { LocalOpsPanel } from './LocalOpsPanel';

const TEXT = 'hsl(var(--tf-text))';
const SURFACE = 'hsl(var(--tf-surface-dark-hs, 226 30%) 9%)';
const BORDER = 'hsl(var(--tf-border) / 0.2)';

/**
 * Right-edge pull-tab. Hidden (aria + pointer) while the panel is open so it
 * never overlaps the panel's own close affordance.
 */
const PullTab: React.FC<{ open: boolean; onOpen: () => void }> = ({ open, onOpen }) => (
  <button
    type='button'
    data-testid='localops-pull-tab'
    aria-label='Open TerraPilot LocalOps'
    aria-hidden={open}
    onClick={onOpen}
    style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: open ? 'translate(100%, -50%)' : 'translate(0, -50%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: Z.companionPanel,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 6px',
      writingMode: 'vertical-rl',
      background: SURFACE,
      color: TEXT,
      border: `1px solid ${BORDER}`,
      borderRight: 'none',
      borderRadius: '6px 0 0 6px',
      cursor: 'pointer',
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      pointerEvents: open ? 'none' : 'auto',
    }}
  >
    LocalOps
  </button>
);

/**
 * Mounts the LocalOps panel as persistent shell chrome. Reads visibility and
 * the view model from the LocalOps store; renders the pull-tab when closed.
 */
export const LocalOpsSurface: React.FC = () => {
  const isOpen = useLocalOpsStore((s) => s.isOpen);
  const data = useLocalOpsStore((s) => s.data);
  const open = useLocalOpsStore((s) => s.open);
  const close = useLocalOpsStore((s) => s.close);

  return (
    <div data-testid='localops-surface'>
      <PullTab open={isOpen} onOpen={open} />
      <LocalOpsPanel data={data} open={isOpen} onClose={close} />
    </div>
  );
};

export default LocalOpsSurface;
