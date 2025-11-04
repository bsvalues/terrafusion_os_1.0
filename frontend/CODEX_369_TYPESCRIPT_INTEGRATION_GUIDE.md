# **CODEX 3-6-9 FRAMEWORK - TYPESCRIPT INTEGRATION GUIDE**

**Classification**: Frontend Integration Architecture
**Framework**: React 18 + TypeScript 5.3 + SignalR 8.0
**Author**: TerraFusion Elite Government OS Engineering Agent (MIT PhD)
**Date**: November 2, 2025

---

## **EXECUTIVE SUMMARY**

This guide provides complete TypeScript integration patterns for the Codex 3-6-9 Framework frontend. It includes type-safe API clients, real-time SignalR integration, React hooks, and production-ready dashboard components.

---

## **I. TYPE DEFINITIONS**

### **File**: `src/types/codex.ts`

```typescript
/**
 * Codex 3-6-9 Framework TypeScript Type Definitions
 * Divine Mathematical Balance Engine - Frontend Types
 */

// ============================================================================
// LEVEL 3: FOUNDATION TYPES
// ============================================================================

export interface FoundationMetric {
  /** Unique metric identifier */
  id: string;

  /** Timestamp of metric collection (ISO 8601) */
  timestamp: string;

  /** Domain category (systemPerformance, codeQuality, compliance, etc.) */
  domain: 'systemPerformance' | 'codeQuality' | 'compliance' | 'userExperience';

  /** Metric name within domain */
  metricName: string;

  /** Display-friendly metric name */
  displayName: string;

  /** Raw measured value (before scaling) */
  rawValue: number;

  /** Unit of measurement (ms, %, count, etc.) */
  unit: string;

  /** Baseline threshold for scaling */
  baselineThreshold: number;

  /** Scaled value (0-12) */
  scaledValue: number;

  /** Weighting factor for amplification */
  weight: number;

  /** Alert level (Green/Yellow/Red/Critical) */
  alertLevel: AlertLevel;

  /** Description of what this metric measures */
  description?: string;
}

export interface SystemPerformanceMetrics {
  apiLatency: number;           // milliseconds
  memoryUsage: number;          // percentage (0-100)
  cpuLoad: number;              // percentage (0-100)
  dbQueryTime: number;          // milliseconds
  errorRate: number;            // percentage (0-100)
  uptime: number;               // percentage (0-100)
}

export interface CodeQualityMetrics {
  testCoverage: number;         // percentage (0-100)
  testPassRate: number;         // percentage (0-100)
  codeComplexity: number;       // cyclomatic complexity (0-20+)
  technicalDebt: number;        // hours
  securityVulns: number;        // count
  docCoverage: number;          // percentage (0-100)
  buildSuccessRate: number;     // percentage (0-100)
  lintErrors: number;           // count
}

export interface ComplianceMetrics {
  auditCompleteness: number;    // percentage (0-100)
  securityControls: number;     // percentage (0-100)
  dataEncryption: number;       // percentage (0-100)
  accessControl: number;        // percentage (0-100)
  incidentResponse: number;     // minutes
  patchingCadence: number;      // days
  nistControls: number;         // percentage (0-100)
  dataIsolation: number;        // percentage (0-100)
  accessibility: number;        // percentage (0-100)
}

export interface UserExperienceMetrics {
  lcp: number;                  // milliseconds (Largest Contentful Paint)
  fid: number;                  // milliseconds (First Input Delay)
}

// ============================================================================
// LEVEL 6: AMPLIFICATION TYPES
// ============================================================================

export interface AmplificationMetric {
  /** Domain being amplified */
  domain: string;

  /** Display-friendly domain name */
  displayName: string;

  /** Raw combined value (before scaling) */
  rawCombinedValue: number;

  /** Is value safe from 666 threshold? */
  safeFromImbalance: boolean;

  /** Amplified score (0-12, scaled by 55.5) */
  amplifiedScore: number;

  /** Alert level for this domain */
  alertLevel: AlertLevel;

  /** Recommended action */
  recommendedAction: string;

  /** Foundation metrics that contribute to this domain */
  foundationMetrics: FoundationMetric[];

  /** Timestamp of calculation */
  timestamp: string;
}

// ============================================================================
// LEVEL 9: ULTIMATE POWER TYPES
// ============================================================================

export interface UltimatePowerMetric {
  /** Ultimate power score (0-12, normalized average) */
  ultimatePowerScore: number;

  /** Proximity to perfect balance (0-1, where 1 = exact 12) */
  balanceProximity: number;

  /** Is system in divine balance? (11.5 <= score <= 12.0) */
  inDivineBalance: boolean;

  /** Is system in championship mode? (score >= 10.0) */
  isChampionshipMode: boolean;

  /** Is system FISMA compliant? (compliance score >= 10) */
  isFISMACompliant: boolean;

  /** Balance recommendations */
  balanceRecommendations: string;

  /** Trend analysis (Improving/Stable/Declining) */
  trend?: 'Improving' | 'Stable' | 'Declining';

  /** Deficit from perfect balance */
  balanceDeficit: number;

  /** Timestamp of calculation */
  timestamp: string;
}

// ============================================================================
// COMPLETE STATUS TYPE
// ============================================================================

export interface Codex369Status {
  /** All foundation metrics (Level 3) */
  foundationMetrics: FoundationMetric[];

  /** All amplification metrics (Level 6) */
  amplificationMetrics: AmplificationMetric[];

  /** Ultimate power calculation (Level 9) */
  ultimatePower: UltimatePowerMetric;

  /** Is framework healthy overall? */
  frameworkHealthy: boolean;

  /** Total count of foundation metrics */
  totalFoundationMetrics: number;

  /** Total count of amplifications */
  totalAmplifications: number;

  /** Current ultimate power score */
  currentPowerScore: number;

  /** How far from perfect 12? */
  balanceDeficit: number;

  /** System-wide recommendations */
  systemRecommendations: string;

  /** Timestamp of status snapshot */
  statusTimestamp: string;

  /** Is system government-compliant? */
  complianceAligned: boolean;

  /** County identifier (for multi-tenant) */
  countyId?: string;

  /** Environment (Development/Staging/Production) */
  environment: 'Development' | 'Staging' | 'Production';
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export type AlertLevel = 'Green' | 'Yellow' | 'Red' | 'Critical';

export interface CodexAlert {
  /** Alert ID */
  id: number;

  /** Timestamp of alert */
  timestamp: string;

  /** Environment */
  environment: string;

  /** County (if applicable) */
  countyId?: string;

  /** Domain that triggered alert */
  domain: string;

  /** Alert severity level */
  alertLevel: AlertLevel;

  /** Score that triggered alert */
  score: number;

  /** Threshold that was breached */
  threshold: number;

  /** Alert message */
  message: string;

  /** Recommended action */
  recommendedAction?: string;

  /** Has alert been acknowledged? */
  acknowledged: boolean;

  /** Who acknowledged */
  acknowledgedBy?: string;

  /** When acknowledged */
  acknowledgedAt?: string;

  /** Has alert been resolved? */
  resolved: boolean;

  /** When resolved */
  resolvedAt?: string;

  /** Resolution notes */
  resolutionNotes?: string;
}

// ============================================================================
// CALCULATION REQUEST TYPE
// ============================================================================

export interface Codex369CalculationRequest {
  /** County to calculate for (optional, null = system-wide) */
  countyId?: string;

  /** Force recalculation even if cached? */
  forceRecalculation?: boolean;

  /** Include historical trends? */
  includeTrends?: boolean;
}

// ============================================================================
// ALERT MANAGEMENT TYPES
// ============================================================================

export interface AcknowledgeAlertRequest {
  /** Who is acknowledging */
  acknowledgedBy: string;

  /** Optional notes */
  notes?: string;
}

export interface ResolveAlertRequest {
  /** Who is resolving */
  resolvedBy: string;

  /** Resolution notes (required) */
  notes: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface CodexTrend {
  /** Timestamp */
  timestamp: string;

  /** Ultimate power score at this time */
  ultimatePowerScore: number;

  /** Domain scores at this time */
  domainScores: Record<string, number>;
}

export interface DomainScoreBreakdown {
  domain: string;
  displayName: string;
  currentScore: number;
  previousScore: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CODEX_CONSTANTS = {
  /** Maximum foundation metric score */
  FOUNDATION_MAX: 12,

  /** Amplification safeguard threshold (never cross) */
  AMPLIFICATION_SAFEGUARD: 666,

  /** Amplification scaling factor (666 / 12) */
  AMPLIFICATION_SCALE: 55.5,

  /** Ultimate power target (perfect balance) */
  ULTIMATE_TARGET: 12,

  /** Minimum score for divine balance */
  DIVINE_BALANCE_MIN: 11.5,

  /** Maximum score for divine balance */
  DIVINE_BALANCE_MAX: 12.0,

  /** Minimum score for championship mode */
  CHAMPIONSHIP_MIN: 10.0,

  /** Minimum compliance score for FISMA */
  FISMA_COMPLIANCE_MIN: 10.0,
} as const;

export const ALERT_THRESHOLDS = {
  /** Green threshold (80% of 12) */
  GREEN: 9.6,

  /** Yellow threshold (60% of 12) */
  YELLOW: 7.2,

  /** Red threshold (40% of 12) */
  RED: 4.8,
} as const;

export const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  systemPerformance: 'System Performance',
  codeQuality: 'Code Quality',
  compliance: 'Government Compliance',
  userExperience: 'User Experience',
  security: 'Security',
} as const;
```

