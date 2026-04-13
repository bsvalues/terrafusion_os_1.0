import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type EvidenceStatus = "CURRENT" | "AGING" | "STALE" | "CRITICAL";

interface RevalAreaEvidenceAge {
  revalArea: string;
  factor: string;
  lastRatioStudyDate: string;
  saleCount: number;
  medianRatio: number;
  evidenceAgeMonths: number;
  evidenceStatus: EvidenceStatus;
}

interface Props {
  evidenceAges: RevalAreaEvidenceAge[];
}

const statusConfig: Record<EvidenceStatus, { label: string; className: string }> = {
  CURRENT: { label: "CURRENT", className: "bg-green-700" },
  AGING: { label: "AGING", className: "bg-yellow-600" },
  STALE: { label: "STALE", className: "bg-orange-600" },
  CRITICAL: { label: "CRITICAL", className: "bg-red-700" },
};

export function RevalAreaEvidenceAgeIndicator({ evidenceAges }: Props) {
  if (!evidenceAges.length) return null;

  return (
    <div className="space-y-1">
      {evidenceAges.map((ea) => {
        const config = statusConfig[ea.evidenceStatus];
        return (
          <Tooltip key={`${ea.revalArea}-${ea.factor}`}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between gap-4 px-3 py-1.5 rounded border bg-muted/30 cursor-default text-xs font-mono">
                <span className="text-muted-foreground w-24 truncate">{ea.revalArea}</span>
                <span className="flex-1 text-foreground">{ea.factor}</span>
                <span className="text-muted-foreground">{ea.evidenceAgeMonths}mo</span>
                <Badge className={config.className + " text-[10px] px-1.5 py-0"}>{config.label}</Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last study: {new Date(ea.lastRatioStudyDate).toLocaleDateString()}</p>
              <p>n={ea.saleCount} · median ratio {ea.medianRatio.toFixed(3)}</p>
              {ea.evidenceStatus === "STALE" && <p className="text-orange-400">WAC 458-07 compliance risk</p>}
              {ea.evidenceStatus === "CRITICAL" && <p className="text-red-400">Immediate review required</p>}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
