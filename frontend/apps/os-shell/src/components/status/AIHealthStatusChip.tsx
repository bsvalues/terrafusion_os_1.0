/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🤖 TerraFusion AI Health Status Chip
 * Phase 15.3: OS Surface Integration - Real-time AI subsystem health indicator
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getSystemDiagnostics, SystemDiagnosticsResponse } from '../../api/systemDiagnosticsApi';

/** Health status for UI styling */
type HealthLevel = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/** Props for the AI Health Status Chip */
interface AIHealthStatusChipProps {
  /** Callback when chip is clicked - typically navigates to SystemGPT Console */
  onClick?: () => void;
  /** Auto-refresh interval in milliseconds (default: 30000 = 30s) */
  refreshInterval?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * AI Health Status Chip - Real-time indicator of TerraFusion AI subsystem health
 *
 * Features:
 * - Auto-refreshing health status from /api/gpt/system/diagnostics
 * - Color-coded badge (green/yellow/red)
 * - Click to navigate to full SystemGPT Console
 * - Pulse animation on degraded/unhealthy states
 */
export const AIHealthStatusChip: React.FC<AIHealthStatusChipProps> = ({
  onClick,
  refreshInterval = 30000,
  compact = false,
}) => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getSystemDiagnostics();
      setDiagnostics(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch AI health');
      console.error('AIHealthStatusChip: Error fetching diagnostics', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHealth, refreshInterval]);

  /** Map API health status to UI level */
  const getHealthLevel = (): HealthLevel => {
    if (!diagnostics) return 'unknown';

    // API returns string: 'Healthy' | 'Degraded' | 'Unhealthy' | 'Unknown'
    switch (diagnostics.overallHealth) {
      case 'Healthy':
        return 'healthy';
      case 'Degraded':
        return 'degraded';
      case 'Unhealthy':
        return 'unhealthy';
      default:
        return 'unknown';
    }
  };

  /** Get display text for health status */
  const getHealthText = (): string => {
    if (isLoading) return 'Loading...';
    if (error) return 'Error';

    const level = getHealthLevel();
    switch (level) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return 'Unknown';
    }
  };

  /** Get color scheme for health level */
  const getHealthColors = () => {
    const level = getHealthLevel();
    switch (level) {
      case 'healthy':
        return {
          bg: 'rgba(0, 255, 136, 0.15)',
          border: 'rgba(0, 255, 136, 0.5)',
          text: '#00ff88',
          glow: '0 0 10px rgba(0, 255, 136, 0.3)',
        };
      case 'degraded':
        return {
          bg: 'rgba(255, 200, 0, 0.15)',
          border: 'rgba(255, 200, 0, 0.5)',
          text: '#ffc800',
          glow: '0 0 10px rgba(255, 200, 0, 0.3)',
        };
      case 'unhealthy':
        return {
          bg: 'rgba(255, 80, 80, 0.15)',
          border: 'rgba(255, 80, 80, 0.5)',
          text: '#ff5050',
          glow: '0 0 10px rgba(255, 80, 80, 0.3)',
        };
      default:
        return {
          bg: 'rgba(128, 128, 128, 0.15)',
          border: 'rgba(128, 128, 128, 0.5)',
          text: '#888888',
          glow: 'none',
        };
    }
  };

  const colors = getHealthColors();
  const level = getHealthLevel();
  const shouldPulse = level === 'degraded' || level === 'unhealthy';

  // Build summary text for tooltip
  const getSummaryText = (): string => {
    if (!diagnostics) return 'AI Health Status';

    const parts: string[] = [];
    const gptCount = diagnostics.gptConfigs?.length ?? 0;
    const enabledGpts = diagnostics.gptConfigs?.filter((g) => g.enabled).length ?? 0;
    parts.push(`GPTs: ${enabledGpts}/${gptCount} active`);

    if (diagnostics.embeddingStatus) {
      parts.push(`Embeddings: ${diagnostics.embeddingStatus.mode}`);
    }

    const indexedRag = diagnostics.ragDatasets?.filter((r) => r.indexed).length ?? 0;
    const totalRag = diagnostics.ragDatasets?.length ?? 0;
    if (totalRag > 0) {
      parts.push(`RAG: ${indexedRag}/${totalRag} indexed`);
    }

    return parts.join(' • ');
  };

  return (
    <button
      onClick={onClick}
      title={getSummaryText()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '0.4rem' : '0.6rem',
        padding: compact ? '0.4rem 0.8rem' : '0.5rem 1rem',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        boxShadow: colors.glow,
        animation: shouldPulse ? 'aiHealthPulse 2s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = colors.glow.replace('0.3', '0.5');
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = colors.glow;
      }}
    >
      {/* Status indicator dot */}
      <span
        style={{
          width: compact ? '8px' : '10px',
          height: compact ? '8px' : '10px',
          borderRadius: '50%',
          background: colors.text,
          boxShadow: `0 0 8px ${colors.text}`,
        }}
      />

      {/* Label */}
      {!compact && (
        <span
          style={{
            fontSize: '0.8rem',
            color: 'rgba(0, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          AI
        </span>
      )}

      {/* Status text */}
      <span
        style={{
          fontSize: compact ? '0.85rem' : '0.95rem',
          fontWeight: 'bold',
          color: colors.text,
        }}
      >
        {getHealthText()}
      </span>

      {/* Pulse animation styles */}
      <style>
        {`
          @keyframes aiHealthPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </button>
  );
};

export default AIHealthStatusChip;
