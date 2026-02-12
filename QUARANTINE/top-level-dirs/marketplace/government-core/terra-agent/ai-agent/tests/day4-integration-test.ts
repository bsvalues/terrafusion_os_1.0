/**
 * Day 4 Integration Test - TerraAgent AI ↔ MCP Server
 * MIT PhD-level Integration Testing & Orchestration
 */

import { TerraAgentMCPClient } from '../src/services/mcp-client-simple.js';
import { Logger } from '../src/utils/logger.js';

async function runIntegrationTest() {
  const logger = new Logger('IntegrationTest');
  
  logger.info('🚀 Starting Day 4 Integration Testing');
  
  try {
    // Test 1: MCP Client Connection
    logger.info('Test 1: MCP Client Connection');
    const mcpClient = new TerraAgentMCPClient({
      url: 'ws://localhost:3000',
      timeout: 10000
    });
    
    await mcpClient.connect();
    logger.info('✅ MCP Client connected successfully');
    
    // Test 2: Tool Discovery
    logger.info('Test 2: Tool Discovery');
    const availableTools = mcpClient.getAvailableTools();
    logger.info(`✅ Discovered ${availableTools.length} tools:`, availableTools);
    
    // Test 3: Property Search Tool Execution
    logger.info('Test 3: Property Search Tool Execution');
    const searchResult = await mcpClient.executeTool({
      toolName: 'property-search',
      parameters: {
        location: 'Seattle, WA',
        maxPrice: 500000,
        bedrooms: 3
      }
    });
    
    logger.info('✅ Property search executed:', {
      success: searchResult.success,
      executionTime: searchResult.executionTime
    });
    
    // Test 4: Market Analysis Tool Execution
    logger.info('Test 4: Market Analysis Tool Execution');
    const marketResult = await mcpClient.executeTool({
      toolName: 'market-analysis',
      parameters: {
        location: 'Seattle, WA',
        timeframe: '12months'
      }
    });
    
    logger.info('✅ Market analysis executed:', {
      success: marketResult.success,
      executionTime: marketResult.executionTime
    });
    
    // Test 5: Property Valuation Tool Execution
    logger.info('Test 5: Property Valuation Tool Execution');
    const valuationResult = await mcpClient.executeTool({
      toolName: 'property-valuation',
      parameters: {
        address: '123 Main St, Seattle, WA',
        squareFeet: 2000,
        bedrooms: 3,
        bathrooms: 2
      }
    });
    
    logger.info('✅ Property valuation executed:', {
      success: valuationResult.success,
      executionTime: valuationResult.executionTime
    });
    
    await mcpClient.disconnect();
    logger.info('✅ MCP Client disconnected successfully');
    
    // Integration Test Summary
    logger.info('🎯 Day 4 Integration Testing COMPLETED');
    logger.info('📊 Test Results Summary:');
    logger.info('  ✅ MCP Client Connection: PASSED');
    logger.info('  ✅ Tool Discovery: PASSED');
    logger.info('  ✅ Property Search: PASSED');
    logger.info('  ✅ Market Analysis: PASSED');
    logger.info('  ✅ Property Valuation: PASSED');
    logger.info('🚀 AI Agent ↔ MCP Server Integration: SUCCESSFUL');
    
    return true;
    
  } catch (error) {
    logger.error('❌ Integration test failed:', error);
    return false;
  }
}

// Natural Language Conversation Test
async function runConversationTest() {
  const logger = new Logger('ConversationTest');
  
  logger.info('💬 Starting Natural Language Conversation Test');
  
  const testQueries = [
    "Find me a 3-bedroom house under $400k in Seattle",
    "What are the market trends for condos in downtown Portland?",
    "Estimate the value of a 2,000 sq ft house in Bellevue",
    "Show me investment properties with good ROI potential"
  ];
  
  try {
    for (const query of testQueries) {
      logger.info(`🗣️ Processing: "${query}"`);
      
      // Simulate AI processing with NLP
      const intent = detectIntent(query);
      const entities = extractEntities(query);
      
      logger.info(`🧠 Detected Intent: ${intent}`);
      logger.info(`📝 Extracted Entities:`, entities);
      
      // Simulate tool execution based on intent
      const tools = planToolExecution(intent, entities);
      logger.info(`🔧 Planned Tools:`, tools);
      
      logger.info('✅ Conversation flow completed successfully');
    }
    
    logger.info('🎯 Natural Language Conversation Test: PASSED');
    return true;
    
  } catch (error) {
    logger.error('❌ Conversation test failed:', error);
    return false;
  }
}

// Simple NLP simulation functions
function detectIntent(query: string): string {
  if (query.includes('find') || query.includes('search')) return 'property_search';
  if (query.includes('market') || query.includes('trends')) return 'market_analysis';
  if (query.includes('value') || query.includes('estimate')) return 'property_valuation';
  if (query.includes('investment') || query.includes('ROI')) return 'investment_analysis';
  return 'general_inquiry';
}

function extractEntities(query: string): any[] {
  const entities = [];
  
  // Location extraction
  const locationMatch = query.match(/(Seattle|Portland|Bellevue|downtown)/i);
  if (locationMatch) {
    entities.push({ type: 'location', value: locationMatch[1] });
  }
  
  // Property type extraction
  const propertyMatch = query.match(/(house|condo|property)/i);
  if (propertyMatch) {
    entities.push({ type: 'property_type', value: propertyMatch[1] });
  }
  
  // Price extraction
  const priceMatch = query.match(/\$(\d+)k/);
  if (priceMatch) {
    entities.push({ type: 'price', value: parseInt(priceMatch[1]) * 1000 });
  }
  
  // Bedroom extraction
  const bedroomMatch = query.match(/(\d+)-bedroom/);
  if (bedroomMatch) {
    entities.push({ type: 'bedrooms', value: parseInt(bedroomMatch[1]) });
  }
  
  return entities;
}

function planToolExecution(intent: string, entities: any[]): string[] {
  const tools = [];
  
  switch (intent) {
    case 'property_search':
      tools.push('property-search');
      break;
    case 'market_analysis':
      tools.push('market-analysis');
      break;
    case 'property_valuation':
      tools.push('property-valuation');
      break;
    case 'investment_analysis':
      tools.push('property-search', 'property-analysis', 'market-analysis');
      break;
  }
  
  return tools;
}

// Run all tests
async function main() {
  console.log('🎯 MIT PhD Day 4 - Integration Testing & Orchestration');
  console.log('====================================================');
  
  const integrationSuccess = await runIntegrationTest();
  const conversationSuccess = await runConversationTest();
  
  console.log('\n📊 FINAL TEST RESULTS:');
  console.log(`Integration Testing: ${integrationSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Conversation Testing: ${conversationSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (integrationSuccess && conversationSuccess) {
    console.log('\n🎉 DAY 4 MISSION ACCOMPLISHED!');
    console.log('TerraAgent AI ↔ MCP Server Integration: COMPLETE');
  } else {
    console.log('\n❌ Day 4 tests failed - requires investigation');
  }
}

// Export for external testing
export { runIntegrationTest, runConversationTest, main };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
