// TerraFusion OS — Multiple Regression Panel (Coefficient table, model stats, equation)
// Mined from terra-forge-rebuild src/components/regression/MultipleRegressionPanel.tsx
// Adapted: tf-* design tokens → OS shell CSS vars. material-bento → border/card.

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoefficientRow, RegressionResult } from "@/hooks/useRegressionAnalysis";

interface MultipleRegressionPanelProps {
  result: RegressionResult | undefined;
  isLoading: boolean;
}

export function MultipleRegressionPanel({ result, isLoading }: MultipleRegressionPanelProps) {
  if (isLoading) return <RegressionSkeleton />;

  if (!result) {
    return (
      <div className="rounded-lg border border-border/30 p-8 text-center">
        <p className="text-muted-foreground">
          No regression analysis available. Click "Run Analysis" to compute coefficients from assessment data.
        </p>
      </div>
    );
  }

  const { coefficients, modelStats } = result;

  return (
    <div className="space-y-6">
      {/* Regression Equation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border/30 p-5"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Regression Equation</h3>
        <div className="p-4 bg-muted/20 rounded-lg font-mono text-sm overflow-x-auto">
          <EquationDisplay coefficients={coefficients} />
        </div>
      </motion.div>

      {/* Coefficients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Coefficient Estimates</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">n = {modelStats.n.toLocaleString()}</Badge>
                <Badge variant="outline" className="text-xs">k = {modelStats.k}</Badge>
                <Badge className="bg-chart-2/20 text-chart-2 text-xs">α = 0.05</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Variable</TableHead>
                    <TableHead className="text-right text-muted-foreground">β̂</TableHead>
                    <TableHead className="text-right text-muted-foreground">Std. Error</TableHead>
                    <TableHead className="text-right text-muted-foreground">t-value</TableHead>
                    <TableHead className="text-right text-muted-foreground">p-value</TableHead>
                    <TableHead className="text-right text-muted-foreground">VIF</TableHead>
                    <TableHead className="text-center text-muted-foreground">Sig.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coefficients.map((row) => (
                    <CoefficientTableRow key={row.variable} row={row} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Fit + Hypothesis Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Goodness of Fit</h3>
          <div className="space-y-3">
            <StatRow label="R²" value={modelStats.rSquared.toFixed(4)} highlight />
            <StatRow label="Adjusted R²" value={modelStats.rSquaredAdj.toFixed(4)} highlight />
            <StatRow label="RMSE" value={modelStats.rmse.toFixed(4)} />
            <StatRow label="MAE" value={modelStats.mae.toFixed(4)} />
            <StatRow label="AIC" value={modelStats.aic.toFixed(1)} isLast />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Hypothesis Tests</h3>
          <div className="space-y-3">
            <StatRow label="F-Statistic" value={modelStats.fStatistic.toFixed(2)} valueClass="text-chart-2" />
            <StatRow
              label="F p-value"
              value={modelStats.fPValue < 0.0001 ? "< 0.0001" : modelStats.fPValue.toFixed(4)}
              valueClass="text-primary"
            />
            <StatRow label="df (Regression)" value={modelStats.k.toString()} />
            <StatRow label="df (Residual)" value={modelStats.dfResidual.toLocaleString()} />
            <StatRow
              label="Computed At"
              value={new Date(result.computedAt).toLocaleTimeString()}
              isLast
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function EquationDisplay({ coefficients }: { coefficients: CoefficientRow[] }) {
  const intercept = coefficients[0];
  const predictors = coefficients.slice(1);
  return (
    <span className="whitespace-nowrap">
      <span className="text-primary">ŷ</span>
      <span className="text-muted-foreground"> = </span>
      <span className="text-yellow-500">{fmt(intercept.coefficient)}</span>
      {predictors.slice(0, 3).map((c) => (
        <span key={c.variable}>
          <span className="text-muted-foreground"> {c.coefficient >= 0 ? "+" : "-"} </span>
          <span className={c.significant ? "text-chart-2" : "text-muted-foreground"}>
            {fmt(Math.abs(c.coefficient))}
          </span>
          <span className="text-foreground">({c.variable.replace("_", "")})</span>
        </span>
      ))}
      {predictors.length > 3 && <span className="text-muted-foreground"> + ...</span>}
    </span>
  );
}

function fmt(value: number): string {
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Math.abs(value) < 0.001) return value.toExponential(2);
  return value.toFixed(4);
}

function CoefficientTableRow({ row }: { row: CoefficientRow }) {
  return (
    <TableRow className={`border-border/30 ${!row.significant ? "opacity-60" : ""}`}>
      <TableCell className="font-medium">{row.variable.replace("_", " ")}</TableCell>
      <TableCell className="text-right font-mono text-sm">{fmt(row.coefficient)}</TableCell>
      <TableCell className="text-right font-mono text-sm text-muted-foreground">{row.stdError.toFixed(4)}</TableCell>
      <TableCell className={`text-right font-mono text-sm ${Math.abs(row.tStatistic) > 2 ? "text-chart-2" : "text-muted-foreground"}`}>
        {row.tStatistic.toFixed(2)}
      </TableCell>
      <TableCell className={`text-right font-mono text-sm ${row.pValue < 0.05 ? "text-primary" : "text-chart-4"}`}>
        {row.pValue < 0.0001 ? "< 0.0001" : row.pValue.toFixed(4)}
      </TableCell>
      <TableCell className={`text-right font-mono text-sm ${row.vif > 5 ? "text-destructive" : row.vif > 2.5 ? "text-chart-4" : "text-muted-foreground"}`}>
        {row.vif.toFixed(2)}
        {row.vif > 5 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
      </TableCell>
      <TableCell className="text-center">
        {row.significant ? <Check className="w-4 h-4 text-chart-2 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
      </TableCell>
    </TableRow>
  );
}

function StatRow({
  label,
  value,
  highlight,
  valueClass,
  isLast,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClass?: string;
  isLast?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-2 ${!isLast ? "border-b border-border/30" : ""}`}>
      <span className="text-sm">{label}</span>
      <span className={`font-mono ${highlight ? "text-primary" : valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

function RegressionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/30 p-5">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Card className="border-border/40">
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => <div key={i} className="rounded-lg border border-border/30 p-5"><Skeleton className="h-48 w-full" /></div>)}
      </div>
    </div>
  );
}
