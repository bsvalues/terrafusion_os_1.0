// TerraFusion OS — Neighborhood Effects Panel for Regression Studio
// Mined from terra-forge-rebuild src/components/regression/NeighborhoodEffectsPanel.tsx
// Geographic equity analysis with β̂ coefficients, t-values, effect chart + implications grid.

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { NeighborhoodEffect } from "@/hooks/useRegressionAnalysis";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface NeighborhoodEffectsPanelProps {
  effects: NeighborhoodEffect[] | undefined;
  isLoading: boolean;
}

export function NeighborhoodEffectsPanel({ effects, isLoading }: NeighborhoodEffectsPanelProps) {
  if (isLoading) {
    return <NeighborhoodSkeleton />;
  }

  if (!effects || effects.length === 0) {
    return (
      <div className="rounded-lg border border-border/30 p-8 text-center">
        <p className="text-muted-foreground">No neighborhood effects data available.</p>
      </div>
    );
  }

  const nonRef = effects.filter(e => !e.isReference);
  const ref = effects.find(e => e.isReference);
  const significantCount = nonRef.filter(e => e.pValue < 0.05).length;
  const overAssessed = nonRef.filter(e => e.coefficient > 0 && e.pValue < 0.05);
  const underAssessed = nonRef.filter(e => e.coefficient < 0 && e.pValue < 0.05);

  const chartData = nonRef
    .sort((a, b) => b.coefficient - a.coefficient)
    .map(e => ({
      code: e.neighborhoodCode,
      coefficient: e.coefficient,
      significant: e.pValue < 0.05,
    }));

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="rounded-lg border border-border/30 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{nonRef.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Neighborhoods</div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
          <div className="text-2xl font-bold text-primary">{significantCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Significant Effects (p &lt; 0.05)</div>
        </div>
        <div className="rounded-lg border border-border/30 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {nonRef.filter(e => e.pValue < 0.05 && Math.abs(e.coefficient) > 5).length}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Large Disparities (&gt;5%)</div>
        </div>
      </motion.div>

      {/* Reference neighborhood */}
      {ref && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4 flex items-center gap-3"
        >
          <div>
            <p className="text-sm font-medium">Reference Neighborhood: {ref.neighborhoodCode}</p>
            <p className="text-xs text-muted-foreground">
              n = {ref.n.toLocaleString()} · all other neighborhood effects are relative to this baseline
            </p>
          </div>
          <Badge className="ml-auto bg-chart-2/20 text-chart-2">Baseline = 0</Badge>
        </motion.div>
      )}

      {/* Effect chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-border/30 p-5"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Coefficient Deviation from Baseline (% points)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          + = over-assessed vs reference · − = under-assessed vs reference · grey = not significant
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="code"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                width={55}
              />
              <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Coefficient"]}
              />
              <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      !entry.significant
                        ? "hsl(var(--muted-foreground) / 0.4)"
                        : entry.coefficient > 0
                        ? "hsl(var(--destructive) / 0.8)"
                        : "hsl(var(--chart-2) / 0.8)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Coefficient table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-border/30 overflow-x-auto"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-muted-foreground">Neighborhood</TableHead>
              <TableHead className="text-right text-muted-foreground">n</TableHead>
              <TableHead className="text-right text-muted-foreground">β̂</TableHead>
              <TableHead className="text-right text-muted-foreground">Std. Err.</TableHead>
              <TableHead className="text-right text-muted-foreground">t-value</TableHead>
              <TableHead className="text-right text-muted-foreground">p-value</TableHead>
              <TableHead className="text-muted-foreground">Interpretation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nonRef.map((effect) => {
              const sig = effect.pValue < 0.001 ? "***" : effect.pValue < 0.01 ? "**" : effect.pValue < 0.05 ? "*" : "";
              const isOver = effect.coefficient > 0 && effect.pValue < 0.05;
              const isUnder = effect.coefficient < 0 && effect.pValue < 0.05;
              return (
                <TableRow key={effect.neighborhoodCode} className="border-border/30">
                  <TableCell className="font-medium">{effect.neighborhoodCode}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">{effect.n.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono text-sm ${isOver ? "text-destructive" : isUnder ? "text-chart-2" : ""}`}>
                    {effect.coefficient.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">{effect.stdError.toFixed(3)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{effect.tValue.toFixed(3)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span>{effect.pValue < 0.0001 ? "< 0.0001" : effect.pValue.toFixed(4)}</span>
                    <span className="text-primary ml-1">{sig}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {!sig ? (
                      <span className="text-muted-foreground">Not significant</span>
                    ) : isOver ? (
                      <span className="text-destructive">Over-assessed</span>
                    ) : (
                      <span className="text-chart-2">Under-assessed</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>

      {/* Equity implications */}
      {(overAssessed.length > 0 || underAssessed.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-border/30 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-chart-4" />
            <h3 className="text-sm font-medium">Equity Implications</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overAssessed.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Over-Assessed</span>
                </div>
                <ul className="space-y-1">
                  {overAssessed.map(e => (
                    <li key={e.neighborhoodCode} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{e.neighborhoodCode}</span>
                      <span className="font-mono text-destructive">+{e.coefficient.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {underAssessed.length > 0 && (
              <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-chart-2" />
                  <span className="text-sm font-medium text-chart-2">Under-Assessed</span>
                </div>
                <ul className="space-y-1">
                  {underAssessed.map(e => (
                    <li key={e.neighborhoodCode} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{e.neighborhoodCode}</span>
                      <span className="font-mono text-chart-2">{e.coefficient.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function NeighborhoodSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}
