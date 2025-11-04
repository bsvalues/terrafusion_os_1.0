import { useCallback } from "react";
import { WorksheetCell } from "@/components/ui/worksheet-cell";
import { Comparable, Adjustment, Property } from "@shared/schema";
import { calculateAdjustments } from "@/lib/calculations";

interface ComparablesTableProps {
  property: Property;
  comparables: Comparable[];
  adjustments: Adjustment[];
  onAdjustmentChange: (comparableId: number, type: string, value: number) => void;
}

export default function ComparablesTable({
  property,
  comparables,
  adjustments,
  onAdjustmentChange,
}: ComparablesTableProps) {
  // Helper function to get adjustments for a specific comparable
  const getAdjustmentAmount = useCallback(
    (comparableId: number, adjustmentType: string) => {
      const adjustment = adjustments.find(
        (adj) => adj.comparableId === comparableId && adj.adjustmentType === adjustmentType
      );
      return adjustment ? Number(adjustment.amount) : 0;
    },
    [adjustments]
  );

  // Helper function to format currency values
  const formatCurrency = useCallback((value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue)
      ? ""
      : `$${numValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  // Helper function to format percentages
  const formatPercentage = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return isNaN(value) ? "" : `${value.toFixed(1)}%`;
  }, []);

  // Get calculated results
  const calculatedResults = comparables.map((comp) => calculateAdjustments(comp, adjustments));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-neutral-medium bg-white font-mono text-sm">
        <thead>
          <tr className="bg-neutral-light border-b border-neutral-medium"><>

            <th className="p-2 border-r border-neutral-medium text-left font-medium">Item</th>
            <th
</> className="p-2 border-r border-neutral-medium text-center font-medium">Subject</th>
            {comparables.map((comp /* , index */) => (
              <th
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium text-center font-medium`}
              >
                Comp {index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Address</td>
            <td
</> className="p-2 border-r border-neutral-medium">{property.address || ""}</td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
              >
                {comp.address || ""}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Proximity to Subject</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
              >
                {comp.proximityToSubject || ""}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Sale Price</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell`}
              >
                <WorksheetCell
                  value={formatCurrency(comp.salePrice)}
                  editable={false}
                  onChange={() => {}}
                />
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">
              Price / GLA ($/sq ft)
            </td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell calculated`}
              >
                {formatCurrency(comp.pricePerSqFt)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium bg-neutral-lightest">
            <td
              className="p-2 border-r border-neutral-medium font-medium"
              colSpan={2 + comparables.length}
            >
              DESCRIPTION
            </td>
          </tr>

          {/* Sale or Financing Adjustments */}
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">
              Sale or Financing Adjustments
            </td>
            <td
</> className="p-2 border-r border-neutral-medium">Conventional</td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
              >
                {comp.saleOrFinancingConcessions || "Conventional"}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium pl-4">Adjustment</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell`}
              >
                <WorksheetCell
                  value={formatCurrency(getAdjustmentAmount(comp.id, "sale_concessions"))}
                  onChange={(value) => {
                    const numValue = value.startsWith("$")
                      ? parseFloat(value.substring(1).replace(/,/g, ""))
                      : parseFloat(value.replace(/,/g, ""));
                    if (!isNaN(numValue)) {
                      onAdjustmentChange(comp.id, "sale_concessions", numValue);
                    }
                  }}
                />
              </td>
            ))}
          </tr>

          {/* Date of Sale/Time */}
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Date of Sale/Time</td>
            <td
</> className="p-2 border-r border-neutral-medium">Current</td>
            {comparables.map((comp /* , index */) => {
              const months = comp.saleDate
                ? Math.round(
                    (new Date().getTime() - new Date(comp.saleDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 30)
                  )
                : null;
              return (
                <td
                  key={comp.id}
                  className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
                >
                  {months ? `${months} months` : ""}
                </td>
              );
            })}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium pl-4">Adjustment</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell`}
              >
                <WorksheetCell
                  value={formatCurrency(getAdjustmentAmount(comp.id, "time"))}
                  onChange={(value) => {
                    const numValue = value.startsWith("$")
                      ? parseFloat(value.substring(1).replace(/,/g, ""))
                      : parseFloat(value.replace(/,/g, ""));
                    if (!isNaN(numValue)) {
                      onAdjustmentChange(comp.id, "time", numValue);
                    }
                  }}
                />
              </td>
            ))}
          </tr>

          {/* Location */}
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Location</td>
            <td
