import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, 
  ChevronUp, 
  ChevronDown,
  TrendingDown,
  Bell,
  Info,
  BarChart,
 } from '@mui/icons-material';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters';
import { TrendForecastService, DataPoint } from '@/services/TrendForecastService';

interface ValuationTrendsForecastProps {
  valuations: any[];
}

export const ValuationTrendsForecast = ({ valuations }: ValuationTrendsForecastProps) => {
  const [forecastPeriods, setForecastPeriods] = useState(3);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const forecastService = useMemo(() => new TrendForecastService(), []);
  
  // Convert valuations to data points for the forecast service
  const valuationDataPoints: DataPoint[] = useMemo(() => {
    return valuations.map(valuation => ({
      date: new Date(valuation.createdAt),
      value: parseFloat(valuation.valuationAmount),
    }));
  }, [valuations]);
  
  // Generate forecast data
  const forecast = useMemo(() => {
    if (valuationDataPoints.length < 2) {
      return null;
    }
    
    try {
      return forecastService.generateForecast(valuationDataPoints, forecastPeriods);
    } catch (error) {
      console.error('Error generating forecast:', error);
      return null;
    }
  }, [forecastService, valuationDataPoints, forecastPeriods]);
  
  // Prepare chart data combining historical and forecast data
  const chartData = useMemo(() => {
    if (!forecast) return [];
    
    // Historical data points
    const historicalPoints = valuationDataPoints.map(point => ({
      date: formatDate(point.date),
      value: point.value,
      type: 'historical',
    }));
    
    // Forecast data points
    const forecastPoints = forecast.predictions.map(prediction => ({
      date: formatDate(prediction.date),
      value: prediction.value,
      lowerBound: prediction.lowerBound,
      upperBound: prediction.upperBound,
      type: 'forecast',
    }));
    
    return [...historicalPoints, ...forecastPoints];
  }, [valuationDataPoints, forecast]);
  
  // For area chart with confidence interval
  const areaChartData = useMemo(() => {
    if (!forecast) return [];
    
    // Only include data points that have forecast information
    return chartData.filter(point => point.type === 'forecast');
  }, [chartData, forecast]);
  
  // Determine growth status and color
  const growthStatus = useMemo(() => {
    if (!forecast) return { label: 'Unknown', color: 'text-gray-500' };
    
    const growthRate = forecast.growthRate;
    
    if (growthRate > 0.05) return { label: 'Strong Growth', color: 'text-green-600' };
    if (growthRate > 0.01) return { label: 'Moderate Growth', color: 'text-green-500' };
    if (growthRate > -0.01) return { label: 'Stable', color: 'text-blue-500' };
    if (growthRate > -0.05) return { label: 'Moderate Decline', color: 'text-amber-500' };
    return { label: 'Strong Decline', color: 'text-red-600' };
  }, [forecast]);
  
  // Determine confidence label
  const confidenceLabel = useMemo(() => {
    if (!forecast) return { label: 'Unknown', color: 'text-gray-500' };
    
    const score = forecast.confidenceScore;
    
    if (score > 0.8) return { label: 'High', color: 'text-green-600' };
    if (score > 0.6) return { label: 'Moderate', color: 'text-blue-500' };
    if (score > 0.4) return { label: 'Fair', color: 'text-amber-500' };
    return { label: 'Low', color: 'text-red-600' };
  }, [forecast]);
  
  // Handle slider change
  const handlePeriodsChange = (value: number[]) => {
    setForecastPeriods(value[0]);
  };
  
  // If there's not enough data, show a message
  if (valuations.length < 2) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Valuation Forecast</CardTitle>
          <CardDescription
</>

</>>Predictive analysis of future valuations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <BarChart className="h-16 w-16 text-muted-foreground" /><>

          <h3 className="text-lg font-medium">Not enough data for forecasting</h3>
          <p
</>

className="text-center text-muted-foreground">
            You need at least 2 valuation data points to generate forecasts.
            Create more valuations to enable trend predictions.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center"><>

          <BarChart className="mr-2 h-5 w-5" />
          Valuation Forecast
        </CardTitle>
        <CardDescription
</>

</>>
          AI-powered predictive analysis of your valuation trajectory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Forecast Period Slider */}
        <div className="space-y-3">
          <div className="flex justify-between"><>

            <span className="text-sm font-medium">Forecast Periods</span>
            <span
