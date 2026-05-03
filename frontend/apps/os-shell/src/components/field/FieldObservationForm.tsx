// TerraFusion OS — Field Observation Form
// Quick condition + notes observation capture.
// WRITE-LANE: persistence via onSave callback — not direct store access.
// Harvested from terra-forge-rebuild

import { useState } from "react";
import { ClipboardList, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { ObservationType } from "@/types/field";

export interface FieldObservationFormProps {
  parcelId: string;
  assignmentId: string;
  onSave: (observation: {
    assignmentId: string;
    parcelId: string;
    type: ObservationType;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    data: Record<string, unknown>;
  }) => Promise<void>;
  onSaved?: () => void;
}

const CONDITION_OPTIONS = [
  { value: "C1", label: "C1 — New / Excellent" },
  { value: "C2", label: "C2 — Near New" },
  { value: "C3", label: "C3 — Good" },
  { value: "C4", label: "C4 — Average" },
  { value: "C5", label: "C5 — Fair" },
  { value: "C6", label: "C6 — Poor" },
  { value: "C7", label: "C7 — Very Poor" },
];

export function FieldObservationForm({ parcelId, assignmentId, onSave, onSaved }: FieldObservationFormProps) {
  const [condition, setCondition] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = condition !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        assignmentId,
        parcelId,
        type: "condition",
        timestamp: new Date().toISOString(),
        latitude: null,
        longitude: null,
        data: {
          condition,
          notes: notes.trim() || null,
          _observationType: "condition_rating",
        },
      });
      toast.success("Observation saved");
      setCondition("");
      setNotes("");
      onSaved?.();
    } catch {
      toast.error("Failed to save observation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 p-4" data-testid="field-observation-form">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ClipboardList className="w-4 h-4 text-primary" />
        Quick Observation
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Condition Rating</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger className="h-9 text-xs" data-testid="condition-select">
            <SelectValue placeholder="Select condition…" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Condition notes, exterior observations…"
          className="text-xs resize-none"
          rows={2}
          data-testid="notes-textarea"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!canSave}
        size="sm"
        className="w-full"
        data-testid="save-observation-btn"
      >
        <Send className="w-3.5 h-3.5 mr-1.5" />
        {saving ? "Saving…" : "Save Observation"}
      </Button>
    </div>
  );
}
