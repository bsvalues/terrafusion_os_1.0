// TerraFusion OS — Regression Diagnostic Plots Panel
// Mined from terra-forge-rebuild src/components/regression/DiagnosticPlotsPanel.tsx
// Residuals vs Fitted, Q-Q Plot, Scale-Location, Cook's Distance

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { RegressionResult } from "@/hooks/useRegressionAnalysis";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface DiagnosticPlotsPanelProps {
  result: RegressionResult | undefined;
  isLoading: boolean;
}

export function DiagnosticPlotsPanel({ result, isLoading }: DiagnosticPlotsPanelProps) {
  if (isLoading) {
    return <DiagnosticsSkeleton />;
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-border/30 p-8 text-center">
        <p className="text-muted-foreground">No diagnostic plots available. Run regression analysis first.</p>
      </div>
    );
  }

  const { diagnosticPlots } = result;

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "6px",
      fontSize: "11px",
    },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border/30 p-4"
      >
        <p className="text-sm text-muted-foreground">
          Standard diagnostic plots for assessing regression model assumptions and identifying influential observations.
          Classic R-style diagnostic framework applied to your assessment data.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Residuals vs Fitted */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Residuals vs Fitted</h3>
          <p className="text-xs text-muted-foreground mb-4">Checks linearity assumption. Look for random scatter around zero.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis type="number" dataKey="x" name="Fitted"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Fitted Values", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis type="number" dataKey="y" name="Residuals"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Residuals", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                <Tooltip {...tooltipStyle} />
                <Scatter data={diagnosticPlots.residualsVsFitted} fill="hsl(var(--primary))" opacity={0.6}>
                  {diagnosticPlots.residualsVsFitted.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isOutlier ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Q-Q Plot */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Normal Q-Q Plot</h3>
          <p className="text-xs text-muted-foreground mb-4">Checks normality of residuals. Points should follow the diagonal line.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis type="number" dataKey="x" name="Theoretical" domain={[-3, 3]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Theoretical Quantiles", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis type="number" dataKey="y" name="Sample" domain={[-3, 3]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Sample Quantiles", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <ReferenceLine
                  segment={[{ x: -3, y: -3 }, { x: 3, y: 3 }]}
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                />
                <Tooltip {...tooltipStyle} />
                <Scatter data={diagnosticPlots.qqPlot} fill="hsl(var(--primary))" opacity={0.6}>
                  {diagnosticPlots.qqPlot.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isOutlier ? "hsl(var(--chart-4))" : "hsl(var(--primary))"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Scale-Location */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Scale-Location Plot</h3>
          <p className="text-xs text-muted-foreground mb-4">Checks homoscedasticity. Look for horizontal spread of residuals.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis type="number" dataKey="x" name="Fitted"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Fitted Values", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis type="number" dataKey="y" name="√|Standardized Residuals|"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "√|Std Res|", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip {...tooltipStyle} />
                <Scatter data={diagnosticPlots.scaleLocation} fill="hsl(var(--chart-4))" opacity={0.6}>
                  {diagnosticPlots.scaleLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isOutlier ? "hsl(var(--destructive))" : "hsl(var(--chart-4))"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cook's Distance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-border/30 p-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Cook's Distance</h3>
          <p className="text-xs text-muted-foreground mb-4">Identifies influential observations. Values &gt; 4/n require attention.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosticPlots.cooksDistance} margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="index"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Observation Index", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: "Cook's D", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip {...tooltipStyle} formatter={(value: number) => [value.toFixed(4), "Cook's D"]} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {diagnosticPlots.cooksDistance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isInfluential ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DiagnosticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/30 p-4">
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border/30 p-5">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48 mb-4" />
            <Skeleton className="h-56 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
