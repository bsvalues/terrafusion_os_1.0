import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin,
  TrendingUp,
  Building,
  Calendar,
  DollarSign,
  Warning,
  Refresh,
  BarChart3,
 } from '@mui/icons-material';

interface ZipForecast {
  zipCode: string;
  city: string;
  county: string;
  currentDevelopmentScore: number;
  forecastAccuracy: number;
  infrastructureInvestment: {
    year1: number;
    year3: number;
    year5: number;
  };
  developmentProbability: {
    year1: number;
    year3: number;
    year5: number;
  };
  landLiftForecast: {
    year1: number;
    year3: number;
    year5: number;
  };
  keyFactors: string[];
  lastUpdate: string;
  status: "Active" | "Monitoring" | "High-Risk" | "Stable";
}

interface RegionalMetrics {
  region: string;
  totalZips: number;
  avgDevelopmentScore: number;
  highProbabilityZips: number;
  totalInvestmentForecast: number;
  avgLandLift: number;
}

export default function MultiZipForecastPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("3year");

  const topZipForecasts: ZipForecast[] = [
    {
      zipCode: "98052",
      city: "Redmond",
      county: "King",
      currentDevelopmentScore: 92.4,
      forecastAccuracy: 95.1,
      infrastructureInvestment: { year1: 125000000, year3: 340000000, year5: 580000000 },
      developmentProbability: { year1: 87.3, year3: 94.1, year5: 96.8 },
      landLiftForecast: { year1: 12.4, year3: 28.7, year5: 42.1 },
      keyFactors: [
        "Microsoft expansion planned",
        "Light rail completion 2025",
        "Zoning reform for high-density",
      ],
      lastUpdate: "2025-05-29T12:00:00Z",
      status: "Active",
    },
    {
      zipCode: "99301",
      city: "Pasco",
      county: "Franklin",
      currentDevelopmentScore: 78.9,
      forecastAccuracy: 89.3,
      infrastructureInvestment: { year1: await DynamicPropertyService.GetPropertyCountAsync(countyCode)000, year3: 120000000, year5: 210000000 },
      developmentProbability: { year1: 72.1, year3: 84.6, year5: 89.2 },
      landLiftForecast: { year1: 8.7, year3: 19.4, year5: 31.2 },
      keyFactors: [
        "Columbia River port expansion",
        "Agricultural processing facilities",
        "Highway infrastructure upgrades",
      ],
      lastUpdate: "2025-05-29T11:45:00Z",
      status: "Monitoring",
    },
    {
      zipCode: "98004",
      city: "Bellevue",
      county: "King",
      currentDevelopmentScore: 88.7,
      forecastAccuracy: 91.8,
      infrastructureInvestment: { year1: 89000000, year3: 2await DynamicPropertyService.GetPropertyCountAsync(countyCode)000, year5: 420000000 },
      developmentProbability: { year1: 81.4, year3: 88.9, year5: 92.3 },
      landLiftForecast: { year1: 9.8, year3: 22.1, year5: 36.4 },
      keyFactors: [
        "Downtown redevelopment zone",
        "Transit-oriented development",
        "Tech company relocations",
      ],
      lastUpdate: "2025-05-29T12:15:00Z",
      status: "Active",
    },
    {
      zipCode: "98661",
      city: "Vancouver",
      county: "Clark",
      currentDevelopmentScore: 74.2,
      forecastAccuracy: 86.7,
      infrastructureInvestment: { year1: 32000000, year3: 95000000, year5: 165000000 },
      developmentProbability: { year1: 68.3, year3: 79.1, year5: 84.5 },
      landLiftForecast: { year1: 6.9, year3: 16.2, year5: 27.8 },
      keyFactors: [
        "Oregon tax migration effects",
        "I-5 Bridge replacement project",
        "Waterfront development plans",
      ],
      lastUpdate: "2025-05-29T11:30:00Z",
      status: "High-Risk",
    },
  ];

  const regionalMetrics: RegionalMetrics[] = [
    {
      region: "Puget Sound Metro",
      totalZips: 47,
      avgDevelopmentScore: 84.6,
      highProbabilityZips: 32,
      totalInvestmentForecast: 2840000000,
      avgLandLift: 24.7,
    },
    {
      region: "Eastern Washington",
      totalZips: 38,
      avgDevelopmentScore: 68.2,
      highProbabilityZips: 18,
      totalInvestmentForecast: 890000000,
      avgLandLift: 15.3,
    },
    {
      region: "Southwest Washington",
      totalZips: 25,
      avgDevelopmentScore: 72.8,
      highProbabilityZips: 14,
      totalInvestmentForecast: 1240000000,
      avgLandLift: 18.9,
    },
    {
      region: "Olympic Peninsula",
      totalZips: 20,
      avgDevelopmentScore: 58.4,
      highProbabilityZips: 7,
      totalInvestmentForecast: 420000000,
      avgLandLift: 11.2,
    },
  ];

  const systemMetrics = {
    totalZipsMonitored: 130,
    forecastAccuracy: 95.1,
    avgUpdateFrequency: "Hourly",
    dataSourcesIntegrated: 12,
    lastSystemUpdate: "2025-05-29T12:30:00Z",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Monitoring":
        return "bg-blue-100 text-blue-800";
      case "High-Risk":
        return "bg-red-100 text-red-800";
      case "Stable":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <MapPin className="w-8 h-8 text-blue-600" />
        <div>
<>

          <h1 className="text-3xl font-bold text-gray-900">
            Multi-Zip Development Forecast Mesh (MZDF)
          </h1>
          <p
</> className="text-gray-600">
            Predictive modeling for infrastructure investment and land lift forecasting
          </p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

            <CardTitle className="text-sm font-medium">ZIP Codes</CardTitle>
            <MapPin
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>

            <div className="text-2xl font-bold text-blue-600">
              {systemMetrics.totalZipsMonitored}
            </div>
            <p
</> className="text-xs text-muted-foreground">Monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
            <TrendingUp
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>

            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(systemMetrics.forecastAccuracy)}
            </div>
            <p
