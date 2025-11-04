import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Warning,
  AlertCircle,
  CheckCircle,
  BarChart,
  LineChart,
  PieChart,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Brain,
  ZoomIn,
  Eye,
  Home,
  Filter,
  CalendarRange,
 } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * AppraisalModelInsights Component
 *
 * A component that translates technical model monitoring data into
 * practical insights for appraisers, focusing on when to trust model
 * outputs and when to exercise more caution.
 */

interface ModelStatistic {
  name: string;
  value: number | string;
  change?: number;
  status?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  tooltip?: string;
}

interface ModelInfo {
  name: string;
  version: string;
  lastUpdated: string;
  status: "stable" | "learning" | "caution";
  insights: string[];
  statistics: ModelStatistic[];
}

interface AppraisalModelInsightsProps {
  models?: ModelInfo[];
  timeframe?: "7d" | "30d" | "90d" | "all";
  simplified?: boolean;
}

export function AppraisalModelInsights({
  timeframe = "30d",
  simplified = false,
  models = [
    {
      name: "Residential Valuation Model",
      version: "2.4.1",
      lastUpdated: "2025-03-15",
      status: "stable",
      insights: [
        "The model is performing reliably across most property types",
        "Accuracy is highest for single-family homes in urban and suburban areas",
        "Exercise caution with luxury properties over $1.5M",
      ],
      statistics: [
        {
          name: "Accuracy",
          value: "92%",
          change: 3,
          status: "positive",
          icon: <CheckCircle className="h-4 w-4" />,
          tooltip: "Percentage of valuations within 5% of actual sale price",
        },
        {
          name: "Average Confidence",
          value: "87%",
          change: 2,
          status: "positive",
          icon: <BarChart className="h-4 w-4" />,
          tooltip: "Average confidence score across all valuations",
        },
        {
          name: "Drift Level",
          value: "Low",
          change: -4,
          status: "positive",
          icon: <LineChart className="h-4 w-4" />,
          tooltip: "Degree to which model performance has changed over time",
        },
      ],
    },
    {
      name: "Property Condition Assessment",
      version: "1.8.2",
      lastUpdated: "2025-04-02",
      status: "learning",
      insights: [
        "Model continues to improve with each photo analysis",
        "Highest accuracy for exterior elements like roofing and siding",
        "Interior assessment reliability depends on photo quality and coverage",
      ],
      statistics: [
        {
          name: "Accuracy",
          value: "88%",
          change: 5,
          status: "positive",
          icon: <CheckCircle className="h-4 w-4" />,
          tooltip: "Percentage of condition assessments matching expert ratings",
        },
        {
          name: "Coverage",
          value: "94%",
          change: 2,
          status: "positive",
          icon: <PieChart className="h-4 w-4" />,
          tooltip: "Percentage of property components the model can evaluate",
        },
        {
          name: "Learning Rate",
          value: "High",
          change: 1,
          status: "positive",
          icon: <TrendingUp className="h-4 w-4" />,
          tooltip: "Rate at which the model is improving with new data",
        },
      ],
    },
    {
      name: "Market Trends Analyzer",
      version: "3.1.0",
      lastUpdated: "2025-02-28",
      status: "caution",
      insights: [
        "Reliable for stable markets with consistent transaction volume",
        "Use with caution in rapidly changing markets or during economic shifts",
        "Model is being updated to better handle current interest rate impacts",
      ],
      statistics: [
        {
          name: "Accuracy",
          value: "85%",
          change: -3,
          status: "negative",
          icon: <AlertCircle className="h-4 w-4" />,
          tooltip: "Percentage of trend predictions matching actual market movements",
        },
        {
          name: "Data Freshness",
          value: "96%",
          change: 0,
          status: "neutral",
          icon: <CalendarRange className="h-4 w-4" />,
          tooltip: "How up-to-date the model's market data is",
        },
        {
          name: "Volatility Handling",
          value: "Medium",
          change: -2,
          status: "negative",
          icon: <TrendingDown className="h-4 w-4" />,
          tooltip: "How well the model handles rapidly changing market conditions",
        },
      ],
    },
  ],
}: AppraisalModelInsightsProps) {
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [activeTab, setActiveTab] = useState(models[0]?.name || "");

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "stable":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "learning":
        return <Brain className="h-4 w-4 text-blue-500" />;
      case "caution":
        return <Warning className="h-4 w-4 text-amber-500" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "stable":
        return "Reliable, well-tested";
      case "learning":
        return "Improving, verify outputs";
      case "caution":
        return "Use with extra review";
      default:
        return "Unknown status";
    }
  };

  // Helper function to get trend icon
  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  // Helper function to get badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "stable":
        return "success";
      case "learning":
        return "default";
      case "caution":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get active model
  const activeModel = models.find((model) => model.name === activeTab) || models[0];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><>

            <CardTitle>AI Model Insights for Appraisers</CardTitle>
            <CardDescription
