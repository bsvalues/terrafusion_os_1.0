// TerraFusion OS — Regression Summary Cards (4 KPI metrics at the top of Regression Studio)
// Mined from terra-forge-rebuild src/components/regression/RegressionSummaryCards.tsx
// Adapted: ProvenanceNumber removed, tf-* tokens mapped to OS CSS vars.

import { motion } from "framer-motion";
import { TrendingUp, Target, Activity, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RegressionResult } from "@/hooks/useRegressionAnalysis";

interface Props {
  result: RegressionResult | undefined;
  isLoading: boolean;
}

interface CardDef {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  bgClass: string;
}

function SummaryCard({ icon, label, value, subValue, bgClass, delay }: CardDef & { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-border/30 p-4"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${bgClass}`}>{icon}</div>
        {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
      </div>
      <div className="mt-3">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export function RegressionSummaryCards({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-border/30 p-4"
          >
            <Skeleton className="w-9 h-9 rounded-lg mb-3" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </motion.div>
        ))}
      </div>
    );
  }

  const placeholder: CardDef[] = [
    { icon: <TrendingUp className="w-5 h-5 text-primary" />, label: "R² Adjusted", value: "—", subValue: "Run analysis", bgClass: "bg-primary/10" },
    { icon: <Target className="w-5 h-5 text-chart-2" />, label: "F-Statistic", value: "—", subValue: "No data", bgClass: "bg-chart-2/10" },
    { icon: <Activity className="w-5 h-5 text-chart-4" />, label: "RMSE", value: "—", subValue: "σ̂", bgClass: "bg-chart-4/10" },
    { icon: <Percent className="w-5 h-5 text-yellow-500" />, label: "Durbin-Watson", value: "—", subValue: "Independence", bgClass: "bg-yellow-500/10" },
  ];

  if (!result) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholder.map((card, i) => <SummaryCard key={card.label} {...card} delay={i * 0.1} />)}
      </div>
    );
  }

  const { modelStats, diagnostics } = result;

  const cards: CardDef[] = [
    {
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      label: "R² Adjusted",
      value: modelStats.rSquaredAdj.toFixed(4),
      subValue: `${(modelStats.rSquaredAdj * 100).toFixed(2)}%`,
      bgClass: "bg-primary/10",
    },
    {
      icon: <Target className="w-5 h-5 text-chart-2" />,
      label: "F-Statistic",
      value: modelStats.fStatistic.toFixed(2),
      subValue: modelStats.fPValue < 0.001 ? "p < 0.001" : `p = ${modelStats.fPValue.toFixed(3)}`,
      bgClass: "bg-chart-2/10",
    },
    {
      icon: <Activity className="w-5 h-5 text-chart-4" />,
      label: "RMSE",
      value: modelStats.rmse.toFixed(4),
      subValue: "σ̂",
      bgClass: "bg-chart-4/10",
    },
    {
      icon: <Percent className="w-5 h-5 text-yellow-500" />,
      label: "Durbin-Watson",
      value: diagnostics.durbinWatson.toFixed(3),
      subValue: diagnostics.independencePassed ? "No autocorrelation" : "Check independence",
      bgClass: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => <SummaryCard key={card.label} {...card} delay={i * 0.1} />)}
    </div>
  );
}
