// TerraFusion OS — Inspection Panel (Field Studio)
// Full field inspection interface with condition/quality rubrics, measurements, photos, notes, anomalies.
// WRITE-LANE: all persistence via callbacks — not direct store access.
// Harvested from terra-forge-rebuild

import { useState, useCallback } from "react";
import {
  ArrowLeft, Camera, Ruler, ClipboardCheck, MessageSquare,
  AlertTriangle, CheckCircle2, MapPin, Save, PenTool,
} from "lucide-react";
import { SketchModule } from "@/components/sketch";
import { GpsTracker } from "./GpsTracker";
import { PhotoCaptureGrid } from "./PhotoCaptureGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { FieldAssignment, FieldObservation, CapturedPhoto } from "@/types/field";

const CONDITION_LABELS = ["", "C1 Excellent", "C2 Good", "C3 Above Avg", "C4 Average", "C5 Below Avg", "C6 Poor", "C7 Unsound"];
const QUALITY_LABELS = ["", "Q1 Luxury", "Q2 Custom", "Q3 Above Avg", "Q4 Average", "Q5 Fair", "Q6 Minimal"];

export interface InspectionPanelProps {
  assignment: FieldAssignment;
  observations: FieldObservation[];
  onBack: () => void;
  onSaveObservation: (obs: Omit<FieldObservation, "id" | "syncStatus">) => Promise<void>;
  onUpdateStatus: (assignmentId: string, status: string) => Promise<void>;
  onRefreshObservations: () => Promise<void>;
}