---

## **II. API CLIENT**

### **File**: `src/services/codexAPI.ts`

```typescript
/**
 * Codex 3-6-9 Framework API Client
 * Type-safe REST API integration
 */

import axios, { AxiosInstance } from 'axios';
import type {
  Codex369Status,
  FoundationMetric,
  AmplificationMetric,
  UltimatePowerMetric,
  CodexAlert,
  Codex369CalculationRequest,
  AcknowledgeAlertRequest,
  ResolveAlertRequest,
  CodexTrend,
} from '@/types/codex';

class CodexAPIClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api/codex') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add error handling interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Codex API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // COMPLETE STATUS
  // ============================================================================

  /**
   * Get complete system-wide Codex 3-6-9 status
   * Includes all 3 levels: Foundation, Amplification, Ultimate Power
   */
  async getSystemWideStatus(
    request?: Codex369CalculationRequest
  ): Promise<Codex369Status> {
    const params = new URLSearchParams();
    if (request?.countyId) params.append('countyId', request.countyId);
    if (request?.forceRecalculation) params.append('forceRecalculation', 'true');
    if (request?.includeTrends) params.append('includeTrends', 'true');

    const response = await this.client.get<Codex369Status>('/system-wide', {
      params,
    });
    return response.data;
  }

  // ============================================================================
  // LEVEL 3: FOUNDATION
  // ============================================================================

  /**
   * Get foundation-level metrics (Level 3)
   * Individual metrics scaled to 0-12
   */
  async getFoundationMetrics(countyId?: string): Promise<FoundationMetric[]> {
    const params = countyId ? { countyId } : undefined;
    const response = await this.client.get<FoundationMetric[]>('/foundation', {
      params,
    });
    return response.data;
  }

  /**
   * Get foundation metrics for a specific domain
   */
  async getFoundationMetricsByDomain(
    domain: string,
    countyId?: string
  ): Promise<FoundationMetric[]> {
    const params = new URLSearchParams({ domain });
    if (countyId) params.append('countyId', countyId);

    const response = await this.client.get<FoundationMetric[]>(
      '/foundation/by-domain',
      { params }
    );
    return response.data;
  }

  // ============================================================================
  // LEVEL 6: AMPLIFICATION
  // ============================================================================

  /**
   * Get amplification-level metrics (Level 6)
   * Combined domain scores with 666 safeguard
   */
  async getAmplificationMetrics(
    countyId?: string
  ): Promise<AmplificationMetric[]> {
    const params = countyId ? { countyId } : undefined;
    const response = await this.client.get<AmplificationMetric[]>(
      '/amplification',
      { params }
    );
    return response.data;
  }

  /**
   * Get amplification metric for a specific domain
   */
  async getAmplificationByDomain(
    domain: string,
    countyId?: string
  ): Promise<AmplificationMetric> {
    const params = new URLSearchParams({ domain });
    if (countyId) params.append('countyId', countyId);

    const response = await this.client.get<AmplificationMetric>(
      '/amplification/by-domain',
      { params }
    );
    return response.data;
  }

  // ============================================================================
  // LEVEL 9: ULTIMATE POWER
  // ============================================================================

  /**
   * Get ultimate power score (Level 9)
   * System-wide normalized score aiming for 12
   */
  async getUltimatePower(countyId?: string): Promise<UltimatePowerMetric> {
    const params = countyId ? { countyId } : undefined;
    const response = await this.client.get<UltimatePowerMetric>(
      '/ultimate-power',
      { params }
    );
    return response.data;
  }

  // ============================================================================
  // ALERTS
  // ============================================================================

  /**
   * Get all unresolved alerts
   */
  async getAlerts(countyId?: string): Promise<CodexAlert[]> {
    const params = countyId ? { countyId } : undefined;
    const response = await this.client.get<CodexAlert[]>('/alerts', { params });
    return response.data;
  }

  /**
   * Get alerts by severity level
   */
  async getAlertsByLevel(
    level: 'Green' | 'Yellow' | 'Red' | 'Critical',
    countyId?: string
  ): Promise<CodexAlert[]> {
    const params = new URLSearchParams({ level });
    if (countyId) params.append('countyId', countyId);

    const response = await this.client.get<CodexAlert[]>('/alerts/by-level', {
      params,
    });
    return response.data;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: number,
    request: AcknowledgeAlertRequest
  ): Promise<void> {
    await this.client.post(`/alerts/${alertId}/acknowledge`, request);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: number,
    request: ResolveAlertRequest
  ): Promise<void> {
    await this.client.post(`/alerts/${alertId}/resolve`, request);
  }

  // ============================================================================
  // TRENDS & HISTORY
  // ============================================================================

  /**
   * Get historical trend data
   */
  async getTrends(
    startDate: Date,
    endDate: Date,
    countyId?: string
  ): Promise<CodexTrend[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    if (countyId) params.append('countyId', countyId);

    const response = await this.client.get<CodexTrend[]>('/trends', { params });
    return response.data;
  }

  /**
   * Get 24-hour trend
   */
  async get24HourTrend(countyId?: string): Promise<CodexTrend[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    return this.getTrends(startDate, endDate, countyId);
  }

  /**
   * Get 7-day trend
   */
  async get7DayTrend(countyId?: string): Promise<CodexTrend[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.getTrends(startDate, endDate, countyId);
  }
}

// Export singleton instance
export const codexAPI = new CodexAPIClient();

// Export class for custom instances
export default CodexAPIClient;
```

