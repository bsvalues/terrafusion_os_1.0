import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

export interface RetrainLogEntry {
  timestamp: string;
  samples_used: number;
  model_version: number;
  model_path: string;
  accuracy: number;
  drift_percentage: number;
  training_duration_sec: number;
}

/**
 * Parses the retrain log CSV file and returns the entries
 */
export function getRetrainLog(): RetrainLogEntry[] {
  try {
    // Use absolute path to the CSV file since __dirname isn't available
    const logPath = path.join(process.cwd(), "model", "retrain_log.csv");
    const fileContent = fs.readFileSync(logPath, "utf-8");

    // Parse CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        // Convert numeric fields to numbers
        if (
          context.column === "samples_used" ||
          context.column === "model_version" ||
          context.column === "accuracy" ||
          context.column === "drift_percentage" ||
          context.column === "training_duration_sec"
        ) {
          return Number(value);
        }
        return value;
      },
    });

    return records as RetrainLogEntry[];
  } catch (error) {
    console.error("Failed to parse retrain log:", error);
    return [];
  }
}

/**
 * Gets the most recent model information
 */
export function getLatestModelInfo(): RetrainLogEntry | null {
  const logs = getRetrainLog();
  if (logs.length === 0) return null;

  // Sort logs by timestamp descending
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return sortedLogs[0];
}

/**
 * Calculate the trend in model accuracy over time
 */
export function getModelAccuracyTrend(): { improving: boolean; rate: number } {
  const logs = getRetrainLog();
  if (logs.length < 2) return { improving: false, rate: 0 };

  // Sort logs by model version
  const sortedLogs = [...logs].sort((a, b) => a.model_version - b.model_version);

  const firstAccuracy = sortedLogs[0].accuracy;
  const lastAccuracy = sortedLogs[sortedLogs.length - 1].accuracy;
  const diff = lastAccuracy - firstAccuracy;
  const rate = diff / (sortedLogs.length - 1); // Average change per version

  return {
    improving: diff > 0,
    rate: Math.abs(rate),
  };
}

/**
 * Calculate the trend in model drift over time
 */
export function getModelDriftTrend(): { reducing: boolean; rate: number } {
  const logs = getRetrainLog();
  if (logs.length < 2) return { reducing: false, rate: 0 };

  // Sort logs by model version
  const sortedLogs = [...logs].sort((a, b) => a.model_version - b.model_version);

  const firstDrift = sortedLogs[0].drift_percentage;
  const lastDrift = sortedLogs[sortedLogs.length - 1].drift_percentage;
  const diff = lastDrift - firstDrift;
  const rate = diff / (sortedLogs.length - 1); // Average change per version

  return {
    reducing: diff < 0, // Negative diff means drift is reducing
    rate: Math.abs(rate),
  };
}

/**
 * Get model improvement summary
 */
export function getModelImprovementSummary(): string {
  const latest = getLatestModelInfo();
  if (!latest) return "No model data available";

  const accuracyTrend = getModelAccuracyTrend();
  const driftTrend = getModelDriftTrend();

  const accuracyDirection = accuracyTrend.improving ? "improving" : "declining";
  const driftDirection = driftTrend.reducing ? "reducing" : "increasing";

  return `
    Model v${latest.model_version} (${latest.timestamp})
    - Current accuracy: ${(latest.accuracy * 100).toFixed(1)}%
    - Accuracy is ${accuracyDirection} by ~${(accuracyTrend.rate * 100).toFixed(1)}% per version
    - Model drift is ${driftDirection} by ${(driftTrend.rate * 100).toFixed(3)}% per version
    - Last trained on ${latest.samples_used} samples in ${latest.training_duration_sec.toFixed(1)}s
  `;
}
