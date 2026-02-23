import styled from '@emotion/styled';
import { KPI } from '../../stores/metricsStore';
import { TFGlassPanel } from '../primitives/TFGlassPanel';
import { TF_TOKENS } from '../theme/tokens';

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${TF_TOKENS.spacing.sm};
`;

const Label = styled.div`
  font-size: 0.75rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Value = styled.div`
  font-size: 2rem;
  font-weight: 300;
  color: var(--terra-cyan);
  font-family: var(--font-primary);
`;

const Badge = styled.span<{ status: KPI['status'] }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.618rem;
  font-weight: bold;
  text-transform: uppercase;
  background: ${(props) =>
    props.status === 'verified'
      ? 'hsl(var(--tf-green-hs) 50% / 0.1)'
      : props.status === 'anomaly'
        ? 'hsl(var(--tf-red-hs) 60% / 0.1)'
        : 'hsl(var(--tf-neutral-hs) 100% / 0.1)'};
  color: ${(props) =>
    props.status === 'verified'
      ? 'var(--success-green)'
      : props.status === 'anomaly'
        ? 'var(--error-red)'
        : 'var(--muted-foreground)'};
  border: 1px solid
    ${(props) =>
      props.status === 'verified'
        ? 'var(--success-green)'
        : props.status === 'anomaly'
          ? 'var(--error-red)'
          : 'var(--glass-border)'};
`;

export const AxiomMetricCard = ({ kpi }: { kpi: KPI }) => {
  return (
    <TFGlassPanel tabIndex={0} role='article' aria-label={`${kpi.label}: ${kpi.value}`}>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{kpi.label}</Label>
          <Badge status={kpi.status}>{kpi.status}</Badge>
        </div>
        <Value>{kpi.value}</Value>
        {kpi.delta && (
          <div style={{ fontSize: '0.8rem', color: 'var(--success-green)' }}>{kpi.delta}</div>
        )}
      </CardContent>
    </TFGlassPanel>
  );
};
