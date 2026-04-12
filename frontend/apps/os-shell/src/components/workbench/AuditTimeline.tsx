// TerraFusion OS — Audit Timeline
// Filterable trace event timeline for any parcel or county.
// Mined from terra-forge-rebuild src/components/workbench/AuditTimeline.tsx
// Adapted: TFR hooks → apiFetch REST. RoleGate → hidden admin controls.
//          useActiveCountyId → useCountyConfig.

import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity, ChevronDown, ChevronRight, Clock, Filter,
  Link, Loader2, MapPin, RotateCcw, ShieldCheck, Trash2,
  User, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiBase";
import { useCountyConfig } from "@/hooks/useCountyConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TraceEvent {
  id: string;
  created_at: string;
  source_module: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  parcel_id: string | null;
  actor_id: string | null;
  sequence_number: number | null;
  event_hash: string | null;
  prev_hash: string | null;
  agent_id: string | null;
  redacted: boolean | null;
  correlation_id: string | null;
}

export interface AuditTimelineProps {
  /** Narrow to a specific parcel */
  parcelId?: string;
  /** Height of scroll area (default 520px) */
  maxHeight?: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  forge: "text-orange-400 bg-orange-950/40 border-orange-800/50",
  dais: "text-blue-400 bg-blue-950/40 border-blue-800/50",
  dossier: "text-violet-400 bg-violet-950/40 border-violet-800/50",
  atlas: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
  os: "text-slate-400 bg-slate-800/40 border-slate-700/50",
  terrapilot: "text-cyan-400 bg-cyan-950/40 border-cyan-800/50",
  system: "text-yellow-400 bg-yellow-950/40 border-yellow-800/50",
};

const MODULE_DOT: Record<string, string> = {
  forge: "bg-orange-400", dais: "bg-blue-400", dossier: "bg-violet-400",
  atlas: "bg-emerald-400", os: "bg-slate-400", terrapilot: "bg-cyan-400", system: "bg-yellow-400",
};

const SOURCE_MODULES = ["all", "forge", "dais", "dossier", "atlas", "os", "terrapilot", "system"];

function moduleColor(mod: string) { return MODULE_COLORS[mod] ?? "text-muted-foreground bg-muted/20 border-border"; }
function moduleDot(mod: string) { return MODULE_DOT[mod] ?? "bg-muted-foreground"; }

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event, onRedact }: { event: TraceEvent; onRedact: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isRedacted = event.redacted === true;
  const color = moduleColor(event.source_module);
  const dot = moduleDot(event.source_module);
  const formattedTime = format(new Date(event.created_at), "MMM d, HH:mm:ss");
  const hashShort = event.event_hash ? event.event_hash.slice(0, 10) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("border-b border-border/20 last:border-0", isRedacted && "opacity-50")}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/20 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
        <span className="text-xs font-medium text-foreground flex-1 truncate">
          {isRedacted ? "[REDACTED]" : event.event_type.replace(/_/g, " ")}
        </span>
        {event.agent_id && (
          <Badge variant="outline" className={cn("text-[9px] px-1.5 shrink-0 flex items-center gap-0.5", moduleColor(event.agent_id))}>
            <Zap className="w-2 h-2" />
            {event.agent_id}
          </Badge>
        )}
        <Badge variant="outline" className={cn("text-[9px] px-1.5 shrink-0", color)}>
          {event.source_module}
        </Badge>
        {hashShort && <span className="text-[9px] text-muted-foreground/60 font-mono hidden sm:inline">{hashShort}</span>}
        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />{formattedTime}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-3 space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <div><span className="font-medium text-foreground/70">Seq </span>{event.sequence_number ?? "—"}</div>
                {event.parcel_id && <div className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 shrink-0" /><span className="truncate">{event.parcel_id}</span></div>}
                {event.actor_id && <div className="flex items-center gap-1"><User className="w-2.5 h-2.5 shrink-0" /><span className="truncate font-mono">{event.actor_id.slice(0, 16)}…</span></div>}
                {event.correlation_id && <div className="flex items-center gap-1"><Link className="w-2.5 h-2.5 shrink-0" /><span className="truncate font-mono">{event.correlation_id.slice(0, 16)}…</span></div>}
                {event.prev_hash && <div className="col-span-2 flex items-center gap-1"><span className="font-medium text-foreground/70">Prev </span><span className="font-mono">{event.prev_hash.slice(0, 24)}…</span></div>}
              </div>
              {!isRedacted && event.event_data && (
                <pre className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 overflow-x-auto max-h-32">
                  {JSON.stringify(event.event_data, null, 2)}
                </pre>
              )}
              {!isRedacted && (
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:text-destructive text-[10px] h-6 px-2"
                  onClick={(e) => { e.stopPropagation(); onRedact(event.id); }}
                >
                  <Trash2 className="w-3 h-3 mr-1" />Redact event
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditTimeline({ parcelId, maxHeight = 520 }: AuditTimelineProps) {
  const { countyId } = useCountyConfig();
  const queryClient = useQueryClient();

  const [moduleFilter, setModuleFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [parcelIdFilter, setParcelIdFilter] = useState(parcelId ?? "");
  const [showFilters, setShowFilters] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (countyId) params.set("countyId", countyId);
  if (parcelIdFilter) params.set("parcelId", parcelIdFilter);
  if (moduleFilter !== "all") params.set("sourceModule", moduleFilter);
  if (eventTypeFilter) params.set("eventType", eventTypeFilter);
  params.set("limit", "100");

  const { data, isLoading, refetch } = useQuery<TraceEvent[]>({
    queryKey: ["audit-timeline", countyId, parcelIdFilter, moduleFilter, eventTypeFilter],
    enabled: !!countyId,
    queryFn: async () => {
      const res = await apiFetch(`/trace/events?${params.toString()}`);
      if (!res.ok) throw new Error(`Trace fetch ${res.status}`);
      return res.json() as Promise<TraceEvent[]>;
    },
  });

  const redactMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiFetch(`/trace/events/${eventId}/redact`, { method: "POST" });
      if (!res.ok) throw new Error(`Redact failed ${res.status}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit-timeline"] }),
  });

  const events = data ?? [];

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Audit Timeline
            {events.length > 0 && (
              <Badge variant="outline" className="text-[9px]">{events.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowFilters(!showFilters)}>
              <Filter className={cn("w-3.5 h-3.5", showFilters && "text-primary")} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refetch()}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Chain integrity badge */}
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Append-only TerraTrace ledger</span>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-muted-foreground">Module</Label>
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_MODULES.map((m) => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-muted-foreground">Event Type</Label>
                  <Input
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    placeholder="e.g. value_update"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-muted-foreground">Parcel ID</Label>
                  <Input
                    value={parcelIdFilter}
                    onChange={(e) => setParcelIdFilter(e.target.value)}
                    placeholder="Parcel ID"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No trace events found.</div>
        ) : (
          <ScrollArea style={{ height: maxHeight }}>
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onRedact={(id) => redactMutation.mutate(id)}
              />
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
