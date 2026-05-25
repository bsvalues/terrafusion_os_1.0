/**
 * CurrentUseAlphaTab.tsx
 *
 * CUForge Alpha — Terra Current Use (RCW 84.34)
 * Workbench tab for current-use classification overview and rollback calculator.
 *
 * Design tokens: all colors from terrafusion-tokens.css — no hardcoded values.
 * Engine: CU_ROLLBACK_ENGINE_v2026_03_01 / Policy: 2025.09.01
 */

import React, { useState } from 'react';
import type { ClassificationType, RollbackResult } from '../domain/rollback/rollbackTypes';
import { calculateRollback } from '../domain/rollback/rollbackEngine';
import { currentUseAlphaFlags } from '../config/currentUseAlphaFlags';

const CLASSIFICATION_OPTIONS: { value: ClassificationType; label: string }[] = [
  { value: 'FARM_AND_AGRICULTURAL', label: 'Farm & Agricultural' },
  { value: 'OPEN_SPACE', label: 'Open Space' },
  { value: 'TIMBER_LAND', label: 'Timber Land' },
  { value: 'DESIGNATED_FORESTLAND', label: 'Designated Forestland' },
];

const fmtCurrency = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const currentYear = new Date().getFullYear();

interface Props {
  parcelId: string;
}

export function CurrentUseAlphaTab({ parcelId }: Props) {
  const [classification, setClassification] = useState<ClassificationType>('FARM_AND_AGRICULTURAL');
  const [removalDate, setRemovalDate] = useState<string>('');
  const [taxYear, setTaxYear] = useState<number>(currentYear);
  const [result, setResult] = useState<RollbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!removalDate) {
      setError('Removal date is required.');
      return;
    }

    try {
      const res = calculateRollback({
        parcelId,
        classificationType: classification,
        removalDate,
        taxYearOfRemoval: taxYear,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed.');
    }
  }

  return (
    <div
      style={{
        background: 'hsl(var(--tf-void-black, 217 33% 7%))',
        color: 'hsl(var(--tf-text, 210 20% 90%))',
        padding: '1.5rem',
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'hsl(var(--terra-cyan, 192 58% 60%))',
            margin: 0,
          }}
        >
          Current Use — Alpha
        </h2>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'hsl(var(--tf-text-muted, 210 15% 55%))',
            margin: '0.25rem 0 0',
          }}
        >
          RCW 84.34 classification overview and rollback tax calculator
        </p>
        {currentUseAlphaFlags.showPolicyVersion && (
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              background: 'hsl(var(--tf-surface-darker, 217 33% 11%))',
              border: '1px solid hsl(var(--terra-cyan, 192 58% 60%) / 0.3)',
              color: 'hsl(var(--terra-cyan, 192 58% 60%))',
            }}
          >
            Policy v2025.09.01
          </span>
        )}
      </div>

      {/* Rollback calculator (conditionally enabled) */}
      {currentUseAlphaFlags.rollbackCalculator && (
        <div
          style={{
            background: 'hsl(var(--tf-surface-darker, 217 33% 11%))',
            border: '1px solid hsl(var(--tf-network-blue, 207 72% 50%) / 0.25)',
            borderRadius: '0.5rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              margin: '0 0 1rem',
              color: 'hsl(var(--tf-text, 210 20% 90%))',
            }}
          >
            Rollback Calculator
          </h3>

          <form onSubmit={handleCalculate}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              {/* Classification */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--tf-text-muted, 210 15% 55%))' }}>
                  Classification type
                </span>
                <select
                  value={classification}
                  onChange={e => setClassification(e.target.value as ClassificationType)}
                  style={{
                    background: 'hsl(var(--tf-bg-surface, 217 33% 20%))',
                    border: '1px solid hsl(var(--tf-network-blue, 207 72% 50%) / 0.4)',
                    borderRadius: '0.25rem',
                    color: 'hsl(var(--tf-text, 210 20% 90%))',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {CLASSIFICATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Removal date */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--tf-text-muted, 210 15% 55%))' }}>
                  Removal date
                </span>
                <input
                  type="date"
                  value={removalDate}
                  onChange={e => setRemovalDate(e.target.value)}
                  required
                  style={{
                    background: 'hsl(var(--tf-bg-surface, 217 33% 20%))',
                    border: '1px solid hsl(var(--tf-network-blue, 207 72% 50%) / 0.4)',
                    borderRadius: '0.25rem',
                    color: 'hsl(var(--tf-text, 210 20% 90%))',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                  }}
                />
              </label>

              {/* Tax year */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--tf-text-muted, 210 15% 55%))' }}>
                  Tax year of removal
                </span>
                <input
                  type="number"
                  value={taxYear}
                  onChange={e => setTaxYear(Number(e.target.value))}
                  min={2000}
                  max={2100}
                  style={{
                    background: 'hsl(var(--tf-bg-surface, 217 33% 20%))',
                    border: '1px solid hsl(var(--tf-network-blue, 207 72% 50%) / 0.4)',
                    borderRadius: '0.25rem',
                    color: 'hsl(var(--tf-text, 210 20% 90%))',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              style={{
                background: 'hsl(var(--terra-cyan, 192 58% 60%))',
                color: 'hsl(var(--tf-void-black, 217 33% 7%))',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.5rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Calculate Rollback
            </button>
          </form>

          {/* Error */}
          {error && (
            <p
              style={{
                marginTop: '0.75rem',
                color: 'hsl(var(--tf-error-red, 0 72% 60%))',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </p>
          )}

          {/* Result */}
          {result && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem',
                background: 'hsl(var(--tf-bg-surface, 217 33% 20%))',
                borderRadius: '0.375rem',
                border: '1px solid hsl(var(--tf-accent-success, 135 90% 55%) / 0.3)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <Metric label="Rollback years" value={result.rollbackYears.join(', ')} />
                <Metric label="Additional tax" value={fmtCurrency(result.additionalTaxSubtotal)} />
                <Metric label="Interest" value={fmtCurrency(result.interestSubtotal)} />
                <Metric label="Penalty" value={fmtCurrency(result.penaltyAmount)} accent="warn" />
                <Metric label="Total due" value={fmtCurrency(result.totalDue)} accent="primary" />
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.8rem',
                  color: 'hsl(var(--tf-text-muted, 210 15% 55%))',
                }}
              >
                {result.explanation.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>

              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.7rem',
                  color: 'hsl(var(--tf-text-muted, 210 15% 45%))',
                }}
              >
                Engine: {result.calculationVersion} · Policy: {result.policyVersion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'primary' | 'warn';
}) {
  const valueColor =
    accent === 'primary'
      ? 'hsl(var(--terra-cyan, 192 58% 60%))'
      : accent === 'warn'
        ? 'hsl(var(--tf-warning-amber, 40 100% 60%))'
        : 'hsl(var(--tf-text, 210 20% 90%))';

  return (
    <div>
      <div
        style={{ fontSize: '0.7rem', color: 'hsl(var(--tf-text-muted, 210 15% 55%))' }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: valueColor }}>{value}</div>
    </div>
  );
}
