import { useQuery } from '@tanstack/react-query';

interface ValuationApproaches {
  costApproach: {
    replacementCostNew: number;
    totalDepreciation: number;
    landValue: number;
    indicatedValue: number;
  } | null;
  incomeApproach: {
    noi: number;
    capRate: number;
    grm: number;
    indicatedValue: number;
  } | null;
  salesComparison: {
    comparableCount: number;
    medianAdjustedPrice: number;
    indicatedValue: number;
  } | null;
  reconciled: {
    value: number;
    confidence: number;
    method: string;
    effectiveDate: string;
  };
}

export function useValuationData(parcelId: string) {
  return useQuery<ValuationApproaches>({
    queryKey: ['valuation', parcelId],
    queryFn: async () => {
      const res = await fetch(`/api/valuation/${parcelId}`);
      if (!res.ok) throw new Error('Failed to fetch valuation data');
      return res.json();
    },
    enabled: !!parcelId,
  });
}

export function useValuationHistory(parcelId: string) {
  return useQuery<Array<{ year: number; assessedValue: number; marketValue: number }>>({
    queryKey: ['valuationHistory', parcelId],
    queryFn: async () => {
      const res = await fetch(`/api/valuation/${parcelId}/history`);
      if (!res.ok) throw new Error('Failed to fetch valuation history');
      return res.json();
    },
    enabled: !!parcelId,
  });
}