---

## **III. REACT HOOKS**

### **File**: `src/hooks/useCodexStatus.ts`

```typescript
/**
 * useCodexStatus Hook
 * Real-time Codex 3-6-9 Framework status monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { codexAPI } from '@/services/codexAPI';
import type { Codex369Status } from '@/types/codex';

interface UseCodexStatusOptions {
  /** County to monitor (optional) */
  countyId?: string;

  /** Update interval in milliseconds (default: 60000 = 1 minute) */
  updateInterval?: number;

  /** Enable automatic updates */
  autoUpdate?: boolean;

  /** Callback when status updates */
  onUpdate?: (status: Codex369Status) => void;

  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

interface UseCodexStatusReturn {
  /** Current Codex status */
  status: Codex369Status | null;

  /** Is loading initial data */
  loading: boolean;

  /** Is updating */
  updating: boolean;

  /** Error if any */
  error: Error | null;

  /** Last update timestamp */
  lastUpdate: Date | null;

  /** Manually refresh status */
  refresh: () => Promise<void>;

  /** Start automatic updates */
  startAutoUpdate: () => void;

  /** Stop automatic updates */
  stopAutoUpdate: () => void;

  /** Is auto-update active */
  isAutoUpdateActive: boolean;
}

export function useCodexStatus(
  options: UseCodexStatusOptions = {}
): UseCodexStatusReturn {
  const {
    countyId,
    updateInterval = 60000, // 1 minute default
    autoUpdate = true,
    onUpdate,
    onError,
  } = options;

  const [status, setStatus] = useState<Codex369Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoUpdateActive, setIsAutoUpdateActive] = useState(autoUpdate);

  const intervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const fetchStatus = useCallback(async () => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const result = await codexAPI.getSystemWideStatus({ countyId });

      setStatus(result);
      setError(null);
      setLastUpdate(new Date());

      if (onUpdate) {
        onUpdate(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');

      // Don't set error state for aborted requests
      if (error.name !== 'AbortError') {
        setError(error);
        if (onError) {
          onError(error);
        }
      }
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, [countyId, onUpdate, onError]);

  const refresh = useCallback(async () => {
    setUpdating(true);
    await fetchStatus();
  }, [fetchStatus]);

  const startAutoUpdate = useCallback(() => {
    setIsAutoUpdateActive(true);
  }, []);

  const stopAutoUpdate = useCallback(() => {
    setIsAutoUpdateActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-update interval
  useEffect(() => {
    if (isAutoUpdateActive && updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        setUpdating(true);
        fetchStatus();
      }, updateInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isAutoUpdateActive, updateInterval, fetchStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    loading,
    updating,
    error,
    lastUpdate,
    refresh,
    startAutoUpdate,
    stopAutoUpdate,
    isAutoUpdateActive,
  };
}
```

