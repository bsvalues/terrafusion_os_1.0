/**
 * UnavailableModuleSurface — Canonical component for dependency-gap disclosure.
 *
 * Tranche 1C (Phase 42): One intentional unavailable pattern as required by
 * Tranche 1C DoD. Used for modules that require a system dependency not
 * present in this environment.
 *
 * @module components/suites/UnavailableModuleSurface
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnavailableModuleSurfaceProps {
  name: string;
  description: string;
  moduleId: string;
  dependencyNote?: string;
}

export const UnavailableModuleSurface: React.FC<UnavailableModuleSurfaceProps> = ({
  name,
  description,
  moduleId,
  dependencyNote,
}) => {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--tf-bg) / 0.97) 0%, hsl(var(--tf-bg) / 0.93) 50%, hsl(var(--tf-bg) / 0.97) 100%)',
      }}
      data-testid={`unavailable-module-surface-${moduleId}`}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, hsl(var(--tf-error) / 0.3) 0%, transparent 70%)',
        }}
      />

      {/* AlertTriangle icon */}
      <div
        className="mb-6"
        style={{
          color: 'hsl(var(--tf-warning))',
          filter: 'drop-shadow(0 0 16px hsl(var(--tf-warning) / 0.3))',
        }}
      >
        <AlertTriangle size={56} strokeWidth={1.25} />
      </div>

      {/* Module name */}
      <h2
        className="text-2xl font-light mb-2 text-center"
        style={{ color: 'hsl(var(--tf-warning))' }}
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

      {/* Unavailable badge */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        style={{
          background: 'hsl(var(--tf-error) / 0.08)',
          border: '1px solid hsl(var(--tf-warning) / 0.30)',
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'hsl(var(--tf-warning))' }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: 'hsl(var(--tf-warning))' }}
        >
          Unavailable
        </span>
      </div>

      {/* Dependency note */}
      <p
        className="text-xs text-center max-w-sm leading-relaxed px-6 py-3 rounded-lg"
        style={{
          color: 'hsl(var(--tf-fg) / 0.35)',
          background: 'hsl(var(--tf-fg) / 0.03)',
          border: '1px solid hsl(var(--tf-fg) / 0.06)',
        }}
      >
        {dependencyNote ??
          'This module requires a system dependency that is not available in this environment.'}
      </p>
    </div>
  );
};

export default UnavailableModuleSurface;
