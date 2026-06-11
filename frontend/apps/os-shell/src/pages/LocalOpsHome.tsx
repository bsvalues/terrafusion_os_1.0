/**
 * TerraFusion LocalOps — Window Home
 *
 * LocalOps is registered as a governed OS feature, but its real operator
 * surface is the shell side panel (`LocalOpsSurface` / `LocalOpsPanel`), not a
 * full-page window — by design it never escapes the shell. If the os-localops
 * window is ever opened, this home tells the truth and offers a button that
 * opens the side panel instead of duplicating the panel as a routable page.
 *
 * Token-only colors (`hsl(var(--tf-*))`); no raw color values.
 *
 * @module pages/LocalOpsHome
 */

import React from 'react';
import { useLocalOpsStore } from '../stores/localOpsStore';

const TEXT = 'hsl(var(--tf-text))';
const TEXT_MUTED = 'hsl(var(--tf-text) / 0.6)';
const BORDER = 'hsl(var(--tf-border) / 0.2)';
const PILOT = 'hsl(var(--tf-suite-pilot-hs, 226 58%) 60%)';

export function LocalOpsHome(): React.ReactElement {
  const open = useLocalOpsStore((s) => s.open);

  return (
    <div
      data-testid='localops-home-content'
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: TEXT,
        }}
      >
        TerraPilot · LocalOps
      </span>
      <p style={{ maxWidth: 440, fontSize: 12, lineHeight: 1.6, color: TEXT_MUTED, margin: 0 }}>
        LocalOps runs as a side panel in the shell, not a full-page window. It is a
        local-first, source-grounded, read-only operator that observes and explains — it
        never mutates records and never leaves the county boundary.
      </p>
      <button
        type='button'
        data-testid='localops-home-open-panel'
        onClick={open}
        style={{
          padding: '8px 16px',
          fontSize: 12,
          color: TEXT,
          background: 'none',
          border: `1px solid ${PILOT}`,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Open LocalOps panel
      </button>
      <span
        style={{
          fontSize: 10,
          color: TEXT_MUTED,
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 10,
        }}
      >
        Runbooks: docs/localops/BENTON_SERVER_RUNBOOK.md
      </span>
    </div>
  );
}

export default LocalOpsHome;