export function InspectionPanel({
  assignment,
  observations,
  onBack,
  onSaveObservation,
  onUpdateStatus,
  onRefreshObservations,
}: InspectionPanelProps) {
  const [activeTab, setActiveTab] = useState("condition");
  const [saving, setSaving] = useState(false);
  const [showSketch, setShowSketch] = useState(false);

  // Condition rubric state
  const [condOverall, setCondOverall] = useState(4);
  const [condRoof, setCondRoof] = useState(4);
  const [condExterior, setCondExterior] = useState(4);
  const [condInterior, setCondInterior] = useState(4);
  const [condMechanical, setCondMechanical] = useState(4);
  const [condNotes, setCondNotes] = useState("");

  // Quality rubric state
  const [qualOverall, setQualOverall] = useState(4);
  const [qualMaterials, setQualMaterials] = useState(4);
  const [qualWorkmanship, setQualWorkmanship] = useState(4);
  const [qualDesign, setQualDesign] = useState(4);
  const [qualNotes, setQualNotes] = useState("");

  // Measurement state
  const [buildingArea, setBuildingArea] = useState("");
  const [landArea, setLandArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  // Note state
  const [noteText, setNoteText] = useState("");

  // Anomaly state
  const [anomalyType, setAnomalyType] = useState("boundary_mismatch");
  const [anomalyDesc, setAnomalyDesc] = useState("");

  // Photos
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);

  const getLocation = useCallback((): Promise<{ lat: number | null; lng: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  }, []);

  const saveObservation = async (type: FieldObservation["type"], data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const loc = await getLocation();
      await onSaveObservation({
        assignmentId: assignment.id,
        parcelId: assignment.parcelId,
        type,
        timestamp: new Date().toISOString(),
        latitude: loc.lat,
        longitude: loc.lng,
        data,
      });
      await onUpdateStatus(assignment.id, "in_progress");
      await onRefreshObservations();
      toast.success(`${type} observation saved`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save", { description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    await onUpdateStatus(assignment.id, "completed");
    toast.success("Inspection marked complete");
    onBack();
  };

  if (showSketch) {
    return (
      <SketchModule
        parcelId={assignment.parcelId}
        currentGLA={undefined}
        onBack={() => setShowSketch(false)}
        onSaveObservation={async (obs) => {
          await onSaveObservation({
            assignmentId: assignment.id,
            parcelId: obs.parcelId,
            type: "measurement",
            timestamp: obs.timestamp,
            latitude: obs.latitude,
            longitude: obs.longitude,
            data: obs.data,
          });
          await onRefreshObservations();
          setShowSketch(false);
        }}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      {/* GPS Tracker */}
      <GpsTracker className="mb-1" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{assignment.address}</h2>
          <p className="text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 inline mr-0.5" />
            {assignment.parcelNumber} · ${assignment.currentValue?.toLocaleString()}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {observations.length} obs
        </Badge>
      </div>

      {/* Inspection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 w-full grid grid-cols-7 h-auto">
          <TabsTrigger value="condition" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5">
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Condition</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Quality</span>
          </TabsTrigger>
          <TabsTrigger value="measure" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5">
            <Ruler className="w-4 h-4" />
            <span className="hidden sm:inline">Measure</span>
          </TabsTrigger>
          <TabsTrigger value="sketch" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5" onClick={() => setShowSketch(true)}>
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Sketch</span>
          </TabsTrigger>
          <TabsTrigger value="photo" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Photo</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="anomaly" className="text-[10px] sm:text-xs py-2 flex flex-col gap-0.5">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Flag</span>
          </TabsTrigger>
        </TabsList>

        {/* Condition Tab */}
        <TabsContent value="condition" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Condition Rubric (C1–C7)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RubricSlider label="Overall" value={condOverall} onChange={setCondOverall} labels={CONDITION_LABELS} max={7} />
              <RubricSlider label="Roof" value={condRoof} onChange={setCondRoof} labels={CONDITION_LABELS} max={7} />
              <RubricSlider label="Exterior" value={condExterior} onChange={setCondExterior} labels={CONDITION_LABELS} max={7} />
              <RubricSlider label="Interior" value={condInterior} onChange={setCondInterior} labels={CONDITION_LABELS} max={7} />
              <RubricSlider label="Mechanical" value={condMechanical} onChange={setCondMechanical} labels={CONDITION_LABELS} max={7} />
              <Textarea
                placeholder="Condition notes..."
                value={condNotes}
                onChange={(e) => setCondNotes(e.target.value)}
                className="text-sm"
                rows={2}
              />
              <Button onClick={() => saveObservation("condition", {
                overall: condOverall, roof: condRoof, exterior: condExterior,
                interior: condInterior, mechanical: condMechanical, notes: condNotes,
              })} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Condition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quality Rubric (Q1–Q6)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RubricSlider label="Overall" value={qualOverall} onChange={setQualOverall} labels={QUALITY_LABELS} max={6} />
              <RubricSlider label="Materials" value={qualMaterials} onChange={setQualMaterials} labels={QUALITY_LABELS} max={6} />
              <RubricSlider label="Workmanship" value={qualWorkmanship} onChange={setQualWorkmanship} labels={QUALITY_LABELS} max={6} />
              <RubricSlider label="Design" value={qualDesign} onChange={setQualDesign} labels={QUALITY_LABELS} max={6} />
              <Textarea
                placeholder="Quality notes..."
                value={qualNotes}
                onChange={(e) => setQualNotes(e.target.value)}
                className="text-sm"
                rows={2}
              />
              <Button onClick={() => saveObservation("quality", {
                overall: qualOverall, materials: qualMaterials,
                workmanship: qualWorkmanship, design: qualDesign, notes: qualNotes,
              })} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Quality
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measure" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Property Measurements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Building Area (Sq Ft)</Label>
                  <Input type="number" value={buildingArea} onChange={(e) => setBuildingArea(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Land Area (Sq Ft)</Label>
                  <Input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Bedrooms</Label>
                  <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Bathrooms</Label>
                  <Input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => saveObservation("measurement", {
                buildingArea: buildingArea ? Number(buildingArea) : null,
                landArea: landArea ? Number(landArea) : null,
                bedrooms: bedrooms ? Number(bedrooms) : null,
                bathrooms: bathrooms ? Number(bathrooms) : null,
              })} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Measurements
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photo Tab */}
        <TabsContent value="photo" className="mt-4 space-y-4">
          <PhotoCaptureGrid
            photos={capturedPhotos}
            onCapture={(photo) => {
              setCapturedPhotos((prev) => [...prev, photo]);
              saveObservation("photo", { blob: photo.dataUrl, label: photo.label, photoCount: 1 });
            }}
            onRemove={(id) => setCapturedPhotos((prev) => prev.filter((p) => p.id !== id))}
            onLabelChange={(id, label) => setCapturedPhotos((prev) => prev.map((p) => p.id === id ? { ...p, label } : p))}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <Textarea
                placeholder="Field observations, access issues, owner conversation..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="text-sm"
                rows={4}
              />
              <Button onClick={() => {
                if (!noteText.trim()) return;
                saveObservation("note", { text: noteText });
                setNoteText("");
              }} disabled={saving || !noteText.trim()} className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Save Note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Tab */}
        <TabsContent value="anomaly" className="mt-4 space-y-4">
          <Card className="border-border/50 border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Flag Spatial Anomaly
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Anomaly Type</Label>
                <select
                  className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={anomalyType}
                  onChange={(e) => setAnomalyType(e.target.value)}
                >
                  <option value="boundary_mismatch">Boundary Mismatch</option>
                  <option value="missing_structure">Missing Structure</option>
                  <option value="new_construction">New Construction</option>
                  <option value="demolition">Demolition</option>
                  <option value="flood_zone">Flood Zone Issue</option>
                  <option value="access_issue">Access Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Textarea
                placeholder="Describe the anomaly..."
                value={anomalyDesc}
                onChange={(e) => setAnomalyDesc(e.target.value)}
                className="text-sm"
                rows={3}
              />
              <Button
                onClick={() => {
                  if (!anomalyDesc.trim()) return;
                  saveObservation("anomaly", { anomalyType, description: anomalyDesc });
                  setAnomalyDesc("");
                }}
                disabled={saving || !anomalyDesc.trim()}
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Flag Anomaly
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Observation History */}
      {observations.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Observations ({observations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-40 overflow-y-auto">
            {observations.map((obs) => (
              <div key={obs.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1 border-b border-border/30 last:border-0">
                <Badge variant="outline" className="text-[10px]">{obs.type}</Badge>
                <span className="flex-1 truncate">
                  {new Date(obs.timestamp).toLocaleTimeString()}
                </span>
                <Badge
                  variant="outline"
                  className={
                    obs.syncStatus === "synced"
                      ? "text-emerald-400 border-emerald-500/30"
                      : obs.syncStatus === "error"
                      ? "text-destructive border-destructive/30"
                      : "text-muted-foreground"
                  }
                >
                  {obs.syncStatus}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Complete Inspection */}
      <Button onClick={handleComplete} variant="default" className="w-full py-3">
        <CheckCircle2 className="w-5 h-5 mr-2" />
        Complete Inspection
      </Button>
    </div>
  );
}

// ── Rubric Slider ──────────────────────────────────────────────────
function RubricSlider({
  label,
  value,
  onChange,
  labels,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  labels: string[];
  max: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-mono text-primary">{labels[value]}</span>
      </div>
      <Slider
        min={1}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
