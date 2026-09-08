// Production Cost action: input capture and canonical output projection only.
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCalcRCNLD, type CostForgeCalcInput, type QualityGrade } from '@/hooks/useCostForgeHooks';
import { useCostForgeWorkspaceStore } from './costForgeWorkspaceStore';
import { getCostForgeCountyScope } from './countyScope';
import { supportsCertifiedCostScheduleLane } from '../countyCertification';

const amount = (value: string) => value.trim() ? Number(value) : Number.NaN;

export function CostApproachRunner() {
  const scope = getCostForgeCountyScope();
  const { result, isLoading, error, errorCorrelationId, calculate, reset } = useCalcRCNLD();
  const selectedParcel = useCostForgeWorkspaceStore(s => s.selectedParcelId);
  const taxYear = useCostForgeWorkspaceStore(s => s.taxYear);
  const [form, setForm] = useState({
    parcelId: selectedParcel ?? '', propertyType: 'residential', yearBuilt: '2000',
    squareFeet: '1800', revalArea: '', quality: 'Average', condition: 'GOOD',
  });

  useEffect(() => { reset(); setForm(current => ({ ...current, parcelId: selectedParcel ?? '' })); }, [selectedParcel, taxYear, scope.countyId, reset]);
  const change = (field: keyof typeof form, value: string) => { reset(); setForm(current => ({ ...current, [field]: value })); };

  const run = async () => {
    if (!scope.countyId || !scope.isolated) return;
    const input: CostForgeCalcInput = {
      lrsn: null, pin: form.parcelId, county_id: scope.countyId, imprv_det_type_cd: null,
      yr_built: amount(form.yearBuilt), area_sqft: amount(form.squareFeet), condition_code: form.condition,
      construction_class_raw: null, use_code: null, section_id: null, occupancy_code: null,
      is_residential: form.propertyType === 'residential', revalArea: form.revalArea,
    };
    await calculate(input, form.quality as QualityGrade, undefined, undefined, scope.headers);
  };

  if (!scope.isolated) return <div className="cf-state cf-state--error">County scope required to load Parcel Inspector.</div>;
  if (!supportsCertifiedCostScheduleLane(scope.countyId))
    return <div className="cf-state cf-state--error" data-testid="cost-parcel-unavailable">Parcel Inspector references are unavailable for the active county.</div>;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>Parcel Inspector — RCNLD</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Calculate with the canonical Forge runtime using the selected county cost references. No value is saved.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([['parcelId', 'Parcel ID'], ['yearBuilt', 'Year Built'], ['squareFeet', 'Area (Sq Ft)'], ['revalArea', 'Reval Area / Cycle']] as const).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`canonical-cost-${field}`}>{label}</Label>
                <Input id={`canonical-cost-${field}`} value={form[field]} onChange={e => change(field, e.target.value)}
                  type={field === 'yearBuilt' || field === 'squareFeet' ? 'number' : 'text'}
                  placeholder={field === 'revalArea' ? 'Explicit cycle, e.g. Reval 1' : undefined} />
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="canonical-cost-type">Property Type</Label>
              <select id="canonical-cost-type" className="w-full rounded border bg-background p-2" value={form.propertyType} onChange={e => change('propertyType', e.target.value)}>
                <option value="residential">Residential</option><option value="commercial">Commercial</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="canonical-cost-quality">Quality Grade</Label>
              <select id="canonical-cost-quality" className="w-full rounded border bg-background p-2" value={form.quality} onChange={e => change('quality', e.target.value)}>
                {['Low', 'Fair', 'Average', 'Good', 'Excellent'].map(value => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="canonical-cost-condition">Condition</Label>
              <select id="canonical-cost-condition" className="w-full rounded border bg-background p-2" value={form.condition} onChange={e => change('condition', e.target.value)}>
                {['POOR', 'FAIR', 'AVERAGE', 'GOOD', 'EXCELLENT'].map(value => <option key={value}>{value}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void run()} disabled={isLoading}>{isLoading ? 'Calculating...' : 'Run RCNLD'}</Button>
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {errorCorrelationId && <p className="text-xs break-all">Trace: {errorCorrelationId}</p>}
        </CardContent>
      </Card>
      {result?.canonical && result.provenance && (
        <Card>
          <CardHeader><CardTitle>Canonical Cost Result</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <dl className="grid gap-3 sm:grid-cols-2">
              {([['Replacement cost', result.canonical.replacementCost], ['Physical depreciation', result.canonical.physicalDepreciation],
                ['Condition adjustment', result.canonical.conditionAdjustment], ['RCNLD', result.canonical.rcnld],
                ['Land value', result.canonical.landValue], ['Total indicated value', result.canonical.totalValue]] as const).map(([label, value]) => (
                <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-semibold">{value.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</dd></div>
              ))}
            </dl>
            <p className="text-xs break-all">Canonical source: {result.provenance.sourceCommit}</p>
            <p className="text-xs break-all">Artifact SHA-256: {result.provenance.executableSha256}</p>
            <p className="text-xs">Parcel: {result.provenance.parcelId} · Trace: {result.provenance.requestId}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
