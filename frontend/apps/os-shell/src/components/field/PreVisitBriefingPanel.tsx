/**
 * PreVisitBriefingPanel
 *
 * "Before you go" intelligence card shown when a field assignment is selected.
 * Pulls real parcel data from the Properties API and a TerraPilot casefile summary.
 *
 * Rule: AI acts, but human eye has final sign-off.
 * This panel is informational only. Nothing executes until the officer
 * taps "Start Inspection" — which is the explicit human go-ahead.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, AlertTriangle, Info, ChevronDown, ChevronUp,
  CheckCircle2, ArrowRight, Building2, MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { invokePilotTool } from "@/api/pilotApi";
import type { FieldAssignment } from "@/types/field";

// ── API helpers ────────────────────────────────────────────────────
const API_PORT = (globalThis as Record<string, unknown>).TF_API_PORT ?? 5046;

interface ParcelSummary {
  parcelNumber: string;
  address: string;
  city: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  squareFeet: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyUseCode: string | null;
  neighborhood: string | null;
}

interface CasefileSummary {
  highlights: string[];
  flags: string[];
  lastChangedYear: number | null;
  rawText: string;
}

async function fetchParcelSummary(parcelNumber: string): Promise<ParcelSummary | null> {
  const res = await fetch(
    `http://localhost:${API_PORT}/api/properties/parcel/${encodeURIComponent(parcelNumber)}`,
  );
  if (!res.ok) return null;
  const d = await res.json();
  return {
    parcelNumber: d.parcelNumber ?? parcelNumber,
    address: d.address ?? "",
    city: d.city ?? "",
    assessedValue: d.assessedValue ?? 0,
    marketValue: d.marketValue ?? 0,
    landValue: d.landValue ?? 0,
    improvementValue: d.improvementValue ?? 0,
    squareFeet: d.squareFeet ?? null,
    yearBuilt: d.yearBuilt ?? null,
    bedrooms: d.bedrooms ?? null,
    bathrooms: d.bathrooms ?? null,
    propertyUseCode: d.useCode ?? null,
    neighborhood: d.neighborhood ?? null,
  };
}

async function fetchCasefileSummary(parcelId: string): Promise<CasefileSummary | null> {
  try {
    const res = await invokePilotTool({
      toolId: "summarize_parcel_casefile",
      params: { parcelId },
      parcelId,
      mode: "muse",
    });
    if (!res.ok || !res.result) return null;
    const r = res.result as Record<string, unknown>;
    return {
      highlights: Array.isArray(r.highlights) ? (r.highlights as string[]) : [],
      flags: Array.isArray(r.flags) ? (r.flags as string[]) : [],
      lastChangedYear: typeof r.lastChangedYear === "number" ? r.lastChangedYear : null,
      rawText: typeof r.summary === "string" ? r.summary : typeof r.text === "string" ? r.text : "",
    };
  } catch {
    return null;
  }
}

// ── Component ──────────────────────────────────────────────────────
export interface PreVisitBriefingPanelProps {
  assignment: FieldAssignment;
  onStartInspection: () => void;
  onDismiss: () => void;
}

export function PreVisitBriefingPanel({
  assignment,
  onStartInspection,
  onDismiss,
}: PreVisitBriefingPanelProps) {
  const [parcel, setParcel] = useState<ParcelSummary | null>(null);
  const [casefile, setCasefile] = useState<CasefileSummary | null>(null);
  const [parcelLoading, setParcelLoading] = useState(true);
  const [casefileLoading, setCasefileLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(async () => {
    const parcelNum = assignment.parcelNumber || assignment.parcelId;
    setParcelLoading(true);
    setCasefileLoading(true);

    // Fetch in parallel — parcel data first, casefile second
    fetchParcelSummary(parcelNum)
      .then(setParcel)
      .finally(() => setParcelLoading(false));

    fetchCasefileSummary(parcelNum)
      .then(setCasefile)
      .finally(() => setCasefileLoading(false));
  }, [assignment.parcelNumber, assignment.parcelId]);

  useEffect(() => { load(); }, [load]);

  const allLoaded = !parcelLoading && !casefileLoading;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span>Pre-Visit Brief</span>
            {allLoaded && (
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                Ready
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Review before driving to the site. You confirm this data — nothing runs until you say go.
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">{assignment.address || "Address not loaded"}</div>
              {assignment.city && (
                <div className="text-xs text-muted-foreground">{assignment.city}</div>
              )}
              <div className="text-xs font-mono text-muted-foreground mt-0.5">
                {assignment.parcelNumber || assignment.parcelId}
              </div>
            </div>
          </div>

          {/* Assessed value + characteristics */}
          {parcelLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading parcel data…
            </div>
          ) : parcel ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex justify-between col-span-2 pb-1 border-b border-border/50">
                  <span className="text-muted-foreground">Assessed Value</span>
                  <span className="font-bold text-foreground">
                    {parcel.assessedValue > 0 ? `$${parcel.assessedValue.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Land</span>
                  <span className="text-xs font-mono">
                    {parcel.landValue > 0 ? `$${parcel.landValue.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Improvement</span>
                  <span className="text-xs font-mono">
                    {parcel.improvementValue > 0 ? `$${parcel.improvementValue.toLocaleString()}` : "—"}
                  </span>
                </div>
                {parcel.squareFeet && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Sq Ft</span>
                    <span className="text-xs font-mono">{parcel.squareFeet.toLocaleString()}</span>
                  </div>
                )}
                {parcel.yearBuilt && parcel.yearBuilt > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Year Built</span>
                    <span className="text-xs font-mono">{parcel.yearBuilt}</span>
                  </div>
                )}
                {(parcel.bedrooms || parcel.bathrooms) && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground text-xs">Bed / Bath</span>
                    <span className="text-xs font-mono">
                      {parcel.bedrooms ?? "?"} / {parcel.bathrooms ?? "?"}
                    </span>
                  </div>
                )}
                {parcel.neighborhood && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Building2 className="w-3 h-3" />Neighborhood
                    </span>
                    <span className="text-xs">{parcel.neighborhood}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 py-1">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
              Parcel not found in database — verify parcel number.
            </div>
          )}

          {/* TerraPilot casefile summary */}
          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Casefile Intelligence
            </div>
            {casefileLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                TerraPilot scanning case history…
              </div>
            ) : casefile && (casefile.highlights.length > 0 || casefile.flags.length > 0 || casefile.rawText) ? (
              <div className="space-y-2">
                {casefile.flags.length > 0 && (
                  <div className="space-y-1">
                    {casefile.flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}
                {casefile.highlights.length > 0 && (
                  <ul className="space-y-1">
                    {casefile.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">·</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                {casefile.rawText && casefile.highlights.length === 0 && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{casefile.rawText}</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No prior casefile notes. First inspection for this parcel.
              </div>
            )}
          </div>

          {/* Human go/no-go */}
          <div className="border-t border-border/50 pt-3 space-y-2">
            {!reviewed ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Confirm you have reviewed this brief before proceeding to the site.
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewed(true)}
                  disabled={!allLoaded}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I've reviewed this brief
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Brief reviewed — your decision, your drive.
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={onDismiss} className="flex-1">
                    Back
                  </Button>
                  <Button size="sm" onClick={onStartInspection} className="flex-1">
                    Start Inspection
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default PreVisitBriefingPanel;