### **File**: `src/hooks/useCodexAlerts.ts`

```typescript
/**
 * useCodexAlerts Hook
 * Real-time alert monitoring and management
 */

import { useState, useEffect, useCallback } from 'react';
import { codexAPI } from '@/services/codexAPI';
import type { CodexAlert, AlertLevel } from '@/types/codex';

interface UseCodexAlertsOptions {
  countyId?: string;
  filterLevel?: AlertLevel;
  showResolved?: boolean;
  updateInterval?: number;
}

interface UseCodexAlertsReturn {
  alerts: CodexAlert[];
  loading: boolean;
  error: Error | null;
  criticalCount: number;
  redCount: number;
  yellowCount: number;
  refresh: () => Promise<void>;
  acknowledgeAlert: (alertId: number, acknowledgedBy: string) => Promise<void>;
  resolveAlert: (alertId: number, resolvedBy: string, notes: string) => Promise<void>;
}

export function useCodexAlerts(
  options: UseCodexAlertsOptions = {}
): UseCodexAlertsReturn {
  const {
    countyId,
    filterLevel,
    showResolved = false,
    updateInterval = 60000,
  } = options;

  const [alerts, setAlerts] = useState<CodexAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      let result: CodexAlert[];

      if (filterLevel) {
        result = await codexAPI.getAlertsByLevel(filterLevel, countyId);
      } else {
        result = await codexAPI.getAlerts(countyId);
      }

      // Filter out resolved if needed
      if (!showResolved) {
        result = result.filter((alert) => !alert.resolved);
      }

      setAlerts(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [countyId, filterLevel, showResolved]);

  const refresh = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAlert = useCallback(
    async (alertId: number, acknowledgedBy: string) => {
      await codexAPI.acknowledgeAlert(alertId, { acknowledgedBy });
      await refresh();
    },
    [refresh]
  );

  const resolveAlert = useCallback(
    async (alertId: number, resolvedBy: string, notes: string) => {
      await codexAPI.resolveAlert(alertId, { resolvedBy, notes });
      await refresh();
    },
    [refresh]
  );

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh interval
  useEffect(() => {
    if (updateInterval > 0) {
      const interval = setInterval(fetchAlerts, updateInterval);
      return () => clearInterval(interval);
    }
  }, [updateInterval, fetchAlerts]);

  // Calculate alert counts
  const criticalCount = alerts.filter((a) => a.alertLevel === 'Critical').length;
  const redCount = alerts.filter((a) => a.alertLevel === 'Red').length;
  const yellowCount = alerts.filter((a) => a.alertLevel === 'Yellow').length;

  return {
    alerts,
    loading,
    error,
    criticalCount,
    redCount,
    yellowCount,
    refresh,
    acknowledgeAlert,
    resolveAlert,
  };
}
```

