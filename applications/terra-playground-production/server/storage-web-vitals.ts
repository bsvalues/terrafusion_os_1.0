/**
 * Web Vitals Storage Interface Extension
 *
 * Extends the IStorage interface with Web Vitals methods for tracking
 * and analyzing performance metrics.
 */

import { IStorage } from './storage';
import {
  storeWebVitalsReport as storeReport,
  storeWebVitalsMetric as storeMetric,
  getWebVitalsMetrics as getMetrics,
  getWebVitalsSummary as getSummary,
  getWebVitalsAggregates as getAggregates,
  createWebVitalsPerformanceBudget as createBudget,
  getWebVitalsPerformanceBudgets as getBudgets,
  getWebVitalsAlerts as getAlerts,
  acknowledgeWebVitalsAlert as acknowledgeAlert,
} from './storage/web-vitals-storage';

/**
 * Extend the IStorage interface with Web Vitals methods
 */
export interface IStorageWithWebVitals extends IStorage {
  storeWebVitalsReport(report: any): Promise<void>;
  storeWebVitalsMetric(metric: any): Promise<void>;
  getWebVitalsMetrics(timeRange: string, metricName?: string, limit?: number): Promise<any[]>;
  getWebVitalsSummary(timeRange: string): Promise<{
    lcp: {
      p50: number;
      p75: number;
      p95: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
    fid: {
      p50: number;
      p75: number;
      p95: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
    cls: {
      p50: number;
      p75: number;
      p95: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
    ttfb: {
      p50: number;
      p75: number;
      p95: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
    fcp: {
      p50: number;
      p75: number;
      p95: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
  }>;
  getWebVitalsAggregates(
    timeRange: string,
    metricName?: string,
    urlPattern?: string
  ): Promise<any[]>;
  createWebVitalsPerformanceBudget(budget: any): Promise<any>;
  getWebVitalsPerformanceBudgets(): Promise<any[]>;
  getWebVitalsAlerts(timeRange: string, acknowledged?: boolean): Promise<any[]>;
  acknowledgeWebVitalsAlert(id: number, userId: string): Promise<void>;
}

/**
 * Extend the Storage class with Web Vitals methods
 */
export function extendStorageWithWebVitals(storage: any): IStorageWithWebVitals {
  // Add Web Vitals methods to the storage instance
  storage.storeWebVitalsReport = async function (report: any): Promise<void> {
    return storeReport(storage.db, report);
  };

  storage.storeWebVitalsMetric = async function (metric: any): Promise<void> {
    return storeMetric(storage.db, metric);
  };

  storage.getWebVitalsMetrics = async function (
    timeRange: string,
    metricName?: string,
    limit: number = 100
  ): Promise<any[]> {
    return getMetrics(storage.db, timeRange, metricName, limit);
  };

  storage.getWebVitalsSummary = async function (timeRange: string): Promise<any> {
    return getSummary(storage.db, timeRange);
  };

  storage.getWebVitalsAggregates = async function (
    timeRange: string,
    metricName?: string,
    urlPattern?: string
  ): Promise<any[]> {
    return getAggregates(storage.db, timeRange, metricName, urlPattern);
  };

  storage.createWebVitalsPerformanceBudget = async function (budget: any): Promise<any> {
    return createBudget(storage.db, budget);
  };

  storage.getWebVitalsPerformanceBudgets = async function (): Promise<any[]> {
    return getBudgets(storage.db);
  };

  storage.getWebVitalsAlerts = async function (
    timeRange: string,
    acknowledged?: boolean
  ): Promise<any[]> {
    return getAlerts(storage.db, timeRange, acknowledged);
  };

  storage.acknowledgeWebVitalsAlert = async function (id: number, userId: string): Promise<void> {
    return acknowledgeAlert(storage.db, id, userId);
  };

  return storage as IStorageWithWebVitals;
}
