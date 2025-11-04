/**
 * Productivity Stats Component
 *
 * Display productivity statistics and trends
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock, CheckCircle, XCircle, Code, AlertCircle  } from '@mui/icons-material';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ProductivityStats = () => {
  const [timeRange, setTimeRange] = useState('7');

  // Fetch productivity statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/productivity/statistics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/productivity/statistics?days=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch productivity statistics');
      }
      return await response.json();
    },
  });

  // Fetch productivity trends
  const { data: trends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['/api/productivity/trends', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/productivity/trends?days=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch productivity trends');
      }
      return await response.json();
    },
  });

  if (isLoadingStats || isLoadingTrends) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no data yet
  if (!stats || !trends) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No productivity data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
<>
        <h3 className="text-sm font-medium">Productivity Stats</h3>
        <Select
</> value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
<>
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent
</>>
<>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem
</> value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Clock className="h-5 w-5 mb-1 text-blue-500" />
<>
              <span className="text-lg font-bold">{stats.averageProductiveHours.toFixed(1)}</span>
              <span
</> className="text-xs text-muted-foreground">hours/day</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <CheckCircle className="h-5 w-5 mb-1 text-green-500" />
<>
              <span className="text-lg font-bold">{stats.averageTasksCompleted.toFixed(1)}</span>
              <span
</> className="text-xs text-muted-foreground">tasks/day</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Code className="h-5 w-5 mb-1 text-purple-500" />
<>
              <span className="text-lg font-bold">{stats.averageCodeLines.toFixed(0)}</span>
              <span
</> className="text-xs text-muted-foreground">lines/day</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <XCircle className="h-5 w-5 mb-1 text-red-500" />
<>
              <span className="text-lg font-bold">{stats.averageDistractions.toFixed(1)}</span>
              <span
</> className="text-xs text-muted-foreground">distractions/day</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
<>
        <h3 className="text-sm font-medium">Energy Level Distribution</h3>
        <div
</> className="space-y-2">
          <div className="flex justify-between text-xs">
<>
            <span>High</span>
            <span
</>>{trends.energyLevelDistribution.HIGH || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.energyLevelDistribution.HIGH, timeRange)}
            className="bg-blue-200 h-2"
          >
<>
            <div className="bg-green-500 h-full" />
          </Progress>

          <div
</> className="flex justify-between text-xs">
<>
            <span>Medium</span>
            <span
</>>{trends.energyLevelDistribution.MEDIUM || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.energyLevelDistribution.MEDIUM, timeRange)}
            className="bg-blue-200 h-2"
          >
<>
            <div className="bg-amber-500 h-full" />
          </Progress>

          <div
</> className="flex justify-between text-xs">
<>
            <span>Low</span>
            <span
</>>{trends.energyLevelDistribution.LOW || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.energyLevelDistribution.LOW, timeRange)}
            className="bg-blue-200 h-2"
          >
            <div className="bg-red-500 h-full" />
          </Progress>
        </div>
      </div>

      <div className="space-y-3">
<>
        <h3 className="text-sm font-medium">Focus Level Distribution</h3>
        <div
</> className="space-y-2">
          <div className="flex justify-between text-xs">
<>
            <span>Deep</span>
            <span
</>>{trends.focusLevelDistribution.DEEP || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.focusLevelDistribution.DEEP, timeRange)}
            className="bg-blue-200 h-2"
          >
<>
            <div className="bg-indigo-600 h-full" />
          </Progress>

          <div
</> className="flex justify-between text-xs">
<>
            <span>Moderate</span>
            <span
</>>{trends.focusLevelDistribution.MODERATE || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.focusLevelDistribution.MODERATE, timeRange)}
            className="bg-blue-200 h-2"
          >
<>
            <div className="bg-blue-500 h-full" />
          </Progress>

          <div
</> className="flex justify-between text-xs">
<>
            <span>Shallow</span>
            <span
</>>{trends.focusLevelDistribution.SHALLOW || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.focusLevelDistribution.SHALLOW, timeRange)}
            className="bg-blue-200 h-2"
          >
<>
            <div className="bg-amber-500 h-full" />
          </Progress>

          <div
</> className="flex justify-between text-xs">
<>
            <span>Distracted</span>
            <span
</>>{trends.focusLevelDistribution.DISTRACTED || 0} days</span>
          </div>
          <Progress
            value={calculatePercentage(trends.focusLevelDistribution.DISTRACTED, timeRange)}
            className="bg-blue-200 h-2"
          >
            <div className="bg-red-500 h-full" />
          </Progress>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate percentage
const calculatePercentage = (value: number | undefined, total: string): number => {
  if (!value) return 0;
  return (value / parseInt(total)) * 100;
};

export default ProductivityStats;