</>

className="text-sm font-medium">{forecastPeriods} {forecastPeriods === 1 ? 'month' : 'months'}</span>
          </div>
          <Slider
            defaultValue={[forecastPeriods]}
            max={12}
            min={1}
            step={1}
            onValueChange={handlePeriodsChange}
          />
        </div>
        
        {/* Main Forecast Chart */}
        <div className="space-y-4"><>

          <h3 className="text-lg font-medium">Valuation Trend with Forecast</h3>
          <div
</>

className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Historical"
                  stroke="#8884d8"
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Forecast"
                  stroke="#82ca9d"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  connectNulls
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Prediction Range */}
        <div className="space-y-4"><>

          <h3 className="text-lg font-medium">Prediction Range</h3>
          <div
</>

className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaChartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  name="Upper Estimate"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  activeDot={false}
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Expected Value"
                  stroke="#82ca9d"
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  name="Lower Estimate"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  activeDot={false}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <Separator />
        
        {/* Forecast Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-4"><>

            <div className="text-sm font-medium text-muted-foreground mb-1">Growth Rate</div>
            <div
</>

className={`text-2xl font-bold flex items-center ${growthStatus.color}`}>
              {forecast ? formatPercentage(forecast.growthRate) : 'N/A'}
              {forecast && forecast.growthRate > 0 ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : forecast && forecast.growthRate < 0 ? (<>

                <ChevronDown className="ml-1 h-4 w-4" />
              ) : null}
            </div>
            <div
</>

className="text-xs text-muted-foreground mt-1">{growthStatus.label}</div>
          </div>
          
          <div className="bg-muted rounded-lg p-4"><>

            <div className="text-sm font-medium text-muted-foreground mb-1">Confidence Score</div>
            <div
</>

className={`text-2xl font-bold ${confidenceLabel.color}`}>
              {forecast ? formatPercentage(forecast.confidenceScore) : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{confidenceLabel.label} Confidence</div>
          </div>
          
          <div className="bg-muted rounded-lg p-4"><>

            <div className="text-sm font-medium text-muted-foreground mb-1">Projected Value</div>
            <div
</>

className="text-2xl font-bold">
              {forecast && forecast.predictions.length > 0 
                ? formatCurrency(forecast.predictions[forecast.predictions.length - 1].value) 
                : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              In {forecastPeriods} {forecastPeriods === 1 ? 'month' : 'months'}
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4"><>

            <div className="text-sm font-medium text-muted-foreground mb-1">Value Range</div>
            <div
</>

className="text-sm font-medium">
              {forecast && forecast.predictions.length > 0 ? (
                  <span className="text-emerald-600">
                    {formatCurrency(forecast.predictions[forecast.predictions.length - 1].upperBound)}
                  </span>
                  {' - '}
                  <span className="text-amber-600">
                    {formatCurrency(forecast.predictions[forecast.predictions.length - 1].lowerBound)}
                  </span>
              ) : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Estimated range</div>
          </div>
        </div>
        
        {forecast && (
            <Separator />
            
            {/* Insights and Warnings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Insights */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3"><>

                  <Info className="mr-2 h-4 w-4" />
                  Insights
                </h3>
                <ul
</>

className="space-y-2">
                  {forecast.insights.slice(0, showAllInsights ? undefined : 3).map((insight /* , index */) => (
                    <li key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
                      {insight}
                    </li>
                  ))}
                </ul>
                {forecast.insights.length > 3 && (
                  <Button 
                    variant="link" 
                    onClick={() => setShowAllInsights(!showAllInsights)}
                    className="mt-2"
                  >
                    {showAllInsights ? 'Show Less' : `Show ${forecast.insights.length - 3} More`}
                  </Button>
                )}
              </div>
              
              {/* Warnings */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <Bell className="mr-2 h-4 w-4" />
                  Warnings
                </h3>
                {forecast.warnings.length > 0 ? (
                  <ul className="space-y-2">
                    {forecast.warnings.map((warning /* , index */) => (
                      <li key={index} className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-md">
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No warnings detected for this forecast.</p>
                )}
              </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};