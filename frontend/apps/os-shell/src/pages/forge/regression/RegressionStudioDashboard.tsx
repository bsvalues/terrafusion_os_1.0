// TerraFusion OS — Regression Studio Dashboard (full tabbed regression lab)
// Mined from terra-forge-rebuild src/components/regression/RegressionStudioDashboard.tsx
// Adapted: live TerraForge tax-year input.

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { RegressionActions } from "./RegressionActions";
import { MultipleRegressionPanel } from "./MultipleRegressionPanel";
import { ANOVAPanel } from "./ANOVAPanel";
import { DiagnosticPlotsPanel } from "./DiagnosticPlotsPanel";
import { RegressionSummaryCards } from "./RegressionSummaryCards";
import { NeighborhoodEffectsPanel } from "./NeighborhoodEffectsPanel";
import { useRegressionAnalysis, useRunRegressionAnalysis } from "@/hooks/useRegressionAnalysis";

interface RegressionStudioDashboardProps {
  initialTaxYear?: number;
}

const DEFAULT_TAX_YEAR = 2026;

export function RegressionStudioDashboard({ initialTaxYear }: RegressionStudioDashboardProps) {
  const [activeTab, setActiveTab] = useState("regression");
  const [taxYear, setTaxYear] = useState<number>(initialTaxYear ?? DEFAULT_TAX_YEAR);

  const { data: regressionResult, isLoading: isLoadingRegression } = useRegressionAnalysis(
    taxYear
  );
  const runAnalysis = useRunRegressionAnalysis(taxYear);

  useEffect(() => {
    if (initialTaxYear) setTaxYear(initialTaxYear);
  }, [initialTaxYear]);

  const handleRunAnalysis = () => {
    runAnalysis.mutate();
  };

  const isBusy = isLoadingRegression || runAnalysis.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h2 className="text-2xl font-light text-primary">
            Regression Studio — Statistical Laboratory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            PhD-Level Analytics · Multiple Regression · ANOVA · Diagnostic Testing
          </p>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="rsd-tax-year" className="text-xs text-muted-foreground">
              Tax Year
            </Label>
            <Input
              id="rsd-tax-year"
              type="number"
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value) || DEFAULT_TAX_YEAR)}
              min={2016}
              max={new Date().getFullYear() + 1}
              className="h-8 w-28 text-sm"
            />
          </div>
          <RegressionActions
            onRunAnalysis={handleRunAnalysis}
            isRunning={runAnalysis.isPending}
            hasResult={!!regressionResult}
            result={regressionResult}
          />
        </div>
      </motion.div>

      {/* KPI Cards */}
      <RegressionSummaryCards result={regressionResult} isLoading={isBusy} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="regression">Multiple Regression</TabsTrigger>
          <TabsTrigger value="neighborhoods" className="gap-1">
            <MapPin className="w-3 h-3" />
            Geographic
          </TabsTrigger>
          <TabsTrigger value="anova">ANOVA</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="regression" className="mt-6">
          <MultipleRegressionPanel result={regressionResult} isLoading={isBusy} />
        </TabsContent>

        <TabsContent value="neighborhoods" className="mt-6">
          <NeighborhoodEffectsPanel
            effects={regressionResult?.neighborhoodEffects}
            isLoading={isBusy}
          />
        </TabsContent>

        <TabsContent value="anova" className="mt-6">
          <ANOVAPanel result={regressionResult} isLoading={isBusy} />
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-6">
          <DiagnosticPlotsPanel result={regressionResult} isLoading={isBusy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