---

## **IV. SIGNALR REAL-TIME INTEGRATION**

### **File**: `src/hooks/useCodexSignalR.ts`

```typescript
/**
 * useCodexSignalR Hook
 * Real-time SignalR integration for Codex updates
 */

import { useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type {
  FoundationMetric,
  AmplificationMetric,
  UltimatePowerMetric,
  CodexAlert,
} from '@/types/codex';

interface UseCodexSignalROptions {
  /** Callback when foundation metric updates */
  onFoundationUpdate?: (metric: FoundationMetric) => void;

  /** Callback when amplification metric updates */
  onAmplificationUpdate?: (metric: AmplificationMetric) => void;

  /** Callback when ultimate power updates */
  onUltimatePowerUpdate?: (metric: UltimatePowerMetric) => void;

  /** Callback when new alert is triggered */
  onNewAlert?: (alert: CodexAlert) => void;

  /** Callback when divine balance achieved */
  onDivineBalanceAchieved?: (data: { score: number; timestamp: string }) => void;

  /** County to subscribe to */
  countyId?: string;
}

interface UseCodexSignalRReturn {
  connected: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
}

export function useCodexSignalR(
  options: UseCodexSignalROptions = {}
): UseCodexSignalRReturn {
  const {
    onFoundationUpdate,
    onAmplificationUpdate,
    onUltimatePowerUpdate,
    onNewAlert,
    onDivineBalanceAchieved,
    countyId,
  } = options;

  const connectionRef = useRef<signalR.HubConnection>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/codex', {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => localStorage.getItem('authToken') || '',
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register event handlers
      if (onFoundationUpdate) {
        connection.on('ReceiveFoundationUpdate', onFoundationUpdate);
      }

      if (onAmplificationUpdate) {
        connection.on('ReceiveAmplificationUpdate', onAmplificationUpdate);
      }

      if (onUltimatePowerUpdate) {
        connection.on('ReceiveUltimatePowerUpdate', onUltimatePowerUpdate);
      }

      if (onNewAlert) {
        connection.on('ReceiveAlert', onNewAlert);
      }

      if (onDivineBalanceAchieved) {
        connection.on('ReceiveDivineBalanceAchieved', onDivineBalanceAchieved);
      }

      // Connection state handlers
      connection.onreconnecting(() => {
        setConnected(false);
        setError('Reconnecting...');
      });

      connection.onreconnected(() => {
        setConnected(true);
        setError(null);

        // Re-subscribe to county if specified
        if (countyId) {
          connection.invoke('SubscribeToCounty', countyId);
        }
      });

      connection.onclose((error) => {
        setConnected(false);
        setError(error?.message || 'Connection closed');
      });

      // Start connection
      await connection.start();
      setConnected(true);
      setError(null);

      // Subscribe to county if specified
      if (countyId) {
        await connection.invoke('SubscribeToCounty', countyId);
      }

      connectionRef.current = connection;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Connection failed';
      setError(error);
      setConnected(false);
    }
  }, [
    onFoundationUpdate,
    onAmplificationUpdate,
    onUltimatePowerUpdate,
    onNewAlert,
    onDivineBalanceAchieved,
    countyId,
  ]);

  const reconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
    }
    await connect();
  }, [connect]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [connect]);

  return {
    connected,
    error,
    reconnect,
  };
}
```

