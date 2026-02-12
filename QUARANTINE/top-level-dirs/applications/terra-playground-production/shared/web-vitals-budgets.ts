/**
 * Web Vitals Performance Budgets
 *
 * This file defines performance budgets for various metrics, used to
 * monitor application performance across different platforms and devices.
 */

/**
 * Performance Budget definition
 */
export interface PerformanceBudget {
  metricName: string;
  description: string;
  good: number;
  needsImprovement: number;
  critical: number;
  unit?: string;
}

/**
 * Performance Budget Set definition
 */
export interface PerformanceBudgetSet {
  name: string;
  description: string;
  category: string;
  budgets: PerformanceBudget[];
}

/**
 * Core Web Vitals budgets
 */
const coreWebVitalsBudgets: PerformanceBudget[] = [
  {
    metricName: 'LCP',
    description: 'Largest Contentful Paint - measures loading performance',
    good: 2500,
    needsImprovement: 4000,
    critical: 6000,
    unit: 'ms',
  },
  {
    metricName: 'FID',
    description: 'First Input Delay - measures interactivity',
    good: 100,
    needsImprovement: 300,
    critical: 600,
    unit: 'ms',
  },
  {
    metricName: 'CLS',
    description: 'Cumulative Layout Shift - measures visual stability',
    good: 0.1,
    needsImprovement: 0.25,
    critical: 0.5,
    unit: 'score',
  },
];

/**
 * Mobile performance budgets
 */
const mobilePerformanceBudgets: PerformanceBudget[] = [
  {
    metricName: 'TTI',
    description: 'Time to Interactive - time until fully interactive',
    good: 3500,
    needsImprovement: 7500,
    critical: 12500,
    unit: 'ms',
  },
  {
    metricName: 'TBT',
    description: 'Total Blocking Time - sum of blocking time',
    good: 200,
    needsImprovement: 600,
    critical: 1000,
    unit: 'ms',
  },
  {
    metricName: 'FCP',
    description: 'First Contentful Paint - first content rendered',
    good: 1800,
    needsImprovement: 3000,
    critical: 5000,
    unit: 'ms',
  },
  {
    metricName: 'TTFB',
    description: 'Time to First Byte - server response time',
    good: 800,
    needsImprovement: 1800,
    critical: 2500,
    unit: 'ms',
  },
];

/**
 * Resource load budgets
 */
const resourceBudgets: PerformanceBudget[] = [
  {
    metricName: 'TotalAssetSize',
    description: 'Total page asset size',
    good: 250 * 1024,
    needsImprovement: 500 * 1024,
    critical: 1024 * 1024,
    unit: 'bytes',
  },
  {
    metricName: 'ImageSize',
    description: 'Total image size',
    good: 100 * 1024,
    needsImprovement: 250 * 1024,
    critical: 500 * 1024,
    unit: 'bytes',
  },
  {
    metricName: 'InitialJSBundle',
    description: 'Initial JavaScript bundle size',
    good: 150 * 1024,
    needsImprovement: 300 * 1024,
    critical: 500 * 1024,
    unit: 'bytes',
  },
  {
    metricName: 'RequestCount',
    description: 'Number of network requests',
    good: 50,
    needsImprovement: 100,
    critical: 150,
    unit: 'count',
  },
];

/**
 * Offline sync performance budgets
 */
const offlineSyncBudgets: PerformanceBudget[] = [
  {
    metricName: 'SyncConflictResolutionTime',
    description: 'Time to resolve sync conflicts',
    good: 1000,
    needsImprovement: 3000,
    critical: 5000,
    unit: 'ms',
  },
  {
    metricName: 'DataSyncTimePerMB',
    description: 'Time to sync 1MB of data',
    good: 2000,
    needsImprovement: 5000,
    critical: 10000,
    unit: 'ms',
  },
  {
    metricName: 'IndexedDBWriteTimePerRecord',
    description: 'Time to write a single record to IndexedDB',
    good: 10,
    needsImprovement: 50,
    critical: 100,
    unit: 'ms',
  },
  {
    metricName: 'MergeOperationTime',
    description: 'CRDT merge operation time',
    good: 100,
    needsImprovement: 500,
    critical: 1000,
    unit: 'ms',
  },
];

