// TerraFusion OS — ANOVA Panel for Regression Studio
// Mined from terra-forge-rebuild src/components/regression/ANOVAPanel.tsx
// Renders Type III SS ANOVA table + effect size chart + model assumption checks.

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { RegressionResult, ModelDiagnostics } from "@/hooks/useRegressionAnalysis";

interface ANOVAPanelProps {
  result: RegressionResult | undefined;
  isLoading: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}×10¹²`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}×10⁹`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}×10⁶`;
  if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return num.toFixed(4);
};

export function ANOVAPanel({ result, isLoading }: ANOVAPanelProps) {
  if (isLoading) {
    return <ANOVASkeleton />;
  }

  if (!result) {
    return (
      <div className="rounded-lg p-8 text-center border border-border/30">
        <p className="text-muted-foreground">
          No ANOVA results available. Run regression analysis first.
        </p>
      </div>
    );
  }

  const { anova, diagnostics } = result;

  const effectSizeData = anova
    .filter(d => d.etaSq !== null)
    .map(d => ({
      variable: d.source.replace("_", " "),
      etaSq: (d.etaSq! * 100),
    }))
    .sort((a, b) => b.etaSq - a.etaSq);

  return (
    <div className="space-y-6">
      {/* Type III ANOVA Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Type III Sum of Squares ANOVA</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Sequential SS</Badge>
                <Badge className="bg-primary/20 text-primary text-xs">F-test</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Source</TableHead>
                    <TableHead className="text-right text-muted-foreground">df</TableHead>
                    <TableHead className="text-right text-muted-foreground">Sum Sq</TableHead>
                    <TableHead className="text-right text-muted-foreground">Mean Sq</TableHead>
                    <TableHead className="text-right text-muted-foreground">F value</TableHead>
                    <TableHead className="text-right text-muted-foreground">Pr(&gt;F)</TableHead>
                    <TableHead className="text-right text-muted-foreground">η²</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anova.map((row) => (
                    <TableRow
                      key={row.source}
                      className={`border-border/30 ${row.source === 'Residuals' ? 'bg-muted/10' : ''}`}
                    >
                      <TableCell className="font-medium">{row.source.replace("_", " ")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.df.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatNumber(row.sumSq)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatNumber(row.meanSq)}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${row.fValue && row.fValue > 100 ? 'text-chart-2' : ''}`}>
                        {row.fValue ? row.fValue.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${row.pValue && row.pValue < 0.001 ? 'text-primary' : row.pValue && row.pValue < 0.05 ? 'text-chart-4' : ''}`}>
                        {row.pValue ? (row.pValue < 0.0001 ? '< 0.0001' : row.pValue.toFixed(4)) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.etaSq ? `${(row.etaSq * 100).toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Effect Size Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Effect Size (η² Partial) — Variance Explained
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={effectSizeData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis
                  type="number"
                  domain={[0, Math.max(50, ...effectSizeData.map(d => d.etaSq)) * 1.1]}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="variable"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "η²"]}
                />
                <Bar dataKey="etaSq" radius={[0, 4, 4, 0]}>
                  {effectSizeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.etaSq > 20
                          ? "hsl(var(--primary))"
                          : entry.etaSq > 10
                          ? "hsl(var(--chart-2))"
                          : entry.etaSq > 5
                          ? "hsl(var(--chart-4))"
                          : "hsl(var(--muted-foreground))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">Large (&gt;20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-chart-2" />
              <span className="text-xs text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-chart-4" />
              <span className="text-xs text-muted-foreground">Small</span>
            </div>
          </div>
        </motion.div>

        {/* Model Assumptions Check */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Model Assumptions Check
          </h3>
          <div className="space-y-4">
            <DiagnosticRow
              label="Linearity"
              description={`Rainbow test: p = ${diagnostics.linearityPValue.toFixed(3)}`}
              passed={diagnostics.linearityPassed}
            />
            <DiagnosticRow
              label="Normality"
              description={`Shapiro-Wilk: p = ${diagnostics.normalityPValue.toFixed(3)}`}
              passed={diagnostics.normalityPassed}
            />
            <DiagnosticRow
              label="Homoscedasticity"
              description={`Breusch-Pagan: p = ${diagnostics.homoscedasticityPValue.toFixed(3)}`}
              passed={diagnostics.homoscedasticityPassed}
              marginal={!diagnostics.homoscedasticityPassed && diagnostics.homoscedasticityPValue > 0.01}
            />
            <DiagnosticRow
              label="Independence"
              description={`Durbin-Watson: ${diagnostics.durbinWatson.toFixed(3)}`}
              passed={diagnostics.independencePassed}
            />
            <DiagnosticRow
              label="No Multicollinearity"
              description={`Max VIF: ${diagnostics.maxVIF.toFixed(2)} (< 5)`}
              passed={diagnostics.multicollinearityPassed}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DiagnosticRow({
  label,
  description,
  passed,
  marginal,
}: {
  label: string;
  description: string;
  passed: boolean;
  marginal?: boolean;
}) {
  const status = passed ? "Pass" : marginal ? "Marginal" : "Fail";
  const statusClass = passed
    ? "bg-chart-2/20 text-chart-2"
    : marginal
    ? "bg-chart-4/20 text-chart-4"
    : "bg-destructive/20 text-destructive";
  const Icon = passed ? Check : AlertCircle;
  const iconClass = passed
    ? "text-chart-2"
    : marginal
    ? "text-chart-4"
    : "text-destructive";

  return (
    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge className={statusClass}>{status}</Badge>
    </div>
  );
}

function ANOVASkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-border/40">
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border/30 p-5">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-lg border border-border/30 p-5">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
