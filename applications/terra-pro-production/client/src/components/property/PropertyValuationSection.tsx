import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, TrendingDown, BarChart, Info, RefreshCcw  } from '@mui/icons-material';

// Define interface for the valuation response
interface AIValuationResponse {
  estimatedValue: number;
  confidenceLevel: "high" | "medium" | "low";
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: Array<{
    factor: string;
    description: string;
    amount: number;
    reasoning: string;
  }>;
  marketAnalysis: string;
  valuationMethodology: string;
  modelVersion?: string;
  timestamp?: string;
}

interface PropertyValuationSectionProps {
  propertyId: number;
  className?: string;
}

export function PropertyValuationSection({ propertyId, className }: PropertyValuationSectionProps) {
  const [valuation, setValuation] = useState<AIValuationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch valuation data
  const fetchValuation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the AI valuation endpoint
      const response = await fetch(`/api/ai/value/${propertyId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch valuation: ${response.status}`);
      }

      const data = await response.json();
      setValuation(data);
    } catch (err) {
      console.error("Error fetching property valuation:", err);
      setError("Unable to retrieve property valuation. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch valuation on component mount
  useEffect(() => {
    if (propertyId) {
      fetchValuation();
    }
  }, [propertyId]);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate confidence score for progress bar
  const getConfidenceScore = (level: "high" | "medium" | "low"): number => {
    switch (level) {
      case "high":
        return 90;
      case "medium":
        return 60;
      case "low":
        return 30;
      default:
        return 0;
    }
  };

  // Get confidence color for styling
  const getConfidenceColor = (level: "high" | "medium" | "low"): string => {
    switch (level) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center"><>

              <DollarSign className="h-5 w-5 mr-1 text-green-600" />
              AI Property Valuation
            </CardTitle>
            <CardDescription
</>>Powered by Terrafusion AI valuation engine</CardDescription>
          </div>
          {!isLoading && (
            <Button variant="ghost" size="sm" onClick={fetchValuation} disabled={isLoading}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6"><>

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p
</> className="text-muted-foreground">Calculating property value...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6"><>

            <p className="text-red-500 mb-4">{error}</p>
            <Button
</> onClick={fetchValuation} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : valuation ? (
          <div className="space-y-4">
            {/* Estimated Value */}
            <div className="text-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg"><>

              <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
              <h2
</> className="text-3xl font-bold text-green-700">
                {formatCurrency(valuation.estimatedValue)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Range: {formatCurrency(valuation.valueRange.min)} -{" "}
                {formatCurrency(valuation.valueRange.max)}
              </p>
            </div>

            {/* Confidence Level */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center"><>

                <span className="text-sm font-medium mr-2">Confidence Level:</span>
                <Badge
</>
                  variant={valuation.confidenceLevel === "high" ? "default" : "outline"}
                  className={`capitalize ${getConfidenceColor(valuation.confidenceLevel)}`}
                >
                  {valuation.confidenceLevel}
                </Badge>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><>

                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent
</>>
                    <p className="max-w-xs">
                      Confidence level indicates the reliability of this valuation based on data
                      quality, market conditions, and property characteristics.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Progress value={getConfidenceScore(valuation.confidenceLevel)} className="h-2" />

            {/* Valuation Adjustments */}
            {valuation.adjustments && valuation.adjustments.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center"><>

                    <BarChart className="h-4 w-4 mr-1 text-muted-foreground" />
                    Value Adjustments
                  </h3>
                  <div
</> className="space-y-2">
                    {valuation.adjustments.map((adjustment /* , index */) => (
                      <div key={index} className="flex justify-between items-center text-sm"><>

                        <span className="flex-1">{adjustment.description}</span>
                        <Badge
</>
                          variant="outline"
                          className={`flex items-center ${adjustment.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {adjustment.amount >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {formatCurrency(Math.abs(adjustment.amount))}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Market Analysis */}
            {valuation.marketAnalysis && (
              <>
                <Separator className="my-4" />
                <div><>

                  <h3 className="text-sm font-medium mb-2">Market Analysis</h3>
                  <p
</> className="text-sm text-muted-foreground">{valuation.marketAnalysis}</p>
                </div>
              </>
            )}

            {/* Methodology */}
            <div className="text-xs text-muted-foreground mt-4 flex justify-between">
              <span>Methodology: {valuation.valuationMethodology}</span>
              {valuation.modelVersion && <span>Model: v{valuation.modelVersion}</span>}
            </div>
          </div>
        ) : (
          <div className="text-center py-6"><>

            <p className="text-muted-foreground mb-4">No valuation data available</p>
            <Button
</> onClick={fetchValuation} variant="outline" size="sm">
              Generate Valuation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