</> className="p-2 border-r border-neutral-medium">Good</td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
              >
                {comp.locationRating || ""}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium pl-4">Adjustment</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell`}
              >
                <WorksheetCell
                  value={formatCurrency(getAdjustmentAmount(comp.id, "location"))}
                  onChange={(value) => {
                    const numValue = value.startsWith("$")
                      ? parseFloat(value.substring(1).replace(/,/g, ""))
                      : parseFloat(value.replace(/,/g, ""));
                    if (!isNaN(numValue)) {
                      onAdjustmentChange(comp.id, "location", numValue);
                    }
                  }}
                />
              </td>
            ))}
          </tr>

          {/* Site Size */}
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Site Size</td>
            <td
</> className="p-2 border-r border-neutral-medium">
              {property.lotSize ? `${property.lotSize} sq ft` : ""}
            </td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
              >
                {comp.siteSize ? `${comp.siteSize} ${comp.siteUnit || "sq ft"}` : ""}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium pl-4">Adjustment</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell`}
              >
                <WorksheetCell
                  value={formatCurrency(getAdjustmentAmount(comp.id, "site"))}
                  onChange={(value) => {
                    const numValue = value.startsWith("$")
                      ? parseFloat(value.substring(1).replace(/,/g, ""))
                      : parseFloat(value.replace(/,/g, ""));
                    if (!isNaN(numValue)) {
                      onAdjustmentChange(comp.id, "site", numValue);
                    }
                  }}
                />
              </td>
            ))}
          </tr>

          {/* GLA */}
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">GLA</td>
            <td
</> className="p-2 border-r border-neutral-medium">
              {property.grossLivingArea ? `${property.grossLivingArea} sq ft` : ""}
            </td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium`}
              >
                {comp.grossLivingArea ? `${comp.grossLivingArea} sq ft` : ""}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium pl-4">Adjustment</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {comparables.map((comp /* , index */) => (
              <td
                key={comp.id}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell`}
              >
                <WorksheetCell
                  value={formatCurrency(getAdjustmentAmount(comp.id, "gla"))}
                  onChange={(value) => {
                    const numValue = value.startsWith("$")
                      ? parseFloat(value.substring(1).replace(/,/g, ""))
                      : parseFloat(value.replace(/,/g, ""));
                    if (!isNaN(numValue)) {
                      onAdjustmentChange(comp.id, "gla", numValue);
                    }
                  }}
                />
              </td>
            ))}
          </tr>

          {/* Summary rows */}
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Total Adjustments</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {calculatedResults.map((result /* , index */) => (
              <td
                key={index}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell calculated`}
              >
                {formatCurrency(result.netAdjustment)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Adjusted Price</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {calculatedResults.map((result /* , index */) => (
              <td
                key={index}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell calculated font-medium`}
              >
                {formatCurrency(result.adjustedPrice)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Net Adjustment (%)</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {calculatedResults.map((result /* , index */) => (
              <td
                key={index}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell calculated`}
              >
                {formatPercentage(result.netAdjustmentPercentage)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-neutral-medium"><>

            <td className="p-2 border-r border-neutral-medium font-medium">Gross Adjustment (%)</td>
            <td
</> className="p-2 border-r border-neutral-medium"></td>
            {calculatedResults.map((result /* , index */) => (
              <td
                key={index}
                className={`p-2 ${index < comparables.length - 1 ? "border-r" : ""} border-neutral-medium worksheet-cell calculated`}
              >
                {formatPercentage(result.grossAdjustmentPercentage)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