/**
 * GIS-specific performance budgets
 */
const gisPerformanceBudgets: PerformanceBudget[] = [
  {
    metricName: 'MapRenderTime',
    description: 'Time to render map tiles',
    good: 500,
    needsImprovement: 1500,
    critical: 3000,
    unit: 'ms',
  },
  {
    metricName: 'VectorLayerLoadTime',
    description: 'Time to load vector layers',
    good: 800,
    needsImprovement: 2000,
    critical: 4000,
    unit: 'ms',
  },
  {
    metricName: 'GeoJSONParseTime',
    description: 'Time to parse GeoJSON data',
    good: 300,
    needsImprovement: 1000,
    critical: 2000,
    unit: 'ms',
  },
  {
    metricName: 'MapRenderFPS',
    description: 'Map rendering frames per second',
    good: 50,
    needsImprovement: 30,
    critical: 15,
    unit: 'fps',
  },
];

/**
 * AI processing performance budgets
 */
const aiPerformanceBudgets: PerformanceBudget[] = [
  {
    metricName: 'AIResponseTime',
    description: 'Time to get AI response',
    good: 2000,
    needsImprovement: 5000,
    critical: 10000,
    unit: 'ms',
  },
  {
    metricName: 'PropertyAnalysisTime',
    description: 'Time to analyze property data',
    good: 3000,
    needsImprovement: 8000,
    critical: 15000,
    unit: 'ms',
  },
  {
    metricName: 'CompSalesGenerationTime',
    description: 'Time to generate comparable sales',
    good: 5000,
    needsImprovement: 12000,
    critical: 20000,
    unit: 'ms',
  },
  {
    metricName: 'ImageAIProcessingTime',
    description: 'Time to process image with AI',
    good: 1500,
    needsImprovement: 4000,
    critical: 8000,
    unit: 'ms',
  },
];

/**
 * Monorepo build performance budgets
 */
const monorepoPerformanceBudgets: PerformanceBudget[] = [
  {
    metricName: 'TotalBuildTime',
    description: 'Total monorepo build time',
    good: 60000,
    needsImprovement: 180000,
    critical: 300000,
    unit: 'ms',
  },
  {
    metricName: 'PackageBuildTime',
    description: 'Individual package build time',
    good: 10000,
    needsImprovement: 30000,
    critical: 60000,
    unit: 'ms',
  },
  {
    metricName: 'CITestTime',
    description: 'Time to run CI tests',
    good: 120000,
    needsImprovement: 300000,
    critical: 600000,
    unit: 'ms',
  },
  {
    metricName: 'ESLintTime',
    description: 'Time to run ESLint',
    good: 10000,
    needsImprovement: 30000,
    critical: 60000,
    unit: 'ms',
  },
];

/**
 * Queue processing performance budgets
 */
const queuePerformanceBudgets: PerformanceBudget[] = [
  {
    metricName: 'QueueProcessingRate',
    description: 'Items processed per second',
    good: 50,
    needsImprovement: 20,
    critical: 5,
    unit: 'items/sec',
  },
  {
    metricName: 'QueueLatency',
    description: 'Queue processing latency',
    good: 100,
    needsImprovement: 500,
    critical: 2000,
    unit: 'ms',
  },
  {
    metricName: 'TaskProcessingTime',
    description: 'Average task processing time',
    good: 200,
    needsImprovement: 1000,
    critical: 5000,
    unit: 'ms',
  },
  {
    metricName: 'QueueBacklogSize',
    description: 'Number of items in queue',
    good: 50,
    needsImprovement: 200,
    critical: 1000,
    unit: 'count',
  },
];

