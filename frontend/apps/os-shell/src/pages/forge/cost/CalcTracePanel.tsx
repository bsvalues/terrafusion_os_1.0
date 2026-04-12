// TerraFusion OS -- Phase 210: CalcTracePanel
// RCNLD calculation audit trail for a parcel. macOS Tahoe design language.
// Mined from terra-forge-rebuild src/components/costforge/CalcTracePanel.tsx

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Info } from "lucide-react";
import { useParcelCostTraces } from "@/hooks/useParcelCostTraces";
import type { CalcTraceRow } from "@/hooks/useParcelCostTraces";

function fmtCurrency(value: number | null | undefined): string {
  if (value == null) return "--";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtPct(value: number | null | undefined): string {
  if (value == null) return "--";
  return `${value}%`;
}

function fmtMultiplier(value: number | null | undefined): string {
  if (value == null) return "--";
  return `${value}%`;
}

function fmtDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return isoString; }
}

function TraceCard({ trace }: { trace: CalcTraceRow }) {
  const clsQual = [
    trace.construction_class ? `Class ${trace.construction_class}` : null,
    trace.quality_grade ?? null,
  ].filter(Boolean).join(" · ");
  return (
    <Card className="border-border/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-foreground">
              {trace.schedule_source ?? "Unknown schedule"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {"Calc Year "}{trace.calc_year}{" · Improvement #"}{trace.imprv_sequence}
              {trace.imprv_type_cd && ` · ${trace.imprv_type_cd}`}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] h-5">{trace.calc_method}</Badge>
            <span className="text-[10px] text-muted-foreground">{fmtDate(trace.calc_run_at)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-[11px]">
          <div>
            <div className="text-muted-foreground">Base Unit Cost</div>
            <div className="font-medium text-foreground tabular-nums">
              {trace.base_unit_cost != null ? `$${trace.base_unit_cost}/sqft` : "--"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Area</div>
            <div className="font-medium text-foreground tabular-nums">
              {trace.area_sqft != null ? `${trace.area_sqft.toLocaleString()} sqft` : "--"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Local Multiplier</div>
            <div className="font-medium text-foreground tabular-nums">{fmtMultiplier(trace.local_multiplier)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current Cost Mult</div>
            <div className="font-medium text-foreground tabular-nums">{fmtMultiplier(trace.current_cost_mult)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-[11px]">
          <div>
            <div className="text-muted-foreground">RCN before Ref.</div>
            <div className="font-medium text-foreground tabular-nums">{fmtCurrency(trace.rcn_before_ref)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Refinements</div>
            <div className="font-medium text-foreground tabular-nums">{fmtCurrency(trace.refinements_total)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">RCN</div>
            <div className="font-medium text-foreground tabular-nums">{fmtCurrency(trace.rcn)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{clsQual || null}</div>
          </div>
        </div>
        <div className="border-t border-border/30 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-[11px]">
          <div>
            <div className="text-muted-foreground">Age</div>
            <div className="font-medium text-foreground tabular-nums">{trace.age_years != null ? `${trace.age_years} yr` : "--"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Eff. Life</div>
            <div className="font-medium text-foreground tabular-nums">{trace.effective_life_years != null ? `${trace.effective_life_years} yr` : "--"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">% Good</div>
            <div className="font-medium text-foreground tabular-nums">{fmtPct(trace.pct_good)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">RCNLD</div>
            <div className="text-base font-semibold text-foreground tabular-nums">{fmtCurrency(trace.rcnld)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CalcTracePanelProps {
  parcelId: string | null;
}

export function CalcTracePanel({ parcelId }: CalcTracePanelProps) {
  const { data: traces, isLoading, isError, error } = useParcelCostTraces(parcelId);

  if (!parcelId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <Info className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Select a parcel to view cost approach traces.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <p className="text-sm text-destructive">
          Failed to load traces: {(error as Error)?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  if (!traces || traces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <ClipboardList className="w-7 h-7 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          No cost approach traces found. Run a cost approach calculation in the Forge tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {traces.length} Trace{traces.length !== 1 ? "s" : ""} -- most recent first
        </span>
      </div>
      <ScrollArea className="pr-1">
        <div className="space-y-3">
          {traces.map((trace) => (
            <TraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
