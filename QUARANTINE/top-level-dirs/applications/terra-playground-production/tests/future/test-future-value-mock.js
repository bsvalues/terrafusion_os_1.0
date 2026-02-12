/**
 * Simplified test script for future value prediction capability
 * Uses mock services to avoid API calls and speed up testing
 */

// Import required modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import services directly - use dynamic imports for TypeScript files
let MemStorage, PropertyAssessmentAgent, MarketFactorService, BaseAgent, LLMService;

// Mock LLM service
const mockLLMService = {
  async prompt(prompt, options) {
    console.log('MOCK: LLM Service - Prompt:', prompt.substring(0, 50) + '...');
    return {
      text: 'Mock LLM response to the prompt.',
      model: 'mock-gpt-model',
      success: true,
    };
  },

  async analyzePropertyTrends(request) {
    console.log('MOCK: LLM Service - Analyzing Property Trends');
    return {
      text: 'Mock property trend analysis.',
      model: 'mock-gpt-model',
      success: true,
      trends: {
        timeframe: request.timeframe || '1year',
        valueTrend: 'increasing',
        percentageChange: 5.2,
        marketCondition: 'strong',
        factors: [
          { name: 'Interest Rates', impact: 'negative', trend: 'rising' },
          { name: 'Local Development', impact: 'positive', trend: 'improving' },
        ],
      },
    };
  },

  async generatePropertyValuation(request) {
    console.log('MOCK: LLM Service - Generating Property Valuation');
    return {
      text: 'Mock property valuation.',
      model: 'mock-gpt-model',
      success: true,
      valuation: {
        estimatedValue: 380000,
        confidenceScore: 0.85,
        comparableAdjustments: [
          { factor: 'Size', adjustment: 2.5 },
          { factor: 'Age', adjustment: -1.8 },
        ],
      },
    };
  },

  async analyzeNeighborhood(request) {
    console.log('MOCK: LLM Service - Analyzing Neighborhood');
    return {
      text: 'Mock neighborhood analysis.',
      model: 'mock-gpt-model',
      success: true,
      analysis: {
        neighborhoodName: 'Test Neighborhood',
        overview: 'Established residential area with good schools.',
        marketCondition: 'stable',
        attributes: {
          safety: 'high',
          schools: 'excellent',
          amenities: 'good',
        },
      },
    };
  },

  async predictFutureValue(request) {
    console.log('MOCK: LLM Service - Predicting Future Value');

    const currentYear = new Date().getFullYear();
    const currentValue = request.propertyData?.value || 375000;
    const yearsAhead = request.yearsAhead || 3;
    const propertyId = request.propertyId;

    // Generate mock prediction
    const predictedValues = [];
    let growthFromPresent = 0;
    let value = currentValue;

    for (let i = 1; i <= yearsAhead; i++) {
      const yearlyGrowth = 3 + i * 0.2; // Slight increase each year
      growthFromPresent += yearlyGrowth;
      value = value * (1 + yearlyGrowth / 100);

      predictedValues.push({
        year: currentYear + i,
        predictedValue: Math.round(value),
        growthRate: yearlyGrowth,
        growthFromPresent: Math.round(growthFromPresent * 10) / 10,
      });
    }

    // Generate confidence intervals
    const confidenceIntervals = predictedValues.map(pv => {
      const marginOfError = 5 + (pv.year - currentYear) * 1.5; // Increasing uncertainty with time
      return {
        year: pv.year,
        low: Math.round(pv.predictedValue * (1 - marginOfError / 100)),
        high: Math.round(pv.predictedValue * (1 + marginOfError / 100)),
        marginOfError,
      };
    });

    // Create object that will be directly converted to JSON string
    const prediction = {
      propertyId,
      currentValue,
      predictedValues,
      confidenceIntervals,
      marketFactors: [
        { name: 'Interest Rates', impact: 'negative', trend: 'rising' },
        { name: 'Local Development', impact: 'positive', trend: 'improving' },
        { name: 'Housing Demand', impact: 'positive', trend: 'stable' },
      ],
      overallConfidence: 0.75,
      marketOutlook: 'positive',
    };

    // Return in the format expected by the property assessment agent
    return {
      text: JSON.stringify(prediction),
      model: 'mock-gpt-model',
      success: true,
    };
  },

  async detectValuationAnomalies(request) {
    console.log('MOCK: LLM Service - Detecting Valuation Anomalies');
    return {
      text: 'Mock anomaly detection results.',
      model: 'mock-gpt-model',
      success: true,
      anomalies: {
        isAnomaly: Math.random() > 0.7,
        anomalyScore: Math.random() * 100,
        factorsContributing: ['Recent sales in area', 'Unusual property features'],
        recommendations: ['Review recent comparable sales', 'Verify property characteristics'],
      },
    };
  },
};

