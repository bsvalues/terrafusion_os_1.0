// TerraFusion OS — Neighborhood Ratio Study Dashboard
// Mined from terra-forge-rebuild src/components/valuation/NeighborhoodRatioStudyDashboard.tsx
// REST-adapted: replaces Supabase direct query with apiFetch + useCountyConfig for county scoping.

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiBase";
import { useCountyConfig } from "@/hooks/useCountyConfig";
import { MapPin } from "lucide-react";

const BENTON_COUNTY_ID = "842a6c54-c7c0-4b2d-aa43-0e3ba63fa57d";

interface NeighborhoodSnapshot {
  neighborhood_code: string;
  parcel_count: number;
  median_ratio: number;
  cod: number;
  prd: number;
  sale_count: number;
}

function codLabel(cod: number): { label: string; cls: string } {
  if (cod <= 15) return { label: "Excellent", cls: "bg-chart-2/20 text-chart-2" };
  if (cod <= 20) return { label: "Good", cls: "bg-primary/20 text-primary" };
  if (cod <= 25) return { label: "Fair", cls: "bg-chart-4/20 text-chart-4" };
  return { label: "Poor", cls: "bg-destructive/20 text-destructive" };
}

function medianRatioColor(ratio: number): string {
  if (ratio >= 0.9 && ratio <= 1.1) return "text-chart-2";
  if (ratio >= 0.85 && ratio <= 1.15) return "text-chart-4";
  return "text-destructive";
}

export function NeighborhoodRatioStudyDashboard() {
  const { config } = useCountyConfig();
  const countyId = config?.countyId ?? BENTON_COUNTY_ID;

  const { data: snapshots = [], isLoading, isError, error } = useQuery<NeighborhoodSnapshot[]>({
    queryKey: ["neighborhood-ratio-snapshots", countyId],
    queryFn: () => apiFetch(`/terraforge/comparison-snapshots?taxYear=2026&countyId=${encodeURIComponent(countyId)}`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load neighborhood data: {(error as Error)?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/40 p-10 text-center space-y-2">
        <MapPin className="w-6 h-6 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">No neighborhood snapshots found for this county.</p>
      </div>
    );
  }

  const avgCOD = snapshots.reduce((s, n) => s + n.cod, 0) / snapshots.length;
  const totalSales = snapshots.reduce((s, n) => s + n.sale_count, 0);

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="rounded-lg border border-border/30 p-4 text-center">
          <div className="text-2xl font-bold">{snapshots.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Neighborhoods</div>
        </div>
        <div className="rounded-lg border border-border/30 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{avgCOD.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Avg COD</div>
        </div>
        <div className="rounded-lg border border-border/30 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{totalSales.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Sales</div>
        </div>
      </motion.div>

      {/* Neighborhood cards */}
      <div className="space-y-2">
        {snapshots.map((n, i) => {
          const cod = codLabel(n.cod);
          return (
            <motion.div
              key={n.neighborhood_code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border/30 p-3 hover:border-border/60 transition-colors"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="min-w-[80px]">
                  <p className="text-sm font-medium">{n.neighborhood_code}</p>
                  <p className="text-xs text-muted-foreground">{n.parcel_count.toLocaleString()} parcels</p>
                </div>
                <div className="flex items-center gap-2 flex-1 flex-wrap justify-end sm:justify-start">
                  <div className="text-center min-w-[50px]">
                    <div className={`font-mono text-sm font-semibold ${medianRatioColor(n.median_ratio)}`}>
                      {n.median_ratio.toFixed(3)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Median</div>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <div className="font-mono text-sm font-semibold tabular-nums">{n.cod.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted-foreground">COD</div>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <div className="font-mono text-sm font-semibold tabular-nums">{n.prd.toFixed(3)}</div>
                    <div className="text-[10px] text-muted-foreground">PRD</div>
                  </div>
                  <div className="text-center min-w-[40px]">
                    <div className="font-mono text-sm font-semibold tabular-nums">{n.sale_count}</div>
                    <div className="text-[10px] text-muted-foreground">Sales</div>
                  </div>
                  <Badge className={cod.cls}>{cod.label}</Badge>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    </div>
  );
}
