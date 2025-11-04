/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 TREND ANALYSIS
 * Divine Mathematical Balance Engine - Historical Analysis & Forecasting
 * Advanced Time-Series Visualization with Predictive Analytics
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Zap,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { codexAPI } from '@/services/codexAPI';
import type { CodexTrend } from '@/types/codex';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const CODEX_CONSTANTS = {
  DIVINE_BALANCE_MIN: 11.5,
  DIVINE_BALANCE_MAX: 12.0,
  CHAMPIONSHIP_MIN: 10.0,
  OPERATIONAL_MIN: 9.6,
  FOUNDATION_MAX: 12.0,
} as const;

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

interface TrendDataPoint {
  timestamp: string;
  date: string;
  time: string;
  ultimatePowerScore: number;
  systemPerformance: number;
  codeQuality: number;
  compliance: number;
  userExperience: number;
}

interface TrendStatistics {
  current: number;
  average: number;
  min: number;
  max: number;
  stdDev: number;
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
  divineBalanceTime: number; // Percentage of time in divine balance
  championshipTime: number; // Percentage of time in championship mode
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateStatistics(data: TrendDataPoint[]): TrendStatistics {
  if (data.length === 0) {
    return {
      current: 0,
      average: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      trend: 'stable',
      trendPercentage: 0,
      divineBalanceTime: 0,
      championshipTime: 0,
    };
  }

  const scores = data.map((d) => d.ultimatePowerScore);
  const current = scores[scores.length - 1];
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // Standard deviation
  const variance = scores.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Trend calculation (compare first half vs second half)
  const midpoint = Math.floor(scores.length / 2);
  const firstHalfAvg = scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const secondHalfAvg = scores.slice(midpoint).reduce((a, b) => a + b, 0) / (scores.length - midpoint);
  const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  let trend: 'improving' | 'stable' | 'declining';
  if (trendPercentage > 2) trend = 'improving';
  else if (trendPercentage < -2) trend = 'declining';
  else trend = 'stable';

  // Time in divine balance and championship mode
  const divineBalanceCount = scores.filter(
    (s) => s >= CODEX_CONSTANTS.DIVINE_BALANCE_MIN
  ).length;
  const championshipCount = scores.filter((s) => s >= CODEX_CONSTANTS.CHAMPIONSHIP_MIN).length;

  return {
    current,
    average,
    min,
    max,
    stdDev,
    trend,
    trendPercentage,
    divineBalanceTime: (divineBalanceCount / scores.length) * 100,
    championshipTime: (championshipCount / scores.length) * 100,
  };
}

function formatTrendData(trends: CodexTrend[]): TrendDataPoint[] {
  return trends.map((trend) => {
    const date = new Date(trend.timestamp);
    return {
      timestamp: trend.timestamp,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      ultimatePowerScore: trend.ultimatePowerScore,
      systemPerformance: trend.domainScores.systemPerformance || 0,
      codeQuality: trend.domainScores.codeQuality || 0,
      compliance: trend.domainScores.compliance || 0,
      userExperience: trend.domainScores.userExperience || 0,
    };
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CodexTrendAnalysisProps {
  countyId?: string;
  defaultTimeRange?: TimeRange;
}

export function CodexTrendAnalysis({
  countyId,
  defaultTimeRange = '24h',
}: CodexTrendAnalysisProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trend data based on time range
  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      setError(null);

      try {
        let trends: CodexTrend[];

        switch (timeRange) {
          case '24h':
            trends = await codexAPI.get24HourTrend(countyId);
            break;
          case '7d':
            trends = await codexAPI.get7DayTrend(countyId);
            break;
          case '30d':
          case '90d':
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(
              startDate.getDate() - (timeRange === '30d' ? 30 : 90)
            );
            trends = await codexAPI.getTrends(startDate, endDate, countyId);
            break;
          default:
            trends = await codexAPI.get24HourTrend(countyId);
        }

        const formatted = formatTrendData(trends);
        setTrendData(formatted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trend data');
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [timeRange, countyId]);

  // Calculate statistics
  const statistics = useMemo(() => calculateStatistics(trendData), [trendData]);

  if (loading) {
    return (
      <Card className="bg-terra-midnight border-terra-slate">
        <CardContent className="p-12 text-center">
          <Activity className="h-12 w-12 animate-pulse mx-auto text-terra-cyan mb-4" />
          <p className="text-gray-400">Loading trend data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-terra-midnight border-red-500/20">
        <CardContent className="p-12 text-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selection */}
      <Card className="bg-terra-midnight border-terra-slate">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <LineChartIcon className="h-6 w-6 text-terra-cyan" />
                Codex 3-6-9 Trend Analysis
              </CardTitle>
              <CardDescription>
                Historical performance and predictive analytics
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={timeRange === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('24h')}
              >
                24 Hours
              </Button>
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
              >
                90 Days
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Score"
          value={statistics.current.toFixed(2)}
          subtitle="/ 12.0"
          icon={<Zap className="h-5 w-5" />}
          trend={statistics.trend}
          trendValue={statistics.trendPercentage}
        />

        <StatCard
          title="Average Score"
          value={statistics.average.toFixed(2)}
          subtitle={`Range: ${statistics.min.toFixed(1)} - ${statistics.max.toFixed(1)}`}
          icon={<Target className="h-5 w-5" />}
          showTrend={false}
        />

        <StatCard
          title="Divine Balance Time"
          value={`${statistics.divineBalanceTime.toFixed(1)}%`}
          subtitle="≥11.5 achievement"
          icon={<Activity className="h-5 w-5" />}
          color={statistics.divineBalanceTime > 50 ? 'cyan' : 'gray'}
        />

        <StatCard
          title="Championship Time"
          value={`${statistics.championshipTime.toFixed(1)}%`}
          subtitle="≥10.0 achievement"
          icon={<BarChart3 className="h-5 w-5" />}
          color={statistics.championshipTime > 80 ? 'blue' : 'gray'}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="ultimate" className="space-y-4">
        <TabsList className="bg-terra-midnight border border-terra-slate">
          <TabsTrigger value="ultimate">Ultimate Power</TabsTrigger>
          <TabsTrigger value="domains">Domain Scores</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Ultimate Power Score Timeline */}
        <TabsContent value="ultimate">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Ultimate Power Score Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ultimatePowerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    stroke="#888"
                    tick={{ fill: '#888' }}
                  />
                  <YAxis
                    domain={[0, 12]}
                    stroke="#888"
                    tick={{ fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0E1A',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />

                  {/* Divine Balance Zone */}
                  <ReferenceArea
                    y1={CODEX_CONSTANTS.DIVINE_BALANCE_MIN}
                    y2={CODEX_CONSTANTS.DIVINE_BALANCE_MAX}
                    fill="#00FFFF"
                    fillOpacity={0.1}
                    label={{
                      value: 'Divine Balance',
                      position: 'insideTopRight',
                      fill: '#00FFFF',
                    }}
                  />

                  {/* Championship Zone */}
                  <ReferenceArea
                    y1={CODEX_CONSTANTS.CHAMPIONSHIP_MIN}
                    y2={CODEX_CONSTANTS.DIVINE_BALANCE_MIN}
                    fill="#0099ff"
                    fillOpacity={0.05}
                  />

                  {/* Target Line */}
                  <ReferenceLine
                    y={12}
                    stroke="#00FFFF"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Perfect Balance (12.0)',
                      position: 'right',
                      fill: '#00FFFF',
                    }}
                  />

                  {/* Championship Line */}
                  <ReferenceLine
                    y={10}
                    stroke="#0099ff"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Championship (10.0)',
                      position: 'right',
                      fill: '#0099ff',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="ultimatePowerScore"
                    stroke="#00FFFF"
                    strokeWidth={2}
                    fill="url(#ultimatePowerGradient)"
                    name="Ultimate Power Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Scores Comparison */}
        <TabsContent value="domains">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Domain Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                  <YAxis domain={[0, 12]} stroke="#888" tick={{ fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0E1A',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="systemPerformance"
                    stroke="#00FF00"
                    strokeWidth={2}
                    name="System Performance"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="codeQuality"
                    stroke="#FF00FF"
                    strokeWidth={2}
                    name="Code Quality"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="compliance"
                    stroke="#FFFF00"
                    strokeWidth={2}
                    name="Compliance"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="userExperience"
                    stroke="#FF6600"
                    strokeWidth={2}
                    name="User Experience"
                    dot={false}
                  />

                  <ReferenceLine y={12} stroke="#00FFFF" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score Distribution */}
        <TabsContent value="distribution">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreDistributionChart data={trendData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast */}
        <TabsContent value="forecast">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Predictive Forecast (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastChart data={trendData} statistics={statistics} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'improving' | 'stable' | 'declining';
  trendValue?: number;
  color?: 'cyan' | 'blue' | 'gray';
  showTrend?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'cyan',
  showTrend = true,
}: StatCardProps) {
  const colorClass = {
    cyan: 'text-terra-cyan',
    blue: 'text-terra-blue',
    gray: 'text-gray-400',
  }[color];

  return (
    <Card className="bg-terra-midnight border-terra-slate">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">{title}</span>
          <div className={colorClass}>{icon}</div>
        </div>

        <div className="text-3xl font-bold text-white mb-1">
          {value}
          <span className="text-lg text-gray-500 ml-1">{subtitle}</span>
        </div>

        {showTrend && trend && trendValue !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            {trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}

            <span
              className={`text-sm ${
                trend === 'improving'
                  ? 'text-green-500'
                  : trend === 'declining'
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {trend === 'improving' && '+'}
              {trendValue.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SCORE DISTRIBUTION CHART
// ============================================================================

function ScoreDistributionChart({ data }: { data: TrendDataPoint[] }) {
  const distribution = useMemo(() => {
    const bins = [
      { range: '0-2', min: 0, max: 2, count: 0 },
      { range: '2-4', min: 2, max: 4, count: 0 },
      { range: '4-6', min: 4, max: 6, count: 0 },
      { range: '6-8', min: 6, max: 8, count: 0 },
      { range: '8-10', min: 8, max: 10, count: 0 },
      { range: '10-11.5', min: 10, max: 11.5, count: 0 },
      { range: '11.5-12', min: 11.5, max: 12, count: 0 },
    ];

    data.forEach((point) => {
      const score = point.ultimatePowerScore;
      const bin = bins.find((b) => score >= b.min && score < b.max);
      if (bin) bin.count++;
    });

    return bins;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={distribution}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="range" stroke="#888" tick={{ fill: '#888' }} />
        <YAxis stroke="#888" tick={{ fill: '#888' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0A0E1A',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="count" fill="#00FFFF" name="Occurrences" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// FORECAST CHART
// ============================================================================

function ForecastChart({
  data,
  statistics,
}: {
  data: TrendDataPoint[];
  statistics: TrendStatistics;
}) {
  const forecast = useMemo(() => {
    if (data.length < 2) return [];

    // Simple linear regression for forecast
    const recent = data.slice(-7); // Last 7 data points
    const futurePoints = 7; // Forecast 7 days ahead

    const forecast = [];
    const lastDate = new Date(recent[recent.length - 1].timestamp);

    for (let i = 1; i <= futurePoints; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Simple trend-based forecast
      const forecastScore =
        statistics.current + (statistics.trendPercentage / 100) * statistics.current * (i / 7);
      const clampedScore = Math.max(0, Math.min(12, forecastScore));

      forecast.push({
        date: forecastDate.toLocaleDateString(),
        forecast: clampedScore,
        upperBound: Math.min(12, clampedScore + statistics.stdDev),
        lowerBound: Math.max(0, clampedScore - statistics.stdDev),
      });
    }

    return forecast;
  }, [data, statistics]);

  const combinedData = [
    ...data.slice(-7).map((d) => ({
      date: d.date,
      actual: d.ultimatePowerScore,
      forecast: null,
      upperBound: null,
      lowerBound: null,
    })),
    ...forecast.map((f) => ({
      date: f.date,
      actual: null,
      forecast: f.forecast,
      upperBound: f.upperBound,
      lowerBound: f.lowerBound,
    })),
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={combinedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
        <YAxis domain={[0, 12]} stroke="#888" tick={{ fill: '#888' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0A0E1A',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
        />
        <Legend />

        <ReferenceLine y={12} stroke="#00FFFF" strokeDasharray="3 3" />
        <ReferenceLine y={10} stroke="#0099ff" strokeDasharray="3 3" />

        <Line
          type="monotone"
          dataKey="actual"
          stroke="#00FFFF"
          strokeWidth={2}
          name="Actual"
          dot={{ fill: '#00FFFF', r: 4 }}
        />

        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#FF6600"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Forecast"
          dot={{ fill: '#FF6600', r: 4 }}
        />

        <Line
          type="monotone"
          dataKey="upperBound"
          stroke="#888"
          strokeWidth={1}
          strokeDasharray="2 2"
          name="Upper Bound"
          dot={false}
        />

        <Line
          type="monotone"
          dataKey="lowerBound"
          stroke="#888"
          strokeWidth={1}
          strokeDasharray="2 2"
          name="Lower Bound"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default CodexTrendAnalysis;
