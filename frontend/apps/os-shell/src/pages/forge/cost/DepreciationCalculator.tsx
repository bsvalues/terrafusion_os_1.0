/**
 * DepreciationCalculator — Depreciation Lab
 *
 * PRIMARY: Benton County Method — market-calibrated % Good bracket tables
 *   Physical % Good comes from Benton County's age×type lookup table,
 *   derived from ratio studies, NOT from a theoretical formula.
 *
 * COMPARISON: IAAO Age/Life (straight-line effectiveAge/economicLife)
 *   Shown side-by-side so the appraiser can see the delta. The Benton
 *   Method gives a more accurate result for this market because it is
 *   calibrated to actual sales, not a universal formula.
 *
 * Bracket tables mirror BentonCostData.ResidentialDepreciation /
 * CommercialDepreciation in CostForgeController.cs (single source of truth
 * in backend; these are kept in sync).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetchJson } from '@/lib/apiBase';

// ── Benton County bracket tables (mirrors CostForgeController.cs BentonCostData) ──
// Source: Benton County Assessor cost manual, calibrated from ratio studies.
// Factor = % Good (e.g., 0.87 = 87% good = 13% physical depreciation)
const RESIDENTIAL_BRACKETS = [
  { minAge: 0,  maxAge: 5,   pctGood: 0.95, label: '0–5 yrs'  },
  { minAge: 6,  maxAge: 15,  pctGood: 0.87, label: '6–15 yrs' },
  { minAge: 16, maxAge: 25,  pctGood: 0.70, label: '16–25 yrs'},
  { minAge: 26, maxAge: 40,  pctGood: 0.50, label: '26–40 yrs'},
  { minAge: 41, maxAge: 999, pctGood: 0.35, label: '41+ yrs'  },
] as const;

const COMMERCIAL_BRACKETS = [
  { minAge: 0,  maxAge: 5,   pctGood: 0.97, label: '0–5 yrs'  },
  { minAge: 6,  maxAge: 15,  pctGood: 0.85, label: '6–15 yrs' },
  { minAge: 16, maxAge: 25,  pctGood: 0.65, label: '16–25 yrs'},
  { minAge: 26, maxAge: 35,  pctGood: 0.40, label: '26–35 yrs'},
  { minAge: 36, maxAge: 999, pctGood: 0.25, label: '36+ yrs'  },
] as const;

function bentonPctGood(effectiveAge: number, isResidential: boolean): number {
  const brackets = isResidential ? RESIDENTIAL_BRACKETS : COMMERCIAL_BRACKETS;
  const match = brackets.find((b) => effectiveAge >= b.minAge && effectiveAge <= b.maxAge);
  return match?.pctGood ?? brackets[brackets.length - 1].pctGood;
}

function iaaoAgLifePctGood(effectiveAge: number, economicLife: number): number {
  if (economicLife <= 0) return 1;
  const pctDep = Math.min(effectiveAge / economicLife, 1);
  return 1 - pctDep;
}

interface IaaoResult {
  physicalDepreciation: number;
  functionalObsolescence: number;
  externalObsolescence: number;
  totalDepreciation: number;
  depreciatedValue: number;
}

function Row({ label, value, bold, accent }: {
  label: string; value: string; bold?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex justify-between py-1 border-b border-border/30 last:border-0">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground text-sm'}>{label}</span>
      <span className={[
        bold ? 'font-semibold' : 'text-sm',
        accent ? 'text-[var(--cf-accent)]' : '',
      ].join(' ')}>{value}</span>
    </div>
  );
}

// Response shape from POST /costforge/effective-age
interface EffectiveAgeApiResult {
  effectiveAge: number;
  conditionAdjustment: number;
  method: string;
}

export function DepreciationCalculator() {
  const [effectiveAge, setEffectiveAge] = useState('');
  const [propType, setPropType]         = useState<'residential' | 'commercial'>('residential');
  const [rcn, setRcn]                   = useState('');
  const [funcObs, setFuncObs]           = useState('');
  const [extObs, setExtObs]             = useState('');

  // IAAO comparison state
  const [iaaoResult, setIaaoResult]     = useState<IaaoResult | null>(null);
  const [iaaoLoading, setIaaoLoading]   = useState(false);
  const [iaaoError, setIaaoError]       = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  // ── Condition-grade effective-age derivation (POST /costforge/effective-age) ──
  const [actualAgeStr, setActualAgeStr]         = useState('');
  const [condGrade, setCondGrade]               = useState<string>('GOOD');
  const [effAgeFromApi, setEffAgeFromApi]       = useState<EffectiveAgeApiResult | null>(null);
  const [effAgeApiLoading, setEffAgeApiLoading] = useState(false);
  const [effAgeApiError, setEffAgeApiError]     = useState<string | null>(null);
  const effAgeCtrl = useRef<AbortController | null>(null);

  // Auto-derive effective age whenever actualAge or conditionGrade changes (400ms debounce)
  useEffect(() => {
    const actualAgeNum = parseInt(actualAgeStr, 10);
    if (!actualAgeStr || isNaN(actualAgeNum) || actualAgeNum < 0) {
      setEffAgeFromApi(null);
      return;
    }

    const timer = setTimeout(() => {
      effAgeCtrl.current?.abort();
      effAgeCtrl.current = new AbortController();
      setEffAgeApiLoading(true);
      setEffAgeApiError(null);

      apiFetchJson<EffectiveAgeApiResult>(
        '/costforge/effective-age',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actualAge: actualAgeNum, conditionGrade: condGrade }),
          signal: effAgeCtrl.current.signal,
        }
      )
        .then((data) => { setEffAgeFromApi(data); })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setEffAgeApiError(err instanceof Error ? err.message : 'Effective age call failed');
        })
        .finally(() => { setEffAgeApiLoading(false); });
    }, 400);

    return () => {
      clearTimeout(timer);
      effAgeCtrl.current?.abort();
    };
  }, [actualAgeStr, condGrade]);

  const effAge  = parseInt(effectiveAge, 10) || 0;
  const rcnVal  = parseFloat(rcn) || 0;
  const funcVal = parseFloat(funcObs) || 0;
  const extVal  = parseFloat(extObs) || 0;
  const isRes   = propType === 'residential';
  const economicLife = isRes ? 40 : 35;

  // ── Benton Method (client-side, instant) ──
  const bentonResult = useMemo(() => {
    if (effAge <= 0 || rcnVal <= 0) return null;
    const pctGood       = bentonPctGood(effAge, isRes);
    const physicalDepAmt = rcnVal * (1 - pctGood);
    const rcnld         = Math.max(0, rcnVal - physicalDepAmt - funcVal - extVal);
    const totalDepAmt   = physicalDepAmt + funcVal + extVal;
    return {
      pctGood,
      physicalDepPct: (1 - pctGood) * 100,
      physicalDepAmt,
      funcObsPct: rcnVal > 0 ? (funcVal / rcnVal) * 100 : 0,
      extObsPct: rcnVal > 0 ? (extVal / rcnVal) * 100 : 0,
      totalDepPct: rcnVal > 0 ? (totalDepAmt / rcnVal) * 100 : 0,
      rcnld,
    };
  }, [effAge, isRes, rcnVal, funcVal, extVal]);

  // ── IAAO Age/Life (client-side instant preview, no network needed) ──
  const iaaoPreview = useMemo(() => {
    if (effAge <= 0 || rcnVal <= 0) return null;
    const pctGood        = iaaoAgLifePctGood(effAge, economicLife);
    const physicalDepAmt = rcnVal * (1 - pctGood);
    const rcnld          = Math.max(0, rcnVal - physicalDepAmt - funcVal - extVal);
    const totalDepAmt    = physicalDepAmt + funcVal + extVal;
    return {
      pctGood,
      physicalDepPct: (1 - pctGood) * 100,
      rcnld,
      totalDepPct: rcnVal > 0 ? (totalDepAmt / rcnVal) * 100 : 0,
    };
  }, [effAge, economicLife, rcnVal, funcVal, extVal]);

  // Optional: also call backend for IAAO validation
  const runIaaoBackend = async () => {
    if (effAge <= 0 || rcnVal <= 0) return;
    ctrlRef.current?.abort();
    ctrlRef.current = new AbortController();
    setIaaoLoading(true);
    setIaaoError(null);
    try {
      const data = await apiFetchJson<IaaoResult>(
        '/costforge/depreciation-calculate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actualAge: effAge,
            effectiveAge: effAge,
            condition: 'average',
            quality: 'average',
            replacementCostNew: rcnVal,
            functionalObsolescence: funcVal,
            externalObsolescence: extVal,
          }),
          signal: ctrlRef.current.signal,
        }
      );
      setIaaoResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setIaaoError(err instanceof Error ? err.message : 'IAAO backend call failed');
    } finally {
      setIaaoLoading(false);
    }
  };

  const canCompute = effAge > 0 && rcnVal > 0;

  // delta: positive = Benton gives MORE value (less depreciation) than IAAO
  const rcnldDelta = bentonResult && iaaoPreview
    ? bentonResult.rcnld - iaaoPreview.rcnld
    : null;

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Depreciation Lab</h1>
          <p className="text-muted-foreground text-sm">
            Benton County market-calibrated % Good tables vs. IAAO Age/Life comparison
          </p>
        </div>
        <div className="flex gap-2 shrink-0 items-start pt-1">
          <Badge
            style={{ background: 'hsl(28 30% 10%)', color: 'var(--cf-accent)', border: '1px solid hsl(28 50% 22%)' }}
            title="Benton County bracket table — calibrated from ratio studies"
          >
            Benton Method ★ Primary
          </Badge>
          <Badge variant="outline" title="Shown for comparison only — not Benton County methodology">
            IAAO Age/Life (comparison)
          </Badge>
        </div>
      </div>

      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="effAge" className="text-xs">Effective Age (yrs)</Label>
              <Input
                id="effAge"
                type="number"
                value={effectiveAge}
                onChange={(e) => { setEffectiveAge(e.target.value); setIaaoResult(null); }}
                placeholder="e.g. 20"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Property Type</Label>
              <Select value={propType} onValueChange={(v: 'residential' | 'commercial') => {
                setPropType(v); setIaaoResult(null);
              }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential (40-yr life)</SelectItem>
                  <SelectItem value="commercial">Commercial (35-yr life)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rcnInput" className="text-xs">RCN ($)</Label>
              <Input
                id="rcnInput"
                type="number"
                value={rcn}
                onChange={(e) => { setRcn(e.target.value); setIaaoResult(null); }}
                placeholder="e.g. 350000"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Economic Life</Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-border/40 bg-muted/30 text-sm tabular-nums text-muted-foreground">
                {economicLife} years
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="funcObs" className="text-xs">
                Functional Obs. ($) <span className="text-muted-foreground">optional</span>
              </Label>
              <Input
                id="funcObs"
                type="number"
                value={funcObs}
                onChange={(e) => { setFuncObs(e.target.value); setIaaoResult(null); }}
                placeholder="e.g. 15000"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="extObs" className="text-xs">
                External Obs. ($) <span className="text-muted-foreground">optional</span>
              </Label>
              <Input
                id="extObs"
                type="number"
                value={extObs}
                onChange={(e) => { setExtObs(e.target.value); setIaaoResult(null); }}
                placeholder="e.g. 5000"
                className="h-9"
              />
            </div>
          </div>

          {/* ── Condition-grade effective-age derivation ── */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Derive effective age from condition{' '}
              <span className="text-xs font-normal opacity-70">
                · POST /costforge/effective-age · Benton WAC-aligned table
              </span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="actualAge" className="text-xs">Actual Age (yrs)</Label>
                <Input
                  id="actualAge"
                  type="number"
                  value={actualAgeStr}
                  onChange={(e) => setActualAgeStr(e.target.value)}
                  placeholder="e.g. 22"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Condition Grade</Label>
                <Select value={condGrade} onValueChange={setCondGrade}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent (−3 yrs)</SelectItem>
                    <SelectItem value="GOOD">Good (±0 yrs)</SelectItem>
                    <SelectItem value="FAIR">Fair (+2 yrs)</SelectItem>
                    <SelectItem value="POOR">Poor (+5 yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Result + Apply */}
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Derived Effective Age</Label>
                {effAgeApiLoading && (
                  <div className="h-9 flex items-center px-3 rounded-md border border-border/40 bg-muted/30 text-xs text-muted-foreground">
                    Computing…
                  </div>
                )}
                {!effAgeApiLoading && effAgeApiError && (
                  <div className="h-9 flex items-center px-3 rounded-md border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                    {effAgeApiError}
                  </div>
                )}
                {!effAgeApiLoading && !effAgeApiError && effAgeFromApi && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-9 flex items-center px-3 rounded-md border border-border/40 bg-muted/30 text-sm font-semibold tabular-nums">
                      {effAgeFromApi.effectiveAge} yrs
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({effAgeFromApi.conditionAdjustment >= 0 ? '+' : ''}{effAgeFromApi.conditionAdjustment} from condition)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 text-xs shrink-0"
                      onClick={() => {
                        setEffectiveAge(String(effAgeFromApi.effectiveAge));
                        setIaaoResult(null);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {!effAgeApiLoading && !effAgeApiError && !effAgeFromApi && (
                  <div className="h-9 flex items-center px-3 rounded-md border border-border/20 text-xs text-muted-foreground/50">
                    Enter actual age above
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results grid */}
      {canCompute && bentonResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── PRIMARY: Benton Method ── */}
          <div style={{
            padding: 16,
            background: 'hsl(28 30% 10%)',
            border: '1px solid hsl(28 50% 22%)',
            borderRadius: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cf-accent)', marginBottom: 2 }}>
                  Benton Method — Primary
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cf-muted)' }}>
                  Market-calibrated % Good bracket table · {isRes ? 'Residential' : 'Commercial'}
                </div>
              </div>
            </div>

            {/* Bracket indicator */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', marginBottom: 4 }}>
                Age bracket applied
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(isRes ? RESIDENTIAL_BRACKETS : COMMERCIAL_BRACKETS).map((b) => {
                  const active = effAge >= b.minAge && effAge <= b.maxAge;
                  return (
                    <span key={b.label} style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: active ? 700 : 400,
                      background: active ? 'hsl(28 30% 10%)' : 'var(--cf-surface)',
                      color: active ? 'var(--cf-accent)' : 'var(--cf-subtle)',
                      border: `1px solid ${active ? 'hsl(28 50% 22%)' : 'var(--cf-border)'}`,
                    }}>
                      {b.label}: {Math.round(b.pctGood * 100)}%
                    </span>
                  );
                })}
              </div>
            </div>

            <Row label="% Good (bracket table)"
              value={`${(bentonResult.pctGood * 100).toFixed(0)}%`} bold accent />
            <Row label="Physical depreciation"
              value={`${bentonResult.physicalDepPct.toFixed(1)}% · $${Math.round(bentonResult.physicalDepAmt).toLocaleString()}`} />
            {funcVal > 0 && (
              <Row label="Functional obsolescence"
                value={`${bentonResult.funcObsPct.toFixed(1)}% · $${Math.round(funcVal).toLocaleString()}`} />
            )}
            {extVal > 0 && (
              <Row label="External obsolescence"
                value={`${bentonResult.extObsPct.toFixed(1)}% · $${Math.round(extVal).toLocaleString()}`} />
            )}
            <Row label="Total depreciation"
              value={`${bentonResult.totalDepPct.toFixed(1)}%`} bold />

            {/* Waterfall bar */}
            <div style={{ margin: '12px 0 4px' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', marginBottom: 4 }}>Depreciation waterfall</div>
              <div className="cf-deprec-bar">
                <div className="cf-deprec-bar__physical"
                  title={`Physical: ${bentonResult.physicalDepPct.toFixed(1)}%`}
                  style={{ width: `${Math.min(bentonResult.physicalDepPct, 100)}%` }} />
                {funcVal > 0 && (
                  <div className="cf-deprec-bar__functional"
                    title={`Functional: ${bentonResult.funcObsPct.toFixed(1)}%`}
                    style={{ width: `${Math.min(bentonResult.funcObsPct, 100)}%` }} />
                )}
                {extVal > 0 && (
                  <div className="cf-deprec-bar__external"
                    title={`External: ${bentonResult.extObsPct.toFixed(1)}%`}
                    style={{ width: `${Math.min(bentonResult.extObsPct, 100)}%` }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', marginTop: 4 }}>
                <span style={{ color: 'var(--cf-warn)' }}>■ Physical</span>
                {funcVal > 0 && <span style={{ color: 'var(--cf-accent)' }}>■ Functional</span>}
                {extVal > 0 && <span style={{ color: 'var(--cf-danger)' }}>■ External</span>}
              </div>
            </div>

            <div style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'hsl(28 30% 10%)',
              border: '1px solid hsl(28 50% 22%)',
              borderRadius: 6,
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--cf-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                RCNLD — Benton Method
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cf-accent)', fontVariantNumeric: 'tabular-nums' }}>
                ${Math.round(bentonResult.rcnld).toLocaleString()}
              </div>
            </div>
          </div>

          {/* ── COMPARISON: IAAO Age/Life ── */}
          <div style={{
            padding: 16,
            background: 'var(--cf-surface)',
            border: '1px solid var(--cf-border)',
            borderRadius: 8,
            opacity: 0.9,
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cf-muted)', marginBottom: 2 }}>
                IAAO Age/Life — Comparison Only
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cf-subtle)' }}>
                Straight-line: Eff. Age ÷ {economicLife}-yr economic life
                · Not Benton County methodology
              </div>
            </div>

            <Row label="% Good (Age/Life formula)"
              value={iaaoPreview ? `${(iaaoPreview.pctGood * 100).toFixed(1)}%` : '—'} bold />
            <Row label="Physical depreciation"
              value={iaaoPreview
                ? `${iaaoPreview.physicalDepPct.toFixed(1)}% · $${Math.round(rcnVal * (1 - iaaoPreview.pctGood)).toLocaleString()}`
                : '—'} />
            {funcVal > 0 && (
              <Row label="Functional obsolescence"
                value={`$${Math.round(funcVal).toLocaleString()}`} />
            )}
            {extVal > 0 && (
              <Row label="External obsolescence"
                value={`$${Math.round(extVal).toLocaleString()}`} />
            )}
            <Row label="Total depreciation"
              value={iaaoPreview ? `${iaaoPreview.totalDepPct.toFixed(1)}%` : '—'} bold />

            {iaaoPreview && (
              <div style={{
                marginTop: 12,
                padding: '10px 12px',
                background: 'hsl(222 16% 14%)',
                border: '1px solid var(--cf-border)',
                borderRadius: 6,
              }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  RCNLD — IAAO Age/Life
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cf-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  ${Math.round(iaaoPreview.rcnld).toLocaleString()}
                </div>
              </div>
            )}

            {/* Optional backend validation */}
            <div style={{ marginTop: 12 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void runIaaoBackend()}
                disabled={iaaoLoading}
                className="w-full text-xs"
              >
                {iaaoLoading ? 'Calling backend…' : 'Validate via IAAO backend endpoint'}
              </Button>
              {iaaoError && <p className="text-xs text-destructive mt-1">{iaaoError}</p>}
              {iaaoResult && (
                <p className="text-xs text-muted-foreground mt-1">
                  Backend confirmed: ${Math.round(iaaoResult.depreciatedValue).toLocaleString()} depreciated value
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Comparison delta callout ── */}
      {rcnldDelta !== null && Math.abs(rcnldDelta) > 0 && (
        <div className="cf-ai-callout">
          <div className="cf-ai-callout__label">Method Comparison</div>
          The Benton Method gives{' '}
          <strong style={{ color: rcnldDelta > 0 ? 'var(--cf-success)' : 'var(--cf-warn)' }}>
            ${Math.abs(Math.round(rcnldDelta)).toLocaleString()} {rcnldDelta > 0 ? 'more' : 'less'}
          </strong>{' '}
          value than the IAAO Age/Life formula for this structure
          ({rcnldDelta > 0
            ? 'Benton bracket tables reflect better-than-formula market retention'
            : 'market data indicates faster-than-formula depreciation in this cohort'
          }).
          {' '}Benton County uses the bracket table method. IAAO Age/Life is shown for reference only.
        </div>
      )}

      {/* Empty state */}
      {!canCompute && (
        <div className="cf-state">
          Enter an effective age, property type, and RCN above to compute depreciation.
        </div>
      )}
    </div>
  );
}
