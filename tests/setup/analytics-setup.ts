/**
 * TerraFusion OS - Analytics Test Setup
 * MIT/PhD-Level Test Analytics Infrastructure
 */

import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  console.log('🔬 Setting up Analytics Testing Environment...');
  
  // Initialize analytics monitoring
  global.analyticsStartTime = Date.now();
  
  // Setup performance monitoring
  if (typeof performance === 'undefined') {
    const { performance } = await import('perf_hooks');
    (global as any).performance = performance;
  }
  
  // Setup test analytics collection
  global.testAnalytics = {
    suiteMetrics: new Map(),
    dashboardData: [],
    realTimeMonitoring: true
  };
  
  console.log('✅ Analytics Testing Environment Ready');
});

afterAll(async () => {
  const totalTime = Date.now() - global.analyticsStartTime;
  console.log(`🔬 Analytics Test Suite Completed in ${totalTime}ms`);
  
  // Generate final analytics report
  if (global.testAnalytics && global.testAnalytics.suiteMetrics.size > 0) {
    console.log(`📊 Total Test Suites Analyzed: ${global.testAnalytics.suiteMetrics.size}`);
    console.log(`📈 Dashboard Data Points Collected: ${global.testAnalytics.dashboardData.length}`);
  }
});

// Extend global types for TypeScript
declare global {
  var analyticsStartTime: number;
  var testAnalytics: {
    suiteMetrics: Map<string, any>;
    dashboardData: any[];
    realTimeMonitoring: boolean;
  };
}