/**
 * StratifiedStudyPanel.tsx
 *
 * IAAO-standard stratified ratio study by Property Type × Quality Grade.
 * DOR-ready table with per-stratum Median/COD/PRD/PRB and compliance dots.
 * Click stratum row → SalesForge filtered to that stratum.
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/apiBase';
import { activateModule } from '../../../orchestration/moduleActivation';

interface StratumRow {
  propertyType: string;
  qualityGrade: string;        // backend returns qualityGrade, not qualityClass
  saleCount: number;
  insufficientSample: boolean;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  iaaoMedianPass: boolean;
  iaaoCodPass: boolean;
  iaaoPrdPass: boolean;
  iaaoPrbPass: boolean;
}

interface StratifiedResponse {
  taxYear: number;
  minSales: number;
  totalStrata: number;
  sufficientStrata: number;
  strata: StratumRow[];
}

const fmt4 = (n: number | null) => (n == null ? '—' : n.toFixed(4));
const fmt2 = (n: number | null) => (n == null ? '—' : n.toFixed(2));

function IAAODot({ pass, insufficient }: { pass: boolean; insufficient: boolean }) {
  if (insufficient) return <span className="text-muted-foreground text-xs">—</span>;
  return <span className={pass ? 'text-green-500' : 'text-red-500'}>{pass ? '✓' : '✗'}</span>;
}

function generateDorCsv(data: StratifiedResponse): void {
  const header = 'PropertyType,QualityGrade,SaleCount,MedianRatio,COD,PRD,PRB,IAAOMedianPass,IAAOCodPass,IAAOPrdPass,IAAOPrbPass,TaxYear';
  const rows = data.strata.map((s) =>
    [
      s.propertyType,
      s.qualityGrade,
      s.saleCount,
      s.medianRatio ?? '',
      s.cod ?? '',
      s.prd ?? '',
      s.prb ?? '',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoMedianPass ? 'PASS' : 'FAIL',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoCodPass ? 'PASS' : 'FAIL',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoPrdPass ? 'PASS' : 'FAIL',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoPrbPass ? 'PASS' : 'FAIL',
      data.taxYear,
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BentonCounty_DOR_StratifiedStudy_${data.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StratifiedStudyPanel() {
  const [taxYear] = useState(2026);

  const { data, isLoading, error } = useQuery<StratifiedResponse>({
    queryKey: ['ratio-study-stratified', taxYear],
    queryFn: () =>
      apiFetch(`/terraforge/ratio-study/stratified?taxYear=${taxYear}&minSales=5`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const handleStratumClick = useCallback((stratum: StratumRow) => {
    void activateModule('sales-forge', {
      source: 'system',
      metadata: {
        filterPropertyType: stratum.propertyType,
        filterQualityGrade: stratum.qualityGrade,
      },
    });
  }, []);

  return (
    <Card data-material="bento" data-testid="stratified-study-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stratified Ratio Study — {taxYear} Tax Year</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Property Type × Quality Grade · IAAO Standard 5 §9 · Min 5 sales per stratum
            </p>
          </div>
          {data && (
            <Button variant="outline" size="sm" onClick={() => generateDorCsv(data)}>
              Export DOR CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading stratified study…</div>
        )}
        {error && (
          <div className="py-8 text-center text-red-500">
            Failed to load stratified study data.
          </div>
        )}
        {data && (
          <>
            <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
              <span>{data.totalStrata} strata total</span>
              <span>·</span>
              <span>{data.sufficientStrata} with ≥5 sales</span>
              <span>·</span>
              <span>{data.totalStrata - data.sufficientStrata} insufficient</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="grid">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-semibold">Stratum</th>
                    <th className="py-2 pr-4 text-right font-semibold">N</th>
                    <th className="py-2 pr-4 text-right font-semibold">Median</th>
                    <th className="py-2 pr-4 text-right font-semibold">COD</th>
                    <th className="py-2 pr-4 text-right font-semibold">PRD</th>
                    <th className="py-2 pr-4 text-right font-semibold">PRB</th>
                    <th className="py-2 text-center font-semibold">
                      IAAO <span className="text-xs font-normal">(Med/COD/PRD/PRB)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.strata.map((stratum) => (
                    <tr
                      key={`${stratum.propertyType}-${stratum.qualityGrade}`}
                      className="border-b hover:bg-white/5 cursor-pointer"
                      onClick={() => handleStratumClick(stratum)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleStratumClick(stratum)}
                    >
                      <td className="py-2 pr-4 font-medium">
                        {stratum.propertyType}
                        {stratum.qualityGrade !== 'Unknown' && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {stratum.qualityGrade}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right">{stratum.saleCount}</td>
                      {stratum.insufficientSample ? (
                        <td colSpan={4} className="py-2 pr-4 text-center text-muted-foreground text-xs">
                          Insufficient sample (N &lt; 5)
                        </td>
                      ) : (
                        <>
                          <td className="py-2 pr-4 text-right font-mono">{fmt4(stratum.medianRatio)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt2(stratum.cod)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt4(stratum.prd)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt4(stratum.prb)}</td>
                        </>
                      )}
                      <td className="py-2 text-center">
                        <span className="flex gap-1 justify-center">
                          <IAAODot pass={stratum.iaaoMedianPass} insufficient={stratum.insufficientSample} />
                          <IAAODot pass={stratum.iaaoCodPass} insufficient={stratum.insufficientSample} />
                          <IAAODot pass={stratum.iaaoPrdPass} insufficient={stratum.insufficientSample} />
                          <IAAODot pass={stratum.iaaoPrbPass} insufficient={stratum.insufficientSample} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Click any stratum row to open SalesForge filtered to that stratum.
              IAAO thresholds: Median 0.90–1.10 · COD ≤20 · PRD 0.98–1.03 · |PRB| ≤0.05
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