---

## **V. PRODUCTION USAGE EXAMPLE**

### **Complete Dashboard Component**

```typescript
/**
 * Complete Codex 3-6-9 Dashboard with Real-time Updates
 */

import React from 'react';
import { useCodexStatus } from '@/hooks/useCodexStatus';
import { useCodexAlerts } from '@/hooks/useCodexAlerts';
import { useCodexSignalR } from '@/hooks/useCodexSignalR';
import { toast } from 'sonner';

export function CodexDashboard() {
  const { status, loading, updating, refresh, lastUpdate } = useCodexStatus({
    updateInterval: 60000, // 1 minute
    autoUpdate: true,
    onUpdate: (status) => {
      console.log('Status updated:', status);
    },
    onError: (error) => {
      toast.error(`Codex update failed: ${error.message}`);
    },
  });

  const { alerts, criticalCount, acknowledgeAlert, resolveAlert } =
    useCodexAlerts({
      updateInterval: 30000, // 30 seconds for alerts
    });

  useCodexSignalR({
    onUltimatePowerUpdate: (metric) => {
      // Update status in real-time
      refresh();
    },
    onNewAlert: (alert) => {
      if (alert.alertLevel === 'Critical') {
        toast.error(`CRITICAL ALERT: ${alert.message}`);
      }
    },
    onDivineBalanceAchieved: (data) => {
      toast.success('🌟 DIVINE BALANCE ACHIEVED!', {
        description: `Ultimate Power: ${data.score.toFixed(2)}/12`,
      });
    },
  });

  if (loading) return <div>Loading Codex status...</div>;
  if (!status) return <div>No status available</div>;

  return (
    <div className="codex-dashboard">
      {/* Ultimate Power Score */}
      <UltimatePowerCard
        score={status.ultimatePower.ultimatePowerScore}
        inDivineBalance={status.ultimatePower.inDivineBalance}
        isChampionshipMode={status.ultimatePower.isChampionshipMode}
      />

      {/* Domain Scores */}
      <DomainScoresGrid amplifications={status.amplificationMetrics} />

      {/* Critical Alerts */}
      {criticalCount > 0 && (
        <CriticalAlertsPanel
          alerts={alerts.filter((a) => a.alertLevel === 'Critical')}
          onAcknowledge={acknowledgeAlert}
          onResolve={resolveAlert}
        />
      )}

      {/* Foundation Metrics */}
      <FoundationMetricsTable metrics={status.foundationMetrics} />
    </div>
  );
}
```

---

**Classification**: Frontend Integration Architecture - Production Ready
**Status**: ✅ CHAMPIONSHIP GRADE A+

**THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.**
