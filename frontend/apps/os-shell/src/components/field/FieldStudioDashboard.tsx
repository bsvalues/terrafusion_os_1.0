// TerraFusion OS — Field Studio Dashboard
// Harvested from terra-forge-rebuild — Supabase replaced with .NET API.
// Wires all 3 InspectionPanel callbacks to fieldStoreV2, provides sync + pull UI.

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ClipboardCheck, Wifi, WifiOff, Upload, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, Plus, RefreshCw, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getAssignments,
  saveAssignments,
  addObservation,
  getObservations,
  updateAssignmentStatus,
  type StoredObservation,
} from "@/services/fieldStoreV2";
import { useFieldSync } from "@/hooks/useFieldSync";
import { InspectionPanel } from "./InspectionPanel";
import { SyncStatusBanner } from "./SyncStatusBanner";
import type { FieldAssignment, FieldObservation, InspectionStatus } from "@/types/field";

// ── API helpers ────────────────────────────────────────────────────
const API_PORT = (globalThis as Record<string, unknown>).TF_API_PORT ?? 5046;

async function fetchParcelsForAssignment(count = 20): Promise<FieldAssignment[]> {
  const res = await fetch(
    `http://localhost:${API_PORT}/api/properties?page=1&limit=${count}`,
    { headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error(`Properties fetch failed: ${res.status}`);
  const body = await res.json();
  const items: unknown[] = Array.isArray(body) ? body : (body?.data ?? []);
  return items.map((p: unknown) => {
    const pp = p as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      parcelId: String(pp.id ?? pp.parcelId ?? ""),
      parcelNumber: String(pp.parcelNumber ?? pp.parcel_number ?? ""),
      address: String(pp.address ?? ""),
      city: String(pp.city ?? ""),
      latitude: typeof pp.latitude === "number" ? pp.latitude : null,
      longitude: typeof pp.longitude === "number" ? pp.longitude : null,
      currentValue: typeof pp.assessedValue === "number"
        ? pp.assessedValue
        : typeof pp.assessed_value === "number"
          ? pp.assessed_value
          : null,
      propertyClass: String(pp.propertyClass ?? pp.property_class ?? ""),
      priority: "routine" as const,
      status: "assigned" as const,
      assignedAt: new Date().toISOString(),
      inspectedAt: null,
      notes: null,
    };
  });
}

// ── Component ──────────────────────────────────────────────────────
export function FieldStudioDashboard() {
  const [assignments, setAssignments] = useState<FieldAssignment[]>([]);
  const [activeInspection, setActiveInspection] = useState<FieldAssignment | null>(null);
  const [observations, setObservations] = useState<StoredObservation[]>([]);
  const [activeTab, setActiveTab] = useState("assigned");
  const sync = useFieldSync();

  const loadData = useCallback(async () => {
    const all = await getAssignments();
    setAssignments(all);
    await sync.refresh();
  }, [sync]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload observations when inspection changes
  useEffect(() => {
    if (!activeInspection) return;
    getObservations(activeInspection.id).then(setObservations);
  }, [activeInspection]);

  // ── InspectionPanel callbacks ──────────────────────────────────
  const handleSaveObservation = useCallback(
    async (obs: Omit<FieldObservation, "id" | "syncStatus">) => {
      await addObservation(obs);
      if (activeInspection) {
        const updated = await getObservations(activeInspection.id);
        setObservations(updated);
      }
      await sync.refresh();
    },
    [activeInspection, sync],
  );

  const handleUpdateStatus = useCallback(
    async (assignmentId: string, status: string) => {
      await updateAssignmentStatus(assignmentId, status as InspectionStatus);
      await loadData();
    },
    [loadData],
  );

  const handleRefreshObservations = useCallback(async () => {
    if (!activeInspection) return;
    const updated = await getObservations(activeInspection.id);
    setObservations(updated);
  }, [activeInspection]);

  // ── Pull assignments from server ───────────────────────────────
  const pullAssignments = async () => {
    if (!sync.isOnline) { toast.error("Cannot pull assignments while offline"); return; }
    try {
      const newAssignments = await fetchParcelsForAssignment(20);
      if (!newAssignments.length) { toast.info("No parcels available"); return; }
      await saveAssignments(newAssignments);
      await loadData();
      toast.success(`${newAssignments.length} assignments cached for field work`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to pull assignments", { description: msg });
    }
  };

  // ── Manual sync ────────────────────────────────────────────────
  const handleSync = async () => {
    if (!sync.isOnline) { toast.error("Cannot sync while offline"); return; }
    const result = await sync.syncNow();
    await loadData();
    if (result.synced > 0) toast.success(`${result.synced} observations synced`);
    if (result.conflicts > 0) toast.warning(`${result.conflicts} conflicts — review queue`);
    if (result.errors > 0) toast.error(`${result.errors} failed (auto-retry pending)`);
    if (result.retried > 0) toast.info(`${result.retried} retried`);
  };

  const filterByStatus = (status: InspectionStatus) =>
    assignments.filter((a) => a.status === status);

  const hasPending = sync.queueStats.pending > 0 || sync.queueStats.error > 0;

  // ── Active inspection view ─────────────────────────────────────
  if (activeInspection) {
    return (
      <InspectionPanel
        assignment={activeInspection}
        onBack={() => { setActiveInspection(null); loadData(); }}
        onSaveObservation={handleSaveObservation}
        onUpdateStatus={handleUpdateStatus}
        onRefreshObservations={handleRefreshObservations}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <SyncStatusBanner sync={sync} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Field Studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Offline-first inspection · Event-sourced truth capture
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={sync.isOnline
              ? "border-primary/40 text-primary bg-primary/10"
              : "border-destructive/40 text-destructive bg-destructive/10"}
          >
            {sync.isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {sync.isOnline ? "Online" : "Offline"}
          </Badge>
          {sync.isOnline && (
            <Badge variant="outline" className="text-[10px] border-primary/20 text-muted-foreground">
              <Zap className="w-2.5 h-2.5 mr-0.5 text-primary" />
              Auto-sync
            </Badge>
          )}
        </div>
      </div>

      {/* Sync Bar */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {sync.queueStats.pending} pending
                </span>
                <span className="text-chart-5">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  {sync.queueStats.synced} synced
                </span>
                {sync.queueStats.error > 0 && (
                  <span className="text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    {sync.queueStats.error} errors
                  </span>
                )}
                {sync.lastSyncAt && (
                  <span className="text-xs text-muted-foreground">
                    Last: {new Date(sync.lastSyncAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {sync.isSyncing && sync.progress ? (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Syncing {sync.progress.completed}/{sync.progress.total}…</span>
                    <span>{Math.round((sync.progress.completed / Math.max(sync.progress.total, 1)) * 100)}%</span>
                  </div>
                  <Progress value={(sync.progress.completed / Math.max(sync.progress.total, 1)) * 100} className="h-1.5" />
                </div>
              ) : sync.queueStats.total > 0 ? (
                <Progress value={(sync.queueStats.synced / sync.queueStats.total) * 100} className="mt-2 h-1.5" />
              ) : null}
              {sync.lastSyncResult && !sync.isSyncing && (
                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                  {sync.lastSyncResult.conflicts > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-chart-4/10 text-chart-4 border-chart-4/30">
                      {sync.lastSyncResult.conflicts} conflicts
                    </Badge>
                  )}
                  {sync.lastSyncResult.retried > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                      {sync.lastSyncResult.retried} retried
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={pullAssignments} disabled={!sync.isOnline}>
                <Plus className="w-4 h-4 mr-1" />
                Pull
              </Button>
              <Button
                size="sm"
                onClick={handleSync}
                disabled={!sync.isOnline || sync.isSyncing || !hasPending}
                className="bg-primary text-primary-foreground"
              >
                {sync.isSyncing
                  ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  : <Upload className="w-4 h-4 mr-1" />}
                {sync.isSyncing ? "Syncing…" : "Sync"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="assigned" className="text-xs sm:text-sm">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Assigned ({filterByStatus("assigned").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
            <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
            In Progress ({filterByStatus("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Done ({filterByStatus("completed").length + filterByStatus("synced").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assigned" className="mt-4 space-y-2">
          <AssignmentList items={filterByStatus("assigned")} onSelect={setActiveInspection} emptyMessage="No assignments. Tap 'Pull' to fetch parcels." />
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4 space-y-2">
          <AssignmentList items={filterByStatus("in_progress")} onSelect={setActiveInspection} emptyMessage="No inspections in progress." />
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-2">
          <AssignmentList
            items={[...filterByStatus("completed"), ...filterByStatus("synced")]}
            onSelect={setActiveInspection}
            emptyMessage="No completed inspections."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Assignment Card List ───────────────────────────────────────────
function AssignmentList({
  items, onSelect, emptyMessage,
}: {
  items: FieldAssignment[];
  onSelect: (a: FieldAssignment) => void;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <AnimatePresence>
      {items.map((a) => (
        <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
          <Card
            className="cursor-pointer hover:border-primary/30 transition-colors border-border/50 bg-card/80"
            onClick={() => onSelect(a)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{a.address}</p>
                <p className="text-xs text-muted-foreground">
                  {a.parcelNumber} · {a.propertyClass || "—"} · ${a.currentValue?.toLocaleString() ?? "—"}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{a.priority}</Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
