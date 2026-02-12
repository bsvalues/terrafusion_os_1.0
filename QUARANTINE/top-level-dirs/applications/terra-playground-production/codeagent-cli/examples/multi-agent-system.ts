/**
 * multi-agent-system.ts
 *
 * Example usage of the multi-agent architecture with adaptive learning
 */

import {
  AgentSystem,
  AgentSystemConfig,
  LogLevel,
  DatabaseTaskType,
  GisTaskType,
  DevelopmentTaskType,
  DebuggingTaskType,
  LocalDeploymentTaskType,
  VersionControlTaskType,
  WebDeploymentTaskType,
  // Adaptive learning components
  AdaptiveDatabaseAgent,
  AdaptiveGisAgent,
  LearningService,
  LearningRepository,
} from '../src/agents';

async function main() {
  console.log('=== Multi-Agent System Example with Adaptive Learning ===');

  // Initialize the learning service
  console.log('\n[1] Initializing Learning Components');

  const learningService = LearningService.getInstance();
  console.log('Learning Service initialized');

  // Configure AI providers if API keys are available
  if (process.env.ANTHROPIC_API_KEY) {
    learningService.configureProvider({
      provider: 'anthropic',
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      model: 'claude-3-7-sonnet-20250219',
    });
    console.log('Anthropic provider configured');
  } else {
    console.log('Anthropic API key not available');
  }

  if (process.env.PERPLEXITY_API_KEY) {
    learningService.configureProvider({
      provider: 'perplexity',
      model: 'llama-3.1-sonar-small-128k-online',
    });
    console.log('Perplexity provider configured');
  } else {
    console.log('Perplexity API key not available');
  }

  const learningRepository = LearningRepository.getInstance();
  console.log('Learning Repository initialized');

  // Create standard agent system
  console.log('\n[2] Initializing Standard Agent System');

  // Create agent system with configuration
  const config: AgentSystemConfig = {
    logLevel: LogLevel.DEBUG,
    autoInitialize: true,
    agents: {
      database: true,
      gis: true,
      development: true,
      debugging: true,
      localDeployment: true,
      versionControl: true,
      webDeployment: true,
    },
  };

  const agentSystem = new AgentSystem(config);

  // Initialize the system (happens automatically with autoInitialize, but can be called explicitly)
  await agentSystem.initialize();

  // List all agents
  const allAgents = agentSystem.getAllAgents();
  console.log(`\nAll Agents (${allAgents.length}):`);
  allAgents.forEach(agent => {
    console.log(
      `- ${agent.name} (ID: ${agent.id}) - Status: ${agent.status}, Priority: ${agent.priority}`
    );
    console.log(`  Capabilities: ${agent.capabilities.join(', ')}`);
  });

  // Initialize adaptive agents
  console.log('\n[3] Initializing Adaptive Agents');

  // Create and initialize adaptive database agent
  const adaptiveDbAgent = new AdaptiveDatabaseAgent();
  await adaptiveDbAgent.initialize();
  console.log(`Adaptive Database Agent initialized (ID: ${adaptiveDbAgent.id})`);

  // Create and initialize adaptive GIS agent
  const adaptiveGisAgent = new AdaptiveGisAgent();
  await adaptiveGisAgent.initialize();
  console.log(`Adaptive GIS Agent initialized (ID: ${adaptiveGisAgent.id})`);

  // Example: Standard vs Adaptive Database Query Analysis
  console.log('\n[4] Comparing Standard vs Adaptive Query Analysis');

  const queryToAnalyze =
    'SELECT * FROM users JOIN orders ON users.id = orders.user_id WHERE users.country = "US" ORDER BY orders.total DESC';

  console.log('\n=== Standard Database Query Analysis ===');
  try {
    const standardResult = await agentSystem.submitTask({
      id: `task-${Date.now()}-1a`,
      type: DatabaseTaskType.ANALYZE_QUERY,
      priority: 'high',
      payload: {
        query: queryToAnalyze,
        options: { detailed: true },
      },
    });

    console.log('Standard Query Analysis Result:');
    console.log(`Original Query: ${standardResult.originalQuery}`);
    if (standardResult.potentialIssues && standardResult.potentialIssues.length > 0) {
      console.log('Potential Issues:');
      standardResult.potentialIssues.forEach((issue: string) => console.log(`- ${issue}`));
    }
    if (standardResult.recommendations && standardResult.recommendations.length > 0) {
      console.log('Recommendations:');
      standardResult.recommendations.forEach((rec: string) => console.log(`- ${rec}`));
    }
  } catch (error) {
    console.error(
      `Standard database task error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  console.log('\n=== Adaptive Database Query Analysis ===');
  try {
    const adaptiveResult = await adaptiveDbAgent.executeTask({
      id: `task-${Date.now()}-1b`,
      type: DatabaseTaskType.ANALYZE_QUERY,
      priority: 'high',
      payload: {
        query: queryToAnalyze,
        options: { detailed: true },
      },
    });

    console.log('Adaptive Query Analysis Result:');
    console.log(`Original Query: ${adaptiveResult.originalQuery}`);
    if (adaptiveResult.potentialIssues && adaptiveResult.potentialIssues.length > 0) {
      console.log('Potential Issues:');
      adaptiveResult.potentialIssues.forEach((issue: string) => console.log(`- ${issue}`));
    }
    if (adaptiveResult.recommendations && adaptiveResult.recommendations.length > 0) {
      console.log('Recommendations:');
      adaptiveResult.recommendations.forEach((rec: string) => console.log(`- ${rec}`));
    }
    if (adaptiveResult.optimizedQuery) {
      console.log(`Optimized Query: ${adaptiveResult.optimizedQuery}`);
    }
    if (adaptiveResult.learningEnhanced) {
      console.log('This result was enhanced with adaptive learning');
    }
  } catch (error) {
    console.error(
      `Adaptive database task error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Example: Standard vs Adaptive GIS Spatial Query
  console.log('\n[5] Comparing Standard vs Adaptive Spatial Query');

  const spatialQuery =
    'SELECT * FROM properties WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), 5000)';
  const spatialBounds = {
    minLat: 37.7,
    minLng: -122.5,
    maxLat: 37.8,
    maxLng: -122.3,
  };

  console.log('\n=== Standard GIS Spatial Query ===');
  try {
    const standardResult = await agentSystem.submitTask({
      id: `task-${Date.now()}-2a`,
      type: GisTaskType.PERFORM_SPATIAL_QUERY,
      priority: 'normal',
      payload: {
        query: spatialQuery,
        bounds: spatialBounds,
      },
    });

    console.log('Standard Spatial Query Result:');
    console.log(`Found ${standardResult.count} features`);
    console.log(`First feature: ${JSON.stringify(standardResult.features[0])}`);
  } catch (error) {
    console.error(
      `Standard GIS task error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  console.log('\n=== Adaptive GIS Spatial Query ===');
  try {
    const adaptiveResult = await adaptiveGisAgent.executeTask({
      id: `task-${Date.now()}-2b`,
      type: GisTaskType.PERFORM_SPATIAL_QUERY,
      priority: 'normal',
      payload: {
        query: spatialQuery,
        bounds: spatialBounds,
      },
    });

    console.log('Adaptive Spatial Query Result:');
    console.log(`Found ${adaptiveResult.count} features`);
    console.log(`First feature: ${JSON.stringify(adaptiveResult.features[0])}`);
    if (adaptiveResult.metadata?.enhancedQuery) {
      console.log(`Enhanced Query: ${adaptiveResult.metadata.enhancedQuery}`);
    }
    if (adaptiveResult.metadata?.learningEnhanced) {
      console.log('This result was enhanced with adaptive learning');
    }
  } catch (error) {
    console.error(
      `Adaptive GIS task error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Provide feedback on learning
  console.log('\n[6] Providing Feedback on Learning');

  // Query the learning repository for recent records
  const recentLearningRecords = learningRepository.queryRecords({
    limit: 2,
    sortBy: 'timestamp',
    sortDirection: 'desc',
  });

  if (recentLearningRecords.length > 0) {
    console.log(`Found ${recentLearningRecords.length} recent learning records`);

    // Provide positive feedback on the first record
    if (recentLearningRecords[0]) {
      const recordId = recentLearningRecords[0].id;
      learningRepository.provideFeedback(recordId, 'positive');
      console.log(`Provided positive feedback for learning record: ${recordId}`);
    }

    // Provide neutral feedback on the second record (if available)
    if (recentLearningRecords[1]) {
      const recordId = recentLearningRecords[1].id;
      learningRepository.provideFeedback(recordId, 'neutral');
      console.log(`Provided neutral feedback for learning record: ${recordId}`);
    }
  } else {
    console.log('No learning records found');
  }

  // Get and display learning summary
  const learningSummary = learningRepository.getSummary();
  console.log('\nLearning Summary:');
  console.log(`Total Records: ${learningSummary.totalRecords}`);
  console.log(
    `By Feedback: Positive: ${learningSummary.byFeedback.positive}, Negative: ${learningSummary.byFeedback.negative}, Neutral: ${learningSummary.byFeedback.neutral}, Unrated: ${learningSummary.byFeedback.unrated}`
  );
  console.log(
    `Recent Activity: Last Day: ${learningSummary.recentActivity.lastDay}, Last Week: ${learningSummary.recentActivity.lastWeek}, Last Month: ${learningSummary.recentActivity.lastMonth}`
  );

  // Shutdown agents
  console.log('\n[7] Shutting down Agents');

  // Shutdown adaptive agents
  await adaptiveDbAgent.shutdown();
  await adaptiveGisAgent.shutdown();
  console.log('Adaptive agents shut down');

  // Shutdown the agent system
  await agentSystem.shutdown();
  console.log('Agent system shut down');

  console.log('\nExample completed successfully');
}

// Execute the example
main().catch(err => {
  console.error('Example error:', err);
  process.exit(1);
});
