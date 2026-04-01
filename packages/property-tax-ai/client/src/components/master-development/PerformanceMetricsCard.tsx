import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BadgeInfo, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

interface PerformanceMetricsCardProps {
  title: string;
  description: string;
  metrics: PerformanceMetric[];
  overallStatus?: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastUpdated?: string;
}

const PerformanceMetricsCard = ({
  title,
  description,
  metrics,
  overallStatus = 'unknown',
  lastUpdated
}: PerformanceMetricsCardProps) => {
  
  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <BadgeInfo className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Helper function to determine progress color
  const getProgressColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.6) return 'bg-green-500';
    if (value <= threshold * 0.8) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center space-x-1">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(overallStatus)}`} />
          <span className="text-xs text-gray-500">
            {lastUpdated ? `Updated ${lastUpdated}` : 'Status unknown'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {getStatusIcon(metric.status)}
                  <span className="text-sm font-medium ml-1">{metric.name}</span>
                </div>
                <span className="text-sm font-semibold">
                  {metric.value} {metric.unit}
                </span>
              </div>
              <div className="flex items-center">
                <Progress 
                  value={(metric.value / metric.threshold) * 100} 
                  max={100} 
                  className={`h-1.5 ${getProgressColor(metric.value, metric.threshold)}`} 
                />
                <span className="text-xs text-gray-500 ml-2">
                  Threshold: {metric.threshold} {metric.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsCard;