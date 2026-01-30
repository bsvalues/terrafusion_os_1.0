import { KPI } from '../../stores/metricsStore';
import { AxiomMetricCard } from './AxiomMetricCard';

export const CostforgeSavingsCard = ({ kpi }: { kpi: KPI }) => {
  // Enforce Costforge specific logic: Only green if verified
  const enhancedKpi = {
    ...kpi,
    status: kpi.status === 'verified' ? 'verified' : 'pending',
  } as KPI;

  return <AxiomMetricCard kpi={enhancedKpi} />;
};
