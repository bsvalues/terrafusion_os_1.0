import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export type FindingClassification = "RATE_PROBLEM" | "DATA_PROBLEM" | "EXTERNAL_FACTOR" | "NO_ACTION";
export type ResolutionStatus = "OPEN" | "ACCEPTED" | "OVERRIDDEN" | "DEFERRED" | "SENT_TO_WORKBENCH";

export interface CalibrationFinding {
  id: number;
  matrixVersionId: number;
  classification: FindingClassification;
  buildingType: string;
  revalArea: string | null;
  prdValue: number | null;
  prbValue: number | null;
  codValue: number | null;
  proposedAdjustmentPct: number | null;
  estimatedAvImpact: number | null;
  evidenceSummary: string | null;
  outlierParcelIds: string | null;
  resolutionStatus: ResolutionStatus;
  appraiserNote: string | null;
}

interface Props {
  matrixVersionId: number;
}

const classificationConfig: Record<FindingClassification, { label: string; className: string }> = {
  RATE_PROBLEM: { label: "RATE PROBLEM", className: "bg-red-700" },
  DATA_PROBLEM: { label: "DATA PROBLEM", className: "bg-orange-600" },
  EXTERNAL_FACTOR: { label: "EXTERNAL FACTOR", className: "bg-blue-600" },
  NO_ACTION: { label: "NO ACTION", className: "bg-gray-600" },
};

const statusConfig: Record<ResolutionStatus, { label: string; className: string }> = {
  OPEN: { label: "OPEN", className: "bg-yellow-700" },
  ACCEPTED: { label: "ACCEPTED", className: "bg-green-700" },
  OVERRIDDEN: { label: "OVERRIDDEN", className: "bg-purple-700" },
  DEFERRED: { label: "DEFERRED", className: "bg-gray-700" },
  SENT_TO_WORKBENCH: { label: "SENT TO WORKBENCH", className: "bg-blue-700" },
};

function FindingCard({ finding }: { finding: CalibrationFinding }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(finding.appraiserNote ?? "");
  const [expanded, setExpanded] = useState(false);

  const resolve = useMutation({
    mutationFn: (status: ResolutionStatus) =>
      fetch(`/api/calibrationdiagnostic/findings/${finding.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionStatus: status, appraiserNote: note }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration-findings"] }),
  });

  const sendToWorkbench = useMutation({
    mutationFn: () =>
      fetch(`/api/calibrationdiagnostic/findings/${finding.id}/flag-to-workbench`, {
        method: "POST",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration-findings"] }),
  });

  const cls = classificationConfig[finding.classification];
  const sts = statusConfig[finding.resolutionStatus];
  const isOpen = finding.resolutionStatus === "OPEN";

  return (
    <Card className="border-muted">
      <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={cls.className + " text-xs"}>{cls.label}</Badge>
          <span className="text-sm font-mono font-medium">{finding.buildingType}</span>
          {finding.revalArea && (
            <span className="text-xs text-muted-foreground">· {finding.revalArea}</span>
          )}
          <span className="text-xs font-mono ml-auto">
            {finding.prdValue != null && <>PRD {finding.prdValue.toFixed(3)} · </>}
            {finding.prbValue != null && <>PRB {finding.prbValue.toFixed(3)} · </>}
            {finding.codValue != null && <>COD {finding.codValue.toFixed(1)}%</>}
          </span>
          {finding.estimatedAvImpact != null && (
            <span className="text-xs text-muted-foreground">
              AV Δ ${(finding.estimatedAvImpact / 1_000_000).toFixed(1)}M
            </span>
          )}
          <Badge className={sts.className + " text-[10px] px-1.5 py-0 ml-1"}>{sts.label}</Badge>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-3">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{finding.evidenceSummary}</p>

          {finding.proposedAdjustmentPct != null && (
            <div className="text-xs font-mono bg-muted/40 px-3 py-2 rounded">
              Proposed adjustment: <strong>{finding.proposedAdjustmentPct > 0 ? "+" : ""}{finding.proposedAdjustmentPct.toFixed(2)}%</strong>
            </div>
          )}

          {finding.outlierParcelIds && (
            <div className="text-xs text-muted-foreground">
              Outlier parcels: <span className="font-mono">{finding.outlierParcelIds}</span>
            </div>
          )}

          {isOpen && (
            <div className="space-y-2">
              <Textarea
                placeholder="Appraiser note (optional)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="text-xs"
              />
              <div className="flex gap-2 flex-wrap">
                {finding.classification === "RATE_PROBLEM" && (
                  <Button size="sm" variant="default" onClick={() => resolve.mutate("ACCEPTED")}>
                    Accept Recommendation
                  </Button>
                )}
                {finding.classification === "DATA_PROBLEM" && (
                  <Button size="sm" variant="default" onClick={() => sendToWorkbench.mutate()}>
                    Send to Property Workbench
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => resolve.mutate("OVERRIDDEN")}>
                  Override (Manual)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resolve.mutate("DEFERRED")}>
                  Defer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function AIFindingQueue({ matrixVersionId }: Props) {
  const qc = useQueryClient();
  const { data: findings, isLoading } = useQuery<CalibrationFinding[]>({
    queryKey: ["calibration-findings", matrixVersionId],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/findings?matrixVersionId=${matrixVersionId}`).then((r) => r.json()),
  });

  const runDiagnostics = useMutation({
    mutationFn: () =>
      fetch("/api/calibrationdiagnostic/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrixVersionId }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration-findings", matrixVersionId] }),
  });

  const openCount = findings?.filter((f) => f.resolutionStatus === "OPEN").length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm">
          AI Findings
          {openCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-[10px]">{openCount} open</Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => runDiagnostics.mutate()} disabled={runDiagnostics.isPending}>
          {runDiagnostics.isPending ? "Running…" : "Re-run Diagnostics"}
        </Button>
      </div>

      {isLoading && <div className="h-24 bg-muted animate-pulse rounded" />}

      {!isLoading && (!findings || findings.length === 0) && (
        <p className="text-sm text-muted-foreground">No findings. Run diagnostics to analyze the current matrix.</p>
      )}

      {findings?.map((f) => <FindingCard key={f.id} finding={f} />)}
    </div>
  );
}
