/**
 * TerraFusion Trace Home
 *
 * Standalone home page for TerraTrace using the shared StandaloneHomeShell.
 * Provides system observability, audit trails, and telemetry visualization.
 *
 * @module pages/TraceHome
 * @see Slice 6.1: Unskip + Harden Standalone Contract Suite
 * @see Slice 17: Action Observability Surface
 */

import React from 'react';

import { StandaloneHomeShell } from '../components/standalone';
import { ActionStreamModule } from '../components/Trace/ActionStreamModule';

/**
 * Placeholder content for TerraTrace.
 * Includes Action Stream module for real-time action visibility.
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

      {/* Action Stream - Real-time OS action visibility */}
      <section className='trace-console__action-stream'>
        <ActionStreamModule maxHeight='400px' showFilters />
      </section>

      <section className='trace-console__placeholder'>
        <p>
          <em>Coming soon: Metrics dashboard and audit log search.</em>
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
