/**
 * QueuedModuleSurface — Canonical component for all queued module launches.
 *
 * Tranche 1C (Phase 42): Replaces PlaceholderModule for every module marked
 * truthState:'queued'. Honest disclosure, no faux KPI or charts.
 *
 * @module components/suites/QueuedModuleSurface
 */

import React from 'react';
import { Clock } from 'lucide-react';

interface QueuedModuleSurfaceProps {
  name: string;
  description: string;
  moduleId: string;
  suiteAccentVar?: string;
}

export const QueuedModuleSurface: React.FC<QueuedModuleSurfaceProps> = ({
  name,
  description,
  moduleId,
  suiteAccentVar = '--tf-warning',
}) => {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tf-bg) / 0.97) 0%, hsl(var(--tf-bg) / 0.93) 50%, hsl(var(--tf-bg) / 0.97) 100%)',
      }}
      data-testid={`queued-module-surface-${moduleId}`}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, hsl(var(${suiteAccentVar}) / 0.4) 0%, transparent 70%)`,
        }}
      />

      {/* Clock icon */}
      <div
        className="mb-6"
        style={{
          color: `hsl(var(${suiteAccentVar}))`,
          filter: `drop-shadow(0 0 16px hsl(var(${suiteAccentVar}) / 0.35))`,
        }}
      >
        <Clock size={56} strokeWidth={1.25} />
      </div>

      {/* Module name */}
      <h2
        className="text-2xl font-light mb-2 text-center"
        style={{ color: `hsl(var(${suiteAccentVar}))` }}
      >
        {name}
      </h2>

      {/* Description */}
      <p
        className="text-center max-w-md mb-6 text-sm leading-relaxed"
        style={{ color: 'hsl(var(--tf-fg) / 0.55)' }}
      >
        {description}
      </p>

      {/* Queued badge */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        style={{
          background: `hsl(var(${suiteAccentVar}) / 0.10)`,
          border: `1px solid hsl(var(${suiteAccentVar}) / 0.25)`,
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: `hsl(var(${suiteAccentVar}))` }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: `hsl(var(${suiteAccentVar}))` }}
        >
          Queued — On the roadmap
        </span>
      </div>

      {/* Honest disclosure */}
      <p
        className="text-xs text-center max-w-sm leading-relaxed px-6 py-3 rounded-lg"
        style={{
          color: 'hsl(var(--tf-fg) / 0.35)',
          background: 'hsl(var(--tf-fg) / 0.03)',
          border: '1px solid hsl(var(--tf-fg) / 0.06)',
        }}
      >
        This module is planned and will be available in a future release.
        No data is being collected or displayed.
      </p>
    </div>
  );
};

export default QueuedModuleSurface;