</>>
              Understanding when to trust and when to verify AI-assisted valuation tools
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Last {timeframe === "all" ? "All Time" : timeframe}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!simplified && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              {models.map((model) => (
                <TabsTrigger key={model.name} value={model.name}>
                  <div className="flex items-center">
                    {getStatusIcon(model.status)}<>

                    <span className="ml-2 hidden md:inline">{model.name.split(" ")[0]}</span>
                    <span
</> className="ml-2 md:hidden">{model.name.charAt(0)}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {models.map((model) => (
              <TabsContent key={model.name} value={model.name} className="space-y-4 pt-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-4 w-full md:w-2/3">
                    <div className="flex items-center justify-between">
                      <div><>

                        <h3 className="text-lg font-medium">{model.name}</h3>
                        <div
</> className="flex items-center gap-2 mt-1"><>

                          <Badge variant="outline" className="text-xs">
                            v{model.version}
                          </Badge>
                          <span
</> className="text-xs text-muted-foreground">
                            Updated: {new Date(model.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={getStatusBadge(model.status)}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(model.status)}
                        <span>{getStatusText(model.status)}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2"><>

                      <h4 className="text-sm font-medium">What This Means For Appraisers:</h4>
                      <ul
</> className="space-y-2">
                        {model.insights.map((insight /* , index */) => (
                          <li key={index} className="flex items-start gap-2 text-sm"><>

                            <div className="mt-1 min-w-[16px]">•</div>
                            <span
</>>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 space-y-2"><>

                    <h4 className="text-sm font-medium">Key Performance Metrics:</h4>
                    <div
</> className="grid grid-cols-1 gap-3">
                      {model.statistics.map((stat /* , index */) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center gap-2"><>

                            <div
                              className={`p-1.5 rounded-full ${
                                stat.status === "positive"
                                  ? "bg-green-100 dark:bg-green-900/20"
                                  : stat.status === "negative"
                                    ? "bg-red-100 dark:bg-red-900/20"
                                    : "bg-gray-100 dark:bg-gray-800"
                              }`}
                            >
                              {stat.icon}
                            </div>
                            <TooltipProvider
</>>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1"><>

                                    <span className="text-sm">{stat.name}</span>
                                    <HelpCircle
</> className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{stat.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{stat.value}</span>
                            {stat.change !== undefined && (
                              <div className="flex items-center text-xs">
                                {getTrendIcon(stat.change)}
                                <span
                                  className={`ml-1 ${
                                    (stat.status === "positive" && stat.change > 0) ||
                                    (stat.status === "negative" && stat.change < 0)
                                      ? "text-green-600 dark:text-green-400"
                                      : (stat.status === "negative" && stat.change > 0) ||
                                          (stat.status === "positive" && stat.change < 0)
                                        ? "text-red-600 dark:text-red-400"
                                        : ""
                                  }`}
                                >
                                  {stat.change > 0 ? "+" : ""}
                                  {stat.change}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {simplified && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {models.map((model) => (
                <Card
                  key={model.name}
                  className={`border-l-4 ${
                    model.status === "stable"
                      ? "border-l-green-500"
                      : model.status === "learning"
                        ? "border-l-blue-500"
                        : "border-l-amber-500"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between"><>

                      <h3 className="font-medium text-sm">{model.name}</h3>
                      <Badge
</> variant={getStatusBadge(model.status)} className="text-xs">
                        {model.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3"><>

                    <p className="text-sm text-muted-foreground mb-3">{model.insights[0]}</p>
                    <div
</> className="flex justify-between items-center text-sm"><>

                      <span className="text-xs">Reliability: {model.statistics[0].value}</span>
                      <Button
</>
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setActiveTab(model.name)}
                      >
                        <ZoomIn className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 border rounded-md bg-muted/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div><>

                  <h3 className="font-medium mb-1">Appraiser's Note</h3>
                  <p
</> className="text-sm text-muted-foreground">
                    Models with "stable" status have consistent performance and can generally be
                    trusted. Models marked as "learning" or "caution" require additional
                    professional review of their outputs. Always apply your professional judgment
                    when using AI-assisted tools in your appraisal work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 flex justify-between">
        <div className="flex items-center text-xs text-muted-foreground"><>

          <Brain className="h-3.5 w-3.5 mr-1" />
          Terrafusion AI Health Status
        </div>
        <Button
</>
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setShowAllInsights(!showAllInsights)}
        >
          {simplified ? (
            <>
              <Eye className="h-3.5 w-3.5 mr-1" />
              View Detailed Insights
            </>
          ) : (
            <>
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
              Open Monitoring Dashboard
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AppraisalModelInsights;