</> className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

            <CardTitle className="text-sm font-medium">Update Frequency</CardTitle>
            <Refresh
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>

            <div className="text-2xl font-bold text-purple-600">
              {systemMetrics.avgUpdateFrequency}
            </div>
            <p
</> className="text-xs text-muted-foreground">Sync rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <BarChart3
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>

            <div className="text-2xl font-bold text-orange-600">
              {systemMetrics.dataSourcesIntegrated}
            </div>
            <p
</> className="text-xs text-muted-foreground">Integrated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>

            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Calendar
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
<>

            <div className="text-2xl font-bold text-indigo-600">12:30</div>
            <p
</> className="text-xs text-muted-foreground">PM Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-64">
<>

            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent
</>>
<>

            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem
</> value="puget">Puget Sound Metro</SelectItem>
<>

            <SelectItem value="eastern">Eastern Washington</SelectItem>
            <SelectItem
</> value="southwest">Southwest Washington</SelectItem>
            <SelectItem value="peninsula">Olympic Peninsula</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-48">
<>

            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent
</>>
<>

            <SelectItem value="1year">1 Year Forecast</SelectItem>
            <SelectItem
</> value="3year">3 Year Forecast</SelectItem>
            <SelectItem value="5year">5 Year Forecast</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Refresh className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="forecasts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
<>

          <TabsTrigger value="forecasts">ZIP Forecasts</TabsTrigger>
          <TabsTrigger
</> value="regional">Regional Metrics</TabsTrigger>
          <TabsTrigger value="factors">Key Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
<>

              <CardTitle>Top Development Forecast ZIPs</CardTitle>
              <CardDescription
