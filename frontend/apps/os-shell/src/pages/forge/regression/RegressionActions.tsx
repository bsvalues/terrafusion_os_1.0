// TerraFusion OS — Regression Actions toolbar (Run, Export CSV, Generate MD report)
// Mined from terra-forge-rebuild src/components/regression/RegressionActions.tsx
// Adapted: tf-* tokens removed, sonner toast unchanged (shared dep).

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RegressionResult } from "@/hooks/useRegressionAnalysis";

interface RegressionActionsProps {
  onRunAnalysis: () => void;
  isRunning: boolean;
  hasResult: boolean;
  result?: RegressionResult | null;
}

export function RegressionActions({ onRunAnalysis, isRunning, hasResult, result }: RegressionActionsProps) {
  const handleExport = () => {
    if (!result) return;
    const rows = [
      "Variable,Coefficient,Std Error,t-Statistic,p-Value,VIF,Significant",
      ...result.coefficients.map((c) =>
        [
          `"${c.variable}"`,
          c.coefficient.toFixed(6),
          c.stdError.toFixed(6),
          c.tStatistic.toFixed(4),
          c.pValue.toFixed(4),
          c.vif.toFixed(3),
          c.significant ? "Yes" : "No",
        ].join(",")
      ),
      "",
      "R²,Adj R²,F-Statistic,RMSE,N",
      [
        result.modelStats.rSquared.toFixed(4),
        result.modelStats.rSquaredAdj.toFixed(4),
        result.modelStats.fStatistic.toFixed(4),
        result.modelStats.rmse.toFixed(4),
        result.modelStats.n,
      ].join(","),
    ];
    triggerDownload(rows.join("\n"), "text/csv", `regression_export_${today()}.csv`);
    toast.success("CSV exported", { description: "Regression results saved to file." });
  };

  const handleReport = () => {
    if (!result) return;
    const { modelStats: ms, diagnostics: d } = result;
    const coeffTable = buildCoeffTable(result);
    const anovaSection = buildAnovaSection(result);
    const diagPass = (passed: boolean, label: string) => `| ${label} | ${passed ? "✅ Pass" : "❌ Fail"} |`;

    const md = [
      "# TerraForge Regression Analysis Report",
      "",
      `Generated: ${today()}`,
      "",
      "## Model Statistics",
      "| Statistic | Value |",
      "|-----------|-------|",
      `| R² | ${ms.rSquared.toFixed(4)} |`,
      `| Adj R² | ${ms.rSquaredAdj.toFixed(4)} |`,
      `| F-Statistic | ${ms.fStatistic.toFixed(4)} (p = ${ms.fPValue.toFixed(4)}) |`,
      `| RMSE | ${ms.rmse.toFixed(4)} |`,
      `| MAE | ${ms.mae.toFixed(4)} |`,
      `| AIC | ${ms.aic.toFixed(2)} |`,
      `| N | ${ms.n} |`,
      `| k | ${ms.k} |`,
      "",
      "## Regression Equation",
      "```",
      result.equation,
      "```",
      "",
      "## Coefficients",
      coeffTable,
      anovaSection,
      "",
      "## Diagnostic Tests",
      "| Test | Result |",
      "|------|--------|",
      diagPass(d.linearityPassed, `Linearity (p = ${d.linearityPValue.toFixed(4)})`),
      diagPass(d.normalityPassed, `Normality (p = ${d.normalityPValue.toFixed(4)})`),
      diagPass(d.homoscedasticityPassed, `Homoscedasticity (p = ${d.homoscedasticityPValue.toFixed(4)})`),
      diagPass(d.independencePassed, `Independence (Durbin-Watson = ${d.durbinWatson.toFixed(3)})`),
    ].join("\n");

    triggerDownload(md, "text/markdown", `regression_report_${today()}.md`);
    toast.success("Markdown report generated", { description: "Analysis report downloaded." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <Button
        onClick={onRunAnalysis}
        disabled={isRunning}
        className="gap-2"
        size="sm"
      >
        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {isRunning ? "Running..." : "Run Analysis"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={!hasResult}
        className="gap-1"
      >
        <Download className="w-4 h-4" />
        CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReport}
        disabled={!hasResult}
        className="gap-1"
      >
        <FileText className="w-4 h-4" />
        Report
      </Button>
    </motion.div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildCoeffTable(result: RegressionResult): string {
  return [
    "| Variable | Coefficient | Std Error | t-Statistic | p-Value | VIF | Significant |",
    "|----------|------------|-----------|-------------|---------|-----|-------------|",
    ...result.coefficients.map(
      (c) =>
        `| ${c.variable} | ${c.coefficient.toFixed(6)} | ${c.stdError.toFixed(6)} | ${c.tStatistic.toFixed(4)} | ${c.pValue.toFixed(4)} | ${c.vif.toFixed(3)} | ${c.significant ? "Yes" : "No"} |`
    ),
  ].join("\n");
}

function buildAnovaSection(result: RegressionResult): string {
  if (!result.anova?.length) return "";
  return [
    "",
    "## ANOVA Table",
    "",
    "| Source | df | Sum Sq | Mean Sq | F | p-Value | η² |",
    "|--------|----|--------|---------|---|---------|-----|",
    ...result.anova.map(
      (row) =>
        `| ${row.source} | ${row.df} | ${row.sumSq.toFixed(4)} | ${row.meanSq.toFixed(4)} | ${row.fValue != null ? row.fValue.toFixed(4) : "—"} | ${row.pValue != null ? row.pValue.toFixed(4) : "—"} | ${row.etaSq != null ? row.etaSq.toFixed(4) : "—"} |`
    ),
  ].join("\n");
}
