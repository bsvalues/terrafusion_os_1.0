import { useState, useEffect } from "react";
import { Warning, CheckCircle, Info, Loader2  } from '@mui/icons-material';
import { TerraFusionComp } from "../../../server/services/rust-importer-bridge";

interface LLMFeedback {
  corrections: {
    field: string;
    originalValue: any;
    correctedValue: any;
    confidence: number;
    reasoning: string;
  }[];
  overallConfidence: number;
}

interface AnomalyAlert {
  field: string;
  current: any;
  prior: any;
  severity: "low" | "medium" | "high";
}

interface LLMFeedbackOverlayProps {
  comp: TerraFusionComp;
  onCorrectionApply?: (correctedComp: TerraFusionComp) => void;
}

export default function LLMFeedbackOverlay({ comp, onCorrectionApply }: LLMFeedbackOverlayProps) {
  const [feedback, setFeedback] = useState<LLMFeedback | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!comp) return;

    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/import/validate/rag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comp }),
        });

        if (!response.ok) {
          throw new Error(`Validation failed: ${response.status}`);
        }

        const result = await response.json();
        setFeedback(result);

        // Check for anomalies (simplified fraud detection)
        checkForAnomalies(comp);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Validation failed");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [comp]);

  const checkForAnomalies = (currentComp: TerraFusionComp) => {
    // Simulate anomaly detection based on unusual patterns
    const detectedAnomalies: AnomalyAlert[] = [];

    // Price anomaly detection
    if (currentComp.sale_price_usd && currentComp.gla_sqft) {
      const pricePerSqft = currentComp.sale_price_usd / currentComp.gla_sqft;
      if (pricePerSqft > 1000 || pricePerSqft < 50) {
        detectedAnomalies.push({
          field: "sale_price_usd",
          current: currentComp.sale_price_usd,
          prior: "Expected range",
          severity: "high",
        });
      }
    }

    // Date anomaly detection
    if (currentComp.sale_date) {
      const saleDate = new Date(currentComp.sale_date);
      const now = new Date();
      if (saleDate > now) {
        detectedAnomalies.push({
          field: "sale_date",
          current: currentComp.sale_date,
          prior: "Future date detected",
          severity: "medium",
        });
      }
    }

    setAnomalies(detectedAnomalies);
  };

  const applyCorrectionSuggestions = () => {
    if (!feedback || !onCorrectionApply) return;

    const correctedComp = { ...comp };
    feedback.corrections.forEach((correction) => {
      if (correction.confidence > 0.7) {
        (correctedComp as any)[correction.field] = correction.correctedValue;
      }
    });

    onCorrectionApply(correctedComp);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded border">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Analyzing with AI validator...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200">
        <Warning className="h-4 w-4" />
        <span>Validation error: {error}</span>
      </div>
    );
  }

  if (!feedback && anomalies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* LLM Feedback */}
      {feedback && feedback.corrections.length > 0 && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI Validation Feedback</span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${getConfidenceColor(feedback.overallConfidence)}`}
            >
              {Math.round(feedback.overallConfidence * 100)}% confidence
            </span>
          </div>

          <div className="space-y-1">
            {feedback.corrections.map((correction /* , index */) => (
              <div key={index} className="text-xs text-blue-800">
                <strong>{correction.field}:</strong> {correction.reasoning}
                {correction.confidence > 0.7 && (
                  <span className="ml-2 text-green-600">(High confidence suggestion)</span>
                )}
              </div>
            ))}
          </div>

          {feedback.corrections.some((c) => c.confidence > 0.7) && onCorrectionApply && (
            <button
              onClick={applyCorrectionSuggestions}
              className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Apply High-Confidence Corrections
            </button>
          )}
        </div>
      )}

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
        <div className="space-y-1">
          {anomalies.map((anomaly /* , index */) => (
            <div
              key={index}
              className={`p-2 text-xs rounded border ${getSeverityColor(anomaly.severity)}`}
            >
              <div className="flex items-center gap-2">
                <Warning className="h-3 w-3" />
                <span className="font-medium">Potential fraud detected</span>
              </div>
              <div className="mt-1">
                Field <strong>{anomaly.field}</strong> shows unusual pattern: {anomaly.prior}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Status */}
      {feedback && feedback.corrections.length === 0 && anomalies.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600 p-2 bg-green-50 rounded border border-green-200">
          <CheckCircle className="h-4 w-4" />
          <span>
            Record passed AI validation (Confidence: {Math.round(feedback.overallConfidence * 100)}
            %)
          </span>
        </div>
      )}
    </div>
  );
}
