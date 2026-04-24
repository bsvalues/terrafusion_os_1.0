import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { ExceptionQueuePanel } from './ExceptionQueuePanel';

type DeckTab = 'distribution' | 'compare' | 'warnings' | 'exceptions';

function DistributionTab() {
  const { segments } = useCountyStudioStore();

  if (segments.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No data — load a segment set first.
      </div>
    );
  }

  const bands: Record<string, number> = {};
  for (let r = 0.70; r < 1.35; r += 0.05) {
    bands[r.toFixed(2)] = 0;
  }
  segments.forEach((seg) => {
    const bucket = (Math.floor(seg.medianRatio / 0.05) * 0.05).toFixed(2);
    if (bucket in bands) bands[bucket] = (bands[bucket] ?? 0) + 1;
  });

  const data = Object.entries(bands).map(([ratio, count]) => ({ ratio, count }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', padding: '4px 8px', flexShrink: 0 }}>
        Segment median ratios (one bar = one segment)
      </div>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="ratio" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} label={{ value: 'Segments', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))', fontSize: 11 }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CompareTab() {
  const { scenarioPreview } = useCountyStudioStore();

  if (!scenarioPreview || scenarioPreview.deltas.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No active scenario preview — save a scenario to compare.
      </div>
    );
  }

  const data = scenarioPreview.deltas.slice(0, 10).map((d) => ({
    name: d.segmentName.slice(0, 12),
    before: d.beforeRatio,
    after: d.afterRatio,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} domain={[0.8, 1.2]} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))', fontSize: 11 }}
        />
        <Bar dataKey="before" fill="#6b7280" radius={[2, 2, 0, 0]} name="Before" />
        <Bar dataKey="after" fill="#3b82f6" radius={[2, 2, 0, 0]} name="After" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function WarningsTab() {
  const { segments } = useCountyStudioStore();

  const warnings: { text: string; severity: 'critical' | 'warning' }[] = [];

  segments.forEach((seg) => {
    if (seg.stabilityScore < 60) {
      warnings.push({ text: `${seg.name}: stability score ${seg.stabilityScore} (below 60)`, severity: 'critical' });
    }
    if (seg.parcelCount < 10) {
      warnings.push({ text: `${seg.name}: very low sample (n=${seg.parcelCount})`, severity: 'critical' });
    } else if (seg.parcelCount < 30) {
      warnings.push({ text: `${seg.name}: low sample (n=${seg.parcelCount})`, severity: 'warning' });
    }
    if (seg.cod > 20) {
      warnings.push({ text: `${seg.name}: COD ${seg.cod.toFixed(1)} exceeds 20`, severity: 'critical' });
    }
    if (seg.prd < 0.98 || seg.prd > 1.03) {
      warnings.push({
        text: `${seg.name}: PRD ${seg.prd.toFixed(3)} outside IAAO range (0.98–1.03)`,
        severity: 'critical',
      });
    }
    const excRate = seg.parcelCount > 0 ? seg.exceptionCount / seg.parcelCount : 0;
    if (excRate > 0.10) {
      warnings.push({
        text: `${seg.name}: high exception rate ${(excRate * 100).toFixed(0)}% of parcels`,
        severity: 'warning',
      });
    }
  });

  return (
    <div data-testid="warnings-panel" style={{ padding: '8px 12px', overflowY: 'auto', height: '100%' }}>
      {warnings.length === 0 ? (
        <div style={{ fontSize: 12, color: 'hsl(var(--tf-muted))', paddingTop: 8 }}>
          No warnings — all segments within thresholds.
        </div>
      ) : (
        warnings.map((w, i) => (
          <div key={i} style={{
            padding: '4px 8px', marginBottom: 4, borderRadius: 4,
            background: w.severity === 'critical' ? '#ef444422' : '#f59e0b22',
            color: w.severity === 'critical' ? '#ef4444' : '#f59e0b',
            fontSize: 11,
          }}>
            {w.severity === 'critical' ? '⛔' : '⚠'} {w.text}
          </div>
        ))
      )}
    </div>
  );
}

function BottomDeckSkeleton() {
  // Mimics the three-tab chart panel at rest — one title bar + four shimmer
  // bars laid out to roughly match the DistributionTab bar chart.
  return (
    <div
      data-testid="bottom-deck-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading segment metrics"
      style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}
    >
      <style>{`@keyframes tf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div
        style={{
          height: 10, width: '40%', borderRadius: 3,
          background: 'linear-gradient(90deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 50%, hsl(var(--tf-surface)) 100%)',
          backgroundSize: '200% 100%',
          animation: 'tf-shimmer 1.4s ease-in-out infinite',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: 1 }}>
        {[60, 90, 120, 80, 55, 110].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              borderRadius: 3,
              background: 'linear-gradient(180deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 100%)',
              opacity: 1 - i * 0.08,
              animation: 'tf-shimmer 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BottomDeckError({ message }: { message: string }) {
  return (
    <div
      data-testid="bottom-deck-error"
      role="alert"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#ef4444', fontSize: 12, padding: 12, textAlign: 'center', gap: 6,
      }}
    >
      <div>Couldn't load segment metrics.</div>
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>{message}</div>
    </div>
  );
}

export function BottomDeck() {
  const [activeTab, setActiveTab] = useState<DeckTab>('distribution');
  const { loadStatus, loadErrors } = useCountyStudioStore();

  const tab = (label: string, key: DeckTab) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      style={{
        padding: '4px 12px',
        border: 'none',
        background: 'transparent',
        borderBottom: activeTab === key ? '2px solid hsl(var(--tf-accent))' : '2px solid transparent',
        color: activeTab === key ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
        fontSize: 11,
        fontWeight: activeTab === key ? 700 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--tf-border))', flexShrink: 0 }}>
        {tab('Distribution', 'distribution')}
        {tab('Before / After', 'compare')}
        {tab('Warnings', 'warnings')}
        {tab('Exceptions', 'exceptions')}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {loadStatus.segments === 'loading' ? (
          <BottomDeckSkeleton />
        ) : loadStatus.segments === 'error' ? (
          <BottomDeckError message={loadErrors.segments ?? 'Unknown error'} />
        ) : (
          <>
            {activeTab === 'distribution' && <DistributionTab />}
            {activeTab === 'compare' && <CompareTab />}
            {activeTab === 'warnings' && <WarningsTab />}
            {activeTab === 'exceptions' && <ExceptionQueuePanel />}
          </>
        )}
      </div>
    </div>
  );
}
