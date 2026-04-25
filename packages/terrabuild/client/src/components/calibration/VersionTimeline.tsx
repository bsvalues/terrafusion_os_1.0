import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevalAreaEvidenceAgeIndicator } from "./RevalAreaEvidenceAgeIndicator";
import type { EvidenceStatus } from "./RevalAreaEvidenceAgeIndicator";

type VersionStatus = "DRAFT" | "REVIEW" | "APPROVED" | "LOCKED" | "ARCHIVED";

interface EvidenceAge {
  revalArea: string;
  factor: string;
  lastRatioStudyDate: string;
  saleCount: number;
  medianRatio: number;
  evidenceAgeMonths: number;
  evidenceStatus: EvidenceStatus;
}

interface MatrixVersion {
  id: number;
  version: string;
  status: VersionStatus;
  versionType: "CALIBRATED" | "MANDATED" | "PATCH";
  effectiveDate: string | null;
  lockedAt: string | null;
  prdBefore: number | null;
  prdAfter: number | null;
  codBefore: number | null;
  codAfter: number | null;
  countyAvImpact: number | null;
  evidenceAges: EvidenceAge[];
}

const statusColors: Record<VersionStatus, string> = {
  DRAFT: "bg-yellow-700",
  REVIEW: "bg-blue-700",
  APPROVED: "bg-teal-700",
  LOCKED: "bg-green-700",
  ARCHIVED: "bg-gray-600",
};

const nextTransition: Partial<Record<VersionStatus, VersionStatus>> = {
  DRAFT: "REVIEW",
  REVIEW: "APPROVED",
  APPROVED: "LOCKED",
};

interface Props {
  countyId?: string;
  activeDraftId: number | null;
  onDraftSelected: (id: number) => void;
}

export function VersionTimeline({ countyId, activeDraftId, onDraftSelected }: Props) {
  const qc = useQueryClient();

  const { data: versions, isLoading } = useQuery<MatrixVersion[]>({
    queryKey: ["matrix-versions"],
    queryFn: () => fetch("/api/matrixversion").then((r) => r.json()),
  });

  const transition = useMutation({
    mutationFn: ({ id, toStatus }: { id: number; toStatus: VersionStatus }) =>
      fetch(`/api/matrixversion/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      }).then((r) => {
        if (!r.ok) throw new Error("Transition failed — check memo completeness gate");
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matrix-versions"] }),
  });

  const createDraft = useMutation({
    mutationFn: () =>
      fetch("/api/matrixversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: `v${new Date().getFullYear()}.0-DRAFT`,
          versionType: "CALIBRATED",
          countyId: "00000000-0000-0000-0000-000000000001",
        }),
      }).then((r) => r.json()),
    onSuccess: (data: MatrixVersion) => {
      qc.invalidateQueries({ queryKey: ["matrix-versions"] });
      onDraftSelected(data.id);
    },
  });

  if (isLoading) return <div className="h-32 bg-muted animate-pulse rounded" />;

  const hasDraft = versions?.some((v) => v.status === "DRAFT");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Version Timeline</h3>
        {!hasDraft && (
          <Button size="sm" variant="outline" onClick={() => createDraft.mutate()} disabled={createDraft.isPending}>
            New Draft
          </Button>
        )}
      </div>

      {versions?.map((v) => {
        const next = nextTransition[v.status];
        const isActive = v.id === activeDraftId;

        return (
          <div
            key={v.id}
            className={[
              "rounded-lg border p-3 space-y-2 cursor-pointer transition-colors",
              isActive ? "border-primary bg-muted/30" : "border-muted hover:border-muted-foreground/40",
            ].join(" ")}
            onClick={() => v.status === "DRAFT" && onDraftSelected(v.id)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColors[v.status] + " text-[10px] px-1.5"}>{v.status}</Badge>
              <span className="text-sm font-mono font-semibold">{v.version}</span>
              <span className="text-xs text-muted-foreground">{v.versionType}</span>
              {v.lockedAt && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Locked {new Date(v.lockedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {(v.prdBefore !== null || v.prdAfter !== null) && (
              <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                {v.prdBefore !== null && <span>PRD before: {v.prdBefore.toFixed(3)}</span>}
                {v.prdAfter !== null && <span>after: {v.prdAfter.toFixed(3)}</span>}
                {v.countyAvImpact !== null && (
                  <span>AV Δ ${(v.countyAvImpact / 1_000_000).toFixed(1)}M</span>
                )}
              </div>
            )}

            {v.evidenceAges?.length > 0 && (
              <RevalAreaEvidenceAgeIndicator evidenceAges={v.evidenceAges} />
            )}

            {next && v.status !== "ARCHIVED" && (
              <Button
                size="sm"
                variant="default"
                className="mt-1"
                disabled={transition.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  transition.mutate({ id: v.id, toStatus: next });
                }}
              >
                Submit for {next}
              </Button>
            )}

            {transition.isError && (
              <p className="text-xs text-destructive">{(transition.error as Error).message}</p>
            )}
          </div>
        );
      })}

      {(!versions || versions.length === 0) && (
        <p className="text-sm text-muted-foreground">No versions yet. Create a draft to begin calibration.</p>
      )}
    </div>
  );
}
