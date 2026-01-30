import styled from '@emotion/styled';
import { useEffect } from 'react';
import { useMetricsStore } from '../../stores/metricsStore';
import { TF_TOKENS } from '../theme/tokens';
import { AxiomMetricCard } from './AxiomMetricCard';
import { CostforgeSavingsCard } from './CostforgeSavingsCard';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${TF_TOKENS.spacing.lg};
  padding: ${TF_TOKENS.spacing.lg};
  width: 100%;
`;

export const AxiomMetricsGrid = () => {
  const { kpis, status, refresh } = useMetricsStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (status === 'loading') {
    return (
      <div style={{ padding: TF_TOKENS.spacing.lg, color: 'var(--muted-foreground)' }}>
        Loading Metrics...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: TF_TOKENS.spacing.lg, color: 'var(--error-red)' }}>
        Metrics Unavailable
      </div>
    );
  }

  return (
    <Grid role='region' aria-label='System Metrics'>
      {kpis.map((kpi) => {
        if (kpi.label.includes('Cost')) {
          return <CostforgeSavingsCard key={kpi.id} kpi={kpi} />;
        }
        return <AxiomMetricCard key={kpi.id} kpi={kpi} />;
      })}
    </Grid>
  );
};
