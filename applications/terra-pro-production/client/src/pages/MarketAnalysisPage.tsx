import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Lightbulb,
  ArrowRight,
  TrendingUp,
  MapPin,
  Home,
  Refresh,
  FileBarChart2,
  Brain,
  AlertCircle,
  Loader2,
  Sparkles,
 } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Mock data for demonstration
const defaultMarketTrendData = [
  { month: "Jan", medianPrice: 285000, inventory: 214, daysOnMarket: 32 },
  { month: "Feb", medianPrice: 290000, inventory: 195, daysOnMarket: 35 },
  { month: "Mar", medianPrice: 298000, inventory: 223, daysOnMarket: 30 },
  { month: "Apr", medianPrice: 310000, inventory: 245, daysOnMarket: 26 },
  { month: "May", medianPrice: 315000, inventory: 267, daysOnMarket: 22 },
  { month: "Jun", medianPrice: 325000, inventory: 274, daysOnMarket: 20 },
  { month: "Jul", medianPrice: 328000, inventory: 242, daysOnMarket: 24 },
  { month: "Aug", medianPrice: 322000, inventory: 201, daysOnMarket: 28 },
  { month: "Sep", medianPrice: 318000, inventory: 187, daysOnMarket: 31 },
  { month: "Oct", medianPrice: 310000, inventory: 195, daysOnMarket: 36 },
  { month: "Nov", medianPrice: 320000, inventory: 178, daysOnMarket: 38 },
  { month: "Dec", medianPrice: 335000, inventory: 165, daysOnMarket: 42 },
];

const neighborhoodData = [
  { name: "Downtown", medianPrice: 420000, pricePerSqft: 375, inventory: 45 },
  { name: "North Hills", medianPrice: 350000, pricePerSqft: 285, inventory: 78 },
  { name: "Westside", medianPrice: 380000, pricePerSqft: 310, inventory: 56 },
  { name: "Southpark", medianPrice: 295000, pricePerSqft: 225, inventory: 95 },
  { name: "Eastview", medianPrice: 275000, pricePerSqft: 195, inventory: 124 },
];

// Define types for our market analysis data
interface MarketTrendPoint {
  date: string;
  value: number;
}

interface MarketAnalysisResult {
  summary: string;
  keyInsights: string[];
  priceTrends: MarketTrendPoint[];
  inventoryTrends: MarketTrendPoint[];
  riskAssessment: {
    level: "low" | "moderate" | "high";
    factors: string[];
  };
  recommendations: string[];
}

// Default market insights when no analysis is loaded yet
const defaultMarketInsights = [
  {
    title: "Market Trend Analysis",
    content:
      'Select a location and property type, then click "Generate Analysis" to get AI-powered market insights.',
  },
  {
    title: "Supply & Demand Balance",
    content:
      "Our AI analyzes current market conditions to provide accurate supply and demand insights.",
  },
  {
    title: "Risk Assessment",
    content: "Get detailed risk analysis based on current and projected market conditions.",
  },
];

