// TerraFusion OS — Ratio Study Panel (IAAO)
// Mined from terra-forge-rebuild src/components/valuation/RatioStudyPanel.tsx
// Displays IAAO-standard metrics (COD, PRD, Median Ratio) with PASS/FAIL gates.

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";
import { useRatioStudy } from "@/hooks/useRatioStudy";

// IAAO Standard thresholds
const IAAO_MEDIAN_MIN = 0.9;
const IAAO_MEDIAN_MAX = 1.1;
const IAAO_COD_MAX = 15;
const IAAO_PRD_MIN = 0.98;
const IAAO_PRD_MAX = 1.03;

function PassBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <Badge className="bg-chart-2/20 text-chart-2 gap-1">
      <CheckCircle className="w-3 h-3" />PASS
    </Badge>
  ) : (
    <Badge className="bg-destructive/20 text-destructive gap-1">
      <XCircle className="w-3 h-3" />FAIL
    </Badge>
  );
}

function MetricRow({
  label,
  value,
  benchmark,
  passed,
  format = "num",
}: {
  label: string;
  value: number | null | undefined;
  benchmark: string;
  passed: boolean;
  format?: "num" | "pct";
}) {
  const display = value == null ? "—" : format === "pct" ? `${value.toFixed(1)}%` : value.toFixed(3);
  return (
    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{benchmark}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-semibold">{display}</span>
        <PassBadge pass={passed} />
      </div>
    </div>
  );
}

interface RatioStudyPanelProps {
  studyPeriodId: string;
}

export function RatioStudyPanel({ studyPeriodId }: RatioStudyPanelProps) {
  const { data: stats, isLoading, isError, error } = useRatioStudy(studyPeriodId);

  if (isLoading) return <RatioStudySkeleton />;

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load ratio study: {(error as Error)?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-border/30 p-6 text-center text-sm text-muted-foreground">
        No ratio study data for this period.
      </div>
    );
  }

  const medianPass = stats.medianRatio != null && stats.medianRatio >= IAAO_MEDIAN_MIN && stats.medianRatio <= IAAO_MEDIAN_MAX;
  const codPass = stats.cod != null && stats.cod <= IAAO_COD_MAX;
  const prdPass = stats.prd != null && stats.prd >= IAAO_PRD_MIN && stats.prd <= IAAO_PRD_MAX;
  const allPass = medianPass && codPass && prdPass;

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-5 ${allPass ? "border-chart-2/40 bg-chart-2/5" : "border-destructive/40 bg-destructive/5"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {allPass ? (
                <CheckCircle className="w-5 h-5 text-chart-2" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-semibold">{allPass ? "IAAO Standards Met" : "IAAO Standards Not Met"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalRatios.toLocaleString()} valid ratios · {stats.outlierCount} outliers excluded
            </p>
          </div>
          <span className="text-3xl font-bold tabular-nums text-muted-foreground">
            {stats.totalRatios.toLocaleString()}
          </span>
        </div>
      </motion.div>

      {/* Key metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <MetricRow
          label="Median Ratio"
          value={stats.medianRatio}
          benchmark="IAAO: 0.90 – 1.10"
          passed={medianPass}
        />
        <MetricRow
          label="COD — Coefficient of Dispersion"
          value={stats.cod}
          benchmark="IAAO: ≤ 15% (residential)"
          passed={codPass}
          format="pct"
        />
        <MetricRow
          label="PRD — Price-Related Differential"
          value={stats.prd}
          benchmark="IAAO: 0.98 – 1.03 (vertical equity)"
          passed={prdPass}
        />
      </motion.div>

      {/* Additional stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Mean Ratio", value: stats.meanRatio?.toFixed(3) ?? "—" },
          { label: "PRB", value: stats.prb?.toFixed(4) ?? "—" },
          { label: "Min Ratio", value: stats.minRatio?.toFixed(3) ?? "—" },
          { label: "Max Ratio", value: stats.maxRatio?.toFixed(3) ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md border border-border/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-mono font-semibold mt-0.5">{value}</div>
          </div>
        ))}
      </motion.div>

      {/* Tier breakdown */}
      {stats.ratiosByTier && stats.ratiosByTier.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Value Tier Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Tier</TableHead>
                    <TableHead className="text-right text-muted-foreground">Count</TableHead>
                    <TableHead className="text-right text-muted-foreground">Median</TableHead>
                    <TableHead className="text-right text-muted-foreground">COD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.ratiosByTier.map((tier) => (
                    <TableRow key={tier.tier} className="border-border/30">
                      <TableCell className="font-medium capitalize">{tier.tier}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{tier.count.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${tier.median < IAAO_MEDIAN_MIN || tier.median > IAAO_MEDIAN_MAX ? "text-destructive" : "text-chart-2"}`}>
                        {tier.median.toFixed(3)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${tier.cod > IAAO_COD_MAX ? "text-destructive" : "text-chart-2"}`}>
                        {tier.cod.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function RatioStudySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-xl" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    </div>
  );
}
