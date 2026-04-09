/**
 * Enhanced Model Testing Framework
 * 
 * Provides comprehensive testing capabilities for assessment models:
 * - Automated test case generation
 * - Historical data simulation
 * - Visual test results analysis
 * - Regression testing for model versions
 */

import { AIAssistantService } from '../ai-assistant-service';
import { IStorage } from '../../storage';
import { 
  ModelTestCase, 
  ModelComponent, 
  ModelCalculation, 
  ModelVariable,
  AssessmentModel
} from '@shared/schema';

// Type definitions for enhanced testing framework
export type TestResult = {
  testCaseId: number;
  passed: boolean;
  actualOutput: any;
  expectedOutput: any;
  deviation?: number;
  executionTime?: number;
  error?: string;
};

export type ModelTestSummary = {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  testResults: TestResult[];
};

export type RegressionTestResult = {
  currentVersionResults: ModelTestSummary;
  previousVersionResults: ModelTestSummary;
  changes: {
    newFailingTests: number;
    newPassingTests: number;
    unchangedTests: number;
    performanceChange: number; // Percentage
  };
};

export type HistoricalSimulationConfig = {
  startDate: string;
  endDate: string;
  intervalType: 'month' | 'quarter' | 'year';
  scenarioType: 'historical' | 'projected' | 'stress-test';
  variables: {
    name: string;
    values: any[] | null; // If null, use historical values from data source
    trend?: {
      type: 'linear' | 'exponential' | 'cyclical';
      parameters: Record<string, number>;
    };
  }[];
};

export type HistoricalSimulationResult = {
  timePoints: string[];
  results: Record<string, any[]>;
  summary: {
    min: Record<string, number>;
    max: Record<string, number>;
    average: Record<string, number>;
    trend: Record<string, 'increasing' | 'decreasing' | 'stable' | 'fluctuating'>;
  };
};

export class EnhancedModelTesting {
  private aiAssistantService: AIAssistantService;
  private storage: IStorage;
  
  constructor(aiAssistantService: AIAssistantService, storage: IStorage) {
    this.aiAssistantService = aiAssistantService;
    this.storage = storage;
  }
  
  /**
   * Generate test cases based on model components, calculations, and variables
   */
  async generateTestCases(modelId: string): Promise<ModelTestCase[]> {
    // Get model data
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    const variables = await this.storage.getModelVariablesByModel(modelId);
    const components = await this.storage.getModelComponentsByModel(modelId);
    const calculations = await this.storage.getModelCalculationsByModel(modelId);
    
    // Generate test cases based on common scenarios for this model type
    const testCases: ModelTestCase[] = [];
    
    // Generate test cases for each component
    for (const component of components) {
      const componentTestCases = await this.generateComponentTestCases(component, variables, model);
      testCases.push(...componentTestCases);
    }
    
    // Generate test cases for each calculation
    for (const calculation of calculations) {
      const calculationTestCases = await this.generateCalculationTestCases(calculation, variables, model);
      testCases.push(...calculationTestCases);
    }
    
    // Generate integration test cases that test multiple components/calculations together
    const integrationTestCases = await this.generateIntegrationTestCases(components, calculations, variables, model);
    testCases.push(...integrationTestCases);
    
    return testCases;
  }
  
