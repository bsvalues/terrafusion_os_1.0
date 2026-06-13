/**
 * TerraNotice Ops Console — shared presentational primitives.
 *
 * These keep the twelve area screens terse and visually consistent. They are
 * pure (token-driven, no fabricated data of their own) and reuse the shell's
 * shadcn/Radix UI components where a primitive already exists.
 *
 * @module pages/notice/components/primitives
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ApprovalStatus, TimelineStep } from '../types';

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatInt(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatPct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// KPI tile
// ---------------------------------------------------------------------------

interface KpiTileProps {
  label: string;
  value: string;
  note?: string;
  /** Token name (without var()), e.g. '--tf-accent'. Drives the value color. */
  accentVar?: string;
  testId?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  note,
  accentVar = '--tf-accent',
  testId,
}) => (
  <Card data-testid={testId} className="overflow-hidden">
    <CardContent className="p-4">
      <div className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--tf-muted))' }}>
        {label}
      </div>
      <div className="text-3xl font-semibold mt-1" style={{ color: `hsl(var(${accentVar}))` }}>
        {value}
      </div>
      {note && (
        <div className="text-xs mt-1.5" style={{ color: 'hsl(var(--tf-muted))' }}>
          {note}
        </div>
      )}
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Section card — a titled panel with an optional right-aligned status chip
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  chip?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, chip, children, testId }) => (
  <Card data-testid={testId}>
    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
      <CardTitle className="text-base">{title}</CardTitle>
      {chip}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Status pill — maps governance statuses to the canonical Badge variants
// ---------------------------------------------------------------------------

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export function approvalVariant(status: ApprovalStatus): BadgeVariant {
  switch (status) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

interface StatusPillProps {
  label: string;
  variant?: BadgeVariant;
  testId?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ label, variant = 'outline', testId }) => (
  <Badge data-testid={testId} variant={variant}>
    {label}
  </Badge>
);

// ---------------------------------------------------------------------------
// Governance timeline — the lifecycle trace shown on the Command Center
// ---------------------------------------------------------------------------

const TIMELINE_DOT: Record<TimelineStep['state'], string> = {
  done: '--tf-success',
  active: '--tf-warning',
  pending: '--tf-muted',
};

export const GovernanceTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => (
  <ol className="space-y-3" data-testid="notice-governance-timeline">
    {steps.map((step, i) => {
      const dot = TIMELINE_DOT[step.state];
      return (
        <li key={step.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${step.state === 'active' ? 'animate-pulse' : ''}`}
              style={{ background: `hsl(var(${dot}))`, boxShadow: `0 0 8px hsl(var(${dot}) / 0.5)` }}
            />
            {i < steps.length - 1 && (
              <span className="w-px flex-1 mt-1" style={{ minHeight: 18, background: 'hsl(var(--tf-border) / 0.4)' }} />
            )}
          </div>
          <div className="flex-1 -mt-0.5">
            <div
              className="text-sm"
              style={{ color: step.state === 'pending' ? 'hsl(var(--tf-muted))' : 'hsl(var(--tf-fg))' }}
            >
              {step.label}
            </div>
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
              {step.at}
            </div>
          </div>
        </li>
      );
    })}
  </ol>
);

// ---------------------------------------------------------------------------
// Lightweight data table — thead/tbody styled to match the shell tables
// ---------------------------------------------------------------------------

export const Table: React.FC<{ children: React.ReactNode; testId?: string }> = ({ children, testId }) => (
  <table data-testid={testId} className="w-full text-sm">
    {children}
  </table>
);

export const Th: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`py-2 font-medium text-left ${className}`} style={{ color: 'hsl(var(--tf-muted))' }}>
    {children}
  </th>
);

export const Tr: React.FC<{ children: React.ReactNode; onClick?: () => void; interactive?: boolean }> = ({
  children,
  onClick,
  interactive,
}) => (
  <tr
    onClick={onClick}
    className={interactive ? 'hover:bg-white/5 cursor-pointer' : ''}
    style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
  >
    {children}
  </tr>
);

export const Td: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`py-2 ${className}`}>{children}</td>
);

// ---------------------------------------------------------------------------
// Empty / unavailable state — used when a real backend returns nothing
// ---------------------------------------------------------------------------

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-8 text-center text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
    {message}
  </div>
);
