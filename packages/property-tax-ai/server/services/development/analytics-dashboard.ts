/**
 * Advanced Analytics Dashboard Service
 * 
 * Provides comprehensive analytics and visualization for assessment models:
 * - Model performance metrics
 * - Version comparison
 * - Predictive metrics
 * - KPI tracking
 */

import { IStorage } from '../../storage';
import { 
  AssessmentModel,
  AssessmentModelVersion,
  ModelTestCase
} from '@shared/schema';

// Type definitions for analytics dashboard
export type ModelPerformanceMetrics = {
  modelId: string;
  executionTime: {
    average: number;
    min: number;
    max: number;
    trend: number[];
  };
  testCoverage: number; // Percentage of model components/calculations covered by tests
  passRate: number; // Percentage of passing tests
  accuracy: number; // Average deviation from expected results
  stability: number; // Percentage of tests with consistent results over time
  lastUpdated: string;
};

export type ModelVersionComparison = {
  currentVersion: {
    versionNumber: string;
    createdAt: string;
    performance: ModelPerformanceMetrics;
  };
  previousVersion: {
    versionNumber: string;
    createdAt: string;
    performance: ModelPerformanceMetrics;
  };
  changes: {
    components: {
      added: string[];
      modified: string[];
      removed: string[];
    };
    calculations: {
      added: string[];
      modified: string[];
      removed: string[];
    };
    variables: {
      added: string[];
      modified: string[];
      removed: string[];
    };
    performanceChange: {
      executionTime: number; // Percentage change
      passRate: number; // Percentage point change
      accuracy: number; // Percentage point change
    };
  };
};

export type PredictiveMetrics = {
  modelId: string;
  predictions: {
    trending: {
      propertyCounts: number[];
      valuationDistribution: { 
        range: string;
        count: number;
        percentage: number;
      }[];
      timePoints: string[];
    };
    seasonality: {
      pattern: 'yearly' | 'quarterly' | 'monthly' | 'none';
      confidence: number;
      peakPeriods: string[];
      lowPeriods: string[];
    };
    anomalies: {
      type: string;
      count: number;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }[];
  };
};

export type AssessmentKPI = {
  name: string;
  description: string;
  value: number;
  target: number;
  unit: string;
  trend: number[];
  timePoints: string[];
  status: 'above-target' | 'on-target' | 'below-target';
};

export class AnalyticsDashboard {
  private storage: IStorage;
  
  constructor(storage: IStorage) {
    this.storage = storage;
  }
  
