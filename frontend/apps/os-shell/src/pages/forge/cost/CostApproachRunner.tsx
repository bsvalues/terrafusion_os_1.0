// TerraFusion OS — CostApproach Runner (RCNLD)
// Mined from terra-forge-rebuild src/components/costforge/CostApproachRunner.tsx
// REST-adapted: calls POST /api/costforge/calculate via useCostForgeHooks

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalcRCNLD, useImprvTypeCodes, type CostForgeCalcInput, type QualityGrade } from "@/hooks/useCostForgeHooks";
import { Calculator, RefreshCw } from "lucide-react";

const BENTON_COUNTY_ID = "842a6c54-c7c0-4b2d-aa43-0e3ba63fa57d";

interface FormState {
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

  const [form, setForm] = useState<FormState>({
    prop_type: "R",
    year_built: "2000",
    area: "1800",
    quality: "Average",
    extWall: "1",
    sectionClass: "A",
    effLife: "60",
    imprvTypeCode: "",
  });

  const yearNow = new Date().getFullYear();
  const derivedAge = Math.max(0, yearNow - toNum(form.year_built));

  const run = async () => {
    const input: CostForgeCalcInput = {
      lrsn: null,
      pin: null,
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
  };

  const canRun = useMemo(() => {
    return toNum(form.area) > 0 && toNum(form.year_built) > 0;
  }, [form.area, form.year_built]);

  return (
    <div className="p-6 space-y-6">
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Cost Approach Runner (RCNLD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label className="text-xs">Area (sqft)</Label>
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
                  {imprvTypeCodes.map((code) => (
                    <SelectItem key={String(code)} value={String(code)}>{String(code)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={run} disabled={isLoading || !canRun} className="h-9">
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
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">RCNLD Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">Base Unit Cost</div>
                <div className="font-medium tabular-nums">{result?.baseUnitCost?.toFixed(2) ?? "-"}</div>
              </div>
              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">Local Multiplier</div>
                <div className="font-medium tabular-nums">{result?.localMultiplier?.toFixed(4) ?? "-"}</div>
              </div>
              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">Current Cost Mult</div>
                <div className="font-medium tabular-nums">{result?.currentCostMult?.toFixed(4) ?? "-"}</div>
              </div>
              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">RCN</div>
                <div className="font-medium tabular-nums">{result?.rcn?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "-"}</div>
              </div>
              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">Age / Eff Life</div>
                <div className="font-medium tabular-nums">{result?.ageYears ?? "-"} / {result?.effectiveLifeYears ?? "-"}</div>
              </div>
              <div className="rounded-md border border-border/40 p-3">
                <div className="text-xs text-muted-foreground">Pct Good</div>
                <div className="font-medium tabular-nums">{result?.pctGood?.toFixed(4) ?? "-"}</div>
              </div>
              <div className="rounded-md border border-primary/40 p-3 bg-primary/5 col-span-2">
                <div className="text-xs text-muted-foreground">RCNLD</div>
                <div className="font-semibold text-base tabular-nums">{result?.rcnld?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