export default function MarketAnalysisPage() {
  const [, setLocation] = useLocation();
  const [selectedMarket, setSelectedMarket] = useState("local");
  const [selectedLocation, setSelectedLocation] = useState("All Areas");
  const [dateRange, setDateRange] = useState("12");
  const [propertyType, setPropertyType] = useState("All Types");
  const [activeTab, setActiveTab] = useState("overview");
  const [marketInsights, setMarketInsights] = useState(defaultMarketInsights);
  const [marketAnalysisResult, setMarketAnalysisResult] = useState<MarketAnalysisResult | null>(
    null
  );
  const [selectedAIProvider, setSelectedAIProvider] = useState<"openai" | "anthropic" | "auto">(
    "auto"
  );
  const [marketTrendData, setMarketTrendData] = useState(defaultMarketTrendData);
  const { toast } = useToast();

  // Market Analysis Query - don't execute automatically, we'll trigger it manually
  const marketAnalysisMutation = useMutation({
    mutationFn: async (params: {
      location: string;
      propertyType: string;
      timeframe: string;
      provider: "openai" | "anthropic" | "auto";
      additionalContext?: string;
    }) => {
      return apiRequest("/api/market-analysis", {
        method: "POST",
        data: params,
      });
    },
    onSuccess: (data: MarketAnalysisResult) => {
      setMarketAnalysisResult(data);

      // Convert AI insights to the format our UI expects
      const insights = [
        {
          title: "Market Summary",
          content: data.summary,
        },
        {
          title: "Risk Assessment",
          content: `Risk Level: ${data.riskAssessment.level.toUpperCase()}. ${data.riskAssessment.factors.join(" ")}`,
        },
        {
          title: "Recommendations",
          content: data.recommendations.join(" "),
        },
      ];

      setMarketInsights(insights);

      // Process price trend data for chart visualization
      if (data.priceTrends && data.priceTrends.length > 0) {
        // Transform the AI-generated price trend data to the format our charts expect
        const formattedTrendData = data.priceTrends.map((point) => {
          const date = new Date(point.date);
          return {
            month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            medianPrice: typeof point.value === "number" ? point.value : parseFloat(point.value),
            // For demo purposes, we're not using actual DOM/inventory data here
            // In a real implementation, this would come from the API
            daysOnMarket: Math.floor(20 + Math.random() * 20),
            inventory: Math.floor(150 + Math.random() * 100),
          };
        });

        // Sort by date to ensure proper chronological display
        formattedTrendData.sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

        setMarketTrendData(formattedTrendData);
      }

      // Process inventory trend data if available
      if (data.inventoryTrends && data.inventoryTrends.length > 0) {
        // If we have both price and inventory data, we can merge them
        // This is only needed if the API returns them separately
        if (data.priceTrends && data.priceTrends.length > 0) {
          // We've already processed the trend data above, so no need to update again
        } else {
          // If we only have inventory data, create chart data from it
          const formattedInventoryData = data.inventoryTrends.map((point) => {
            const date = new Date(point.date);
            return {
              month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
              inventory: typeof point.value === "number" ? point.value : parseFloat(point.value),
              medianPrice: 0, // No price data available
              daysOnMarket: 0, // No DOM data available
            };
          });

          // Sort by date
          formattedInventoryData.sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA.getTime() - dateB.getTime();
          });

          setMarketTrendData(formattedInventoryData);
        }
      }

      toast({
        title: "Market Analysis Generated",
        description: "AI-powered market analysis completed successfully.",
        variant: "default",
      });

      // Update the price trends chart data if we have that tab open
      if (data.priceTrends && data.priceTrends.length > 0) {
        setActiveTab("trends");
      }
    },
    onError: (error) => {
      console.error("Failed to generate market analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate market analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAnalysis = () => {
    // Format time period as readable string
    let timeframe: string;
    if (dateRange === "60") {
      timeframe = "5 years";
    } else {
      timeframe = `${dateRange} months`;
    }

    marketAnalysisMutation.mutate({
      location: selectedLocation,
      propertyType: propertyType === "All Types" ? "Residential" : propertyType,
      timeframe,
      provider: selectedAIProvider,
      additionalContext: `Market scope: ${selectedMarket}`,
    });
  };

  return (
    <PageLayout
      title="Market Analysis"
      description="AI-powered real estate market insights and trends"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation("/ai-valuation")}><>

            <Brain className="mr-2 h-4 w-4" />
            AI Valuation
          </Button>
          <Button
</> onClick={handleGenerateAnalysis} disabled={marketAnalysisMutation.isPending}>
            <Refresh
              className={`mr-2 h-4 w-4 ${marketAnalysisMutation.isPending ? "animate-spin" : ""}`}
            />
            {marketAnalysisMutation.isPending ? "Generating..." : "Generate Analysis"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Market selection and filters */}
        <Card>
          <CardHeader className="pb-3"><>

            <CardTitle>Market Analysis Parameters</CardTitle>
            <CardDescription
</>>
              Customize parameters to generate targeted market analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2"><>

                <label className="text-sm font-medium">Market Scope</label>
                <Select
</> value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger><>

                    <SelectValue placeholder="Select market scope" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="local">Local Market</SelectItem>
                    <SelectItem
</> value="regional">Regional</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <label className="text-sm font-medium">Location</label>
                <Select
</> value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger><>

                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="All Areas">All Areas</SelectItem>
                    <SelectItem
</> value="Downtown">Downtown</SelectItem><>

                    <SelectItem value="North Hills">North Hills</SelectItem>
                    <SelectItem
</> value="Westside">Westside</SelectItem><>

                    <SelectItem value="Southpark">Southpark</SelectItem>
                    <SelectItem
</> value="Eastview">Eastview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <label className="text-sm font-medium">Time Period (months)</label>
                <Select
</> value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger><>

                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem
</> value="6">6 months</SelectItem><>

                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem
</> value="24">24 months</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <label className="text-sm font-medium">Property Type</label>
                <Select
</> value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger><>

                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="All Types">All Types</SelectItem>
                    <SelectItem
</> value="Single Family">Single Family</SelectItem><>

                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem
</> value="Townhouse">Townhouse</SelectItem><>

                    <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                    <SelectItem
</> value="Land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <label className="text-sm font-medium">AI Provider</label>
                <Select
</>
                  value={selectedAIProvider}
                  onValueChange={(value: string) => {
                    setSelectedAIProvider(value as "auto" | "openai" | "anthropic");
                  }}
                >
                  <SelectTrigger><>

                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="auto">Auto-select</SelectItem>
                    <SelectItem
</> value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={() => {
                marketAnalysisMutation.mutate({
                  location: selectedLocation,
                  propertyType,
                  timeframe: `${dateRange} months`,
                  provider: selectedAIProvider,
                  additionalContext: `Market scope: ${selectedMarket}`,
                });
                toast({
                  title: "Generating Analysis",
                  description: `Using ${selectedAIProvider === "auto" ? "auto-selected AI provider" : selectedAIProvider} for market analysis...`,
                });
              }}
              disabled={marketAnalysisMutation.isPending}
            >
              {marketAnalysisMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Analysis
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Market Analysis Tabs */}
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full"><>

            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger
</> value="trends">Price Trends</TabsTrigger><>

            <TabsTrigger value="inventory">Inventory Analysis</TabsTrigger>
            <TabsTrigger
</> value="neighborhoods">Neighborhood Comparison</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Market Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketAnalysisMutation.isPending ? (
                    <div className="flex flex-col items-center py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <><>

                      <div className="text-3xl font-bold mb-1">
                        {
                          marketTrendData && marketTrendData.length > 2
                            ? // Calculate trend percentage based on first and last data points
                              (() => {
                                const sortedData = [...marketTrendData].sort((a, b) => {
                                  const dateA = new Date(a.month);
                                  const dateB = new Date(b.month);
                                  return dateA.getTime() - dateB.getTime();
                                });

                                const firstPoint = sortedData[0];
                                const lastPoint = sortedData[sortedData.length - 1];

                                if (firstPoint?.medianPrice && lastPoint?.medianPrice) {
                                  const percentChange =
                                    ((lastPoint.medianPrice - firstPoint.medianPrice) /
                                      firstPoint.medianPrice) *
                                    100;
                                  return `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
                                }
                                return "+5.2%"; // Default value
                              })()
                            : "+5.2%" // Default value
                        }
                      </div>
                      <p
</> className="text-sm text-muted-foreground">Year-over-year appreciation</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Home className="h-5 w-5 mr-2 text-primary" />
                    Median Sale Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketAnalysisMutation.isPending ? (
                    <div className="flex flex-col items-center py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <><>

                      <div className="text-3xl font-bold mb-1">
                        {
                          marketTrendData && marketTrendData.length > 0
                            ? (() => {
                                // Get the most recent data point
                                const sortedData = [...marketTrendData].sort((a, b) => {
                                  const dateA = new Date(a.month);
                                  const dateB = new Date(b.month);
                                  return dateB.getTime() - dateA.getTime(); // Sort descending
                                });

                                const latestPoint = sortedData[0];

                                if (latestPoint?.medianPrice) {
                                  return `$${latestPoint.medianPrice.toLocaleString()}`;
                                }
                                return "$312,500"; // Default value
                              })()
                            : "$312,500" // Default value
                        }
                      </div>
                      <p
</> className="text-sm text-muted-foreground">Current median price</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileBarChart2 className="h-5 w-5 mr-2 text-primary" />
                    Average DOM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketAnalysisMutation.isPending ? (
                    <div className="flex flex-col items-center py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <><>

                      <div className="text-3xl font-bold mb-1">
                        {
                          marketTrendData && marketTrendData.length > 0
                            ? (() => {
                                // Get the most recent data point
                                const sortedData = [...marketTrendData].sort((a, b) => {
                                  const dateA = new Date(a.month);
                                  const dateB = new Date(b.month);
                                  return dateB.getTime() - dateA.getTime(); // Sort descending
                                });

                                const latestPoint = sortedData[0];

                                if (latestPoint?.daysOnMarket) {
                                  return `${Math.round(latestPoint.daysOnMarket)} days`;
                                }
                                return "28 days"; // Default value
                              })()
                            : "28 days" // Default value
                        }
                      </div>
                      <p
</> className="text-sm text-muted-foreground">Current days on market</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><>

                <CardTitle>AI Market Insights</CardTitle>
                <CardDescription
</>>
                  Generated using historical sales data, economic indicators, and market trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketAnalysisMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">
                      Generating AI-powered market analysis...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {marketInsights.map((insight /* , index */) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <h4 className="font-medium mb-1 flex items-center"><>

                          <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                          {insight.title}
                        </h4>
                        <p
</> className="text-sm text-muted-foreground">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Custom Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Price Trends Tab */}
          <TabsContent value="trends">
            <Card>
              <CardHeader><>

                <CardTitle>Price Trends Over Time</CardTitle>
                <CardDescription
</>>
                  Median sale prices for {selectedLocation} over the past {dateRange} months
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value} days`}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "medianPrice")
                          return [`$${value.toLocaleString()}`, "Median Price"];
                        if (name === "daysOnMarket") return [`${value} days`, "Days on Market"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="medianPrice"
                      name="Median Price"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="daysOnMarket"
                      name="Days on Market"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader><>

                <CardTitle>Inventory Levels</CardTitle>
                <CardDescription
</>>Total active listings by month</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {marketAnalysisMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">Loading inventory data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "inventory") return [`${value} listings`, "Active Listings"];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="inventory" name="Active Listings" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              <CardFooter>
                <div className="text-sm">
                  {marketAnalysisResult ? (
                    <div>
                      <p className="font-medium">
                        Current Market Status:
                        <span
                          className={
                            marketAnalysisResult.riskAssessment.level === "low"
                              ? "text-green-500 ml-1"
                              : marketAnalysisResult.riskAssessment.level === "moderate"
                                ? "text-orange-500 ml-1"
                                : "text-red-500 ml-1"
                          }
                        >
                          {marketAnalysisResult.riskAssessment.level === "low"
                            ? "Buyer's Market"
                            : marketAnalysisResult.riskAssessment.level === "moderate"
                              ? "Balanced Market"
                              : "Seller's Market"}
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {marketTrendData.length > 0 &&
                          `${(marketTrendData.reduce((sum, item) => sum + item.inventory, 0) / marketTrendData.length / 100).toFixed(1)} months of inventory (balanced market is 5-6 months)`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">
                        Current Market Status:{" "}
                        <span className="text-orange-500">Seller's Market</span>
                      </p>
                      <p className="text-muted-foreground mt-1">
                        2.4 months of inventory (balanced market is 5-6 months)
                      </p>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Neighborhoods Tab */}
          <TabsContent value="neighborhoods">
            <Card>
              <CardHeader><>

                <CardTitle>Neighborhood Comparison</CardTitle>
                <CardDescription
</>>Market metrics across different neighborhoods</CardDescription>
              </CardHeader>
              <CardContent>
                {marketAnalysisMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">Loading neighborhood data...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b"><>

                          <th className="text-left p-2">Neighborhood</th>
                          <th
</> className="text-right p-2">Median Price</th><>

                          <th className="text-right p-2">Price/Sq.Ft</th>
                          <th
</> className="text-right p-2">Active Listings</th>
                          <th className="text-right p-2">YoY Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neighborhoodData.map((hood, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="p-2 flex items-center"><>

                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              {hood.name}
                            </td>
                            <td
</> className="text-right p-2">${hood.medianPrice.toLocaleString()}</td><>

                            <td className="text-right p-2">${hood.pricePerSqft}</td>
                            <td
</> className="text-right p-2">{hood.inventory}</td>
                            <td className="text-right p-2">
                              {marketAnalysisResult ? (
                                <span
                                  className={
                                    (i * 2) % 5 === 0
                                      ? "text-amber-500"
                                      : (i * 3) % 4 === 0
                                        ? "text-red-500"
                                        : "text-green-500"
                                  }
                                >
                                  {(i * 2) % 5 === 0 ? "0" : "+"}
                                  {((i * 7) % 9) + 1}.{(i * 11) % 9}%
                                </span>
                              ) : (
                                <span className={i % 2 === 0 ? "text-green-500" : "text-red-500"}>
                                  {i % 2 === 0 ? "+" : "-"}
                                  {Math.floor(Math.random() * 10) + 1}.
                                  {Math.floor(Math.random() * 9)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full space-y-2">
                  {marketAnalysisResult && (
                    <div className="text-sm p-2 bg-muted rounded-md mb-2"><>

                      <h4 className="font-medium">Key Insights:</h4>
                      <ul
</> className="list-disc list-inside pl-2 space-y-1 mt-1">
                        {marketAnalysisResult.keyInsights.slice(0, 2).map((insight, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button variant="secondary" className="w-full">
                    <FileBarChart2 className="mr-2 h-4 w-4" />
                    Export Neighborhood Analysis
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
