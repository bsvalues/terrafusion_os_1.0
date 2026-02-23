/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ADVANCED CODEX 3-6-9 DASHBOARD
 * Divine Mathematical Balance Engine - Elite Real-Time Visualization
 * Production-Ready Dashboard with SignalR Live Updates
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Zap,
  Trophy,
  Star,
  Activity,
  Clock,
} from 'lucide-react';
import { useCodexStatus } from '@/hooks/useCodexStatus';
import { useCodexSignalR } from '@/hooks/useCodexSignalR';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import type { Codex369Status, AlertLevel } from '@/types/codex';

// ============================================================================
// CONSTANTS
// ============================================================================

const CODEX_CONSTANTS = {
  FOUNDATION_MAX: 12,
  DIVINE_BALANCE_MIN: 11.5,
  DIVINE_BALANCE_MAX: 12.0,
  CHAMPIONSHIP_MIN: 10.0,
  ALERT_THRESHOLDS: {
    GREEN: 9.6,
    YELLOW: 7.2,
    RED: 4.8,
  },
} as const;

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  systemPerformance: 'System Performance',
  codeQuality: 'Code Quality',
  compliance: 'Government Compliance',
  userExperience: 'User Experience',
  security: 'Security',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getAlertLevelColor(level: AlertLevel): string {
  switch (level) {
    case 'Green':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'Yellow':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'Red':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'Critical':
      return 'text-red-700 bg-red-700/10 border-red-700/20 animate-pulse';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}

function getAlertIcon(level: AlertLevel): React.ReactNode {
  switch (level) {
    case 'Green':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'Yellow':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'Red':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'Critical':
      return <XCircle className="h-5 w-5 text-red-700 animate-pulse" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= CODEX_CONSTANTS.DIVINE_BALANCE_MIN) return 'default';
  if (score >= CODEX_CONSTANTS.CHAMPIONSHIP_MIN) return 'secondary';
  if (score >= CODEX_CONSTANTS.ALERT_THRESHOLDS.GREEN) return 'outline';
  return 'destructive';
}

function getTrendIcon(current: number, previous: number): React.ReactNode {
  if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

interface AdvancedCodexDashboardProps {
  countyId?: string;
  updateInterval?: number;
  showTrends?: boolean;
  showAlerts?: boolean;
}

export function AdvancedCodexDashboard({
  countyId,
  updateInterval = 60000,
  showTrends = true,
  showAlerts = true,
}: AdvancedCodexDashboardProps) {
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [celebrationActive, setCelebrationActive] = useState(false);

  // Fetch Codex status with auto-update
  const { status, loading, updating, error, lastUpdate, refresh } = useCodexStatus({
    countyId,
    updateInterval,
    autoUpdate: true,
    onUpdate: (newStatus) => {
      // Track score changes for trend analysis
      if (status) {
        setPreviousScore(status.ultimatePower.ultimatePowerScore);
      }
    },
    onError: (err) => {
      toast.error(`Codex update failed: ${err.message}`);
    },
  });

  // Real-time SignalR updates
  const { connected: signalRConnected } = useCodexSignalR({
    countyId,
    onUltimatePowerUpdate: (metric) => {
      // Refresh data when ultimate power updates
      refresh();
    },
    onNewAlert: (alert) => {
      if (alert.alertLevel === 'Critical') {
        toast.error(`🚨 CRITICAL ALERT`, {
          description: `${alert.domain}: ${alert.message}`,
          duration: 10000,
        });
      } else if (alert.alertLevel === 'Red') {
        toast.warning(`🔴 Alert: ${alert.domain}`, {
          description: alert.message,
          duration: 5000,
        });
      }
    },
    onDivineBalanceAchieved: (data) => {
      // Celebrate divine balance with confetti!
      setCelebrationActive(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['var(--tf-transcend-cyan)', 'var(--tf-transcend-cyan)', 'var(--tf-network-blue)'],
      });

      toast.success('🌟 DIVINE BALANCE ACHIEVED!', {
        description: `Ultimate Power: ${data.score.toFixed(2)}/12`,
        duration: 10000,
      });

      setTimeout(() => setCelebrationActive(false), 5000);
    },
  });

  // Loading state
  if (loading && !status) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-terra-cyan" />
          <p className="text-lg text-gray-400">Loading Codex 3-6-9 Framework...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !status) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Codex Status</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        <Button onClick={refresh} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  if (!status) return null;

  const { ultimatePower, amplificationMetrics, foundationMetrics } = status;

  return (
    <div className="space-y-6 p-6 bg-terra-midnight min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Zap className="h-10 w-10 text-terra-cyan" />
            Codex 3-6-9 Framework
          </h1>
          <p className="text-gray-400 mt-2">
            Divine Mathematical Balance Engine - Real-Time Operational Excellence
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* SignalR Connection Status */}
          <Badge variant={signalRConnected ? 'default' : 'destructive'} className="gap-2">
            <Activity className={`h-3 w-3 ${signalRConnected ? 'animate-pulse' : ''}`} />
            {signalRConnected ? 'Live' : 'Disconnected'}
          </Badge>

          {/* Last Update Time */}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}

          {/* Manual Refresh */}
          <Button
            onClick={refresh}
            disabled={updating}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Ultimate Power Score - Hero Section */}
      <UltimatePowerCard
        score={ultimatePower.ultimatePowerScore}
        balanceProximity={ultimatePower.balanceProximity}
        inDivineBalance={ultimatePower.inDivineBalance}
        isChampionshipMode={ultimatePower.isChampionshipMode}
        previousScore={previousScore}
        celebrationActive={celebrationActive}
      />

      {/* Domain Scores Grid - Level 6 Amplification */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {amplificationMetrics.map((amp) => (
          <DomainScoreCard
            key={amp.domain}
            domain={amp.domain}
            displayName={amp.displayName}
            score={amp.amplifiedScore}
            alertLevel={amp.alertLevel}
            safeFromImbalance={amp.safeFromImbalance}
            rawCombinedValue={amp.rawCombinedValue}
          />
        ))}
      </div>

      {/* Alerts Panel */}
      {showAlerts && status.amplificationMetrics.some((a) => a.alertLevel !== 'Green') && (
        <AlertsPanel amplificationMetrics={amplificationMetrics} />
      )}

      {/* Foundation Metrics Table - Level 3 */}
      <FoundationMetricsTable metrics={foundationMetrics} />

      {/* System Recommendations */}
      {ultimatePower.balanceRecommendations && (
        <Card className="bg-gradient-to-r from-terra-blue/10 to-terra-cyan/10 border-terra-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-terra-cyan">
              <Star className="h-5 w-5" />
              System Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white text-lg">{ultimatePower.balanceRecommendations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// ULTIMATE POWER CARD
// ============================================================================

interface UltimatePowerCardProps {
  score: number;
  balanceProximity: number;
  inDivineBalance: boolean;
  isChampionshipMode: boolean;
  previousScore: number | null;
  celebrationActive: boolean;
}

function UltimatePowerCard({
  score,
  balanceProximity,
  inDivineBalance,
  isChampionshipMode,
  previousScore,
  celebrationActive,
}: UltimatePowerCardProps) {
  const percentage = (score / CODEX_CONSTANTS.FOUNDATION_MAX) * 100;

  return (
    <Card
      className={`bg-gradient-to-br from-terra-midnight via-terra-blue/20 to-terra-cyan/20 border-2 ${
        inDivineBalance
          ? 'border-terra-cyan shadow-[0_0_30px_hsl(var(--tf-cyan-hs)_50%_/_0.3)] animate-pulse'
          : isChampionshipMode
          ? 'border-terra-blue shadow-[0_0_20px_hsl(var(--tf-blue-hs)_50%_/_0.2)]'
          : 'border-terra-slate'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl text-white flex items-center gap-3">
            {inDivineBalance ? (
              <Star className="h-8 w-8 text-terra-cyan animate-pulse" />
            ) : isChampionshipMode ? (
              <Trophy className="h-8 w-8 text-terra-blue" />
            ) : (
              <Zap className="h-8 w-8 text-gray-400" />
            )}
            Ultimate Power Score (Level 9)
          </CardTitle>

          {previousScore !== null && (
            <div className="flex items-center gap-2">
              {getTrendIcon(score, previousScore)}
              <span className="text-sm text-gray-400">
                {previousScore !== null && Math.abs(score - previousScore) > 0.01
                  ? `${score > previousScore ? '+' : ''}${(score - previousScore).toFixed(2)}`
                  : '—'}
              </span>
            </div>
          )}
        </div>
        <CardDescription className="text-gray-300 text-lg">
          {inDivineBalance
            ? '🌟 Divine Balance - Perfect Operational Harmony'
            : isChampionshipMode
            ? '🏆 Championship Mode - Production Ready'
            : 'Operational Excellence Monitoring'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center">
          <div className={`text-8xl font-bold ${celebrationActive ? 'animate-bounce' : ''}`}>
            <span
              className={
                inDivineBalance
                  ? 'text-terra-cyan'
                  : isChampionshipMode
                  ? 'text-terra-blue'
                  : 'text-white'
              }
            >
              {score.toFixed(2)}
            </span>
            <span className="text-4xl text-gray-500"> / 12</span>
          </div>

          <Progress value={percentage} className="h-4 mt-6 bg-gray-800" />

          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-gray-400">Balance Proximity</span>
            <span className="text-terra-cyan font-semibold">
              {(balanceProximity * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {inDivineBalance && (
            <Badge variant="default" className="bg-terra-cyan text-black gap-2 px-4 py-2 text-lg">
              <Star className="h-5 w-5" />
              DIVINE BALANCE
            </Badge>
          )}

          {isChampionshipMode && !inDivineBalance && (
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-lg">
              <Trophy className="h-5 w-5" />
              CHAMPIONSHIP MODE
            </Badge>
          )}

          {!isChampionshipMode && score >= CODEX_CONSTANTS.ALERT_THRESHOLDS.GREEN && (
            <Badge variant="outline" className="gap-2 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Operational Excellence
            </Badge>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-400">Target</p>
            <p className="text-2xl font-bold text-terra-cyan">12.0</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Current</p>
            <p className="text-2xl font-bold text-white">{score.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Deficit</p>
            <p className="text-2xl font-bold text-gray-500">
              {(CODEX_CONSTANTS.FOUNDATION_MAX - score).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DOMAIN SCORE CARD
// ============================================================================

interface DomainScoreCardProps {
  domain: string;
  displayName: string;
  score: number;
  alertLevel: AlertLevel;
  safeFromImbalance: boolean;
  rawCombinedValue: number;
}

function DomainScoreCard({
  domain,
  displayName,
  score,
  alertLevel,
  safeFromImbalance,
  rawCombinedValue,
}: DomainScoreCardProps) {
  const percentage = (score / CODEX_CONSTANTS.FOUNDATION_MAX) * 100;

  return (
    <Card className={`bg-terra-midnight border ${getAlertLevelColor(alertLevel)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{displayName}</CardTitle>
          {getAlertIcon(alertLevel)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">
            {score.toFixed(1)}
            <span className="text-lg text-gray-500"> / 12</span>
          </div>

          <Progress value={percentage} className="h-2 mt-3 bg-gray-800" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
            {alertLevel}
          </Badge>

          {!safeFromImbalance && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertCircle className="h-3 w-3" />
              Approaching 666
            </Badge>
          )}
        </div>

        <div className="text-xs text-gray-400 text-center">
          Raw: {rawCombinedValue.toFixed(1)} / 666
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ALERTS PANEL
// ============================================================================

interface AlertsPanelProps {
  amplificationMetrics: any[];
}

function AlertsPanel({ amplificationMetrics }: AlertsPanelProps) {
  const alerts = amplificationMetrics.filter((a) => a.alertLevel !== 'Green');

  if (alerts.length === 0) return null;

  return (
    <Card className="bg-terra-midnight border-yellow-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-500">
          <AlertTriangle className="h-5 w-5" />
          Active Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert
              key={alert.domain}
              variant={alert.alertLevel === 'Critical' || alert.alertLevel === 'Red' ? 'destructive' : 'default'}
              className="bg-terra-midnight/50"
            >
              {getAlertIcon(alert.alertLevel)}
              <AlertTitle>{alert.displayName}</AlertTitle>
              <AlertDescription>
                Score: {alert.amplifiedScore.toFixed(1)}/12 - {alert.recommendedAction}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FOUNDATION METRICS TABLE
// ============================================================================

interface FoundationMetricsTableProps {
  metrics: any[];
}

function FoundationMetricsTable({ metrics }: FoundationMetricsTableProps) {
  return (
    <Card className="bg-terra-midnight border-terra-slate">
      <CardHeader>
        <CardTitle className="text-white">Foundation Metrics (Level 3)</CardTitle>
        <CardDescription>Individual metrics scaled to 0-12</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr className="text-left text-gray-400">
                <th className="pb-3">Metric</th>
                <th className="pb-3">Domain</th>
                <th className="pb-3">Raw Value</th>
                <th className="pb-3">Scaled</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {metrics.slice(0, 10).map((metric) => (
                <tr key={metric.metricName} className="text-white">
                  <td className="py-3">{metric.displayName || metric.metricName}</td>
                  <td className="py-3 text-gray-400">{DOMAIN_DISPLAY_NAMES[metric.domain] || metric.domain}</td>
                  <td className="py-3">
                    {metric.rawValue.toFixed(1)} {metric.unit}
                  </td>
                  <td className="py-3">
                    <span className="font-semibold">{metric.scaledValue.toFixed(1)}</span>
                    <span className="text-gray-500"> / 12</span>
                  </td>
                  <td className="py-3">{getAlertIcon(metric.alertLevel)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {metrics.length > 10 && (
            <div className="mt-4 text-center text-gray-400 text-sm">
              Showing 10 of {metrics.length} metrics
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedCodexDashboard;
