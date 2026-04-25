// TerraFusion OS — Swarm Activity Bar
// Parallel agent visualization for TerraPilot Swarm.
// Mined from terra-forge-rebuild src/components/workbench/SwarmActivityBar.tsx
// Self-contained: no Supabase deps. Pure props.

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwarmTaskStatus {
  agent: string;
  tool: string;
  status: "pending" | "active" | "done" | "error";
  execution_time_ms?: number;
}

export interface SwarmPhase {
  phase: "routing" | "dispatching" | "executing" | "synthesizing" | "complete";
  message?: string;
  intent?: string;
  tasks?: SwarmTaskStatus[];
  complexity?: string;
  total_time_ms?: number;
}

const PHASE_ORDER = ["routing", "dispatching", "executing", "synthesizing", "complete"] as const;

const PHASE_LABELS: Record<string, string> = {
  routing: "Analyzing intent…",
  dispatching: "Dispatching agents…",
  executing: "Agents executing…",
  synthesizing: "Merging results…",
  complete: "Complete",
};

const AGENT_COLORS: Record<string, string> = {
  forge: "border-[hsl(var(--suite-forge))] text-[hsl(var(--suite-forge))]",
  dais: "border-[hsl(var(--suite-dais))] text-[hsl(var(--suite-dais))]",
  dossier: "border-[hsl(var(--suite-dossier))] text-[hsl(var(--suite-dossier))]",
  atlas: "border-[hsl(var(--suite-atlas))] text-[hsl(var(--suite-atlas))]",
  os: "border-primary text-primary",
};

export function SwarmActivityBar({ phase }: { phase: SwarmPhase }) {
  const currentIndex = PHASE_ORDER.indexOf(phase.phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-card/50 border border-border/30"
    >
      {/* Phase progress dots */}
      <div className="flex items-center gap-1.5">
        {PHASE_ORDER.slice(0, -1).map((p, i) => (
          <div key={p} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentIndex > i
                  ? "bg-primary"
                  : currentIndex === i
                  ? "bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                  : "bg-muted"
              )}
            />
            {i < PHASE_ORDER.length - 2 && (
              <div
                className={cn(
                  "w-4 h-px transition-colors duration-300",
                  currentIndex > i ? "bg-primary/50" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}

        <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
          {phase.phase === "executing" && phase.tasks
            ? `${phase.tasks.filter((t) => t.status === "active").length} agents active`
            : PHASE_LABELS[phase.phase]}
        </span>

        {phase.phase === "complete" && phase.total_time_ms && (
          <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            {phase.total_time_ms}ms
          </span>
        )}
      </div>

      {/* Agent task badges */}
      <AnimatePresence>
        {phase.tasks && phase.tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1"
          >
            {phase.tasks.map((t, i) => (
              <motion.div
                key={`${t.agent}-${t.tool}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] gap-1 transition-all duration-300",
                    AGENT_COLORS[t.agent] ?? "border-border text-muted-foreground",
                    t.status === "active" && "animate-pulse",
                    t.status === "done" && "opacity-70",
                    t.status === "error" && "border-destructive text-destructive"
                  )}
                >
                  {t.status === "active" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  {t.status === "done" && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {t.status === "error" && <XCircle className="w-2.5 h-2.5" />}
                  {t.agent}/{t.tool}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intent summary */}
      {phase.intent && (
        <p className="text-[10px] text-muted-foreground italic truncate">"{phase.intent}"</p>
      )}
    </motion.div>
  );
}
