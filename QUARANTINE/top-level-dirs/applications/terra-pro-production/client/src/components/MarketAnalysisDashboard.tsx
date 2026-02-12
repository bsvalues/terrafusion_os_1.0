import { useState } from "react";
import { MarketAnalysis, Property } from "@shared/schema";
import { useMarketAnalysis } from "@/hooks/useMarketAnalysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { AlertCircle, BarChart2, MapPin, Refresh, TrendingUp  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";

interface MarketAnalysisDashboardProps {
  reportId: number;
  property?: Property;
}

export function MarketAnalysisDashboard({ reportId, property }: MarketAnalysisDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("regression");

  const { analyses, isLoadingAnalyses, generateMarketAnalysis, isGeneratingMarketAnalysis } =
    useMarketAnalysis(reportId);

  const regressionAnalysis = analyses.find((a) => a.analysisType === "regression");
  const trendAnalysis = analyses.find((a) => a.analysisType === "trend");
  const pricingAnalysis = analyses.find((a) => a.analysisType === "pricing");

  const handleGenerateAnalysis = async (type: string) => {
    if (!property) {
      toast({
        title: "Property Data Required",
        description: "The property data is needed to generate a market analysis",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateMarketAnalysis(
        {
          reportId,
          location: `${property.city}, ${property.state}`,
          propertyType: property.propertyType,
          aiProvider: "auto",
        },
        {
          onSuccess: (newAnalysis) => {
            toast({
              title: "Market Analysis Generated",
              description: `New ${type} market analysis has been created`,
            });
            setActiveTab(type);
          },
          onError: (error) => {
            toast({
              title: "Failed to Generate Analysis",
              description: "There was an error generating the market analysis. Please try again.",
              variant: "destructive",
            });
            console.error("Error generating analysis:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error generating market analysis:", error);
    }
  };

  const renderRegressionAnalysis = (analysis: MarketAnalysis) => {
    if (!analysis || !analysis.data || !analysis.data.regressionData) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" /><>

          <AlertTitle>No regression data available</AlertTitle>
          <AlertDescription
</>>The regression analysis does not contain valid data.</AlertDescription>
        </Alert>
      );
    }

    const data = analysis.data.regressionData as any[];

    return (
      <div className="space-y-6"><>

        <div className="text-sm text-muted-foreground">
          {analysis.data.description || "Regression analysis of property characteristics vs. price"}
        </div>

        <ResponsiveContainer
</> width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="squareFeet"
              name="Living Area"
              unit=" sq ft"
              label={{ value: "Living Area (sq ft)", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              dataKey="price"
              name="Price"
              unit="$"
              label={{ value: "Price ($)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: any) => ["$" + value.toLocaleString(), "Price"]}
            />
            <Scatter name="Properties" data={data} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>

        {analysis.data.insights && (
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                {analysis.data.insights.map((insight: string /* , index */: number) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTrendAnalysis = (analysis: MarketAnalysis) => {
    if (!analysis || !analysis.data || !analysis.data.trendData) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" /><>

          <AlertTitle>No trend data available</AlertTitle>
          <AlertDescription
</>>The trend analysis does not contain valid data.</AlertDescription>
        </Alert>
      );
    }

    const data = analysis.data.trendData as any[];

    return (
      <div className="space-y-6"><>

        <div className="text-sm text-muted-foreground">
          {analysis.data.description || "Market price trends over time"}
        </div>

        <ResponsiveContainer
</> width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: "Median Price ($)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value: any) => ["$" + value.toLocaleString()]} />
            <Legend />
            <Line type="monotone" dataKey="medianPrice" stroke="#8884d8" name="Median Price" />
            <Line type="monotone" dataKey="averagePrice" stroke="#82ca9d" name="Average Price" />
          </LineChart>
        </ResponsiveContainer>

        {analysis.data.insights && (
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                {analysis.data.insights.map((insight: string /* , index */: number) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderPricingAnalysis = (analysis: MarketAnalysis) => {
    if (!analysis || !analysis.data || !analysis.data.pricingData) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" /><>

          <AlertTitle>No pricing data available</AlertTitle>
          <AlertDescription
</>>The pricing analysis does not contain valid data.</AlertDescription>
        </Alert>
      );
    }

    const data = analysis.data.pricingData as any[];

    return (
      <div className="space-y-6"><>

        <div className="text-sm text-muted-foreground">
          {analysis.data.description || "Price distribution by submarket areas"}
        </div>

        <ResponsiveContainer
</> width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: "Price per sq ft ($)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value: any) => ["$" + value.toLocaleString()]} />
            <Legend />
            <Bar dataKey="pricePerSqFt" fill="#8884d8" name="Price per sq ft" />
          </BarChart>
        </ResponsiveContainer>

        {analysis.data.insights && (
          <Card>
            <CardHeader>
              <CardTitle>Price Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                {analysis.data.insights.map((insight: string /* , index */: number) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderAnalysisTab = (type: string, analysis: MarketAnalysis | undefined) => {
    if (isLoadingAnalyses) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    if (!analysis) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <AlertCircle className="w-10 h-10 mb-4" /><>

          <p>No {type} analysis available</p>
          <Button
</>
            variant="outline"
            className="mt-4"
            onClick={() => handleGenerateAnalysis(type)}
            disabled={isGeneratingMarketAnalysis || !property}
          >
            {isGeneratingMarketAnalysis ? (
              <>
                <Refresh className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate {type} Analysis
              </>
            )}
          </Button>
        </div>
      );
    }

    switch (type) {
      case "regression":
        return renderRegressionAnalysis(analysis);
      case "trend":
        return renderTrendAnalysis(analysis);
      case "pricing":
        return renderPricingAnalysis(analysis);
      default:
        return <div>Unknown analysis type</div>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">Market Analysis</CardTitle>
            <CardDescription
</>>
              {property && `Market data for ${property.city}, ${property.state}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="regression" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="regression"><>

              <BarChart2 className="mr-2 h-4 w-4" />
              Regression Analysis
            </TabsTrigger>
            <TabsTrigger
</> value="trend"><>

              <TrendingUp className="mr-2 h-4 w-4" />
              Market Trends
            </TabsTrigger>
            <TabsTrigger
</> value="pricing">
              <MapPin className="mr-2 h-4 w-4" />
              Area Pricing
            </TabsTrigger>
          </TabsList><>


          <TabsContent value="regression" className="mt-0">
            {renderAnalysisTab("regression", regressionAnalysis)}
          </TabsContent>

          <TabsContent
</> value="trend" className="mt-0">
            {renderAnalysisTab("trend", trendAnalysis)}
          </TabsContent>

          <TabsContent value="pricing" className="mt-0">
            {renderAnalysisTab("pricing", pricingAnalysis)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
