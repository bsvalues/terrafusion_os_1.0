import React from 'react';

const STATUS_ITEMS = [
  { label: 'Deployment Runtime', value: 'Provider required' },
  { label: 'Integration Health', value: 'Unavailable' },
  { label: 'Agent Runtime', value: 'Unavailable' },
  { label: 'Availability Evidence', value: 'Unavailable' },
  { label: 'Response-Time Evidence', value: 'Unavailable' },
  { label: 'Security Attestation', value: 'Unavailable' },
];

const ChampionshipDeployment: React.FC = () => {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        background: 'linear-gradient(135deg, var(--tf-bg-void) 0%, var(--tf-bg-surface) 100%)',
        color: 'var(--tf-text-primary)',
        minHeight: '100vh',
        padding: '32px',
      }}
    >
      <section
        style={{
          border: '1px solid hsl(var(--tf-accent-2) / 0.3)',
          borderRadius: '16px',
          background: 'hsl(var(--tf-surface) / 0.88)',
          padding: '28px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            color: 'var(--tf-accent-warning)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '0 0 12px',
          }}
        >
          Deployment Control Blocked
        </p>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            margin: '0 0 12px',
          }}
        >
          Governed Deployment Provider Required
        </h1>
        <p
          style={{
            color: 'var(--tf-text-secondary)',
            lineHeight: 1.6,
            maxWidth: '760px',
            margin: 0,
          }}
        >
          This surface no longer generates deployment, integration, swarm, or performance status in
          the browser. Production deployment actions must route through a governed deployment
          provider with correlation IDs, execution logs, rollback evidence, and operator approval.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '28px',
          }}
        >
          {STATUS_ITEMS.map((item) => (
            <article
              key={item.label}
              style={{
                border: '1px solid hsl(var(--tf-accent-2) / 0.2)',
                borderRadius: '12px',
                padding: '16px',
                background: 'hsl(var(--tf-bg) / 0.35)',
              }}
            >
              <div style={{ color: 'var(--tf-text-secondary)', fontSize: '0.85rem' }}>
                {item.label}
              </div>
              <div style={{ color: 'var(--tf-accent-warning)', fontWeight: 700, marginTop: '8px' }}>
                {item.value}
              </div>
            </article>
          ))}
        </div>

        <div
          style={{
            marginTop: '28px',
            padding: '18px',
            borderRadius: '12px',
            background: 'hsl(var(--tf-accent-warning) / 0.1)',
            border: '1px solid hsl(var(--tf-accent-warning) / 0.3)',
            color: 'var(--tf-text-primary)',
          }}
        >
          Required before enablement: provider endpoint, preflight result, correlation-first log
          stream, artifact digest, rollback plan, and explicit operator confirmation. Until those
          exist, every deployment action remains disabled.
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          {['Run Preflight', 'Execute Deployment', 'Rollback'].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              style={{
                border: '1px solid hsl(var(--tf-accent-2) / 0.25)',
                background: 'hsl(var(--tf-text) / 0.08)',
                color: 'var(--tf-text-secondary)',
                borderRadius: '999px',
                padding: '10px 18px',
                cursor: 'not-allowed',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ChampionshipDeployment;
