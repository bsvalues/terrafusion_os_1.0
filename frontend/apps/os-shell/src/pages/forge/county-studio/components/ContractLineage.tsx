import React from 'react';

interface ContractLineageProps {
  operationalContractId?: string | null;
  correctionContractId?: string | null;
  countyName?: string | null;
  countyId?: string | null;
  compact?: boolean;
}

export function getCountyTrustPosture(countyName?: string | null, countyId?: string | null): string {
  const normalized = `${countyName ?? ''} ${countyId ?? ''}`.toLowerCase();
  if (normalized.includes('benton')) {
    return 'Benton production provisional · sync-derived · converted legacy sensitive';
  }
  return 'County trust tier not emitted by runtime · non-certified counties remain demo/reference';
}

export function ContractLineage({
  operationalContractId,
  correctionContractId,
  countyName,
  countyId,
  compact = false,
}: ContractLineageProps) {
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  };

  const labelStyle: React.CSSProperties = {
    color: 'hsl(var(--tf-muted))',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: compact ? 9 : 10,
    whiteSpace: 'nowrap',
  };

  const codeStyle: React.CSSProperties = {
    color: 'hsl(var(--tf-fg))',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: compact ? 10 : 11,
    overflowWrap: 'anywhere',
  };

  return (
    <div
      data-testid="contract-lineage"
      style={{
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-start',
        flexDirection: compact ? 'row' : 'column',
        gap: compact ? 10 : 4,
        padding: compact ? '4px 0' : 8,
        border: compact ? 'none' : '1px solid hsl(var(--tf-border))',
        borderRadius: compact ? 0 : 4,
        background: compact ? 'transparent' : 'hsl(var(--tf-surface))',
        fontSize: 11,
        minWidth: 0,
      }}
    >
      <span style={rowStyle}>
        <span style={labelStyle}>Operational Contract</span>
        <code data-testid="operational-contract-id" style={codeStyle}>
          {operationalContractId ?? 'unavailable'}
        </code>
      </span>
      <span style={rowStyle}>
        <span style={labelStyle}>Correction Contract</span>
        <code data-testid="correction-contract-id" style={codeStyle}>
          {correctionContractId ?? 'unavailable'}
        </code>
      </span>
      <span style={rowStyle}>
        <span style={labelStyle}>Trust Posture</span>
        <span data-testid="county-trust-posture" style={{ ...codeStyle, fontFamily: 'inherit' }}>
          {getCountyTrustPosture(countyName, countyId)}
        </span>
      </span>
    </div>
  );
}
