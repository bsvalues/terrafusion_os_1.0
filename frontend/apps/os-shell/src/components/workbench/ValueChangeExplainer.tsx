// TerraFusion OS — AI Value Change Explainer
// Generates a 2-3 sentence natural language explanation of an assessment change.
// Mined from terra-forge-rebuild src/components/workbench/ValueChangeExplainer.tsx
// Adapted: supabase.functions.invoke("ai-proxy") → POST /pilot/explain-change

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/apiBase";
import { cn } from "@/lib/utils";

export interface ValueChangeExplainerProps {
  parcelNumber: string;
  address: string | null;
  propertyClass: string | null;
  currentValue: number;
  priorValue: number | null;
  landValue: number | null;
  improvementValue: number | null;
  neighborhoodCode: string | null;
  className?: string;
}

export function ValueChangeExplainer({
  parcelNumber,
  address,
  propertyClass,
  currentValue,
  priorValue,
  landValue,
  improvementValue,
  neighborhoodCode,
  className,
}: ValueChangeExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const change = priorValue ? currentValue - priorValue : null;
  const changePct = priorValue ? ((currentValue - priorValue) / priorValue) * 100 : null;

  if (!priorValue) return null;

  const generateExplanation = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/pilot/explain-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelNumber,
          address,
          propertyClass,
          neighborhoodCode,
          currentValue,
          priorValue,
          landValue,
          improvementValue,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { explanation?: string; content?: string };
      setExplanation(data.explanation ?? data.content ?? "Unable to generate explanation.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExplanation(`Unable to generate explanation: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("border-border/30", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-chart-3" />
          AI Value Change Summary
          {change !== null && (
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] ml-auto",
                change > 0 ? "text-chart-5 border-chart-5/30" : "text-destructive border-destructive/30"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {change > 0 ? "+" : ""}
              {changePct?.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {explanation ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-sm text-foreground leading-relaxed">{explanation}</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-6 px-2 text-muted-foreground"
              onClick={generateExplanation}
              disabled={loading}
            >
              <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} />
              Regenerate
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={generateExplanation}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Explain Value Change
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
