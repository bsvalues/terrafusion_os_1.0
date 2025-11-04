import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComparablesTable from "./ComparablesTable";
import { Property, Comparable, Adjustment, AppraisalReport } from "@shared/schema";
import { useAppraisal } from "@/contexts/AppraisalContext";

interface MarketValueWorksheetCardProps {
  property: Property;
  comparables: Comparable[];
  adjustments: Adjustment[];
  report: AppraisalReport;
  onReportChange: (report: Partial<AppraisalReport>) => void;
  onAdjustmentChange: (comparableId: number, type: string, value: number) => void;
}

export default function MarketValueWorksheetCard({
  property,
  comparables,
  adjustments,
  report,
  onReportChange,
  onAdjustmentChange,
}: MarketValueWorksheetCardProps) {
  const handleValueChange = useCallback(
    (field: keyof AppraisalReport, value: any) => {
      onReportChange({ [field]: value });
    },
    [onReportChange]
  );

  // Format currency for display
  const formatCurrency = useCallback((value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue)
      ? ""
      : `$${numValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  // Parse currency from string to number
  const parseCurrency = useCallback((value: string): number | undefined => {
    if (!value) return undefined;
    const numericString = value.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(numericString);
    return isNaN(parsed) ? undefined : parsed;
  }, []);

  return (
    <Card className="bg-white rounded-md shadow-sm">
      <div className="draggable-panel-header p-4 border-b border-neutral-medium bg-neutral-light flex justify-between items-center"><>

        <h3 className="font-medium">Sales Comparison Approach - Adjustments</h3>
        <div
</> className="flex space-x-2">
          <button
            className="p-1 text-neutral-gray hover:text-neutral-dark"
            title="Expand/collapse panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
              />
            </svg>
          </button>
          <button className="p-1 text-neutral-gray hover:text-neutral-dark" title="More options">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto"><>

        <ComparablesTable
          property={property}
          comparables={comparables}
          adjustments={adjustments}
          onAdjustmentChange={onAdjustmentChange}
        />
      </div>

      <div
</> className="p-4 bg-neutral-light border-t border-neutral-medium">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">
              Indicated Value by Sales Comparison Approach
            </Label>
            <Input
</>
              type="text"
              value={formatCurrency(report.marketValue)}
              onChange={(e) => {
                const parsed = parseCurrency(e.target.value);
                handleValueChange("marketValue", parsed);
              }}
              className="w-full border border-neutral-medium rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium text-lg"
            />
          </div>

          <div><>

            <Label className="block text-sm font-medium text-neutral-dark mb-1">Value Range</Label>
            <div
</> className="flex items-center">
              <Input
                type="text"
                placeholder="Min Value"
                className="w-full border border-neutral-medium rounded-l-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              /><>

              <span className="px-3 py-2 border-t border-b border-neutral-medium bg-neutral-light">
                to
              </span>
              <Input
</>
                type="text"
                placeholder="Max Value"
                className="w-full border border-neutral-medium rounded-r-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
