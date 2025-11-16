import LLMFeedbackOverlay from "./LLMFeedbackOverlay";

// Validation interfaces matching server-side schema
interface ValidationIssue {
  type: "error" | "warning" | "info";
  field: string;
  message: string;
  severity: "critical" | "moderate" | "low";
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  correctedData?: any;
}

interface TerraFusionComp {
  address: string;
  sale_price_usd: number;
  gla_sqft: number;
  sale_date: string;
  source_table: string;
  bedrooms?: number;
  bathrooms?: number;
  lot_size_sqft?: number;
  year_built?: number;
  property_type?: string;
}

function validateComp(comp: TerraFusionComp): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!comp.address) {
    issues.push({
      field: "address",
      type: "error",
      message: "Missing address",
      severity: "critical",
    });
  }

  if (!comp.sale_price_usd || comp.sale_price_usd <= 0) {
    issues.push({
      field: "sale_price_usd",
      type: "error",
      message: "Invalid sale price",
      severity: "critical",
    });
  }

  if (!comp.gla_sqft || comp.gla_sqft <= 0) {
    issues.push({
      field: "gla_sqft",
      type: "error",
      message: "Invalid living area",
      severity: "moderate",
    });
  }

  return issues;
}

interface ImportRowProps {
  comp: TerraFusionComp;
  validation?: ValidationResult;
}

export default function ImportRow({ comp, validation }: ImportRowProps) {
  // Use server validation if available, fallback to client validation
  const issues = validation?.issues || validateComp(comp);
  const hasIssues = issues.length > 0;
  const hasHighSeverity = issues.some((issue) => issue.severity === "critical");
  const confidence = validation?.confidence;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "moderate":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const pricePerSqft =
    comp.sale_price_usd && comp.gla_sqft ? (comp.sale_price_usd / comp.gla_sqft).toFixed(0) : "N/A";

  return (
    <div
      className={`border-b p-3 grid grid-cols-6 gap-3 text-sm font-mono hover:bg-gray-50 ${
        hasHighSeverity
          ? "bg-red-50 border-red-200"
          : hasIssues
            ? "bg-yellow-50 border-yellow-200"
            : "bg-white"
      }`}
    >
      <div className="flex flex-col"><>

        <span className="font-medium text-gray-900">{comp.address}</span>
        <span
</> className="text-xs text-gray-500">{comp.source_table}</span>
      </div>

      <div className="flex flex-col items-end"><>

        <span className="font-semibold text-green-700">
          ${comp.sale_price_usd?.toLocaleString() || "N/A"}
        </span>
        <span
</> className="text-xs text-gray-500">${pricePerSqft}/sqft</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-gray-900">{comp.gla_sqft?.toLocaleString() || "N/A"} sqft</span>
        {comp.bedrooms !== undefined && comp.bathrooms !== undefined && (
          <span className="text-xs text-gray-500">
            {comp.bedrooms}br / {comp.bathrooms}ba
          </span>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span className="text-gray-900">{comp.sale_date || "N/A"}</span>
        {comp.year_built && <span className="text-xs text-gray-500">Built {comp.year_built}</span>}
      </div>

      <div className="flex flex-col">
        {hasIssues ? (
          <div className="space-y-1">
            {issues.slice(0, 2).map((issue /* , index */) => (
              <div key={index} className={`text-xs ${getSeverityColor(issue.severity)}`}>
                {issue.message}
              </div>
            ))}
            {issues.length > 2 && (
              <span className="text-xs text-gray-400">+{issues.length - 2} more</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-green-600">✓ Valid</span>
        )}
      </div>

      <div className="flex items-center justify-end space-x-2">
        {hasHighSeverity && (
          <div className="w-2 h-2 bg-red-500 rounded-full" title="High severity issues"></div>
        )}
        {hasIssues && !hasHighSeverity && (
          <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Medium severity issues"></div>
        )}
        {!hasIssues && <div className="w-2 h-2 bg-green-500 rounded-full" title="No issues"></div>}
      </div>

      {/* LLM Feedback Overlay */}
      <div className="mt-2">
        <LLMFeedbackOverlay comp={comp} />
      </div>
    </div>
  );
}
