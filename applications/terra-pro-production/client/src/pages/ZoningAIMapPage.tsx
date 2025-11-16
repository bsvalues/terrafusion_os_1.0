import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, TrendingUp, TrendingDown, Warning, Calendar  } from '@mui/icons-material';

interface ZoningForecast {
  zipCode: string;
  region: string;
  timeframe: string;
  predictions: {
    category: string;
    change: number;
    confidence: number;
    trend: "up" | "down" | "stable";
  }[];
  riskFactors: string[];
  opportunities: string[];
}

export default function ZoningAIMapPage() {
  const [selectedZip, setSelectedZip] = useState("75201");
  const [timeframe, setTimeframe] = useState("24-month");
  const [forecast, setForecast] = useState<ZoningForecast | null>(null);

  useEffect(() => {
    // In production, this would fetch from a real zoning prediction API
    const mockForecast: ZoningForecast = {
      zipCode: selectedZip,
      region:
        selectedZip === "75201"
          ? "Dallas Downtown"
          : selectedZip === "98052"
            ? "Redmond, WA"
            : "Selected Area",
      timeframe,
      predictions: [
        {
          category: "Mixed-use Development",
          change: 23,
          confidence: 87,
          trend: "up",
        },
        {
          category: "Single Family Residential",
          change: -17,
          confidence: 72,
          trend: "down",
        },
        {
          category: "Commercial Retail",
          change: 8,
          confidence: 65,
          trend: "up",
        },
        {
          category: "Industrial/Warehouse",
          change: -5,
          confidence: 58,
          trend: "down",
        },
      ],
      riskFactors: [
        "Pending city council zoning review scheduled Q2 2024",
        "Transit development may impact residential zoning",
        "New environmental regulations under consideration",
      ],
      opportunities: [
        "Mixed-use incentives through 2025",
        "Tax benefits for green building compliance",
        "Fast-track permitting for affordable housing",
      ],
    };

    setForecast(mockForecast);
  }, [selectedZip, timeframe]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <span className="w-4 h-4 text-gray-600">→</span>;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold">Zoning AI Forecast Map</h1>
          <p
</> className="text-muted-foreground">AI-powered zoning predictions with GIS overlay</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <MapPin className="w-4 h-4 mr-2" />
          Live Predictions
        </Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader><>

          <CardTitle>Forecast Parameters</CardTitle>
          <CardDescription
</>>Select area and timeframe for zoning predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1"><>

              <label className="text-sm font-medium mb-2 block">ZIP Code / Area</label>
              <Select
</> value={selectedZip} onValueChange={setSelectedZip}>
                <SelectTrigger><>

                  <SelectValue placeholder="Select ZIP code" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="75201">75201 - Dallas Downtown</SelectItem>
                  <SelectItem
</> value="98052">98052 - Redmond, WA</SelectItem><>

                  <SelectItem value="10001">10001 - Manhattan, NY</SelectItem>
                  <SelectItem
</> value="90210">90210 - Beverly Hills, CA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1"><>

              <label className="text-sm font-medium mb-2 block">Forecast Timeframe</label>
              <Select
</> value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><>

                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="12-month">12 Month</SelectItem>
                  <SelectItem
</> value="24-month">24 Month</SelectItem><>

                  <SelectItem value="36-month">36 Month</SelectItem>
                  <SelectItem
</> value="60-month">60 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader><>

          <CardTitle>Interactive Zoning Map</CardTitle>
          <CardDescription
</>>GIS overlay with AI-predicted zoning changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" /><>

              <p className="text-gray-500 mb-2">Interactive Map Integration</p>
              <p
</> className="text-sm text-gray-400">
                Would display live GIS data with zoning overlays
              </p>
              <Button variant="outline" className="mt-4">
                Connect to GIS Provider
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Calendar className="w-5 h-5" />
                {forecast.timeframe} Predictions
              </CardTitle>
              <CardDescription
</>>
                {forecast.region} - ZIP {forecast.zipCode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecast.predictions.map((prediction /* , index */) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTrendIcon(prediction.trend)}
                      <div><>

                        <p className="font-medium">{prediction.category}</p>
                        <p
</> className="text-sm text-gray-600">{prediction.confidence}% confidence</p>
                      </div>
                    </div>
                    <div className="text-right"><>

                      <p className={`text-lg font-bold ${getChangeColor(prediction.change)}`}>
                        {prediction.change > 0 ? "+" : ""}
                        {prediction.change}%
                      </p>
                      <p
</> className="text-xs text-gray-500">projected change</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="w-5 h-5 text-orange-500" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {forecast.riskFactors.map((risk /* , index */) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {forecast.opportunities.map((opportunity /* , index */) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4"><>

            <Button>Export Forecast Report</Button>
            <Button
</> variant="outline">Set Alert Notifications</Button>
            <Button variant="outline">Historical Analysis</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