</>>
                Highest probability infrastructure investment and land lift potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topZipForecasts.map((forecast) => (
                  <div key={forecast.zipCode} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
<>

                          <div className="font-medium text-lg">{forecast.zipCode}</div>
                          <div
</> className="text-gray-600">
                            {forecast.city}, {forecast.county} County
                          </div>
                          <Badge className={getStatusColor(forecast.status)}>
                            {forecast.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
<>

                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Development Probability
                            </div>
                            <div
</> className="space-y-1">
                              <div className="flex justify-between text-sm">
<>

                                <span>1 Year:</span>
                                <span
</> className="font-medium">
                                  {formatPercentage(forecast.developmentProbability.year1)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
<>

                                <span>3 Year:</span>
                                <span
</> className="font-medium">
                                  {formatPercentage(forecast.developmentProbability.year3)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
<>

                                <span>5 Year:</span>
                                <span
</> className="font-medium">
                                  {formatPercentage(forecast.developmentProbability.year5)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
<>

                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Infrastructure Investment
                            </div>
                            <div
</> className="space-y-1">
                              <div className="flex justify-between text-sm">
<>

                                <span>1 Year:</span>
                                <span
</> className="font-medium">
                                  {formatCurrency(forecast.infrastructureInvestment.year1)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
<>

                                <span>3 Year:</span>
                                <span
</> className="font-medium">
                                  {formatCurrency(forecast.infrastructureInvestment.year3)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
<>

                                <span>5 Year:</span>
                                <span
</> className="font-medium">
                                  {formatCurrency(forecast.infrastructureInvestment.year5)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
<>

                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Land Lift Forecast
                            </div>
                            <div
</> className="space-y-1">
                              <div className="flex justify-between text-sm">
<>

                                <span>1 Year:</span>
                                <span
</> className="font-medium text-green-600">
                                  +{formatPercentage(forecast.landLiftForecast.year1)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
<>

                                <span>3 Year:</span>
                                <span
</> className="font-medium text-green-600">
                                  +{formatPercentage(forecast.landLiftForecast.year3)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
<>

                                <span>5 Year:</span>
                                <span
</> className="font-medium text-green-600">
                                  +{formatPercentage(forecast.landLiftForecast.year5)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
<>

                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Key Development Factors
                          </div>
                          <div
</> className="flex flex-wrap gap-2">
                            {forecast.keyFactors.map((factor /* , index */) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
<>

                          <span>
                            Forecast Accuracy: {formatPercentage(forecast.forecastAccuracy)}
                          </span>
                          <span
</>>
                            Last Updated: {new Date(forecast.lastUpdate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
<>

              <CardTitle>Regional Development Metrics</CardTitle>
              <CardDescription
</>>
                Comparative analysis across Washington State regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regionalMetrics.map((region) => (
                  <div key={region.region} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
<>

                        <div className="font-medium text-lg">{region.region}</div>

                        <div
</> className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
<>

                            <div className="text-sm text-gray-600">Total ZIPs</div>
                            <div
</> className="text-xl font-bold">{region.totalZips}</div>
                          </div>
                          <div>
<>

                            <div className="text-sm text-gray-600">Avg Dev Score</div>
                            <div
</> className="text-xl font-bold">
                              {formatPercentage(region.avgDevelopmentScore)}
                            </div>
                          </div>
                          <div>
<>

                            <div className="text-sm text-gray-600">High Probability</div>
                            <div
</> className="text-xl font-bold text-green-600">
                              {region.highProbabilityZips}
                            </div>
                          </div>
                          <div>
<>

                            <div className="text-sm text-gray-600">Investment Forecast</div>
                            <div
</> className="text-xl font-bold">
                              {formatCurrency(region.totalInvestmentForecast)}
                            </div>
                          </div>
                          <div>
<>

                            <div className="text-sm text-gray-600">Avg Land Lift</div>
                            <div
</> className="text-xl font-bold text-green-600">
                              +{formatPercentage(region.avgLandLift)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
<>

                            <span>Development Score</span>
                            <span
</>>{formatPercentage(region.avgDevelopmentScore)}</span>
                          </div>
                          <Progress value={region.avgDevelopmentScore} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
<>

                <CardTitle>Data Input Sources</CardTitle>
                <CardDescription
</>>Real-time feeds integrated into forecasting model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
<>

                  <span className="text-sm">Zoning History Database</span>
                  <Badge
</> variant="outline">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
<>

                  <span className="text-sm">Municipal Budget Cycles</span>
                  <Badge
</> variant="outline">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
<>

                  <span className="text-sm">Political Mapping Data</span>
                  <Badge
</> variant="outline">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
<>

                  <span className="text-sm">Land Sales Records</span>
                  <Badge
</> variant="outline">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
<>

                  <span className="text-sm">Building Permit Signals</span>
                  <Badge
</> variant="outline">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
<>

                  <span className="text-sm">Infrastructure Change Feed</span>
                  <Badge
</> variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
<>

                <CardTitle>System Performance</CardTitle>
                <CardDescription
</>>MZDF model accuracy and processing metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
<>

                    <span>Forecast Accuracy</span>
                    <span
</>>{formatPercentage(systemMetrics.forecastAccuracy)}</span>
                  </div>
<>

                  <Progress value={systemMetrics.forecastAccuracy} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm">
<>

                    <span>Data Freshness</span>
                    <span
</>>97.8%</span>
                  </div>
<>

                  <Progress value={97.8} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm">
<>

                    <span>Processing Speed</span>
                    <span
</>>94.2%</span>
                  </div>
<>

                  <Progress value={94.2} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm">
<>

                    <span>Model Coherence</span>
                    <span
</>>91.6%</span>
                  </div>
                  <Progress value={91.6} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
