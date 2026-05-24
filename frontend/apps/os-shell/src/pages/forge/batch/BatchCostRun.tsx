/**
 * BatchCostRun.tsx — Batch Cost Model Runs module.
 *
 * Standalone Forge module: Batch cost preview, history, cost matrix, depreciation, and estimator.
 * Consumes live CostForge API endpoints via Zustand store.
 *
 * Architecture: Statistics Studio pattern (React module, not AppFrame iframe).
 * Data: TerraFusion CostForge API — batch preview, history, cost matrix, depreciation, estimates.
 *
 * Tabs:
 *   1. Batch Preview — Run batch adjustment preview for a neighborhood/property type
 *   2. Cost Matrix — Benton County 2025 cost schedule (42 entries)
 *   3. Depreciation — Residential + commercial depreciation brackets
 *   4. Estimator — Single-property cost estimate calculator
 *   5. History — Completed batch run history
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBatchCostRunStore } from './batchCostRunStore';
import type { CostEstimateRequest } from './batchCostRunStore';

type BatchTab = 'preview' | 'matrix' | 'depreciation' | 'estimator' | 'history';

const TABS: { id: BatchTab; label: string }[] = [
  { id: 'preview', label: 'Batch Preview' },
  { id: 'matrix', label: 'Cost Matrix' },
  { id: 'depreciation', label: 'Depreciation' },
  { id: 'estimator', label: 'Estimator' },
  { id: 'history', label: 'History' },
];

// ── Stats Rail ───────────────────────────────────────────────────────────────

function StatsRail() {
  const stats = useBatchCostRunStore((s) => s.stats);
  const items = [
    { label: 'Matrix Entries', value: stats.matrixEntries },
    { label: 'Building Types', value: stats.buildingTypes },
    { label: 'Regions', value: stats.regions },
    { label: 'Completed Runs', value: stats.completedRuns },
    { label: 'Preview Parcels', value: stats.lastPreviewParcels },
  ];
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-md border px-3 py-2"
          style={{ background: 'hsl(var(--tf-card-bg, 220 20% 97%) / 0.6)' }}
        >
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div className="text-lg font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Batch Preview Tab ────────────────────────────────────────────────────────

function BatchPreviewTab() {
  const { preview, previewLoading, previewError, fetchPreview } = useBatchCostRunStore();
  const [neighborhood, setNeighborhood] = useState('Downtown');
  const [propertyType, setPropertyType] = useState('Residential');

  const handleRun = () => {
    fetchPreview(neighborhood, propertyType);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Neighborhood</label>
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Property Type</label>
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          />
        </div>
        <button
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          onClick={handleRun}
          disabled={previewLoading}
        >
          {previewLoading ? 'Running...' : 'Run Preview'}
        </button>
      </div>

      {previewError && (
        <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{previewError}</div>
      )}

      {preview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Preview: {preview.neighborhood} / {preview.propertyType}
            </CardTitle>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Batch {preview.batchId}</Badge>
              <span>{preview.matchCount} matched</span>
              <span>{preview.affectedCount} affected</span>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1 pr-3">Factor</th>
                  <th className="py-1 pr-3 text-right">Current</th>
                  <th className="py-1 pr-3 text-right">Proposed</th>
                  <th className="py-1 pr-3 text-right">Delta</th>
                  <th className="py-1 text-right">Parcels</th>
                </tr>
              </thead>
              <tbody>
                {preview.adjustments.map((adj) => (
                  <tr key={adj.factor} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 font-medium">{adj.factor}</td>
                    <td className="py-1.5 pr-3 text-right">{adj.currentValue.toFixed(4)}</td>
                    <td className="py-1.5 pr-3 text-right">{adj.proposedValue.toFixed(4)}</td>
                    <td className={`py-1.5 pr-3 text-right ${adj.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.delta >= 0 ? '+' : ''}{adj.delta.toFixed(4)}
                    </td>
                    <td className="py-1.5 text-right">{adj.parcels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Cost Matrix Tab ──────────────────────────────────────────────────────────

function CostMatrixTab() {
  const { costMatrix, matrixLoading, matrixError, fetchCostMatrix } = useBatchCostRunStore();
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  useEffect(() => {
    if (costMatrix.length === 0) fetchCostMatrix();
  }, []);

  const filtered = costMatrix.filter((e) => {
    if (filterType && !e.buildingType.toLowerCase().includes(filterType.toLowerCase())) return false;
    if (filterRegion && !e.region.toLowerCase().includes(filterRegion.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Filter Type</label>
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            placeholder="e.g. SFR"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Filter Region</label>
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            placeholder="e.g. Urban"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          />
        </div>
      </div>

      {matrixLoading && <div className="text-sm text-muted-foreground">Loading cost matrix...</div>}
      {matrixError && (
        <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{matrixError}</div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1 pr-3">Building Type</th>
                <th className="py-1 pr-3">Label</th>
                <th className="py-1 pr-3">Region</th>
                <th className="py-1 pr-3 text-right">Base $/sqft</th>
                <th className="py-1 text-right">Year</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr key={`${entry.buildingType}-${entry.region}-${i}`} className="border-b last:border-0">
                  <td className="py-1.5 pr-3 font-mono text-xs">{entry.buildingType}</td>
                  <td className="py-1.5 pr-3">{entry.buildingTypeLabel}</td>
                  <td className="py-1.5 pr-3">{entry.region}</td>
                  <td className="py-1.5 pr-3 text-right font-medium">
                    ${entry.baseCostPerSqft.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right">{entry.matrixYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!matrixLoading && filtered.length === 0 && costMatrix.length > 0 && (
        <div className="text-sm text-muted-foreground">No entries match filter.</div>
      )}
    </div>
  );
}

// ── Depreciation Tab ─────────────────────────────────────────────────────────

function DepreciationTab() {
  const { depreciation, depreciationLoading, depreciationError, fetchDepreciation } =
    useBatchCostRunStore();

  useEffect(() => {
    if (!depreciation) fetchDepreciation();
  }, []);

  if (depreciationLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (depreciationError)
    return <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{depreciationError}</div>;
  if (!depreciation) return null;

  const renderSchedule = (
    label: string,
    schedule: { usefulLifeYears: number; annualRate: number; brackets: { minAge: number; maxAge: number; factor: number }[] }
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
        <div className="text-xs text-muted-foreground">
          Useful life: {schedule.usefulLifeYears} yrs | Annual rate: {(schedule.annualRate * 100).toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-1 pr-3">Age Range</th>
              <th className="py-1 text-right">Depreciation Factor</th>
            </tr>
          </thead>
          <tbody>
            {schedule.brackets.map((b) => (
              <tr key={`${b.minAge}-${b.maxAge}`} className="border-b last:border-0">
                <td className="py-1.5 pr-3">
                  {b.minAge}–{b.maxAge} years
                </td>
                <td className="py-1.5 text-right font-medium">{(b.factor * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {renderSchedule('Residential Depreciation', depreciation.residential)}
      {renderSchedule('Commercial Depreciation', depreciation.commercial)}
    </div>
  );
}

// ── Estimator Tab ────────────────────────────────────────────────────────────

function EstimatorTab() {
  const { costEstimate, estimateLoading, estimateError, calculateEstimate } =
    useBatchCostRunStore();
  const [form, setForm] = useState<CostEstimateRequest>({
    buildingType: 'SFR',
    region: 'Urban',
    squareFeet: 2000,
    yearBuilt: 2005,
    qualityGrade: 'STANDARD',
    conditionGrade: 'GOOD',
    complexityGrade: 'STANDARD',
  });

  const handleChange = (field: keyof CostEstimateRequest, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleCalculate = () => {
    calculateEstimate(form);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Building Type</label>
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.buildingType}
            onChange={(e) => handleChange('buildingType', e.target.value)}
          >
            <option value="SFR">SFR (Single Family)</option>
            <option value="MFR">MFR (Multi Family)</option>
            <option value="COM">COM (Commercial)</option>
            <option value="IND">IND (Industrial)</option>
            <option value="AGR">AGR (Agricultural)</option>
            <option value="MHP">MHP (Manufactured Home)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Region</label>
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.region}
            onChange={(e) => handleChange('region', e.target.value)}
          >
            <option value="Urban">Urban</option>
            <option value="Suburban">Suburban</option>
            <option value="Rural">Rural</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Square Feet</label>
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.squareFeet}
            onChange={(e) => handleChange('squareFeet', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Year Built</label>
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.yearBuilt}
            onChange={(e) => handleChange('yearBuilt', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Quality</label>
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.qualityGrade}
            onChange={(e) => handleChange('qualityGrade', e.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="STANDARD">Standard</option>
            <option value="GOOD">Good</option>
            <option value="EXCELLENT">Excellent</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Condition</label>
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.conditionGrade}
            onChange={(e) => handleChange('conditionGrade', e.target.value)}
          >
            <option value="POOR">Poor</option>
            <option value="FAIR">Fair</option>
            <option value="GOOD">Good</option>
            <option value="EXCELLENT">Excellent</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Complexity</label>
          <select
            className="border rounded px-2 py-1 text-sm w-full"
            value={form.complexityGrade}
            onChange={(e) => handleChange('complexityGrade', e.target.value)}
          >
            <option value="SIMPLE">Simple</option>
            <option value="STANDARD">Standard</option>
            <option value="COMPLEX">Complex</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 w-full"
            onClick={handleCalculate}
            disabled={estimateLoading}
          >
            {estimateLoading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>

      {estimateError && (
        <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{estimateError}</div>
      )}

      {costEstimate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cost Estimate Result</CardTitle>
            <div className="text-xs text-muted-foreground">Source: {costEstimate.source}</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ResultField label="Building Type" value={costEstimate.buildingType} />
              <ResultField label="Region" value={costEstimate.region} />
              <ResultField label="Square Feet" value={costEstimate.squareFeet.toLocaleString()} />
              <ResultField label="Base $/sqft" value={`$${costEstimate.baseCostPerSqft.toFixed(2)}`} />
              <ResultField
                label="Replacement Cost New"
                value={`$${costEstimate.replacementCostNew.toLocaleString()}`}
              />
              <ResultField label="Effective Age" value={`${costEstimate.effectiveAge} yrs`} />
              <ResultField
                label="Depreciation Factor"
                value={`${(costEstimate.depreciationFactor * 100).toFixed(1)}%`}
              />
              <ResultField
                label="Quality Multiplier"
                value={`${costEstimate.qualityMultiplier.toFixed(3)}x`}
              />
              <ResultField
                label="Condition Multiplier"
                value={`${costEstimate.conditionMultiplier.toFixed(3)}x`}
              />
              <ResultField
                label="Complexity Multiplier"
                value={`${costEstimate.complexityMultiplier.toFixed(3)}x`}
              />
              <ResultField
                label="Depreciated Value"
                value={`$${costEstimate.depreciatedValue.toLocaleString()}`}
              />
              <ResultField
                label="Final Estimate"
                value={`$${costEstimate.finalEstimate.toLocaleString()}`}
                highlight
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded border px-3 py-2" style={highlight ? { background: 'hsl(142 70% 95%)' } : {}}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${highlight ? 'text-green-700 text-lg' : ''}`}>{value}</div>
    </div>
  );
}

// ── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const { history, historyLoading, historyError, fetchHistory } = useBatchCostRunStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  if (historyLoading) return <div className="text-sm text-muted-foreground">Loading history...</div>;
  if (historyError)
    return <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{historyError}</div>;

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">
            <p className="text-sm font-medium">No completed batch runs</p>
            <p className="text-xs mt-1">
              Batch runs will appear here once the preview engine is promoted to production
              and runs are applied.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-1 pr-3">Batch ID</th>
          <th className="py-1 pr-3">Neighborhood</th>
          <th className="py-1 pr-3">Type</th>
          <th className="py-1 pr-3 text-right">Affected</th>
          <th className="py-1 pr-3">Status</th>
          <th className="py-1">Applied</th>
        </tr>
      </thead>
      <tbody>
        {history.map((h) => (
          <tr key={h.batchId} className="border-b last:border-0">
            <td className="py-1.5 pr-3 font-mono text-xs">{h.batchId}</td>
            <td className="py-1.5 pr-3">{h.neighborhood}</td>
            <td className="py-1.5 pr-3">{h.propertyType}</td>
            <td className="py-1.5 pr-3 text-right">{h.affectedCount}</td>
            <td className="py-1.5 pr-3">
              <Badge variant="outline">{h.status}</Badge>
            </td>
            <td className="py-1.5 text-xs">{h.appliedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function BatchCostRun() {
  const [activeTab, setActiveTab] = useState<BatchTab>('preview');
  const { fetchPreview, fetchCostMatrix } = useBatchCostRunStore();

  useEffect(() => {
    // Load initial data
    fetchPreview();
    fetchCostMatrix();
  }, []);

  return (
    <div data-testid="batch-cost-run" className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batch Cost Model Runs</h1>
          <p className="text-muted-foreground text-sm">
            Benton County 2025 cost schedule, depreciation, and batch preview engine
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          Live API
        </Badge>
      </div>

      {/* Stats Rail */}
      <StatsRail />

      {/* Tab Bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'preview' && <BatchPreviewTab />}
        {activeTab === 'matrix' && <CostMatrixTab />}
        {activeTab === 'depreciation' && <DepreciationTab />}
        {activeTab === 'estimator' && <EstimatorTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}

export default BatchCostRun;
