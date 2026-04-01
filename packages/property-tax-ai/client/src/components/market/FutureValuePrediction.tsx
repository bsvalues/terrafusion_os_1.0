/**
 * Future Value Prediction Component
 * 
 * Displays a property's predicted future values with a chart visualization
 * and confidence intervals.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { AlertCircle, Calendar, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface PredictedValue {
  timeframe: string;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidenceLevel: number;
}

interface InfluencingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

interface FutureValuePredictionData {
  propertyId: string;
  address: string;
  currentValue: number;
  predictedValues: PredictedValue[];
  influencingFactors: InfluencingFactor[];
  methodology: string;
  generatedDate: string;
}

interface FutureValuePredictionProps {
  propertyId: string;
  className?: string;
}

export function FutureValuePrediction({ 
  propertyId, 
  className = '' 
}: FutureValuePredictionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['futureValuePrediction', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/market/future-value/${propertyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load future value prediction');
      }
      
      return response.json() as Promise<FutureValuePredictionData>;
    },
    enabled: !!propertyId
  });
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Prepare chart data for visualization
  const prepareChartData = (predictionData: FutureValuePredictionData) => {
    const currentYear = new Date().getFullYear();
    
    // Start with current value
    const chartData = [
      {
        year: currentYear,
        value: predictionData.currentValue,
        // No confidence interval for current value
        lowerBound: predictionData.currentValue,
        upperBound: predictionData.currentValue
      }
    ];
    
    // Add predicted values
    predictionData.predictedValues.forEach((prediction, index) => {
      chartData.push({
        year: currentYear + parseInt(prediction.timeframe),
        value: prediction.value,
        lowerBound: prediction.confidenceInterval.lower,
        upperBound: prediction.confidenceInterval.upper,
        confidenceLevel: Math.round(prediction.confidenceLevel * 100)
      });
    });
    
    return chartData;
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Future Value Prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : 'An error occurred while loading the future value prediction'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          No future value prediction data is available for this property.
        </AlertDescription>
      </Alert>
    );
  }
  
  const chartData = prepareChartData(data);
  
  // Calculate growth percentage from current to final predicted value
  const finalPrediction = data.predictedValues[data.predictedValues.length - 1];
  const growthPercentage = ((finalPrediction.value - data.currentValue) / data.currentValue) * 100;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Future Value Prediction</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Current Value</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(data.currentValue)}
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>5-Year Projection</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(finalPrediction.value)}
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Projected Growth</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600">
              +{growthPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Chart visualization */}
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={['dataMin - 10000', 'dataMax + 20000']}
                label={{ value: 'Property Value', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'Predicted Value']}
                labelFormatter={(value) => `Year: ${value}`}
              />
              <Legend />
              <ReferenceLine y={data.currentValue} stroke="#666" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="upperBound" 
                fill="#8884d8" 
                stroke="none" 
                fillOpacity={0.1}
              />
              <Area 
                type="monotone" 
                dataKey="lowerBound" 
                fill="#8884d8" 
                stroke="none" 
                fillOpacity={0.1}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Confidence note */}
        <div className="bg-muted p-3 rounded-md flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium">Prediction confidence</h4>
            <p className="text-sm text-muted-foreground">
              This prediction has a {Math.round(finalPrediction.confidenceLevel * 100)}% confidence level 
              with a range from {formatCurrency(finalPrediction.confidenceInterval.lower)} to {formatCurrency(finalPrediction.confidenceInterval.upper)}.
              Predictions for longer timeframes have lower confidence levels.
            </p>
          </div>
        </div>
        
        {/* Influencing factors */}
        {data.influencingFactors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Key Influencing Factors</h3>
            <div className="space-y-3">
              {data.influencingFactors.slice(0, 3).map((factor, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className={`h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center 
                    ${factor.impact === 'positive' 
                      ? 'bg-green-100 text-green-600' 
                      : factor.impact === 'negative' 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'}`}>
                    {factor.impact === 'positive' 
                      ? <TrendingUp className="h-3 w-3" /> 
                      : factor.impact === 'negative'
                        ? <TrendingUp className="h-3 w-3 rotate-180" />
                        : <AlertCircle className="h-3 w-3" />}
                  </div>
                  <div>
                    <div className="font-medium">{factor.factor}</div>
                    <div className="text-sm text-muted-foreground">{factor.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}