// Mock MCP service - we'll assign the property reference later
const mockMCPService = {
  // Track all registered tools for reporting
  _registeredTools: [],
  _requiredTools: [
    'property.getAll',
    'property.getById',
    'property.getByPropertyId',
    'property.search',
    'property.update',
    'property.getComparables',
    'property.getNeighborhood',
    'property.getZipCodeFromProperty',
    'landRecord.getAll',
    'landRecord.getById',
    'landRecord.getByPropertyId',
    'landRecord.search',
    'improvement.getAll',
    'improvement.getById',
    'improvement.getByPropertyId',
    'improvement.search',
    'market.getFactors',
    'market.getLandUseImpact',
  ],

  // Tool registration methods
  registerTool: toolDef => {
    mockMCPService._registeredTools.push(toolDef.name);
    return true;
  },
  getTools: () => mockMCPService._requiredTools.map(name => ({ name })),
  getAvailableTools: () => mockMCPService._requiredTools.map(name => ({ name })),
  registerSystemTool: () => true,
  registerAgentTools: () => true,

  // Tool execution
  executeTool: async (toolName, parameters) => {
    console.log(`MOCK MCP: Executing tool '${toolName}', typeof toolName: ${typeof toolName}`);
    let actualToolName = toolName;

    if (typeof toolName === 'object') {
      console.log('Tool name is an object, checking properties:', Object.keys(toolName));
      if (toolName.tool) {
        console.log(`Found tool property: ${toolName.tool}`);
        actualToolName = toolName.tool;
        parameters = toolName.parameters || parameters;
      } else if (toolName.toolName) {
        console.log(`Found toolName property: ${toolName.toolName}`);
        actualToolName = toolName.toolName;
      }
    }

    console.log(
      `MOCK MCP: Using tool name '${actualToolName}', parameters:`,
      JSON.stringify(parameters, null, 2)
    );

    if (actualToolName === 'property.getByPropertyId' || actualToolName === 'property.getById') {
      return {
        success: true,
        result: mockMCPService._testProperty,
      };
    }

    if (actualToolName === 'property.getAll') {
      return {
        success: true,
        result: [mockMCPService._testProperty],
      };
    }

    if (actualToolName === 'property.search') {
      return {
        success: true,
        result: [mockMCPService._testProperty],
      };
    }

    if (actualToolName === 'property.getComparables') {
      // Create mock comparable properties
      return {
        success: true,
        result: [
          {
            propertyId: 'COMP001',
            address: '234 Comp Ave, Testville, WA 98765',
            value: 385000,
            extraFields: { squareFootage: 2400, yearBuilt: 1995 },
          },
          {
            propertyId: 'COMP002',
            address: '567 Comp St, Testville, WA 98765',
            value: 360000,
            extraFields: { squareFootage: 2300, yearBuilt: 1992 },
          },
        ],
      };
    }

    if (actualToolName === 'property.getNeighborhood') {
      return {
        success: true,
        result: {
          name: 'Test Neighborhood',
          properties: [mockMCPService._testProperty],
          statistics: {
            medianValue: 380000,
            avgSalePrice: 390000,
            totalProperties: 45,
          },
        },
      };
    }

    if (actualToolName === 'property.getZipCodeFromProperty') {
      return {
        success: true,
        result: '98765',
      };
    }

    if (actualToolName === 'market.getFactors') {
      return {
        success: true,
        result: [
          { name: 'Interest Rates', value: 6.5, trend: 'rising', impact: 'negative' },
          { name: 'Local Development', value: 7.2, trend: 'improving', impact: 'positive' },
          { name: 'Housing Demand', value: 8.1, trend: 'stable', impact: 'positive' },
        ],
      };
    }

    if (actualToolName === 'market.getLandUseImpact') {
      return {
        success: true,
        result: {
          currentZoning: 'Residential',
          proposedChanges: 'None',
          nearbyDevelopments: [{ type: 'Commercial', distance: 0.5, impact: 'neutral' }],
          estimatedImpact: 'neutral',
        },
      };
    }

    // Land record tools
    if (actualToolName === 'landRecord.getAll') {
      return {
        success: true,
        result: [
          {
            id: 'LR001',
            propertyId: mockMCPService._testProperty.propertyId,
            recordType: 'Deed',
            recordDate: '2020-01-15',
            recordNumber: 'D-12345',
            description: 'Property transfer',
          },
        ],
      };
    }

    if (actualToolName === 'landRecord.getById') {
      return {
        success: true,
        result: {
          id: 'LR001',
          propertyId: mockMCPService._testProperty.propertyId,
          recordType: 'Deed',
          recordDate: '2020-01-15',
          recordNumber: 'D-12345',
          description: 'Property transfer',
        },
      };
    }

    if (actualToolName === 'landRecord.getByPropertyId') {
      return {
        success: true,
        result: [
          {
            id: 'LR001',
            propertyId: mockMCPService._testProperty.propertyId,
            recordType: 'Deed',
            recordDate: '2020-01-15',
            recordNumber: 'D-12345',
            description: 'Property transfer',
          },
        ],
      };
    }

    if (actualToolName === 'landRecord.search') {
      return {
        success: true,
        result: [
          {
            id: 'LR001',
            propertyId: mockMCPService._testProperty.propertyId,
            recordType: 'Deed',
            recordDate: '2020-01-15',
            recordNumber: 'D-12345',
            description: 'Property transfer',
          },
        ],
      };
    }

    // Improvement tools
    if (actualToolName === 'improvement.getAll') {
      return {
        success: true,
        result: [
          {
            id: 'IMP001',
            propertyId: mockMCPService._testProperty.propertyId,
            type: 'Residential Structure',
            value: 325000,
            description: 'Main house',
            yearBuilt: mockMCPService._testProperty.extraFields.yearBuilt,
            squareFootage: mockMCPService._testProperty.extraFields.squareFootage,
            condition: 'Good',
          },
          {
            id: 'IMP002',
            propertyId: mockMCPService._testProperty.propertyId,
            type: 'Detached Garage',
            value: 25000,
            description: 'Two-car garage',
            yearBuilt: 1990,
            squareFootage: 400,
            condition: 'Good',
          },
        ],
      };
    }

    if (actualToolName === 'improvement.getById') {
      return {
        success: true,
        result: {
          id: 'IMP001',
          propertyId: mockMCPService._testProperty.propertyId,
          type: 'Residential Structure',
          value: 325000,
          description: 'Main house',
          yearBuilt: mockMCPService._testProperty.extraFields.yearBuilt,
          squareFootage: mockMCPService._testProperty.extraFields.squareFootage,
          condition: 'Good',
        },
      };
    }

    if (actualToolName === 'improvement.getByPropertyId') {
      return {
        success: true,
        result: [
          {
            id: 'IMP001',
            propertyId: mockMCPService._testProperty.propertyId,
            type: 'Residential Structure',
            value: 325000,
            description: 'Main house',
            yearBuilt: mockMCPService._testProperty.extraFields.yearBuilt,
            squareFootage: mockMCPService._testProperty.extraFields.squareFootage,
            condition: 'Good',
          },
          {
            id: 'IMP002',
            propertyId: mockMCPService._testProperty.propertyId,
            type: 'Detached Garage',
            value: 25000,
            description: 'Two-car garage',
            yearBuilt: 1990,
            squareFootage: 400,
            condition: 'Good',
          },
        ],
      };
    }

    if (actualToolName === 'improvement.search') {
      return {
        success: true,
        result: [
          {
            id: 'IMP001',
            propertyId: mockMCPService._testProperty.propertyId,
            type: 'Residential Structure',
            value: 325000,
            description: 'Main house',
            yearBuilt: mockMCPService._testProperty.extraFields.yearBuilt,
            squareFootage: mockMCPService._testProperty.extraFields.squareFootage,
            condition: 'Good',
          },
        ],
      };
    }

    return null;
  },

  // Request execution interface
  executeRequest: async request => {
    if (request && request.tool) {
      console.log(
        `MOCK MCP: Execute request for tool '${request.tool}', parameters:`,
        JSON.stringify(request.parameters || {}, null, 2)
      );
      return await mockMCPService.executeTool({
        tool: request.tool,
        parameters: request.parameters || {},
      });
    } else if (request && request.toolName) {
      console.log(
        `MOCK MCP: Execute request for toolName '${request.toolName}', parameters:`,
        JSON.stringify(request.parameters || {}, null, 2)
      );
      return await mockMCPService.executeTool(request.toolName, request.parameters);
    }
    return null;
  },

  // Property data will be set at runtime
  _testProperty: null,
};

