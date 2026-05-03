// TerraFusion OS — GPS Tracker for Field Studio
// Real-time GPS position tracking with accuracy indicator for field inspectors.
// Harvested from terra-forge-rebuild

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Navigation, Signal, SignalLow, SignalZero } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GpsPosition } from "@/types/field";

interface GpsTrackerProps {
  onPositionUpdate?: (pos: GpsPosition) => void;
  className?: string;
}

export function GpsTracker({ onPositionUpdate, className }: GpsTrackerProps) {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setTracking(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const gps: GpsPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setPosition(gps);
        onPositionUpdate?.(gps);
      },
      (err) => {
        setError(err.message);
        setTracking(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onPositionUpdate]);

  const accuracyTier = position
    ? position.accuracy < 5 ? "high" : position.accuracy < 15 ? "medium" : "low"
    : "none";

  const AccuracyIcon = accuracyTier === "high" ? Signal
    : accuracyTier === "medium" ? SignalLow
    : SignalZero;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30", className)}
    >
      {!tracking ? (
        <Button variant="ghost" size="sm" onClick={startTracking} className="gap-1.5 text-xs">
          <Navigation className="w-3.5 h-3.5" />
          Start GPS
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <AccuracyIcon className={cn(
              "w-3.5 h-3.5",
              accuracyTier === "high" && "text-chart-5",
              accuracyTier === "medium" && "text-chart-3",
              accuracyTier === "low" && "text-destructive",
            )} />
            <Badge variant="outline" className={cn(
              "text-[9px] px-1.5",
              accuracyTier === "high" && "border-chart-5/30 text-chart-5",
              accuracyTier === "medium" && "border-chart-3/30 text-chart-3",
              accuracyTier === "low" && "border-destructive/30 text-destructive",
            )}>
              ±{position ? Math.round(position.accuracy) : "—"}m
            </Badge>
          </div>
          {position && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
            </span>
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-chart-5 animate-pulse" />
        </>
      )}

      {error && (
        <span className="text-[10px] text-destructive">{error}</span>
      )}
    </motion.div>
  );
}
