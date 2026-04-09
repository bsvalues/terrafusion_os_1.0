import React from 'react';
import type { LaneStatus } from '../../hooks/useMuseLaneStatus';
import { useMuseLaneStatus } from '../../hooks/useMuseLaneStatus';

function LaneCard({ name, lane }: { name: string; lane: LaneStatus }): React.ReactElement {
  return (
    <div
      data-testid={`lane-card-${name}`}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: `1px solid ${lane.live ? 'hsl(142 71% 45%)' : 'hsl(0 72% 51%)'}`,
        background: 'hsl(var(--tf-bg))',
        minWidth: '140px',
        flex: '1 1 140px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'hsl(var(--tf-text-muted, 30 15% 50%))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: '12px', color: 'hsl(var(--tf-text))', marginTop: '2px' }}>
        {lane.model}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span
          data-testid={`lane-status-${name}`}
          className={`muse-lane-dot ${lane.live ? 'muse-lane-dot--live' : 'muse-lane-dot--offline'}`}
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: lane.live ? 'hsl(142 71% 45%)' : 'hsl(0 72% 51%)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '11px', color: 'hsl(var(--tf-text-muted, 30 15% 50%))' }}>
          {lane.live ? 'LIVE' : 'OFFLINE'}
        </span>
        {lane.live && lane.latencyMs !== null && (
          <span
            data-testid={`lane-latency-${name}`}
            style={{
              fontSize: '11px',
              color: 'hsl(var(--tf-text-muted, 30 15% 50%))',
              marginLeft: 'auto',
            }}
          >
            {lane.latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}

export function MuseRouterObservatory(): React.ReactElement {
  const { lanes, fallbackActive, loading, error, lastUpdated } = useMuseLaneStatus();

  return (
    <div
      data-testid="muse-router-observatory"
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid hsl(var(--tf-border, 30 20% 85%))',
        background: 'hsl(var(--tf-surface, 45 30% 97%))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'hsl(var(--tf-text-muted, 30 15% 50%))',
            textTransform: 'uppercase',
          }}
        >
          Muse Routing Observatory
        </span>
        {lastUpdated && (
          <span style={{ fontSize: '10px', color: 'hsl(var(--tf-text-muted, 30 15% 50%))' }}>
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading && !lanes && (
        <div
          data-testid="observatory-loading"
          style={{ fontSize: '12px', color: 'hsl(var(--tf-text-muted, 30 15% 50%))' }}
        >
          Probing lanes…
        </div>
      )}

      {error && !lanes && (
        <div data-testid="observatory-error" style={{ fontSize: '12px', color: 'hsl(0 72% 51%)' }}>
          {error}
        </div>
      )}

      {lanes && (
        <div
          data-testid="observatory-lanes"
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
        >
          {Object.entries(lanes).map(([name, lane]) => (
            <LaneCard key={name} name={name} lane={lane} />
          ))}
        </div>
      )}

      {fallbackActive && (
        <div
          data-testid="observatory-fallback-banner"
          style={{
            marginTop: '8px',
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'hsl(0 72% 51% / 0.1)',
            border: '1px solid hsl(0 72% 51% / 0.3)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'hsl(0 60% 40%)',
            letterSpacing: '0.04em',
          }}
        >
          FALLBACK ACTIVE — Muse is using static templates
        </div>
      )}
    </div>
  );
}