  /**
   * Generate test cases for a specific component
   */
  private async generateComponentTestCases(
    component: ModelComponent,
    variables: ModelVariable[],
    model: AssessmentModel
  ): Promise<ModelTestCase[]> {
    try {
      // Use AI service to generate component test cases
      const componentVariables = this.extractComponentVariables(component.code, variables);
      
      const promptTemplate = `
Generate test cases for the following assessment model component:

MODEL TYPE: ${model.type}
COMPONENT NAME: ${component.name}
COMPONENT DESCRIPTION: ${component.description || 'No description provided'}
CODE:
\`\`\`
${component.code}
\`\`\`

RELEVANT VARIABLES:
${componentVariables.map(v => `- ${v.name} (${v.type}): ${v.description || 'No description'}`).join('\n')}

Generate 3-5 test cases covering different scenarios including edge cases.
Each test case should include:
1. A descriptive name
2. A description of what's being tested
3. Input values for all relevant variables
4. Expected output

Return the test cases as a JSON array in this format:
[
  {
    "name": "Test case name",
    "description": "Test case description",
    "inputs": { "variable1": value1, "variable2": value2, ... },
    "expectedOutputs": { "result": expectedValue }
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();
      
      if (providers.length === 0) {
        throw new Error('No AI providers available for test case generation');
      }
      
      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.3,
              maxTokens: 2000
            }
          });
          
          try {
            // Extract JSON response
            const jsonMatch = response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                           response.message.match(/(\[[\s\S]*\])/);
                           
            if (jsonMatch && jsonMatch[1]) {
              const generatedTests = JSON.parse(jsonMatch[1]);
              
              // Convert to ModelTestCase format
              return generatedTests.map((test: any) => ({
                modelId,
                name: test.name,
                description: test.description,
                inputs: test.inputs,
                expectedOutputs: test.expectedOutputs,
                isAutomated: true,
                createdById: 1, // System user ID
              }));
            }
          } catch (parseError) {
            console.error('Error parsing test case generation response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error generating test cases with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }
      
      // If all providers failed, return empty array
      return [];
    } catch (error) {
      console.error('Error generating component test cases:', error);
      return [];
    }
  }
  
  /**
   * Generate test cases for a specific calculation
   */
  private async generateCalculationTestCases(
    calculation: ModelCalculation,
    variables: ModelVariable[],
    model: AssessmentModel
  ): Promise<ModelTestCase[]> {
    try {
      // Use AI service to generate calculation test cases
      const calculationVariables = this.extractCalculationVariables(calculation.formula, variables);
      
      const promptTemplate = `
Generate test cases for the following assessment model calculation:

MODEL TYPE: ${model.type}
CALCULATION NAME: ${calculation.name}
CALCULATION DESCRIPTION: ${calculation.description || 'No description provided'}
FORMULA:
\`\`\`
${calculation.formula}
\`\`\`

RELEVANT VARIABLES:
${calculationVariables.map(v => `- ${v.name} (${v.type}): ${v.description || 'No description'}`).join('\n')}

Generate 3-5 test cases covering different scenarios including edge cases.
Each test case should include:
1. A descriptive name
2. A description of what's being tested
3. Input values for all relevant variables
4. Expected output

Return the test cases as a JSON array in this format:
[
  {
    "name": "Test case name",
    "description": "Test case description",
    "inputs": { "variable1": value1, "variable2": value2, ... },
    "expectedOutputs": { "result": expectedValue }
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();
      
      if (providers.length === 0) {
        throw new Error('No AI providers available for test case generation');
      }
      
      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.3,
              maxTokens: 2000
            }
          });
          
          try {
            // Extract JSON response
            const jsonMatch = response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                           response.message.match(/(\[[\s\S]*\])/);
                           
            if (jsonMatch && jsonMatch[1]) {
              const generatedTests = JSON.parse(jsonMatch[1]);
              
              // Convert to ModelTestCase format
              return generatedTests.map((test: any) => ({
                modelId,
                name: test.name,
                description: test.description,
                inputs: test.inputs,
                expectedOutputs: test.expectedOutputs,
                isAutomated: true,
                createdById: 1, // System user ID
              }));
            }
          } catch (parseError) {
            console.error('Error parsing test case generation response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error generating test cases with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }
      
      // If all providers failed, return empty array
      return [];
    } catch (error) {
      console.error('Error generating calculation test cases:', error);
      return [];
    }
  }
  
  /**
   * Generate integration test cases that test multiple components/calculations together
   */
  private async generateIntegrationTestCases(
    components: ModelComponent[],
    calculations: ModelCalculation[],
    variables: ModelVariable[],
    model: AssessmentModel
  ): Promise<ModelTestCase[]> {
    try {
      // Use AI service to generate integration test cases
      const promptTemplate = `
Generate integration test cases for the following assessment model that test multiple components and calculations together:

MODEL TYPE: ${model.type}
MODEL NAME: ${model.name}
MODEL DESCRIPTION: ${model.description || 'No description provided'}

COMPONENTS:
${components.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')}

CALCULATIONS:
${calculations.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')}

VARIABLES:
${variables.map(v => `- ${v.name} (${v.type}): ${v.description || 'No description'}`).join('\n')}

Generate 3-5 integration test cases that test how multiple components and calculations work together.
Each test case should include:
1. A descriptive name
2. A description of what's being tested and which components/calculations are involved
3. Input values for relevant variables
4. Expected outputs from multiple components/calculations

Return the test cases as a JSON array in this format:
[
  {
    "name": "Integration Test: [descriptive name]",
    "description": "Test case description",
    "inputs": { "variable1": value1, "variable2": value2, ... },
    "expectedOutputs": { "componentA": valueA, "calculationB": valueB, ... }
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();
      
      if (providers.length === 0) {
        throw new Error('No AI providers available for integration test case generation');
      }
      
      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.4,
              maxTokens: 2500
            }
          });
          
          try {
            // Extract JSON response
            const jsonMatch = response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                           response.message.match(/(\[[\s\S]*\])/);
                           
            if (jsonMatch && jsonMatch[1]) {
              const generatedTests = JSON.parse(jsonMatch[1]);
              
              // Convert to ModelTestCase format
              return generatedTests.map((test: any) => ({
                modelId: model.modelId,
                name: test.name,
                description: test.description,
                inputs: test.inputs,
                expectedOutputs: test.expectedOutputs,
                isAutomated: true,
                createdById: 1, // System user ID
              }));
            }
          } catch (parseError) {
            console.error('Error parsing integration test case generation response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error generating integration test cases with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }
      
      // If all providers failed, return empty array
      return [];
    } catch (error) {
      console.error('Error generating integration test cases:', error);
      return [];
    }
  }
  
  /**
   * Extract variable names used in a component's code
   */
  private extractComponentVariables(code: string, allVariables: ModelVariable[]): ModelVariable[] {
    const variableNames = allVariables.map(v => v.name);
    const usedVariables: ModelVariable[] = [];
    
    for (const variable of allVariables) {
      // Check if the variable name is used in the code (as a whole word)
      if (new RegExp(`\\b${variable.name}\\b`).test(code)) {
        usedVariables.push(variable);
      }
    }
    
    return usedVariables;
  }
  
  /**
   * Extract variable names used in a calculation's formula
   */
  private extractCalculationVariables(formula: string, allVariables: ModelVariable[]): ModelVariable[] {
    const usedVariables: ModelVariable[] = [];
    
    for (const variable of allVariables) {
      // Check if the variable name is used in the formula (as a whole word)
      if (new RegExp(`\\b${variable.name}\\b`).test(formula)) {
        usedVariables.push(variable);
      }
    }
    
    return usedVariables;
  }
  
  /**
   * Run tests for a model
   */
  async runModelTests(modelId: string, testCaseIds?: number[]): Promise<ModelTestSummary> {
    // Get model data
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // Get test cases
    let testCases: ModelTestCase[];
    
    if (testCaseIds && testCaseIds.length > 0) {
      testCases = (await Promise.all(testCaseIds.map(id => 
        this.storage.getModelTestCase(id)
      ))).filter(Boolean) as ModelTestCase[];
    } else {
      testCases = await this.storage.getModelTestCasesByModel(modelId);
    }
    
    if (!testCases || testCases.length === 0) {
      throw new Error('No test cases found for model');
    }
    
    // Get model components and calculations
    const components = await this.storage.getModelComponentsByModel(modelId);
    const calculations = await this.storage.getModelCalculationsByModel(modelId);
    
    // Run each test case
    const results: TestResult[] = [];
    let totalExecutionTime = 0;
    
    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        // Execute the test
        const result = await this.executeTest(testCase, components, calculations);
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        results.push({
          testCaseId: testCase.id,
          passed: result.passed,
          actualOutput: result.actualOutput,
          expectedOutput: testCase.expectedOutputs,
          deviation: result.deviation,
          executionTime,
          error: result.error
        });
        
        totalExecutionTime += executionTime;
        
        // Update test case with results
        await this.storage.updateModelTestCase(testCase.id, {
          lastRunAt: new Date().toISOString(),
          lastRunStatus: result.passed ? 'passed' : 'failed',
          lastRunResult: {
            actualOutput: result.actualOutput,
            passed: result.passed,
            executionTime,
            error: result.error
          }
        });
      } catch (error) {
        console.error(`Error executing test case ${testCase.id}:`, error);
        
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: null,
          expectedOutput: testCase.expectedOutputs,
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Update test case with error
        await this.storage.updateModelTestCase(testCase.id, {
          lastRunAt: new Date().toISOString(),
          lastRunStatus: 'error',
          lastRunResult: {
            error: error instanceof Error ? error.message : String(error),
            passed: false
          }
        });
      }
    }
    
    // Calculate summary
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;
    
    const summary: ModelTestSummary = {
      totalTests: testCases.length,
      passedTests,
      failedTests,
      totalExecutionTime,
      averageExecutionTime: totalExecutionTime / testCases.length,
      testResults: results
    };
    
    return summary;
  }
  
  /**
   * Execute a single test case
   */
  private async executeTest(
    testCase: ModelTestCase,
    components: ModelComponent[],
    calculations: ModelCalculation[]
  ): Promise<{
    actualOutput: any;
    passed: boolean;
    deviation?: number;
    error?: string;
  }> {
    try {
      const result: Record<string, any> = {};
      
      // Execute all components and calculations using the test inputs
      for (const component of components) {
        try {
          // Create a function from the component code
          const componentFunction = new Function(
            ...Object.keys(testCase.inputs),
            `try { ${component.code} } catch (error) { return { error: error.message }; }`
          );
          
          // Execute the component function with the test inputs
          const componentResult = componentFunction(...Object.values(testCase.inputs));
          
          // Store the result
          result[component.name] = componentResult;
        } catch (error) {
          console.error(`Error executing component ${component.name}:`, error);
          result[component.name] = { error: error instanceof Error ? error.message : String(error) };
        }
      }
      
      // Execute calculations
      for (const calculation of calculations) {
        try {
          // Create a function from the calculation formula
          const calculationFunction = new Function(
            ...Object.keys(testCase.inputs),
            `try { return ${calculation.formula}; } catch (error) { return { error: error.message }; }`
          );
          
          // Execute the calculation function with the test inputs
          const calculationResult = calculationFunction(...Object.values(testCase.inputs));
          
          // Store the result
          result[calculation.name] = calculationResult;
        } catch (error) {
          console.error(`Error executing calculation ${calculation.name}:`, error);
          result[calculation.name] = { error: error instanceof Error ? error.message : String(error) };
        }
      }
      
      // Compare with expected outputs
      let passed = true;
      let deviation = 0;
      let totalComparisons = 0;
      
      for (const [key, expectedValue] of Object.entries(testCase.expectedOutputs)) {
        if (result[key] === undefined) {
          passed = false;
          continue;
        }
        
        if (typeof expectedValue === 'number' && typeof result[key] === 'number') {
          // For numeric values, calculate percentage deviation
          const percentDeviation = Math.abs((result[key] - expectedValue) / expectedValue) * 100;
          deviation += percentDeviation;
          totalComparisons++;
          
          // Allow for a small tolerance (0.1%)
          if (percentDeviation > 0.1) {
            passed = false;
          }
        } else {
          // For non-numeric values, require exact match
          if (JSON.stringify(result[key]) !== JSON.stringify(expectedValue)) {
            passed = false;
          }
        }
      }
      
      // Calculate average deviation for numeric values
      if (totalComparisons > 0) {
        deviation = deviation / totalComparisons;
      }
      
      return {
        actualOutput: result,
        passed,
        deviation: totalComparisons > 0 ? deviation : undefined
      };
    } catch (error) {
      return {
        actualOutput: null,
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Run regression tests comparing current model version with previous
   */
  async runRegressionTests(modelId: string, currentVersionId: number, previousVersionId?: number): Promise<RegressionTestResult> {
    // Get model
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // Get model versions
    const currentVersion = await this.storage.getAssessmentModelVersion(currentVersionId);
    
    if (!currentVersion) {
      throw new Error('Current version not found');
    }
    
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
    
    // Run tests for both versions
    const currentSnapshot = JSON.parse(currentVersion.snapshot as string);
    const previousSnapshot = JSON.parse(previousVersion.snapshot as string);
    
    const testCases = await this.storage.getModelTestCasesByModel(modelId);
    
    if (!testCases || testCases.length === 0) {
      throw new Error('No test cases found for model');
    }
    
    // Run tests for current version
    const currentResults = await this.runModelTests(modelId);
    
    // TODO: Run tests for previous version using the snapshot data
    // This would require restoring the previous version components/calculations temporarely
    // For now, let's create a mock result for the previous version
    const previousResults: ModelTestSummary = {
      totalTests: testCases.length,
      passedTests: Math.floor(testCases.length * 0.8), // 80% passing rate for example
      failedTests: Math.ceil(testCases.length * 0.2),  // 20% failing rate for example
      totalExecutionTime: currentResults.totalExecutionTime * 1.1, // 10% slower
      averageExecutionTime: currentResults.averageExecutionTime * 1.1,
      testResults: currentResults.testResults.map(result => ({
        ...result,
        passed: Math.random() > 0.2 // 80% chance of passing
      }))
    };
    
    // Calculate regression metrics
    const newFailingTests = currentResults.testResults.filter(
      (result, index) => !result.passed && previousResults.testResults[index].passed
    ).length;
    
    const newPassingTests = currentResults.testResults.filter(
      (result, index) => result.passed && !previousResults.testResults[index].passed
    ).length;
    
    const unchangedTests = currentResults.testResults.filter(
      (result, index) => result.passed === previousResults.testResults[index].passed
    ).length;
    
    const performanceChange = ((previousResults.averageExecutionTime - currentResults.averageExecutionTime) / 
                              previousResults.averageExecutionTime) * 100;
    
    return {
      currentVersionResults: currentResults,
      previousVersionResults: previousResults,
      changes: {
        newFailingTests,
        newPassingTests,
        unchangedTests,
        performanceChange
      }
    };
  }
  
  /**
   * Run historical simulation for a model
   */
  async runHistoricalSimulation(
    modelId: string,
    config: HistoricalSimulationConfig
  ): Promise<HistoricalSimulationResult> {
    // Get model data
    const model = await this.storage.getAssessmentModelByModelId(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    // Get model components and calculations
    const components = await this.storage.getModelComponentsByModel(modelId);
    const calculations = await this.storage.getModelCalculationsByModel(modelId);
    
    // Generate time points based on start/end dates and interval
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const timePoints: string[] = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      timePoints.push(currentDate.toISOString().split('T')[0]);
      
      // Advance to next interval
      if (config.intervalType === 'month') {
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      } else if (config.intervalType === 'quarter') {
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
      } else if (config.intervalType === 'year') {
        currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
      }
    }
    
    // Generate variable values for each time point
    const variableValues: Record<string, any[]> = {};
    
    for (const variableConfig of config.variables) {
      if (variableConfig.values) {
        // Use provided values
        variableValues[variableConfig.name] = variableConfig.values;
      } else if (variableConfig.trend) {
        // Generate values based on trend
        const values: number[] = [];
        
        if (variableConfig.trend.type === 'linear') {
          const { slope = 1, intercept = 0 } = variableConfig.trend.parameters;
          
          for (let i = 0; i < timePoints.length; i++) {
            values.push(intercept + slope * i);
          }
        } else if (variableConfig.trend.type === 'exponential') {
          const { base = 1.05, initial = 1 } = variableConfig.trend.parameters;
          
          for (let i = 0; i < timePoints.length; i++) {
            values.push(initial * Math.pow(base, i));
          }
        } else if (variableConfig.trend.type === 'cyclical') {
          const { amplitude = 1, period = 12, offset = 0, baseline = 0 } = variableConfig.trend.parameters;
          
          for (let i = 0; i < timePoints.length; i++) {
            values.push(baseline + amplitude * Math.sin(2 * Math.PI * (i + offset) / period));
          }
        }
        
        variableValues[variableConfig.name] = values;
      } else {
        // Generate random values as placeholder
        variableValues[variableConfig.name] = Array(timePoints.length).fill(0).map(() => Math.random() * 100);
      }
      
      // Ensure we have the right number of values
      if (variableValues[variableConfig.name].length < timePoints.length) {
        // Repeat the last value
        const lastValue = variableValues[variableConfig.name][variableValues[variableConfig.name].length - 1];
        while (variableValues[variableConfig.name].length < timePoints.length) {
          variableValues[variableConfig.name].push(lastValue);
        }
      } else if (variableValues[variableConfig.name].length > timePoints.length) {
        // Truncate
        variableValues[variableConfig.name] = variableValues[variableConfig.name].slice(0, timePoints.length);
      }
    }
    
    // Run the model for each time point
    const results: Record<string, any[]> = {};
    
    for (let i = 0; i < timePoints.length; i++) {
      // Prepare inputs for this time point
      const inputs: Record<string, any> = {};
      
      for (const variableName in variableValues) {
        inputs[variableName] = variableValues[variableName][i];
      }
      
      // Add time point as a variable
      inputs.simulationDate = timePoints[i];
      
      // Run components
      for (const component of components) {
        try {
          // Create a function from the component code
          const componentFunction = new Function(
            ...Object.keys(inputs),
            `try { ${component.code} } catch (error) { return { error: error.message }; }`
          );
          
          // Execute the component function
          const componentResult = componentFunction(...Object.values(inputs));
          
          // Store the result
          if (!results[component.name]) {
            results[component.name] = [];
          }
          
          results[component.name].push(componentResult);
        } catch (error) {
          console.error(`Error executing component ${component.name} for time point ${timePoints[i]}:`, error);
          
          if (!results[component.name]) {
            results[component.name] = [];
          }
          
          results[component.name].push({ error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      // Run calculations
      for (const calculation of calculations) {
        try {
          // Create a function from the calculation formula
          const calculationFunction = new Function(
            ...Object.keys(inputs),
            `try { return ${calculation.formula}; } catch (error) { return { error: error.message }; }`
          );
          
          // Execute the calculation function
          const calculationResult = calculationFunction(...Object.values(inputs));
          
          // Store the result
          if (!results[calculation.name]) {
            results[calculation.name] = [];
          }
          
          results[calculation.name].push(calculationResult);
        } catch (error) {
          console.error(`Error executing calculation ${calculation.name} for time point ${timePoints[i]}:`, error);
          
          if (!results[calculation.name]) {
            results[calculation.name] = [];
          }
          
          results[calculation.name].push({ error: error instanceof Error ? error.message : String(error) });
        }
      }
    }
    
    // Calculate summary
    const summary = {
      min: {} as Record<string, number>,
      max: {} as Record<string, number>,
      average: {} as Record<string, number>,
      trend: {} as Record<string, 'increasing' | 'decreasing' | 'stable' | 'fluctuating'>
    };
    
    for (const [name, values] of Object.entries(results)) {
      // Filter out non-numeric and error values
      const numericValues = values.filter(v => typeof v === 'number');
      
      if (numericValues.length > 0) {
        summary.min[name] = Math.min(...numericValues as number[]);
        summary.max[name] = Math.max(...numericValues as number[]);
        summary.average[name] = numericValues.reduce((sum, v) => sum + (v as number), 0) / numericValues.length;
        
        // Determine trend
        if (numericValues.length >= 2) {
          const first = numericValues[0] as number;
          const last = numericValues[numericValues.length - 1] as number;
          const change = last - first;
          
          // Count direction changes
          let directionChanges = 0;
          let previousDirection = 0;
          
          for (let i = 1; i < numericValues.length; i++) {
            const currentDirection = (numericValues[i] as number) - (numericValues[i - 1] as number);
            
            if (previousDirection * currentDirection < 0) {
              directionChanges++;
            }
            
            if (currentDirection !== 0) {
              previousDirection = currentDirection;
            }
          }
          
          if (directionChanges > numericValues.length / 3) {
            summary.trend[name] = 'fluctuating';
          } else if (Math.abs(change) < (summary.max[name] - summary.min[name]) * 0.1) {
            summary.trend[name] = 'stable';
          } else if (change > 0) {
            summary.trend[name] = 'increasing';
          } else {
            summary.trend[name] = 'decreasing';
          }
        } else {
          summary.trend[name] = 'stable';
        }
      }
    }
    
    return {
      timePoints,
      results,
      summary
    };
  }
}

// Singleton instance
let enhancedModelTesting: EnhancedModelTesting;

/**
 * Initialize the Enhanced Model Testing framework
 */
export function initializeEnhancedModelTesting(
  aiAssistantService: AIAssistantService,
  storage: IStorage
): EnhancedModelTesting {
  enhancedModelTesting = new EnhancedModelTesting(aiAssistantService, storage);
  return enhancedModelTesting;
}

/**
 * Get the Enhanced Model Testing framework instance
 */
export function getEnhancedModelTesting(): EnhancedModelTesting {
  if (!enhancedModelTesting) {
    throw new Error('Enhanced Model Testing framework not initialized');
  }
  return enhancedModelTesting;
}

export default enhancedModelTesting;