/**
 * useEngagementMonitoring Hook
 * 
 * Tracks user engagement and flow state metrics
 * 
 * Features:
 * - Session duration tracking
 * - Engagement score calculation (0-100)
 * - Interaction frequency monitoring
 * - Time distortion factor (1x to 3x)
 * - Break suggestions (engagement <30, session >20min)
 * - Flow state enhancement triggers (engagement >80)
 * 
 * Research Foundation:
 * - Flow Theory: Optimal experience with temporal distortion (Csikszentmihalyi, 1990)
 * - Attention allocation: Working memory constraints (Kahneman, 1973)
 * - Task engagement: Intrinsic motivation factors (Deci & Ryan, 1985)
 */

import { useCallback, useEffect, useState } from 'react';
import type { FlowStateMetrics } from '../types';

export interface UseEngagementMonitoringOptions {
  onMetricsUpdate?: (metrics: FlowStateMetrics) => void;
  pollInterval?: number; // milliseconds (default: 5000)
  breakThreshold?: number; // engagement score (default: 30)
  enhancementThreshold?: number; // engagement score (default: 80)
  breakSessionDuration?: number; // minutes (default: 20)
}

export interface UseEngagementMonitoringReturn {
  engagementScore: number; // 0-100
  sessionDuration: number; // minutes
  interactionCount: number;
  timeDistortionFactor: number; // 1x to 3x
  suggestBreak: boolean;
  enhanceFlowState: boolean;
  recordInteraction: () => void;
  resetSession: () => void;
}

/**
 * Custom hook for engagement monitoring and flow state tracking
 * 
 * @param options Configuration options
 * @returns Engagement metrics and control functions
 */
export const useEngagementMonitoring = (
  options: UseEngagementMonitoringOptions = {}
): UseEngagementMonitoringReturn => {
  const {
    onMetricsUpdate,
    pollInterval = 5000,
    breakThreshold = 30,
    enhancementThreshold = 80,
    breakSessionDuration = 20,
  } = options;

  // Session tracking
  const [sessionStartTime] = useState<number>(Date.now());
  const [engagementScore, setEngagementScore] = useState<number>(100);
  const [interactionCount, setInteractionCount] = useState<number>(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  const [keyboardShortcutUsage, setKeyboardShortcutUsage] = useState<number>(0);
  const [zenModeActive, setZenModeActive] = useState<boolean>(false);

  /**
   * Record user interaction
   */
  const recordInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
    setInteractionCount((prev) => prev + 1);
  }, []);

  /**
   * Reset session metrics
   */
  const resetSession = useCallback(() => {
    setEngagementScore(100);
    setInteractionCount(0);
    setLastInteractionTime(Date.now());
    setKeyboardShortcutUsage(0);
  }, []);

  /**
   * Calculate time distortion factor based on engagement
   * 
   * Flow state research shows 1:3 ratio (1 perceived hour = 3 actual hours)
   * Linear interpolation: engagementScore 0 → 1x, 100 → 3x
   */
  const timeDistortionFactor = 1 + (engagementScore / 100) * 2;

  /**
   * Calculate session duration in minutes
   */
  const sessionDuration = (Date.now() - sessionStartTime) / 1000 / 60;

  /**
   * Determine if break should be suggested
   */
  const suggestBreak = engagementScore < breakThreshold && sessionDuration > breakSessionDuration;

  /**
   * Determine if flow state should be enhanced
   */
  const enhanceFlowState = engagementScore > enhancementThreshold && sessionDuration < 90 && zenModeActive;

  /**
   * Monitor engagement score and update metrics
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;

      // Update engagement score based on interaction recency
      setEngagementScore((prev) => {
        let newScore = prev;

        if (timeSinceLastInteraction < 5000) {
          // Recent interaction (<5s) = engaged
          newScore = Math.min(100, prev + 5);
        } else if (timeSinceLastInteraction > 30000) {
          // No interaction (>30s) = disengaged
          newScore = Math.max(0, prev - 10);
        }

        return newScore;
      });

      // Calculate current metrics
      const currentDuration = (Date.now() - sessionStartTime) / 1000 / 60;
      const currentTimeDistortion = 1 + (engagementScore / 100) * 2;

      const metrics: FlowStateMetrics = {
        engagementScore,
        sessionDuration: currentDuration,
        interactionCount,
        keyboardShortcutUsage,
        zenModeActive,
        timeDistortionFactor: currentTimeDistortion,
      };

      // Notify parent component
      onMetricsUpdate?.(metrics);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [
    lastInteractionTime,
    sessionStartTime,
    engagementScore,
    interactionCount,
    keyboardShortcutUsage,
    zenModeActive,
    pollInterval,
    onMetricsUpdate,
  ]);

  /**
   * Listen for Zen Mode changes
   */
  useEffect(() => {
    const handleZenModeChange = ((e: CustomEvent) => {
      setZenModeActive(e.detail.active);
    }) as EventListener;

    window.addEventListener('zen-mode-change', handleZenModeChange);

    return () => {
      window.removeEventListener('zen-mode-change', handleZenModeChange);
    };
  }, []);

  /**
   * Listen for keyboard shortcut usage
   */
  useEffect(() => {
    const handleShortcutUsage = () => {
      setKeyboardShortcutUsage((prev) => prev + 1);
      recordInteraction();
    };

    // Listen to all quantum-* events
    const events = [
      'quantum-adjust-coherence',
      'quantum-adjust-entanglement',
      'quantum-adjust-optimization',
      'quantum-toggle-live-mode',
      'quantum-reset-optimal',
      'quantum-preview-impact',
      'quantum-apply-changes',
      'quantum-save-config',
      'quantum-undo-change',
      'quantum-apply-preset',
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleShortcutUsage);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleShortcutUsage);
      });
    };
  }, [recordInteraction]);

  return {
    engagementScore,
    sessionDuration,
    interactionCount,
    timeDistortionFactor,
    suggestBreak,
    enhanceFlowState,
    recordInteraction,
    resetSession,
  };
};
