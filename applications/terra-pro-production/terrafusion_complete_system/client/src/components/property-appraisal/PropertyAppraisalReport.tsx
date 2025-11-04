import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HomeIcon,
  MapPinIcon,
  TrendingUpIcon,
  DollarSignIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  BarChart3Icon,
  PresentationIcon,
  BuildingIcon,
 } from '@mui/icons-material';

interface PropertyAppraisalReportProps {
  appraisalData: any;
  isLoading: boolean;
  error: string | null;
}

const PropertyAppraisalReport: React.FC<PropertyAppraisalReportProps> = ({
  appraisalData,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4"><>

          <CardTitle className="text-2xl">Property Appraisal Report</CardTitle>
          <CardDescription
</>>Analyzing property data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 space-y-4"><>

            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p
</> className="text-muted-foreground">
              This may take a few moments while we gather and analyze the latest market data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader className="pb-4"><>

          <CardTitle className="text-2xl">Error Generating Report</CardTitle>
          <CardDescription
</>>Unable to complete property analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start p-4 space-x-4 bg-destructive/10 rounded-md">
            <AlertCircleIcon className="h-6 w-6 text-destructive flex-shrink-0" />
            <div><>

              <p className="font-medium text-destructive">Analysis Error</p>
              <p
</> className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Please check your connection and try again. If the problem persists, contact support.
          </p>
        </CardFooter>
      </Card>
    );
  }

  if (!appraisalData) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4"><>

          <CardTitle className="text-2xl">Property Appraisal Report</CardTitle>
          <CardDescription
</>>No property data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8">
            <HomeIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Submit a property address to generate an appraisal report
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have data, render the report
  const { propertyDetails, marketData, propertyAnalysis, appraisalSummary } = appraisalData;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle className="text-2xl">Property Appraisal Report</CardTitle>
            <CardDescription
</>>Market analysis and valuation report</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Property Details */}
        <section>
          <div className="flex items-center mb-4">
            <HomeIcon className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Property Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                <div><>

                  <p className="font-medium">{propertyDetails.address}</p>
                  <p
</> className="text-sm text-muted-foreground">
                    {propertyDetails.city}, {propertyDetails.state} {propertyDetails.zipCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start">
                <BuildingIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                <div><>

                  <p className="font-medium">Property Type</p>
                  <p
</> className="text-sm text-muted-foreground">
                    {propertyDetails.propertyType || "Residential"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Market Data */}
        <section>
          <div className="flex items-center mb-4">
            <BarChart3Icon className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Market Analysis</h3>
          </div>

          <div className="pl-7 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/30 p-4 rounded-md">
                <div className="flex justify-between items-center"><>

                  <p className="text-sm text-muted-foreground">Estimated Value</p>
                  <Badge
</> variant="secondary" className="font-mono">
                    Confidence: {Math.floor(marketData.confidenceScore * 100)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold mt-1">{marketData.estimatedValue}</p>
              </div>

              <div className="bg-secondary/30 p-4 rounded-md"><>

                <p className="text-sm text-muted-foreground">Market Trends</p>
                <div
</> className="flex items-center mt-1">
                  <TrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
                  <p className="font-medium">{marketData.marketTrends}</p>
                </div>
              </div>
            </div>

            <div><>

              <h4 className="text-sm font-medium mb-2">Comparable Sales</h4>
              <div
</> className="bg-secondary/10 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-secondary/30"><>

                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">
                        Address
                      </th>
                      <th
</> className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">
                        Sale Price
                      </th><>

                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider hidden md:table-cell">
                        Date
                      </th>
                      <th
</> className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider hidden md:table-cell">
                        Distance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {marketData.comparableSales.map((comp: any /* , index */: number) => (
                      <tr key={index}><>

                        <td className="px-4 py-2 text-sm">{comp.address}</td>
                        <td
</> className="px-4 py-2 text-sm font-medium">{comp.salePrice}</td><>

                        <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                          {comp.dateOfSale}
                        </td>
                        <td
</> className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                          {comp.distanceFromSubject}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Property Analysis */}
        <section>
          <div className="flex items-center mb-4">
            <PresentationIcon className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Property Analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            <div><>

              <h4 className="text-sm font-medium mb-2">Property Condition & Quality</h4>
              <div
</> className="space-y-2">
                <div className="flex justify-between items-center bg-secondary/20 p-2 rounded"><>

                  <span className="text-sm">Condition</span>
                  <Badge
</> variant={propertyAnalysis.condition === "Good" ? "success" : "default"}>
                    {propertyAnalysis.condition}
                  </Badge>
                </div>
                <div className="flex justify-between items-center bg-secondary/20 p-2 rounded"><>

                  <span className="text-sm">Quality Rating</span>
                  <Badge
</> variant="outline">{propertyAnalysis.qualityRating}</Badge>
                </div>
              </div>
            </div>

            <div><>

              <h4 className="text-sm font-medium mb-2">Key Features & Improvements</h4>
              <div
</> className="space-y-2">
                <div className="bg-secondary/20 p-2 rounded"><>

                  <span className="text-sm font-medium">Features</span>
                  <div
</> className="flex flex-wrap gap-1 mt-1">
                    {propertyAnalysis.features.map((feature: string /* , index */: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary/20 p-2 rounded"><>

                  <span className="text-sm font-medium">Recent Improvements</span>
                  <ul
</> className="mt-1 space-y-1">
                    {propertyAnalysis.improvements.map((improvement: string /* , index */: number) => (
                      <li key={index} className="text-xs flex items-center">
                        <CheckCircleIcon className="h-3 w-3 text-green-600 mr-1" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Appraisal Summary */}
        <section>
          <div className="flex items-center mb-4">
            <DollarSignIcon className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Appraisal Summary</h3>
          </div>

          <div className="pl-7">
            <div className="bg-secondary/40 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2"><>

                  <h4 className="text-sm font-medium">Final Value Opinion</h4>
                  <p
</> className="text-2xl font-bold mt-1">{appraisalSummary.finalValueOpinion}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {appraisalSummary.valuationApproach}
                  </p>
                </div>
                <div className="flex justify-center items-center">
                  <Badge
                    className="text-md h-12 flex items-center justify-center px-4"
                    variant="outline"
                  >
                    {marketData.confidenceScore >= 0.85 ? "High Confidence" : "Moderate Confidence"}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div><>

                <h4 className="text-sm font-medium mb-2">Appraiser Comments</h4>
                <p
</> className="text-sm text-muted-foreground">{appraisalSummary.comments}</p>
              </div>
            </div>
          </div>
        </section>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4"><>

        <p className="text-xs text-muted-foreground">
          Report generated: {new Date().toLocaleString()}
        </p>
        <p
</> className="text-xs text-muted-foreground">TerraFusionPro Appraisal System</p>
      </CardFooter>
    </Card>
  );
};

export default PropertyAppraisalReport;
