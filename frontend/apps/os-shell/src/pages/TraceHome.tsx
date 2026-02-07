/**
 * TerraFusion Trace Home
 *
 * Standalone home page for TerraTrace using the shared StandaloneHomeShell.
 * Provides system observability, audit trails, and telemetry visualization.
 *
 * @module pages/TraceHome
 * @see Slice 6.1: Unskip + Harden Standalone Contract Suite
 */

import React from 'react';

import { StandaloneHomeShell } from '../components/standalone';

/**
 * Placeholder content for TerraTrace.
 * This will be replaced with actual telemetry UI in a future slice.
 */
function TraceConsoleContent(): React.ReactElement {
  return (
    <div className='trace-console' data-testid='trace-console-content'>
      <section className='trace-console__overview'>
        <h2>System Telemetry</h2>
        <p>Real-time observability and audit trail visualization.</p>

        <div className='trace-console__stats'>
          <div className='trace-console__stat'>
            <span className='trace-console__stat-label'>Events Today</span>
            <span className='trace-console__stat-value'>--</span>
          </div>
          <div className='trace-console__stat'>
            <span className='trace-console__stat-label'>Active Traces</span>
            <span className='trace-console__stat-value'>--</span>
          </div>
          <div className='trace-console__stat'>
            <span className='trace-console__stat-label'>Error Rate</span>
            <span className='trace-console__stat-value'>--</span>
          </div>
        </div>
      </section>

      <section className='trace-console__placeholder'>
        <p>
          <em>Coming soon: Live trace viewer, metrics dashboard, and audit log search.</em>
        </p>
      </section>
    </div>
  );
}

/**
 * TraceHome - Standalone entry point for TerraTrace.
 *
 * Uses StandaloneHomeShell for consistent chrome (header, badge, actions)
 * and renders TraceConsoleContent inside the content slot.
 */
export function TraceHome(): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId='trace'
      meta={{
        title: 'TerraTrace Console',
        description: 'System observability, audit trails, and telemetry visualization.',
        primaryActions: [
          {
            id: 'refresh',
            label: 'Refresh',
            intent: 'system',
          },
          {
            id: 'export',
            label: 'Export Logs',
            intent: 'standalone',
          },
        ],
      }}
    >
      <TraceConsoleContent />
    </StandaloneHomeShell>
  );
}

export default TraceHome;
