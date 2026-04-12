// TerraFusion OS — AVM Run Panel (Valuation Suite)
// Mined from terra-forge-rebuild src/components/valuation/AvmRunPanel.tsx
// REST-adapted: useCountyConfig replaces useAuthContext for county scoping.

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Play, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAvmRuns, useLaunchAvmRun, type AvmRun } from "@/hooks/useAvmPipeline";
import { useCountyConfig } from "@/hooks/useCountyConfig";

const BENTON_COUNTY_ID = "842a6c54-c7c0-4b2d-aa43-0e3ba63fa57d";

const MODEL_TYPES = [
  { value: "linear_regression", label: "Linear Regression" },
  { value: "random_forest", label: "Random Forest" },
  { value: "gradient_boost", label: "Gradient Boosting" },
  { value: "neural_net", label: "Neural Network" },
] as const;

function StatusIcon({ status }: { status: AvmRun["status"] }) {
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-chart-2" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  if (status === "queued") return <Clock className="w-4 h-4 text-chart-4" />;
  return <AlertCircle className="w-4 h-4 text-destructive" />;
}

function StatusBadge({ status }: { status: AvmRun["status"] }) {
  const map: Record<AvmRun["status"], string> = {
    completed: "bg-chart-2/20 text-chart-2",
    running: "bg-primary/20 text-primary",
    queued: "bg-chart-4/20 text-chart-4",
    failed: "bg-destructive/20 text-destructive",
  };
  return <Badge className={map[status] ?? "bg-muted text-muted-foreground"}>{status}</Badge>;
}

function MetricCard({ label, value, suffix }: { label: string; value: number | null | undefined; suffix?: string }) {
  const display = value == null ? "—" : `${value.toFixed(value < 1 ? 4 : 2)}${suffix ?? ""}`;
  return (
    <div className="rounded-md border border-border/30 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-semibold text-sm tabular-nums mt-0.5">{display}</div>
    </div>
  );
}

export function AvmRunPanel() {
  const { config } = useCountyConfig();
  const countyId = config?.countyId ?? BENTON_COUNTY_ID;

  const { data: runs = [], isLoading: runsLoading } = useAvmRuns(countyId);
  const { launch, isLaunching, error: launchError } = useLaunchAvmRun();

  const [modelName, setModelName] = useState("Assessment Model");
  const [modelType, setModelType] = useState<AvmRun["model_type"]>("gradient_boost");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const selectedRun = runs.find(r => r.id === selectedRunId);

  const handleLaunch = async () => {
    const result = await launch({ county_id: countyId, model_name: modelName, model_type: modelType });
    if (result) setSelectedRunId(result.id);
  };

  return (
    <div className="space-y-6 p-5">
      {/* Launch form */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Launch AVM Run
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Model Name</Label>
              <Input
                className="h-9 text-sm"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Model Type</Label>
              <Select
                value={modelType}
                onValueChange={(v) => setModelType(v as AvmRun["model_type"])}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_TYPES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {launchError && <p className="text-sm text-destructive">{launchError}</p>}

          <Button
            onClick={handleLaunch}
            disabled={isLaunching || !modelName.trim()}
            className="gap-2"
          >
            {isLaunching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isLaunching ? "Launching..." : "Launch Run"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Run history */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Run History</h3>
          {runsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : runs.length === 0 ? (
            <div className="rounded-lg border border-border/30 p-6 text-center text-sm text-muted-foreground">
              No AVM runs found for this county.
            </div>
          ) : (
            <ScrollArea className="h-72 pr-1">
              <div className="space-y-2">
                {runs.map((run) => (
                  <motion.button
                    key={run.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${
                      selectedRunId === run.id
                        ? "border-primary bg-primary/5"
                        : "border-border/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon status={run.status} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{run.model_name}</p>
                          <p className="text-xs text-muted-foreground">{run.model_type.replace("_", " ")}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={run.status} />
                        {run.sample_size && (
                          <span className="text-[10px] text-muted-foreground">n = {run.sample_size.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Diagnostics */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Diagnostics</h3>
          {!selectedRun ? (
            <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
              Select a run to view diagnostics
            </div>
          ) : (
            <motion.div
              key={selectedRun.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              <MetricCard label="R²" value={selectedRun.r_squared} />
              <MetricCard label="RMSE" value={selectedRun.rmse} />
              <MetricCard label="MAE" value={selectedRun.mae} />
              <MetricCard label="MAPE" value={selectedRun.mape} suffix="%" />
              <MetricCard label="COD" value={selectedRun.cod} suffix="%" />
              <MetricCard label="PRD" value={selectedRun.prd} />
            </motion.div>
          )}
          {selectedRun?.status === "completed" && selectedRun.training_time_ms && (
            <p className="text-xs text-muted-foreground">
              Training time: {(selectedRun.training_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