/**
 * Performance budget sets
 */
export const performanceBudgetSets: PerformanceBudgetSet[] = [
  {
    name: 'Core Web Vitals',
    description: 'Essential metrics for web user experience',
    category: 'critical',
    budgets: coreWebVitalsBudgets,
  },
  {
    name: 'Mobile Experience',
    description: 'Mobile-specific performance metrics',
    category: 'mobile',
    budgets: mobilePerformanceBudgets,
  },
  {
    name: 'Resource Optimization',
    description: 'Asset size and request count budgets',
    category: 'all',
    budgets: resourceBudgets,
  },
  {
    name: 'Offline Sync',
    description: 'Offline and synchronization performance',
    category: 'all',
    budgets: offlineSyncBudgets,
  },
  {
    name: 'GIS Performance',
    description: 'Map rendering and geospatial operations',
    category: 'all',
    budgets: gisPerformanceBudgets,
  },
  {
    name: 'AI Processing',
    description: 'AI and machine learning operations',
    category: 'all',
    budgets: aiPerformanceBudgets,
  },
  {
    name: 'Monorepo Build',
    description: 'Build and testing performance',
    category: 'desktop',
    budgets: monorepoPerformanceBudgets,
  },
  {
    name: 'Queue Processing',
    description: 'Background task processing',
    category: 'all',
    budgets: queuePerformanceBudgets,
  },
];

/**
 * Helper function to get the performance budget for a given metric and device type
 */
export function getPerformanceBudget(
  metricName: string,
  deviceType: 'desktop' | 'mobile' = 'desktop'
): PerformanceBudget | undefined {
  // First, find the metric in all budget sets
  for (const budgetSet of performanceBudgetSets) {
    // Skip if this budget set is not applicable to the device type
    if (
      budgetSet.category !== 'all' &&
      budgetSet.category !== deviceType &&
      !(budgetSet.category === 'critical')
    ) {
      continue;
    }

    // Look for the metric in this budget set
    const matchingBudget = budgetSet.budgets.find(budget => budget.metricName === metricName);

    if (matchingBudget) {
      return matchingBudget;
    }
  }

  // Fallback: handle specific cases that don't follow the pattern
  if (metricName === 'FCP') {
    // First Contentful Paint has different thresholds for mobile vs desktop
    return {
      metricName: 'FCP',
      description: 'First Contentful Paint - first content rendered',
      good: deviceType === 'mobile' ? 1800 : 1000,
      needsImprovement: deviceType === 'mobile' ? 3000 : 2000,
      critical: deviceType === 'mobile' ? 5000 : 4000,
      unit: 'ms',
    };
  }

  if (metricName === 'TTFB') {
    // Time to First Byte is similar for both platforms
    return {
      metricName: 'TTFB',
      description: 'Time to First Byte - server response time',
      good: 800,
      needsImprovement: 1800,
      critical: 2500,
      unit: 'ms',
    };
  }

  return undefined;
}

/**
 * Determine the rating of a metric value based on performance budgets
 */
export function getRating(
  metricName: string,
  value: number,
  deviceType: 'desktop' | 'mobile' = 'desktop'
): 'good' | 'needs-improvement' | 'poor' {
  const budget = getPerformanceBudget(metricName, deviceType);

  if (!budget) {
    // Default to "good" if we don't have a budget for this metric
    return 'good';
  }

  // For most metrics, lower is better
  // But some metrics like FPS are better when higher
  const isHigherBetter = metricName === 'MapRenderFPS' || metricName === 'QueueProcessingRate';

  if (isHigherBetter) {
    if (value >= budget.good) {
      return 'good';
    } else if (value >= budget.needsImprovement) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  } else {
    // Lower is better for most metrics
    if (value <= budget.good) {
      return 'good';
    } else if (value <= budget.needsImprovement) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }
}
