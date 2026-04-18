// TerraFusion OS — CostApproach Runner (RCNLD / Parcel Inspector)
// Mined from terra-forge-rebuild src/components/costforge/CostApproachRunner.tsx
// REST-adapted: calls POST /api/costforge/calculate via useCostForgeHooks

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalcRCNLD, useImprvTypeCodes, type CostForgeCalcInput, type QualityGrade, type CostForgeSecondaryFeature } from "@/hooks/useCostForgeHooks";
import { apiFetchJson } from "@/lib/apiBase";
import { Calculator, RefreshCw } from "lucide-react";
import { useCostForgeWorkspaceStore } from "./costForgeWorkspaceStore";

// SecondaryFeature row shape from GET /costforge/schedule (matrixType = "SecondaryFeature")
interface SfRate {
  code: string;
  description: string;
  pctOfBiv: number; // e.g. 0.03 = 3%
}

interface CostScheduleApiRow {
  buildingType?: string;
  description?: string;
  matrixType?: string;
  secondaryFeaturePctOfBiv?: number;
}

/** Valuation record returned by GET /costforge/parcels/{parcelId}/valuations */
interface ValuationRecord {
  id: string;
  parcelId: string;
  taxYear: number;
  status: 'draft' | 'reviewed' | 'sealed';
  finalReconciledValue: number | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

const BENTON_COUNTY_ID =
  (import.meta.env as Record<string, string>).VITE_BENTON_COUNTY_ID ??
  "19190019-1919-1919-1919-191919191919";

interface FormState {
  parcelId: string;
  prop_type: "R" | "C";
  year_built: string;
  area: string;
  quality: string;
  extWall: string;
  sectionClass: string;
  effLife: string;
  imprvTypeCode: string;
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function CostApproachRunner() {
  const { result, isLoading, error, calculate, reset } = useCalcRCNLD();
  const { data: imprvTypeCodes = [] } = useImprvTypeCodes(BENTON_COUNTY_ID);

  const selectedParcelId  = useCostForgeWorkspaceStore((s) => s.selectedParcelId);
  const setSelectedParcel = useCostForgeWorkspaceStore((s) => s.setSelectedParcel);
  const taxYear           = useCostForgeWorkspaceStore((s) => s.taxYear);

  // Tax roll certification — GET /costforge/parcels/{parcelId}/valuations
  const [valuations, setValuations]         = useState<ValuationRecord[]>([]);
  const [valuationsLoading, setValuationsLoading] = useState(false);
  const [statusPending, setStatusPending]   = useState<Record<string, boolean>>({});
  const [certifyPending, setCertifyPending] = useState<Record<string, boolean>>({});
  const [certifyDone, setCertifyDone]       = useState<Record<string, boolean>>({});
  const [certifyError, setCertifyError]     = useState<Record<string, string>>({});
  const valuationsAbortRef = useRef<AbortController | null>(null);

  // Fetch secondary-feature rates once on mount from /costforge/schedule
  const [sfRates, setSfRates] = useState<SfRate[]>([]);
  const sfAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    sfAbortRef.current = new AbortController();
    apiFetchJson<CostScheduleApiRow[]>('/costforge/schedule', { signal: sfAbortRef.current.signal })
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setSfRates(
          rows
            .filter((r) => r.matrixType === 'SecondaryFeature' && r.secondaryFeaturePctOfBiv != null)
            .map((r) => ({
              code: r.buildingType ?? '—',
              description: r.description ?? r.buildingType ?? '—',
              pctOfBiv: Number(r.secondaryFeaturePctOfBiv),
            }))
        );
      })
      .catch(() => { /* non-fatal: rates panel stays hidden */ });
    return () => { sfAbortRef.current?.abort(); };
  }, []);

  const [form, setForm] = useState<FormState>({
    parcelId: "",
    prop_type: "R",
    year_built: "2000",
    area: "1800",
    quality: "Average",
    extWall: "1",
    sectionClass: "A",
    effLife: "60",
    imprvTypeCode: "",
  });

  // Pre-populate parcel ID from workspace store when navigated via drill-in
  useEffect(() => {
    if (selectedParcelId && !form.parcelId) {
      setForm((p) => ({ ...p, parcelId: selectedParcelId }));
    }
  }, [selectedParcelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch existing valuation records for the current parcel when a result is available
  useEffect(() => {
    if (!form.parcelId || !result) { setValuations([]); return; }
    valuationsAbortRef.current?.abort();
    valuationsAbortRef.current = new AbortController();
    setValuationsLoading(true);
    apiFetchJson<ValuationRecord[]>(
      `/costforge/parcels/${encodeURIComponent(form.parcelId)}/valuations?taxYear=${taxYear}`,
      { signal: valuationsAbortRef.current.signal }
    )
      .then((recs) => { setValuations(Array.isArray(recs) ? recs : []); setValuationsLoading(false); })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setValuations([]);
        setValuationsLoading(false);
      });
    return () => { valuationsAbortRef.current?.abort(); };
  }, [form.parcelId, result, taxYear]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Advance a draft valuation to "reviewed" so it can be certified. */
  const advanceToReviewed = async (id: string) => {
    setStatusPending((p) => ({ ...p, [id]: true }));
    try {
      await apiFetchJson<unknown>(`/costforge/valuations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewed' }),
      });
      setValuations((prev) => prev.map((v) => v.id === id ? { ...v, status: 'reviewed', reviewedAt: new Date().toISOString() } : v));
    } catch (err) {
      setCertifyError((p) => ({ ...p, [id]: err instanceof Error ? err.message : 'Status update failed' }));
    } finally {
      setStatusPending((p) => ({ ...p, [id]: false }));
    }
  };

  /** Certify a reviewed valuation — promotes to PropertyAssessment on the tax roll. */
  const certifyValuation = async (id: string) => {
    setCertifyPending((p) => ({ ...p, [id]: true }));
    setCertifyError((p) => ({ ...p, [id]: '' }));
    try {
      await apiFetchJson<unknown>(`/costforge/valuations/${id}/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: null }),
      });
      setCertifyDone((p) => ({ ...p, [id]: true }));
      setValuations((prev) => prev.map((v) => v.id === id ? { ...v, status: 'sealed' } : v));
    } catch (err) {
      setCertifyError((p) => ({ ...p, [id]: err instanceof Error ? err.message : 'Certify failed' }));
    } finally {
      setCertifyPending((p) => ({ ...p, [id]: false }));
    }
  };

  const yearNow = new Date().getFullYear();
  const derivedAge = Math.max(0, yearNow - toNum(form.year_built));

  const run = async () => {
    const input: CostForgeCalcInput = {
      lrsn: null,
      pin: form.parcelId || null,
      county_id: BENTON_COUNTY_ID,
      imprv_det_type_cd: form.imprvTypeCode || null,
      yr_built: toNum(form.year_built),
      area_sqft: toNum(form.area),
      condition_code: null,
      construction_class_raw: form.prop_type === "C" ? form.sectionClass || null : null,
      use_code: null,
      section_id: null,
      occupancy_code: null,
      is_residential: form.prop_type === "R",
    };
    await calculate(
      input,
      (form.quality as QualityGrade) || undefined,
      form.prop_type === "R" ? form.extWall || undefined : undefined,
      form.effLife ? toNum(form.effLife) : undefined
    );
    // Sync parcel ID to workspace store so CalcTrace can follow
    if (form.parcelId) {
      setSelectedParcel(form.parcelId);
    }
  };

  const canRun = useMemo(() => {
    return toNum(form.area) > 0 && toNum(form.year_built) > 0;
  }, [form.area, form.year_built]);

  // BIV = sqft × base cost/sqft
  const bivTotal =
    result?.baseUnitCost != null && result.baseUnitCost > 0
      ? toNum(form.area) * result.baseUnitCost
      : null;

  return (
    <div className="p-6 space-y-6">
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Parcel Inspector — RCNLD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Optional parcel ID */}
          <div className="space-y-1">
            <Label className="text-xs">Parcel ID (optional — syncs to Calc Trace)</Label>
            <Input
              className="h-9 text-sm font-mono"
              value={form.parcelId}
              onChange={(e) => setForm((p) => ({ ...p, parcelId: e.target.value }))}
              placeholder="e.g. 123456789"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Property Type</Label>
              <Select
                value={form.prop_type}
                onValueChange={(v: "R" | "C") => setForm((p) => ({ ...p, prop_type: v }))}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="R">Residential</SelectItem>
                  <SelectItem value="C">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Year Built</Label>
              <Input
                className="h-9 text-sm"
                value={form.year_built}
                onChange={(e) => setForm((p) => ({ ...p, year_built: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Area (Sq Ft)</Label>
              <Input
                className="h-9 text-sm"
                value={form.area}
                onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Quality Grade</Label>
              <Select
                value={form.quality}
                onValueChange={(v) => setForm((p) => ({ ...p, quality: v }))}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Fair", "Average", "Good", "Excellent"].map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.prop_type === "R" && (
              <div className="space-y-1">
                <Label className="text-xs">Exterior Wall Code</Label>
                <Input
                  className="h-9 text-sm"
                  value={form.extWall}
                  onChange={(e) => setForm((p) => ({ ...p, extWall: e.target.value }))}
                />
              </div>
            )}

            {form.prop_type === "C" && (
              <div className="space-y-1">
                <Label className="text-xs">Section / Class</Label>
                <Input
                  className="h-9 text-sm"
                  value={form.sectionClass}
                  onChange={(e) => setForm((p) => ({ ...p, sectionClass: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Effective Life</Label>
              <Input
                className="h-9 text-sm"
                value={form.effLife}
                onChange={(e) => setForm((p) => ({ ...p, effLife: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Improvement Type Code</Label>
              <Select
                value={form.imprvTypeCode || "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, imprvTypeCode: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {imprvTypeCodes.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.description} ({item.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => void run()} disabled={isLoading || !canRun} className="h-9">
              {isLoading ? "Calculating..." : "Run RCNLD"}
            </Button>
            <Button variant="outline" onClick={reset} className="h-9 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <div className="text-xs text-muted-foreground ml-auto">Derived age: {derivedAge} years</div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* RCNLD result cards */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">RCNLD Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Base Unit Cost</div>
                  <div className="font-medium tabular-nums">{result.baseUnitCost?.toFixed(2) ?? "—"}</div>
                </div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Local Multiplier</div>
                  <div className="font-medium tabular-nums">{result.localMultiplier?.toFixed(4) ?? "—"}</div>
                </div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Current Cost Mult</div>
                  <div className="font-medium tabular-nums">{result.currentCostMult?.toFixed(4) ?? "—"}</div>
                </div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">RCN</div>
                  <div className="font-medium tabular-nums">
                    {result.rcn?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"}
                  </div>
                </div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Age / Eff Life</div>
                  <div className="font-medium tabular-nums">
                    {result.ageYears ?? "—"} / {result.effectiveLifeYears ?? "—"}
                  </div>
                </div>
                <div className="rounded-md border border-border/40 p-3">
                  <div className="text-xs text-muted-foreground">Pct Good</div>
                  <div className="font-medium tabular-nums">{result.pctGood?.toFixed(4) ?? "—"}</div>
                </div>
                <div className="rounded-md border border-primary/40 p-3 bg-primary/5 col-span-2">
                  <div className="text-xs text-muted-foreground">RCNLD</div>
                  <div className="font-semibold text-base tabular-nums">
                    {result.rcnld?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BIV section — Benton Method */}
          <div className="cf-biv-section">
            <div className="cf-biv-section__heading">BIV Calculation — Benton Method</div>

            <div className="cf-biv-row">
              <span className="cf-biv-row__label">Main living area</span>
              <span className="cf-biv-row__value">{toNum(form.area).toLocaleString()} sf</span>
            </div>
            <div className="cf-biv-row">
              <span className="cf-biv-row__label">× Base cost/sf</span>
              <span className="cf-biv-row__value">
                {result.baseUnitCost != null ? "$" + result.baseUnitCost.toFixed(2) + "/sf" : "—"}
              </span>
            </div>
            <div className="cf-biv-row cf-biv-total">
              <span className="cf-biv-row__label">= BIV</span>
              <span className="cf-biv-row__value">
                {bivTotal != null ? "$" + Math.round(bivTotal).toLocaleString() : "—"}
              </span>
            </div>

            {/* Secondary features as %-of-BIV */}
            {result.secondaryFeatures && result.secondaryFeatures.length > 0 && (
              <>
                <div className="cf-biv-section__heading" style={{ marginTop: 10 }}>
                  Secondary Features (%-of-BIV)
                </div>
                {result.secondaryFeatures.map((feat: CostForgeSecondaryFeature) => (
                  <div key={feat.code} className="cf-biv-row">
                    <span className="cf-biv-row__label">{feat.description}</span>
                    <span className="cf-biv-row__value">
                      ${feat.value.toLocaleString()}
                      {bivTotal != null && bivTotal > 0 && (
                        <span className="cf-biv-row__pct">
                          {((feat.value / bivTotal) * 100).toFixed(1)}%
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Depreciation waterfall */}
            <div className="cf-biv-section__heading" style={{ marginTop: 10 }}>
              Depreciation (% good)
            </div>
            <div className="cf-deprec-bar">
              <div
                className="cf-deprec-bar__physical"
                style={{
                  width: `${result.pctGood != null ? Math.max(0, 100 - result.pctGood * 100) : 0}%`,
                }}
                title={`Physical depreciation: ${result.pctGood != null ? (100 - result.pctGood * 100).toFixed(1) : "—"}%`}
              />
            </div>
            <div className="cf-biv-row cf-biv-total" style={{ marginTop: 6 }}>
              <span className="cf-biv-row__label">
                % good: {result.pctGood != null ? (result.pctGood * 100).toFixed(1) + "%" : "—"}
              </span>
              <span className="cf-biv-row__value">
                RCNLD: {result.rcnld != null ? "$" + Math.round(result.rcnld).toLocaleString() : "—"}
              </span>
            </div>
          </div>

          {/* Accessory Reference Rates — secondary features at current BIV */}
          {sfRates.length > 0 && bivTotal != null && bivTotal > 0 && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Accessory Reference Rates</CardTitle>
                  <Badge variant="outline" className="text-xs">%-of-BIV · Benton Method</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  At BIV of{' '}
                  <strong className="tabular-nums">${Math.round(bivTotal).toLocaleString()}</strong>,
                  each accessory type would contribute:
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-xs text-muted-foreground">
                      <th className="text-left py-2 px-4 font-medium">Feature</th>
                      <th className="text-right py-2 px-4 font-medium">Rate</th>
                      <th className="text-right py-2 px-4 font-medium">Value at BIV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sfRates.map((sf) => (
                      <tr key={sf.code} className="border-b border-border/20 last:border-0">
                        <td className="py-2 px-4">
                          <span className="font-mono text-xs text-muted-foreground mr-2">{sf.code}</span>
                          {sf.description}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums font-medium">
                          {(sf.pctOfBiv * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums font-semibold">
                          ${Math.round(bivTotal * sf.pctOfBiv).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Tax Roll Certification — POST /costforge/valuations/{id}/certify */}
          {form.parcelId && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Tax Roll Certification</CardTitle>
                  <Badge variant="outline" className="text-xs">POST /valuations/{'{id}'}/certify</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Promote a reviewed valuation to a PropertyAssessment on the {taxYear} tax roll.
                  Status progression: <span className="font-mono">draft → reviewed → sealed</span>
                </p>
              </CardHeader>
              <CardContent>
                {valuationsLoading && (
                  <p className="text-xs text-muted-foreground">Loading valuations…</p>
                )}
                {!valuationsLoading && valuations.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No valuation records found for parcel <span className="font-mono">{form.parcelId}</span> in {taxYear}.
                    Save a valuation record via the API or a future Save workflow to enable certification.
                  </p>
                )}
                {!valuationsLoading && valuations.length > 0 && (
                  <div className="space-y-3">
                    {valuations.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-md border border-border/40 p-3 text-sm"
                        style={{ background: v.status === 'sealed' ? 'hsl(142 20% 7%)' : undefined }}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs text-muted-foreground">{v.id.slice(0, 8)}…</div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: v.status === 'sealed' ? 'hsl(142 40% 12%)' : v.status === 'reviewed' ? 'hsl(210 50% 14%)' : 'hsl(222 16% 16%)',
                                  color: v.status === 'sealed' ? 'var(--cf-success)' : v.status === 'reviewed' ? 'hsl(210 80% 60%)' : 'var(--cf-muted)',
                                }}
                              >
                                {v.status}
                              </span>
                              {v.finalReconciledValue != null && (
                                <span className="tabular-nums font-medium">
                                  ${Math.round(v.finalReconciledValue).toLocaleString()} AV
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {(() => { try { return new Date(v.createdAt).toLocaleDateString(); } catch { return v.createdAt; } })()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Sealed — already on tax roll */}
                            {v.status === 'sealed' && (
                              <span className="text-xs font-bold" style={{ color: 'var(--cf-success)' }}>
                                ✓ Certified to Tax Roll
                              </span>
                            )}

                            {/* Draft → advance to reviewed */}
                            {v.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={!!statusPending[v.id]}
                                onClick={() => void advanceToReviewed(v.id)}
                              >
                                {statusPending[v.id] ? 'Advancing…' : 'Mark Reviewed'}
                              </Button>
                            )}

                            {/* Reviewed → certify */}
                            {v.status === 'reviewed' && !certifyDone[v.id] && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-green-700 hover:bg-green-600"
                                disabled={!!certifyPending[v.id]}
                                onClick={() => void certifyValuation(v.id)}
                              >
                                {certifyPending[v.id] ? 'Certifying…' : '⬆ Certify to Tax Roll'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {certifyError[v.id] && (
                          <p className="text-xs text-destructive mt-1">{certifyError[v.id]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