// Mock Property Story Generator
const mockPropertyStoryGenerator = {
  generatePropertyStory: async () => ({
    title: 'Mock Property Story',
    summary: 'This is a mock property story for testing.',
  }),
};

async function runTest() {
  try {
    console.log('Loading modules...');

    // Dynamically import TypeScript modules
    const storageModule = await import('./server/storage.ts');
    MemStorage = storageModule.MemStorage;

    const agentModule = await import('./server/services/agents/property-assessment-agent.ts');
    PropertyAssessmentAgent = agentModule.PropertyAssessmentAgent;

    const baseAgentModule = await import('./server/services/agents/base-agent.ts');
    BaseAgent = baseAgentModule.BaseAgent;

    const llmServiceModule = await import('./server/services/llm-service.ts');
    LLMService = llmServiceModule.LLMService;

    const marketFactorModule = await import('./server/services/market-factor-service.ts');
    MarketFactorService = marketFactorModule.marketFactorService;

    console.log('Modules loaded successfully');
    console.log('Setting up test environment...');

    // Create storage
    const storage = new MemStorage();

    // Create property data based on real Benton County property
    console.log('Creating Benton County property...');
    const bentonCountyProperty = {
      propertyId: 'BC-11390000000',
      address: '1320 N Louisiana St, Kennewick, WA 99336',
      parcelNumber: '1-1390-000-0000-000',
      propertyType: 'Residential',
      acres: 0.18,
      value: 427000,
      status: 'active',
      extraFields: {
        yearBuilt: 1974,
        squareFootage: 2365,
        bedrooms: 3,
        bathrooms: 2.5,
        lastSaleDate: '2021-08-15',
        lastSalePrice: 395000,
        assessedValue: 427000,
        zoning: 'R-1',
        taxCode: '2-113',
        dataSource: 'Benton County Assessor',
      },
    };

    // Save the Benton County property
    await storage.createProperty(bentonCountyProperty);
    console.log('Benton County property created with ID:', bentonCountyProperty.propertyId);

    // Assign property to MCP service for tool execution
    mockMCPService._testProperty = bentonCountyProperty;

    // Set up agent
    console.log('Setting up property assessment agent...');
    const agent = new PropertyAssessmentAgent(
      storage,
      mockMCPService,
      mockPropertyStoryGenerator,
      mockLLMService
    );

    // Initialize agent
    await agent.initialize();
    await agent.start();
    console.log('Agent initialized and started');

    // Test predictFutureValue capability directly
    console.log(
      `\nTesting Future Value Prediction for property ${bentonCountyProperty.propertyId}...`
    );

    try {
      // Execute the capability directly on the agent
      const result = await agent.executeCapability('predictFutureValue', {
        propertyId: bentonCountyProperty.propertyId,
        yearsAhead: 3,
      });

      console.log('\nFuture Value Prediction Results:');

      // Check if result has an inner result property (from the agent wrapper)
      const resultData = result.result || result;

      console.log('Property ID:', bentonCountyProperty.propertyId);
      console.log('Current Value:', resultData.currentValue);

      if (resultData.predictedValues && resultData.predictedValues.length > 0) {
        const lastPrediction = resultData.predictedValues[resultData.predictedValues.length - 1];
        console.log(`Value in ${lastPrediction.year}:`, lastPrediction.predictedValue);
        console.log('Growth from present:', lastPrediction.growthFromPresent + '%');
      }

      if (resultData.confidenceIntervals && resultData.confidenceIntervals.length > 0) {
        const lastInterval =
          resultData.confidenceIntervals[resultData.confidenceIntervals.length - 1];
        console.log(
          `Confidence Interval in ${lastInterval.year}:`,
          `${lastInterval.low} - ${lastInterval.high} (±${lastInterval.marginOfError}%)`
        );
      }

      // Display market factors
      if (resultData.marketFactors && resultData.marketFactors.length > 0) {
        console.log('\nKey Market Factors:');
        resultData.marketFactors.forEach(factor => {
          console.log(`- ${factor.name}: ${factor.impact} impact, ${factor.trend} trend`);
        });
      }

      // Display overall market outlook
      if (resultData.marketOutlook) {
        console.log(`\nMarket Outlook: ${resultData.marketOutlook}`);
        console.log(`Confidence Level: ${(resultData.overallConfidence * 100).toFixed(0)}%`);
      }

      // Save the result to a file for inspection
      fs.writeFileSync(
        path.join(__dirname, 'future-value-prediction-result.json'),
        JSON.stringify(result || { error: 'No result returned' }, null, 2)
      );
      console.log('\nResult saved to future-value-prediction-result.json');

      console.log('\n✅ Test completed successfully');
    } catch (error) {
      console.error('Error executing capability:', error);
    }
  } catch (error) {
    console.error('Test setup failed:', error);
  }
}

runTest();
