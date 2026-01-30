/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 MOBILE WIDGET
 * Divine Mathematical Balance Engine - Mobile-First Compact Display
 * Executive Dashboard Widget for On-The-Go Monitoring
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  Star,
  Trophy,
  ExternalLink,
} from 'lucide-react';
import { useCodexStatus } from '@/hooks/useCodexStatus';
import { useCodexSignalR } from '@/hooks/useCodexSignalR';
import type { AlertLevel } from '@/types/codex';

// ============================================================================
// CONSTANTS
// ============================================================================

const CODEX_CONSTANTS = {
  DIVINE_BALANCE_MIN: 11.5,
  CHAMPIONSHIP_MIN: 10.0,
  OPERATIONAL_MIN: 9.6,
  FOUNDATION_MAX: 12.0,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface CodexMobileWidgetProps {
  countyId?: string;
  compact?: boolean;
  showDomains?: boolean;
  updateInterval?: number;
  onExpand?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CodexMobileWidget({
  countyId,
  compact = false,
  showDomains = true,
  updateInterval = 60000,
  onExpand,
}: CodexMobileWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  // Fetch Codex status
  const { status, loading, updating, refresh, lastUpdate } = useCodexStatus({
    countyId,
    updateInterval,
    autoUpdate: true,
  });

  // Real-time SignalR updates
  const { connected: signalRConnected } = useCodexSignalR({
    countyId,
    onUltimatePowerUpdate: () => refresh(),
  });

  // Track score changes
  useEffect(() => {
    if (status && previousScore === null) {
      setPreviousScore(status.ultimatePower.ultimatePowerScore);
    }
  }, [status, previousScore]);

  if (loading && !status) {
    return (
      <Card className="bg-terra-midnight border-terra-slate">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-terra-cyan" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const { ultimatePower, amplificationMetrics } = status;
  const score = ultimatePower.ultimatePowerScore;
  const percentage = (score / CODEX_CONSTANTS.FOUNDATION_MAX) * 100;

  // Determine status color and icon
  const getStatusColor = () => {
    if (ultimatePower.inDivineBalance) return 'text-terra-cyan';
    if (ultimatePower.isChampionshipMode) return 'text-terra-blue';
    if (score >= CODEX_CONSTANTS.OPERATIONAL_MIN) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusIcon = () => {
    if (ultimatePower.inDivineBalance) return <Star className="h-5 w-5" />;
    if (ultimatePower.isChampionshipMode) return <Trophy className="h-5 w-5" />;
    if (score >= CODEX_CONSTANTS.OPERATIONAL_MIN) return <CheckCircle2 className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  const getStatusLabel = () => {
    if (ultimatePower.inDivineBalance) return 'Divine Balance';
    if (ultimatePower.isChampionshipMode) return 'Championship';
    if (score >= CODEX_CONSTANTS.OPERATIONAL_MIN) return 'Operational';
    return 'Attention Needed';
  };

  const getTrend = () => {
    if (previousScore === null) return null;
    if (score > previousScore) return 'up';
    if (score < previousScore) return 'down';
    return 'stable';
  };

  const trend = getTrend();
  const trendValue = previousScore ? ((score - previousScore) / previousScore) * 100 : 0;

  return (
    <Card className="bg-terra-midnight border-terra-slate shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-terra-cyan" />
            <h3 className="text-sm font-semibold text-white">Codex 3-6-9</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* SignalR Status */}
            <Badge
              variant={signalRConnected ? 'default' : 'destructive'}
              className="text-xs px-2 py-0.5"
            >
              <Activity className={`h-2 w-2 mr-1 ${signalRConnected ? 'animate-pulse' : ''}`} />
              {signalRConnected ? 'Live' : 'Offline'}
            </Badge>

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={updating}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Ultimate Power Score */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getStatusColor()}`}>
                {score.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ 12</span>
            </div>

            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusLabel()}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={percentage} className="h-2 bg-gray-800" />

          {/* Score Details */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Balance:</span>
              <span className="text-terra-cyan font-medium">
                {(ultimatePower.balanceProximity * 100).toFixed(0)}%
              </span>
            </div>

            {trend && (
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
                <span
                  className={
                    trend === 'up'
                      ? 'text-green-500'
                      : trend === 'down'
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }
                >
                  {trend === 'up' && '+'}
                  {Math.abs(trendValue).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Domain Scores (Expandable) */}
        {showDomains && !compact && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-between text-xs h-7 text-gray-400 hover:text-white"
            >
              <span>Domain Scores ({amplificationMetrics.length})</span>
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {expanded && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                {amplificationMetrics.map((domain) => (
                  <DomainScoreRow
                    key={domain.domain}
                    name={domain.displayName}
                    score={domain.amplifiedScore}
                    alertLevel={domain.alertLevel}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
            <span>Updated {new Date(lastUpdate).toLocaleTimeString()}</span>

            {onExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="h-6 text-xs gap-1 text-terra-cyan hover:text-terra-cyan/80"
              >
                View Full
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Compact Mode Bottom Strip */}
        {compact && (
          <div className="flex items-center justify-around pt-2 border-t border-gray-800">
            {amplificationMetrics.slice(0, 4).map((domain) => (
              <div key={domain.domain} className="text-center">
                <div className="text-xs text-gray-400 truncate max-w-[60px]">
                  {domain.displayName.split(' ')[0]}
                </div>
                <div className="text-sm font-semibold text-white">
                  {domain.amplifiedScore.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DOMAIN SCORE ROW COMPONENT
// ============================================================================

interface DomainScoreRowProps {
  name: string;
  score: number;
  alertLevel: AlertLevel;
}

function DomainScoreRow({ name, score, alertLevel }: DomainScoreRowProps) {
  const percentage = (score / CODEX_CONSTANTS.FOUNDATION_MAX) * 100;

  const getAlertColor = () => {
    switch (alertLevel) {
      case 'Green':
        return 'text-green-500';
      case 'Yellow':
        return 'text-yellow-500';
      case 'Red':
        return 'text-red-500';
      case 'Critical':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 truncate max-w-[120px]">{name}</span>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${getAlertColor()}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-gray-600">/12</span>
        </div>
      </div>
      <Progress value={percentage} className="h-1 bg-gray-800" />
    </div>
  );
}

// ============================================================================
// COMPACT VARIANT FOR GRID LAYOUTS
// ============================================================================

export function CodexMiniWidget({ countyId }: { countyId?: string }) {
  const { status, loading } = useCodexStatus({
    countyId,
    updateInterval: 60000,
    autoUpdate: true,
  });

  if (loading || !status) {
    return (
      <div className="bg-terra-midnight border border-terra-slate rounded-lg p-3 flex items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-terra-cyan" />
      </div>
    );
  }

  const score = status.ultimatePower.ultimatePowerScore;
  const isDivine = status.ultimatePower.inDivineBalance;
  const isChampionship = status.ultimatePower.isChampionshipMode;

  return (
    <div className="bg-terra-midnight border border-terra-slate rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Codex</span>
        {isDivine ? (
          <Star className="h-3 w-3 text-terra-cyan" />
        ) : isChampionship ? (
          <Trophy className="h-3 w-3 text-terra-blue" />
        ) : (
          <Zap className="h-3 w-3 text-gray-500" />
        )}
      </div>

      <div className="text-center">
        <div
          className={`text-2xl font-bold ${
            isDivine
              ? 'text-terra-cyan'
              : isChampionship
              ? 'text-terra-blue'
              : 'text-white'
          }`}
        >
          {score.toFixed(1)}
        </div>
        <div className="text-xs text-gray-500">/ 12</div>
      </div>

      <Progress value={(score / 12) * 100} className="h-1 bg-gray-800" />
    </div>
  );
}

// ============================================================================
// EXPORT ALL VARIANTS
// ============================================================================

export default CodexMobileWidget;
