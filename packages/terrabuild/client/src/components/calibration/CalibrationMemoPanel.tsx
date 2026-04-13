import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CalibrationMemo {
  id: number;
  matrixVersionId: number;
  section1Purpose: string | null;
  section2DataUsed: string | null;
  section3DiagnosticsSummary: string | null;
  section4ChangeMade: string | null;
  section5ExpectedImpact: string | null;
  section6VerificationPlan: string | null;
  section7SignOffChain: string | null;
  section8Notes: string | null;
  completenessScore: number;
  signedBy: string | null;
  signedAt: string | null;
}

const SECTIONS: Array<{ key: keyof CalibrationMemo; label: string; hint: string }> = [
  { key: "section1Purpose", label: "1. Purpose / Trigger", hint: "What initiated this calibration session?" },
  { key: "section2DataUsed", label: "2. Data Used", hint: "Sales window, cleaning rules, exclusions." },
  { key: "section3DiagnosticsSummary", label: "3. Diagnostics Summary", hint: "PRD/PRB/COD before adjustment." },
  { key: "section4ChangeMade", label: "4. Change Made", hint: "Old/new version numbers, rates adjusted, effective date." },
  { key: "section5ExpectedImpact", label: "5. Expected Impact", hint: "County AV delta, projected PRD/PRB/COD after." },
  { key: "section6VerificationPlan", label: "6. Verification Plan", hint: "Post-change ratio study scheduled date." },
  { key: "section7SignOffChain", label: "7. Sign-Off Chain", hint: "Analyst → Chief Appraiser → Assessor." },
  { key: "section8Notes", label: "8. Appraiser Notes", hint: "Free narrative — market context, anomalies, judgment calls." },
];

interface Props {
  matrixVersionId: number;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function CalibrationMemoPanel({ matrixVersionId }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");

  const { data: memo, isLoading } = useQuery<CalibrationMemo>({
    queryKey: ["calibration-memo", matrixVersionId],
    queryFn: () =>
      fetch(`/api/calibrationmemo?matrixVersionId=${matrixVersionId}`).then((r) => r.json()),
  });

  const autoDraft = useMutation({
    mutationFn: () =>
      fetch("/api/calibrationmemo/auto-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrixVersionId }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibration-memo", matrixVersionId] }),
  });

  const updateSection = useMutation({
    mutationFn: ({ sectionKey, content }: { sectionKey: string; content: string }) =>
      fetch(`/api/calibrationmemo/${memo?.id}/section`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, content }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calibration-memo", matrixVersionId] });
      setEditing(null);
    },
  });

  if (isLoading) return <div className="h-32 bg-muted animate-pulse rounded" />;

  if (!memo) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No memo yet for this version.</p>
        <Button size="sm" onClick={() => autoDraft.mutate()} disabled={autoDraft.isPending}>
          {autoDraft.isPending ? "Drafting…" : "Auto-Draft Memo"}
        </Button>
      </div>
    );
  }

  const ready = memo.completenessScore >= 75;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm">Calibration Memo</CardTitle>
          <span className={`text-sm font-mono font-bold ${scoreColor(memo.completenessScore)}`}>
            {memo.completenessScore}%
          </span>
          {ready ? (
            <Badge className="bg-green-700 text-[10px] px-1.5">READY FOR REVIEW</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 text-muted-foreground">
              Need {75 - memo.completenessScore}% more to submit
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => autoDraft.mutate()} disabled={autoDraft.isPending}>
          {autoDraft.isPending ? "Refreshing…" : "Refresh Auto-Draft"}
        </Button>
      </div>

      <div className="space-y-2">
        {SECTIONS.map(({ key, label, hint }) => {
          const content = memo[key] as string | null;
          const isEditing = editing === key;

          return (
            <Card key={key} className="border-muted">
              <CardHeader
                className="py-2 px-3 cursor-pointer"
                onClick={() => {
                  if (!isEditing) {
                    setEditing(key as string);
                    setDraft(content ?? "");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{label}</span>
                  {!content && <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">EMPTY</Badge>}
                  {content && <span className="text-xs text-muted-foreground truncate max-w-xs">{content.slice(0, 80)}{content.length > 80 ? "…" : ""}</span>}
                </div>
              </CardHeader>

              {isEditing && (
                <CardContent className="pt-0 pb-3 px-3 space-y-2">
                  <p className="text-xs text-muted-foreground">{hint}</p>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    className="text-xs"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateSection.mutate({ sectionKey: key as string, content: draft })}
                      disabled={updateSection.isPending}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {memo.signedBy && (
        <p className="text-xs text-muted-foreground">
          Signed by {memo.signedBy} on {new Date(memo.signedAt!).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
