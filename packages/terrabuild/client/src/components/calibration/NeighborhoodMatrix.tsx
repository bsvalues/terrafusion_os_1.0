/**
 * NeighborhoodMatrix.tsx
 *
 * Per-neighborhood IAAO ratio study for the CostForge Calibration Workbench.
 * Fetches live data from GET /api/costforge/calibration/neighborhood-matrix
 * (proxied by vite dev server to the .NET API at port 5000).
 *
 * Groups are sorted worst-COD-first so the appraiser sees what needs attention.
 * Mass-adjust preview calls POST /api/costforge/calibration/mass-adjust-preview.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NeighborhoodRow {
  hoodCd: string;
  revalArea: string;
  saleCount: number;
  medianRatio: number;
  cod: number;
  prd: number;
  p25: number;
  p75: number;
  ratioOk: boolean;
  codOk: boolean;
  iaaoCompliant: boolean;
}

interface MatrixResponse {
  neighborhoods: NeighborhoodRow[];
  totalSales: number;
  matchedSales: number;
  taxYear: number;
  hoodCount: number;
  outOfCompliance: number;
  source: "live" | "static";
}

interface AdjustPreview {
  parcelCount: number;
  matchedSales: number;
  totalAvBefore: number;
  totalAvAfter: number;
  totalAvDelta: number;
  medianRatioBefore: number;
  medianRatioAfter: number;
  ratioDelta: number;
  iaaoCompliantAfter: boolean;
}

// ── Mass Adjust Modal ─────────────────────────────────────────────────────────

function MassAdjustPanel({
  hood,
  taxYear,
  onClose,
}: {
  hood: NeighborhoodRow;
  taxYear: number;
  onClose: () => void;
}) {
  const [pct, setPct] = useState<number>(0);
  const [preview, setPreview] = useState<AdjustPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const suggested =
    hood.medianRatio > 0
      ? Math.round(((1.0 / hood.medianRatio) - 1) * 1000) / 10
      : 0;

  async function runPreview() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/costforge/calibration/mass-adjust-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          neighborhoodCode: hood.hoodCd,
          adjustmentPct: pct,
          taxYear,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPreview(await res.json() as AdjustPreview);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-border rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Mass Adjustment — Hood {hood.hoodCd}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded border p-2 text-center">
            <div className="font-bold">{hood.medianRatio.toFixed(4)}</div>
            <div className="text-muted-foreground text-xs">Current Ratio</div>
          </div>
          <div className="rounded border p-2 text-center">
            <div className="font-bold">{hood.cod.toFixed(1)}</div>
            <div className="text-muted-foreground text-xs">COD</div>
          </div>
          <div className="rounded border p-2 text-center">
            <div className="font-bold">{hood.saleCount}</div>
            <div className="text-muted-foreground text-xs">Sales</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Adjustment % (+ raises AV, − lowers)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={pct}
              onChange={(e) => setPct(parseFloat(e.target.value) || 0)}
              className="border rounded px-3 py-1 w-28 text-sm bg-background"
            />
            <Button size="sm" variant="outline" onClick={() => setPct(suggested)}>
              Suggest ({suggested > 0 ? "+" : ""}{suggested.toFixed(1)}%)
            </Button>
            <Button size="sm" onClick={runPreview} disabled={loading}>
              {loading ? "Running…" : "Preview"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Suggested: {suggested > 0 ? "+" : ""}{suggested.toFixed(1)}% → ratio 1.000
          </p>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {preview && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Parcels affected</div>
                <div className="font-bold">{fmt(preview.parcelCount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Sales matched</div>
                <div className="font-bold">{fmt(preview.matchedSales)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">AV before</div>
                <div className="font-bold">{fmtM(preview.totalAvBefore)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">AV after</div>
                <div className="font-bold">{fmtM(preview.totalAvAfter)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">AV delta</div>
                <div
                  className={`font-bold ${
                    preview.totalAvDelta >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {preview.totalAvDelta >= 0 ? "+" : ""}{fmtM(preview.totalAvDelta)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Ratio after</div>
                <div
                  className={`font-bold ${
                    preview.iaaoCompliantAfter ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {preview.medianRatioAfter.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {preview.iaaoCompliantAfter ? (
                <Badge className="bg-green-100 text-green-800">
                  ✓ IAAO Compliant after adjustment
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800">
                  ⚠ Still out of range after adjustment
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground italic">
              Preview only — no values have been changed. Apply in your assessment system after supervisor review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function NeighborhoodMatrix() {
  const [selectedHood, setSelectedHood] = useState<NeighborhoodRow | null>(null);
  const [sortBy, setSortBy] = useState<"cod" | "ratio" | "sales">("cod");
  const [filterOoc, setFilterOoc] = useState(false);
  const taxYear = new Date().getFullYear();

  const { data, isLoading, isError, refetch } = useQuery<MatrixResponse>({
    queryKey: ["calibration-neighborhood-matrix", taxYear],
    queryFn: () =>
      fetch(
        `/api/costforge/calibration/neighborhood-matrix?taxYear=${taxYear}&minSales=3`
      ).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MatrixResponse>;
      }),
    staleTime: 10 * 60 * 1000,
  });

  const rows = data?.neighborhoods ?? [];

  const sorted = [...rows]
    .filter((r) => !filterOoc || !r.iaaoCompliant)
    .sort((a, b) => {
      if (sortBy === "cod") return b.cod - a.cod;
      if (sortBy === "ratio") return a.medianRatio - b.medianRatio;
      return b.saleCount - a.saleCount;
    });

  const chartData = [...rows]
    .sort((a, b) => b.cod - a.cod)
    .slice(0, 20)
    .map((r) => ({
      name: r.hoodCd,
      cod: r.cod,
      ratio: r.medianRatio,
      compliant: r.iaaoCompliant,
    }));

  const overallMedian = rows.length
    ? rows.reduce((s, r) => s + r.medianRatio * r.saleCount, 0) /
      rows.reduce((s, r) => s + r.saleCount, 0)
    : 0;
  const overallCOD = rows.length
    ? rows.reduce((s, r) => s + r.cod, 0) / rows.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Computing neighborhood ratio matrix…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded border border-destructive/30 p-6 text-center text-sm text-destructive">
        Failed to load neighborhood matrix. Ensure the .NET API is running on port 5000.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.hoodCount} neighborhoods · ${data.matchedSales.toLocaleString()} qualified sales · TY${data.taxYear}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setFilterOoc((f) => !f)}>
            {filterOoc ? "Show All" : "Out of Compliance Only"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            ↻ Refresh
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    overallMedian >= 0.9 && overallMedian <= 1.1
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {overallMedian.toFixed(3)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Wtd. Median Ratio</div>
                <Badge
                  className="mt-1 text-xs"
                  variant={
                    overallMedian >= 0.9 && overallMedian <= 1.1 ? "default" : "destructive"
                  }
                >
                  {overallMedian >= 0.9 && overallMedian <= 1.1 ? "IAAO OK" : "Out of Range"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    overallCOD <= 15 ? "text-green-600" : "text-amber-500"
                  }`}
                >
                  {overallCOD.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Avg COD</div>
                <Badge
                  className="mt-1 text-xs"
                  variant={overallCOD <= 15 ? "default" : "outline"}
                >
                  {overallCOD <= 15 ? "≤15 Residential" : "Review Needed"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {data.outOfCompliance}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Out of Compliance</div>
                <div className="text-xs text-muted-foreground">
                  of {data.hoodCount} hoods
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{data.matchedSales.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Qualified Sales</div>
                <div className="text-xs text-muted-foreground">w/ AV match</div>
              </CardContent>
            </Card>
          </div>

          {/* COD chart */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">
                Top 20 Neighborhoods by COD (worst first)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: 0, right: 10, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={55}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis
                    label={{
                      value: "COD",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}`, "COD"]} />
                  <ReferenceLine
                    y={15}
                    stroke="#ef4444"
                    strokeDasharray="4 2"
                    label={{ value: "IAAO Max", fill: "#ef4444", fontSize: 9 }}
                  />
                  <Bar dataKey="cod" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.compliant ? "#10b981" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detail table */}
          <Card>
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Neighborhood Detail</CardTitle>
                <div className="flex gap-1 text-xs">
                  <span className="text-muted-foreground mr-1">Sort:</span>
                  {(["cod", "ratio", "sales"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-2 py-0.5 rounded border text-xs ${
                        sortBy === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {s === "cod" ? "COD ↓" : s === "ratio" ? "Ratio ↑" : "Sales ↓"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-1 pr-3">Hood</th>
                      <th className="text-left py-1 pr-3">Area</th>
                      <th className="text-right py-1 pr-3">Sales</th>
                      <th className="text-right py-1 pr-3">Median Ratio</th>
                      <th className="text-right py-1 pr-3">COD</th>
                      <th className="text-right py-1 pr-3">PRD</th>
                      <th className="text-right py-1 pr-3">P25–P75</th>
                      <th className="text-center py-1 pr-3">Status</th>
                      <th className="text-center py-1">Adjust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr
                        key={r.hoodCd}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-1.5 pr-3 font-mono font-medium">{r.hoodCd}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground text-xs">
                          {r.revalArea}
                        </td>
                        <td className="py-1.5 pr-3 text-right">{r.saleCount}</td>
                        <td
                          className={`py-1.5 pr-3 text-right font-mono ${
                            r.ratioOk ? "" : "text-red-500 font-bold"
                          }`}
                        >
                          {r.medianRatio.toFixed(4)}
                        </td>
                        <td
                          className={`py-1.5 pr-3 text-right font-mono ${
                            r.codOk ? "" : "text-amber-500 font-bold"
                          }`}
                        >
                          {r.cod.toFixed(1)}
                        </td>
                        <td className="py-1.5 pr-3 text-right font-mono">
                          {r.prd.toFixed(4)}
                        </td>
                        <td className="py-1.5 pr-3 text-right text-xs text-muted-foreground font-mono">
                          {r.p25.toFixed(3)}–{r.p75.toFixed(3)}
                        </td>
                        <td className="py-1.5 pr-3 text-center">
                          {r.iaaoCompliant ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              {!r.ratioOk && !r.codOk
                                ? "Ratio+COD"
                                : !r.ratioOk
                                ? "Ratio"
                                : "COD"}
                            </Badge>
                          )}
                        </td>
                        <td className="py-1.5 text-center">
                          <button
                            onClick={() => setSelectedHood(r)}
                            className="text-xs text-primary underline hover:no-underline"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sorted.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          {filterOoc
                            ? "All neighborhoods are IAAO compliant"
                            : "No data"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedHood && (
        <MassAdjustPanel
          hood={selectedHood}
          taxYear={taxYear}
          onClose={() => setSelectedHood(null)}
        />
      )}
    </div>
  );
}
