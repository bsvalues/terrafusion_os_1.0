import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface DiagnosticsSummary {
  prd: number;
  prb: number;
  cod: number;
  saleCount: number;
  openFindingCount: number;
}

function statusBadge(prd: number) {
  if (prd >= 0.98 && prd <= 1.03) return <Badge className="bg-green-600">EQUITABLE</Badge>;
  if (prd >= 0.95 && prd <= 1.05) return <Badge className="bg-yellow-600">REVIEW</Badge>;
  return <Badge className="bg-red-600">ACTION REQUIRED</Badge>;
}

export function LiveDiagnosticsBar() {
  const { data } = useQuery<DiagnosticsSummary>({
    queryKey: ["calibration-summary"],
    queryFn: () => fetch("/api/calibrationdiagnostic/summary").then(r => r.json()),
    refetchInterval: 15_000,
  });

  if (!data) return <div className="h-10 bg-muted animate-pulse rounded" />;

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-card border rounded-lg text-sm font-mono">
      <span className="text-muted-foreground">Live Diagnostics</span>
      {statusBadge(data.prd)}
      <span>
        PRD{" "}
        <strong className={data.prd < 0.98 || data.prd > 1.03 ? "text-red-400" : "text-green-400"}>
          {data.prd.toFixed(3)}
        </strong>
      </span>
      <span>
        PRB{" "}
        <strong className={Math.abs(data.prb) > 0.05 ? "text-red-400" : "text-green-400"}>
          {data.prb.toFixed(3)}
        </strong>
      </span>
      <span>
        COD{" "}
        <strong className={data.cod > 20 ? "text-red-400" : "text-green-400"}>
          {data.cod.toFixed(1)}%
        </strong>
      </span>
      <span className="text-muted-foreground">n={data.saleCount.toLocaleString()} sales</span>
      {data.openFindingCount > 0 && (
        <Badge variant="destructive">{data.openFindingCount} open findings</Badge>
      )}
    </div>
  );
}