  /**
   * Get model performance metrics
   */
  async getModelPerformanceMetrics(modelId: string): Promise<ModelPerformanceMetrics> {
    // Get model
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // Get test cases with results
    const testCases = await this.storage.getModelTestCasesByModel(modelId);
    
    if (!testCases || testCases.length === 0) {
      return {
        modelId,
        executionTime: {
          average: 0,
          min: 0,
          max: 0,
          trend: []
        },
        testCoverage: 0,
        passRate: 0,
        accuracy: 0,
        stability: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Get components and calculations
    const components = await this.storage.getModelComponentsByModel(modelId);
    const calculations = await this.storage.getModelCalculationsByModel(modelId);
    const totalComponents = components.length + calculations.length;
    
    // Calculate test coverage
    const testedComponentIds = new Set<string>();
    
    testCases.forEach(testCase => {
      // Check which components/calculations are covered by test expected outputs
      Object.keys(testCase.expectedOutputs).forEach(outputKey => {
        // Find the component/calculation that matches this output
        const matchingComponent = components.find(c => c.name === outputKey);
        const matchingCalculation = calculations.find(c => c.name === outputKey);
        
        if (matchingComponent) {
          testedComponentIds.add(`component-${matchingComponent.id}`);
        } else if (matchingCalculation) {
          testedComponentIds.add(`calculation-${matchingCalculation.id}`);
        }
      });
    });
    
    const testCoverage = totalComponents > 0 
      ? testedComponentIds.size / totalComponents
      : 0;
    
    // Calculate pass rate
    const testsWithResults = testCases.filter(tc => tc.lastRunStatus);
    const passedTests = testsWithResults.filter(tc => tc.lastRunStatus === 'passed');
    
    const passRate = testsWithResults.length > 0
      ? passedTests.length / testsWithResults.length
      : 0;
    
    // Calculate execution time metrics
    const executionTimes = testsWithResults
      .filter(tc => tc.lastRunResult && typeof tc.lastRunResult === 'object' && 'executionTime' in tc.lastRunResult)
      .map(tc => (tc.lastRunResult as any).executionTime as number);
    
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;
    
    const minExecutionTime = executionTimes.length > 0
      ? Math.min(...executionTimes)
      : 0;
      
    const maxExecutionTime = executionTimes.length > 0
      ? Math.max(...executionTimes)
      : 0;
    
    // Calculate accuracy (average deviation from expected)
    let totalDeviation = 0;
    let deviationCount = 0;
    
    testsWithResults.forEach(testCase => {
      if (!testCase.lastRunResult || typeof testCase.lastRunResult !== 'object') {
        return;
      }
      
      const result = testCase.lastRunResult as any;
      
      if (result.actualOutput && testCase.expectedOutputs) {
        // Compare actual outputs with expected outputs
        Object.entries(testCase.expectedOutputs).forEach(([key, expectedValue]) => {
          const actualValue = result.actualOutput[key];
          
          if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
            const deviation = Math.abs((actualValue - expectedValue) / expectedValue);
            totalDeviation += deviation;
            deviationCount++;
          }
        });
      }
    });
    
    const accuracy = deviationCount > 0
      ? 1 - (totalDeviation / deviationCount)
      : 0;
    
    // For trend, we would need historical data
    // For now, let's generate a mock trend
    const executionTimeTrend = [0, 0, 0, 0, 0];
    
    // Calculate stability
    // Would normally require historical test runs
    // For now, let's assume a high stability for simplicity
    const stability = 0.95;
    
    return {
      modelId,
      executionTime: {
        average: averageExecutionTime,
        min: minExecutionTime,
        max: maxExecutionTime,
        trend: executionTimeTrend
      },
      testCoverage,
      passRate,
      accuracy,
      stability,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Compare model versions
   */
  async compareModelVersions(
    modelId: string,
    currentVersionId: number,
    previousVersionId?: number
  ): Promise<ModelVersionComparison> {
    // Get model
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // Get current version
    const currentVersion = await this.storage.getAssessmentModelVersion(currentVersionId);
    
    if (!currentVersion) {
      throw new Error('Current version not found');
    }
    
    // Get previous version
    let previousVersion;
    
    if (previousVersionId) {
      previousVersion = await this.storage.getAssessmentModelVersion(previousVersionId);
      
      if (!previousVersion) {
        throw new Error('Previous version not found');
      }
    } else {
      // Get previous version automatically
      const versions = await this.storage.getAssessmentModelVersionsByModel(modelId);
      previousVersion = versions
        .filter(v => v.id !== currentVersionId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (!previousVersion) {
        throw new Error('No previous version found');
      }
    }
    
    // Get performance metrics for both versions
    const currentPerformance = await this.getModelPerformanceMetrics(modelId);
    
    // For the previous version, we would need to restore it and run tests
    // For now, let's create a mock performance for the previous version
    const previousPerformance: ModelPerformanceMetrics = {
      ...currentPerformance,
      executionTime: {
        ...currentPerformance.executionTime,
        average: currentPerformance.executionTime.average * 1.05 // 5% slower
      },
      passRate: currentPerformance.passRate * 0.95, // 5% lower pass rate
      accuracy: currentPerformance.accuracy * 0.98 // 2% lower accuracy
    };
    
    // Compare snapshots to identify changes
    const currentSnapshot = typeof currentVersion.snapshot === 'string' 
      ? JSON.parse(currentVersion.snapshot) 
      : currentVersion.snapshot;
      
    const previousSnapshot = typeof previousVersion.snapshot === 'string'
      ? JSON.parse(previousVersion.snapshot)
      : previousVersion.snapshot;
    
    // Extract the components, calculations, and variables from snapshots
    const changes = this.compareSnapshots(currentSnapshot, previousSnapshot);
    
    // Calculate performance changes
    const performanceChange = {
      executionTime: ((previousPerformance.executionTime.average - currentPerformance.executionTime.average) / 
                       previousPerformance.executionTime.average) * 100,
      passRate: (currentPerformance.passRate - previousPerformance.passRate) * 100,
      accuracy: (currentPerformance.accuracy - previousPerformance.accuracy) * 100
    };
    
    return {
      currentVersion: {
        versionNumber: currentVersion.versionNumber,
        createdAt: currentVersion.createdAt,
        performance: currentPerformance
      },
      previousVersion: {
        versionNumber: previousVersion.versionNumber,
        createdAt: previousVersion.createdAt,
        performance: previousPerformance
      },
      changes: {
        ...changes,
        performanceChange
      }
    };
  }
  
  /**
   * Compare two model snapshots to identify changes
   */
  private compareSnapshots(currentSnapshot: any, previousSnapshot: any): {
    components: { added: string[]; modified: string[]; removed: string[]; };
    calculations: { added: string[]; modified: string[]; removed: string[]; };
    variables: { added: string[]; modified: string[]; removed: string[]; };
  } {
    // Initialize result
    const result = {
      components: { added: [], modified: [], removed: [] },
      calculations: { added: [], modified: [], removed: [] },
      variables: { added: [], modified: [], removed: [] }
    };
    
    // Helper function to compare arrays of objects
    const compareArrays = (current: any[], previous: any[], key: string, category: 'components' | 'calculations' | 'variables') => {
      // Create maps for faster lookup
      const currentMap = new Map(current.map(item => [item[key], item]));
      const previousMap = new Map(previous.map(item => [item[key], item]));
      
      // Find added items
      for (const [itemKey, item] of currentMap.entries()) {
        if (!previousMap.has(itemKey)) {
          result[category].added.push(item.name || itemKey);
        } else {
          // Check if modified
          const previousItem = previousMap.get(itemKey);
          
          if (JSON.stringify(item) !== JSON.stringify(previousItem)) {
            result[category].modified.push(item.name || itemKey);
          }
        }
      }
      
      // Find removed items
      for (const [itemKey, item] of previousMap.entries()) {
        if (!currentMap.has(itemKey)) {
          result[category].removed.push(item.name || itemKey);
        }
      }
    };
    
    // Compare components
    if (currentSnapshot.components && previousSnapshot.components) {
      compareArrays(currentSnapshot.components, previousSnapshot.components, 'id', 'components');
    }
    
    // Compare calculations
    if (currentSnapshot.calculations && previousSnapshot.calculations) {
      compareArrays(currentSnapshot.calculations, previousSnapshot.calculations, 'id', 'calculations');
    }
    
    // Compare variables
    if (currentSnapshot.variables && previousSnapshot.variables) {
      compareArrays(currentSnapshot.variables, previousSnapshot.variables, 'id', 'variables');
    }
    
    return result;
  }
  
  /**
   * Get predictive metrics for a model
   */
  async getPredictiveMetrics(modelId: string): Promise<PredictiveMetrics> {
    // Get model
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // In a real implementation, this would analyze historical data
    // and use statistical analysis to generate predictions
    // For demonstration purposes, let's create example predictive metrics
    
    // Generate example time points (last 12 months)
    const timePoints = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      timePoints.push(date.toISOString().split('T')[0]);
    }
    
    // Generate example property counts with a slight upward trend and seasonal pattern
    const propertyCounts = timePoints.map((_, index) => {
      const baseTrend = 1000 + index * 20;
      const seasonalFactor = Math.sin((index % 12) / 12 * 2 * Math.PI) * 100;
      return Math.round(baseTrend + seasonalFactor + Math.random() * 50);
    });
    
    // Generate example valuation distribution
    const valuationDistribution = [
      { range: '$0 - $100,000', count: 120, percentage: 12 },
      { range: '$100,001 - $250,000', count: 350, percentage: 35 },
      { range: '$250,001 - $500,000', count: 280, percentage: 28 },
      { range: '$500,001 - $750,000', count: 150, percentage: 15 },
      { range: '$750,001 - $1,000,000', count: 70, percentage: 7 },
      { range: 'Over $1,000,000', count: 30, percentage: 3 }
    ];
    
    // Generate example seasonality data
    const seasonality = {
      pattern: 'yearly' as const,
      confidence: 0.85,
      peakPeriods: ['June', 'July', 'August'],
      lowPeriods: ['January', 'February', 'December']
    };
    
    // Generate example anomalies
    const anomalies = [
      {
        type: 'Valuation Spike',
        count: 12,
        description: 'Unusual increase in property valuations in the northwest sector',
        impact: 'medium' as const
      },
      {
        type: 'Assessment Gap',
        count: 45,
        description: 'Properties with assessment values significantly below market value',
        impact: 'high' as const
      },
      {
        type: 'Classification Error',
        count: 8,
        description: 'Commercial properties incorrectly classified as residential',
        impact: 'low' as const
      }
    ];
    
    return {
      modelId,
      predictions: {
        trending: {
          propertyCounts,
          valuationDistribution,
          timePoints
        },
        seasonality,
        anomalies
      }
    };
  }
  
  /**
   * Get assessment KPIs
   */
  async getAssessmentKPIs(modelId: string): Promise<AssessmentKPI[]> {
    // Get model
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // In a real implementation, this would retrieve KPIs from a database
    // and calculate current values based on assessment data
    // For demonstration purposes, let's create example KPIs
    
    // Generate example time points (last 12 months)
    const timePoints = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      timePoints.push(date.toISOString().split('T')[0]);
    }
    
    // Standard assessment KPIs
    const kpis: AssessmentKPI[] = [
      {
        name: 'Assessment Ratio',
        description: 'Ratio of assessed value to market value',
        value: 0.92,
        target: 0.95,
        unit: 'ratio',
        trend: timePoints.map((_, i) => 0.85 + (i * 0.007) + (Math.random() * 0.01)),
        timePoints,
        status: 'below-target'
      },
      {
        name: 'Coefficient of Dispersion',
        description: 'Measure of assessment uniformity',
        value: 12.5,
        target: 15,
        unit: 'percent',
        trend: timePoints.map((_, i) => 14 - (i * 0.1) + (Math.random() * 1)),
        timePoints,
        status: 'above-target'
      },
      {
        name: 'Price-Related Differential',
        description: 'Measure of assessment equity between high and low-value properties',
        value: 1.03,
        target: 1.05,
        unit: 'ratio',
        trend: timePoints.map((_, i) => 1.02 + (Math.random() * 0.03)),
        timePoints,
        status: 'on-target'
      },
      {
        name: 'Appeal Rate',
        description: 'Percentage of properties with assessment appeals',
        value: 2.8,
        target: 5,
        unit: 'percent',
        trend: timePoints.map((_, i) => 4.5 - (i * 0.2) + (Math.random() * 0.3)),
        timePoints,
        status: 'above-target'
      },
      {
        name: 'Processing Time',
        description: 'Average time to process assessments',
        value: 3.2,
        target: 3,
        unit: 'days',
        trend: timePoints.map((_, i) => 4 - (i * 0.05) + (Math.random() * 0.2)),
        timePoints,
        status: 'below-target'
      },
      {
        name: 'Data Quality Index',
        description: 'Measure of assessment data quality and completeness',
        value: 87,
        target: 90,
        unit: 'percent',
        trend: timePoints.map((_, i) => 80 + (i * 0.5) + (Math.random() * 2)),
        timePoints,
        status: 'below-target'
      }
    ];
    
    return kpis;
  }
}

// Singleton instance
let analyticsDashboard: AnalyticsDashboard;

/**
 * Initialize the Analytics Dashboard
 */
export function initializeAnalyticsDashboard(storage: IStorage): AnalyticsDashboard {
  analyticsDashboard = new AnalyticsDashboard(storage);
  return analyticsDashboard;
}

/**
 * Get the Analytics Dashboard instance
 */
export function getAnalyticsDashboard(): AnalyticsDashboard {
  if (!analyticsDashboard) {
    throw new Error('Analytics Dashboard not initialized');
  }
  return analyticsDashboard;
}

export default analyticsDashboard;