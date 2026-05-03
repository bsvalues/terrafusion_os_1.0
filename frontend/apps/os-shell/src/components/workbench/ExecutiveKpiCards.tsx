// TerraFusion OS — Executive KPI Dashboard Cards
// High-level county metrics for Summary tab (no parcel selected).
// Mined from terra-forge-rebuild src/components/workbench/ExecutiveKpiCards.tsx
// Adapted: Supabase → apiFetch REST. useAuthContext → useCountyConfig.

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, DollarSign, TrendingUp, AlertTriangle, Gavel, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/apiBase";
import { useCountyConfig } from "@/hooks/useCountyConfig";

interface KpiData {
  totalParcels: number;
  totalAssessedValue: number;
  avgAssessedValue: number;
  activeAppeals: number;
  dqIssues: number;
  recentSales: number;
}

export function ExecutiveKpiCards() {
  const { countyId } = useCountyConfig();

  const { data: kpi, isLoading } = useQuery<KpiData>({
    queryKey: ["executive-kpi", countyId],
    enabled: !!countyId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await apiFetch(`/kpi/county/${countyId}`);
      if (!res.ok) throw new Error(`KPI fetch failed: ${res.status}`);
      return res.json() as Promise<KpiData>;
    },
  });

  const CARD_DEFS = [
    { label: "Total Parcels", value: kpi?.totalParcels.toLocaleString(), icon: Building2, color: "text-primary" },
    {
      label: "Total Assessed Value",
      value: kpi ? `$${(kpi.totalAssessedValue / 1e9).toFixed(2)}B` : undefined,
      icon: DollarSign,
      color: "text-chart-2",
    },
    {
      label: "Avg Assessment",
      value: kpi ? `$${kpi.avgAssessedValue.toLocaleString()}` : undefined,
      icon: TrendingUp,
      color: "text-chart-3",
    },
    { label: "Active Appeals", value: kpi?.activeAppeals.toLocaleString(), icon: Gavel, color: "text-chart-4" },
    { label: "DQ Issues (Open)", value: kpi?.dqIssues.toLocaleString(), icon: AlertTriangle, color: "text-destructive" },
    { label: "Qualified Sales", value: kpi?.recentSales.toLocaleString(), icon: BarChart3, color: "text-chart-1" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {CARD_DEFS.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-border/30 bg-card/60 hover:bg-card/80 transition-colors">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted/40">
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 mt-1" />
                ) : (
                  <p className="text-lg font-bold text-foreground">{c.value ?? "—"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
