// TerraFusion OS — Offline Sync Status Banner
// Persistent banner showing connectivity + sync queue status for field inspectors.
// Harvested from terra-forge-rebuild

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Cloud, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FieldSyncState } from "@/types/field";

interface SyncStatusBannerProps {
  sync: FieldSyncState;
  className?: string;
}

export function SyncStatusBanner({ sync, className }: SyncStatusBannerProps) {
  const { isOnline, isSyncing, queueStats, syncNow } = sync;
  const hasPending = queueStats.pending > 0;
  const hasErrors = queueStats.error > 0;

  const state = !isOnline
    ? "offline"
    : isSyncing
    ? "syncing"
    : hasErrors
    ? "error"
    : hasPending
    ? "pending"
    : "synced";

  const config = {
    offline: {
      icon: WifiOff,
      bg: "bg-destructive/10 border-destructive/20",
      text: "text-destructive",
      label: "Offline — observations saved locally",
    },
    syncing: {
      icon: Loader2,
      bg: "bg-primary/10 border-primary/20",
      text: "text-primary",
      label: `Syncing ${queueStats.pending} observation${queueStats.pending !== 1 ? "s" : ""}…`,
    },
    error: {
      icon: AlertTriangle,
      bg: "bg-chart-4/10 border-chart-4/20",
      text: "text-chart-4",
      label: `${queueStats.error} observation${queueStats.error !== 1 ? "s" : ""} failed to sync`,
    },
    pending: {
      icon: Cloud,
      bg: "bg-chart-3/10 border-chart-3/20",
      text: "text-chart-3",
      label: `${queueStats.pending} pending observation${queueStats.pending !== 1 ? "s" : ""}`,
    },
    synced: {
      icon: CheckCircle2,
      bg: "bg-chart-5/10 border-chart-5/20",
      text: "text-chart-5",
      label: "All synced",
    },
  }[state];

  const Icon = config.icon;

  // Hide if fully synced with no queue
  if (state === "synced" && queueStats.total === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
          config.bg,
          className
        )}
      >
        <Icon className={cn("w-3.5 h-3.5 shrink-0", config.text, state === "syncing" && "animate-spin")} />
        <span className={cn("flex-1", config.text)}>{config.label}</span>

        {queueStats.total > 0 && (
          <Badge variant="outline" className="text-[9px] border-border/30">
            {queueStats.synced}/{queueStats.total}
          </Badge>
        )}

        {isOnline && (hasPending || hasErrors) && !isSyncing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => syncNow()}
          >
            Sync Now
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
