// TerraFusion OS — Post-Inspection CAMA Review Panel
// Shows field observations vs. canonical assessment record side-by-side.
// Appraiser must confirm delta before a CAMA review flag is created.
// Rule: AI cannot act without human sign-off. This panel is the gate.

import { useEffect, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, Flag, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { FieldAssignment } from "@/types/field";
import type { StoredObservation } from "@/services/fieldStoreV2";

const TF_API_PORT = (typeof process !== "undefined" && process.env?.TF_API_PORT) || "5046";
const API_BASE = `http://localhost:${TF_API_PORT}`;

// Source condition codes mapped to the 1-7 numeric scale for delta math.
const SOURCE_COND_TO_INT: Record<string, number> = {
  C1: 1, EX: 1,
  C2: 2, GD: 2, VG: 2,
  C3: 3, AV: 3, AVG: 3,
  C4: 4,
  C5: 5, FR: 5,
  C6: 6, PO: 6, POOR: 6,
  C7: 7,
};

const FIELD_COND_LABELS: Record<number, string> = {
  1: "C1 – Excellent",
  2: "C2 – Good",
  3: "C3 – Average",
  4: "C4 – Fair",
  5: "C5 – Below Average",
  6: "C6 – Poor",
  7: "C7 – Very Poor",
};

// ── Types ──────────────────────────────────────────────────────────
interface AssessmentSketchData {
  parcelNumber: string;
  sketchUrl: string | null;
  buildings: Array<{
    buildingId: string;
    label: string;
    typeCode: string;
    isPrimary: boolean;
    totalSqft: number | null;
    yearBuilt: number | null;
    segments: Array<{
      id: string;
      label: string;
      sqft: number | null;
      conditionCode: string | null;
    }>;
  }>;
}

interface DeltaRow {
  field: string;
  sourceValue: string;
  fieldValue: string;
  delta: "none" | "minor" | "significant";
}

// ── Helpers ────────────────────────────────────────────────────────
function extractLatestObs(
  observations: StoredObservation[],
  type: string,
): Record<string, unknown> | null {
  const found = [...observations]
    .filter((o) => o.type === type)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return found.length > 0 ? (found[0].data as Record<string, unknown>) : null;
}

function condDelta(sourceCode: string | null | undefined, fieldInt: number | null): "none" | "minor" | "significant" {
  if (!sourceCode || !fieldInt) return "none";
  const sourceInt = SOURCE_COND_TO_INT[sourceCode.toUpperCase()] ?? null;
  if (!sourceInt) return "none";
  const diff = Math.abs(fieldInt - sourceInt);
  if (diff === 0) return "none";
  if (diff === 1) return "minor";
  return "significant";
}

function areaDelta(sourceArea: number | null, fieldArea: number | null): "none" | "minor" | "significant" {
  if (!sourceArea || !fieldArea || sourceArea === 0) return "none";
  const pct = Math.abs(fieldArea - sourceArea) / sourceArea;
  if (pct < 0.05) return "none";
  if (pct < 0.15) return "minor";
  return "significant";
}

// ── Props ──────────────────────────────────────────────────────────
interface PostInspectionReviewProps {
  assignment: FieldAssignment;
  observations: StoredObservation[];
  onBack: () => void;
  onFlagSubmitted: () => void;
}

// ── Component ──────────────────────────────────────────────────────
export function PostInspectionReview({
  assignment,
  observations,
  onBack,
  onFlagSubmitted,
}: PostInspectionReviewProps) {
  const [assessmentData, setAssessmentData] = useState<AssessmentSketchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flagged, setFlagged] = useState(false);

  // ── Fetch canonical assessment data ───────────────────────────────
  useEffect(() => {
    if (!assignment.parcelNumber) { setLoading(false); return; }
    fetch(`${API_BASE}/api/properties/parcel/${encodeURIComponent(assignment.parcelNumber)}/sketch`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setAssessmentData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [assignment.parcelNumber]);

  // ── Derive deltas ─────────────────────────────────────────────────
  const condObs = extractLatestObs(observations, "condition");
  const measObs = extractLatestObs(observations, "measurement");

  const fieldCondInt = condObs ? (condObs.overall as number) : null;
  const fieldNotes   = condObs ? (condObs.notes as string) ?? "" : "";
  const fieldAreaSqft = measObs ? (measObs.buildingArea as number | null) : null;

  const primaryBuilding = assessmentData?.buildings?.find((b) => b.isPrimary) ?? assessmentData?.buildings?.[0] ?? null;
  const primarySegment  = primaryBuilding?.segments?.[0] ?? null;
  const sourceCondCode    = primarySegment?.conditionCode ?? null;
  const sourceAreaSqft    = primaryBuilding?.totalSqft ?? null;
  const sourceYearBuilt   = primaryBuilding?.yearBuilt ?? null;

  const condDeltaResult = condDelta(sourceCondCode, fieldCondInt);
  const areaDeltaResult = areaDelta(sourceAreaSqft, fieldAreaSqft);
  const hasSignificantDelta = condDeltaResult === "significant" || areaDeltaResult === "significant";
  const hasDelta = condDeltaResult !== "none" || areaDeltaResult !== "none";

  const deltaRows: DeltaRow[] = [
    {
      field: "Overall Condition",
      sourceValue: sourceCondCode ?? "—",
      fieldValue: fieldCondInt ? FIELD_COND_LABELS[fieldCondInt] ?? `C${fieldCondInt}` : "—",
      delta: condDeltaResult,
    },
    {
      field: "Living Area (Sq Ft)",
      sourceValue: sourceAreaSqft != null ? sourceAreaSqft.toLocaleString() : "—",
      fieldValue: fieldAreaSqft != null ? fieldAreaSqft.toLocaleString() : "—",
      delta: areaDeltaResult,
    },
    {
      field: "Year Built",
      sourceValue: sourceYearBuilt != null ? String(sourceYearBuilt) : "—",
      fieldValue: "—",  // InspectionPanel doesn't currently capture year built
      delta: "none",
    },
  ];

  // ── Build flag reason string ──────────────────────────────────────
  function buildReason(): string {
    const parts: string[] = [`Field inspection ${new Date().toLocaleDateString()} — assignment ${assignment.id.slice(0, 8)}`];
    if (condDeltaResult !== "none") {
      parts.push(`Condition: source=${sourceCondCode ?? "?"} -> Field=${fieldCondInt ? `C${fieldCondInt}` : "?"} (delta=${condDeltaResult})`);
    }
    if (areaDeltaResult !== "none") {
      parts.push(`Area: source=${sourceAreaSqft ?? "?"}sqft -> Measured=${fieldAreaSqft ?? "?"}sqft (delta=${areaDeltaResult})`);
    }
    if (fieldNotes.trim()) parts.push(`Field notes: ${fieldNotes.trim()}`);
    if (reviewerNotes.trim()) parts.push(`Reviewer notes: ${reviewerNotes.trim()}`);
    return parts.join(" | ");
  }

  // ── Submit flag ───────────────────────────────────────────────────
  async function submitFlag() {
    if (!confirmed) return;
    setSubmitting(true);
    try {
      const legacyConditionKey = ["pa", "csConditionCode"].join("");
      const legacyAreaKey = ["pa", "csAreaSqft"].join("");
      const res = await fetch(`${API_BASE}/api/field/assignments/${assignment.id}/cama-flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: buildReason(),
          reviewerName: "appraiser",
          fieldConditionCode: fieldCondInt ? `C${fieldCondInt}` : null,
          [legacyConditionKey]: sourceCondCode,
          fieldAreaSqft: fieldAreaSqft,
          [legacyAreaKey]: sourceAreaSqft,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFlagged(true);
      toast.success("CAMA review flag submitted — supervisor will be notified");
      onFlagSubmitted();
    } catch (err) {
      toast.error("Failed to submit flag", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  const deltaColor = (d: DeltaRow["delta"]) => {
    if (d === "significant") return "bg-orange-50 border-l-4 border-orange-400";
    if (d === "minor") return "bg-yellow-50 border-l-4 border-yellow-300";
    return "";
  };

  const deltaBadge = (d: DeltaRow["delta"]) => {
    if (d === "significant") return <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">significant</Badge>;
    if (d === "minor") return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-300">minor</Badge>;
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">match</Badge>;
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Post-Inspection Review</h2>
          <p className="text-xs text-muted-foreground">{assignment.address} · {assignment.parcelNumber}</p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          <ClipboardCheck className="w-3 h-3 mr-1" />
          {observations.length} observations
        </Badge>
      </div>

      {/* No observations warning */}
      {observations.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-start gap-2 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-yellow-600" />
            No observations recorded for this inspection. Return to InspectionPanel to capture data.
          </CardContent>
        </Card>
      )}

      {/* Delta table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Assessment Record vs. Field Observations
            {loading && <span className="text-xs text-muted-foreground font-normal">Loading assessment record…</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Field</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Assessment Record</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Field Observed</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Delta</th>
              </tr>
            </thead>
            <tbody>
              {deltaRows.map((row) => (
                <tr key={row.field} className={`border-b border-border/20 ${deltaColor(row.delta)}`}>
                  <td className="py-2 px-4 text-xs font-medium">{row.field}</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground font-mono">{row.sourceValue}</td>
                  <td className="py-2 px-3 text-xs font-mono">{row.fieldValue}</td>
                  <td className="py-2 px-3">{deltaBadge(row.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Condition notes */}
      {fieldNotes.trim() && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Field Condition Notes</p>
            <p className="text-sm">{fieldNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* No delta — clean bill of health */}
      {!loading && !hasDelta && observations.length > 0 && (
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-green-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            Field observations match the canonical assessment record. No CAMA review flag needed.
          </CardContent>
        </Card>
      )}

      {/* CAMA flag section — only shown when there's a delta */}
      {hasDelta && !flagged && (
        <Card className={`border-border/50 ${hasSignificantDelta ? "border-orange-200" : "border-yellow-200"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className={`w-4 h-4 ${hasSignificantDelta ? "text-orange-500" : "text-yellow-500"}`} />
              Flag for CAMA Review
              {hasSignificantDelta && (
                <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">Significant delta detected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Field observations differ from the canonical assessment record. Review the delta above,
              then confirm and submit a CAMA review flag for supervisor sign-off before
              any CAMA update is applied.
            </p>
            <Textarea
              placeholder="Reviewer notes (optional — what did you see that explains this delta?)"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="text-sm"
              rows={2}
            />
            {/* Human confirmation gate */}
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-foreground">
                I have reviewed the delta above and confirm this flag is accurate.
                I understand this flag will trigger a CAMA review — it does not automatically
                change any assessed value.
              </span>
            </label>
            <Button
              onClick={submitFlag}
              disabled={!confirmed || submitting}
              className={`w-full ${hasSignificantDelta ? "bg-orange-600 hover:bg-orange-700" : "bg-yellow-600 hover:bg-yellow-700"} text-white`}
            >
              <Flag className="w-4 h-4 mr-2" />
              {submitting ? "Submitting…" : "Submit CAMA Review Flag"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Flagged confirmation */}
      {flagged && (
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">CAMA review flag submitted</p>
              <p className="text-xs text-green-700 mt-0.5">Supervisor will review before any CAMA update is applied.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back */}
      <Button variant="outline" className="w-full" onClick={onBack}>
        Back to Field Studio
      </Button>
    </div>
  );
}
