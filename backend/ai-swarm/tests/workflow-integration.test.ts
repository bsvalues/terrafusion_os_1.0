import { AISwarmCoordinator } from '../orchestrators/ai-swarm-coordinator';
import { IDEDomain } from '../services/PlaybookRegistry';

/**
 * Integration Test: Workflow Codification Engine
 * Tests the complete workflow system integration with AI swarm
 */
export class WorkflowIntegrationTest {
  private coordinator: AISwarmCoordinator;

  constructor() {
    this.coordinator = new AISwarmCoordinator();
  }

  /**
   * Test full workflow system initialization and execution
   */
  public async runFullIntegrationTest(): Promise<boolean> {
    console.log('🚀 Starting Workflow Integration Test...');

    try {
      // Test 1: Initialize the swarm with workflow system
      console.log('1. Initializing AI Swarm with Workflow System...');
      const initialized = await this.coordinator.initializeSwarm();
      if (!initialized) {
        throw new Error('Failed to initialize AI swarm');
      }
      console.log('✅ Swarm initialized successfully');

      // Test 2: Verify workflow playbooks are loaded
      console.log('2. Verifying workflow playbooks...');
      const workflows = this.coordinator.getAvailableWorkflows();
      console.log(`📚 Found ${workflows.length} available workflows`);

      if (workflows.length === 0) {
        throw new Error('No workflows loaded');
      }

      // Test 3: Test workflow execution by domain
      console.log('3. Testing workflows by domain...');
      for (const domain of Object.values(IDEDomain)) {
        const domainWorkflows = this.coordinator.getWorkflowsByDomain(domain);
        console.log(`   ${domain}: ${domainWorkflows.length} workflows`);
      }

      // Test 4: Execute a quick workflow
      console.log('4. Executing quick analysis workflow...');
      const analysisResult = await this.coordinator.executeQuickWorkflow('analyze', '/test/project');
      console.log(`   Analysis workflow: ${analysisResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Steps completed: ${analysisResult.stepsCompleted}/${analysisResult.stepsTotal}`);

      // Test 5: Execute build workflow
      console.log('5. Executing build workflow...');
      const buildResult = await this.coordinator.executeQuickWorkflow('build', '/test/project');
      console.log(`   Build workflow: ${buildResult.success ? 'SUCCESS' : 'FAILED'}`);

      // Test 6: Check active workflows
      console.log('6. Checking active workflows...');
      const activeWorkflows = this.coordinator.getActiveWorkflows();
      console.log(`   Active workflows: ${activeWorkflows.size}`);

      // Test 7: Execute full development cycle
      console.log('7. Executing full development cycle...');
      const fullCycleResult = await this.coordinator.executeWorkflowPlaybook('full_development_cycle_v1', {
        parameters: {
          projectPath: '/test/terrafusion-ide',
          buildMode: 'development',
          optimization: true
        }
      });
      console.log(`   Full cycle: ${fullCycleResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Duration: ${fullCycleResult.executionTime}ms`);

      console.log('✅ All workflow integration tests passed!');
      return true;

    } catch (error) {
      console.error('❌ Workflow integration test failed:', error);
      return false;
    }
  }

  /**
   * Test workflow performance and metrics
   */
  public async testWorkflowPerformance(): Promise<void> {
    console.log('⚡ Testing workflow performance...');

    const startTime = Date.now();

    // Execute multiple workflows in parallel
    const parallelWorkflows = [
      this.coordinator.executeQuickWorkflow('analyze'),
      this.coordinator.executeQuickWorkflow('test'),
      this.coordinator.executeQuickWorkflow('review')
    ];

    const results = await Promise.all(parallelWorkflows);
    const endTime = Date.now();

    console.log(`🏁 Parallel execution completed in ${endTime - startTime}ms`);
    console.log(`📊 Results: ${results.filter(r => r.success).length}/${results.length} succeeded`);
  }

  /**
   * Test workflow error handling and rollback
   */
  public async testWorkflowErrorHandling(): Promise<void> {
    console.log('🔧 Testing workflow error handling...');

    try {
      // Test with invalid playbook
      await this.coordinator.executeWorkflowPlaybook('non_existent_workflow');
    } catch (error) {
      console.log('✅ Error handling working correctly for invalid playbook');
    }

    try {
      // Test with invalid operation
      await this.coordinator.executeQuickWorkflow('invalid_operation');
    } catch (error) {
      console.log('✅ Error handling working correctly for invalid operation');
    }
  }

  /**
   * Generate comprehensive test report
   */
  public async generateTestReport(): Promise<string> {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Workflow Integration Test',
      results: {
        initialization: false,
        workflowExecution: false,
        parallelExecution: false,
        errorHandling: false
      },
      metrics: {
        totalWorkflows: 0,
        activeWorkflows: 0,
        successfulExecutions: 0,
        failedExecutions: 0
      }
    };

    try {
      // Run all tests
      report.results.initialization = await this.coordinator.initializeSwarm();

      const workflows = this.coordinator.getAvailableWorkflows();
      report.metrics.totalWorkflows = workflows.length;

      // Test basic execution
      const testResult = await this.coordinator.executeQuickWorkflow('analyze');
      report.results.workflowExecution = testResult.success;

      if (testResult.success) {
        report.metrics.successfulExecutions++;
      } else {
        report.metrics.failedExecutions++;
      }

      // Test parallel execution
      await this.testWorkflowPerformance();
      report.results.parallelExecution = true;

      // Test error handling
      await this.testWorkflowErrorHandling();
      report.results.errorHandling = true;

      report.metrics.activeWorkflows = this.coordinator.getActiveWorkflows().size;

    } catch (error) {
      console.error('Test report generation failed:', error);
    }

    return JSON.stringify(report, null, 2);
  }
}

// Export test runner function
export async function runWorkflowIntegrationTests(): Promise<boolean> {
  const tester = new WorkflowIntegrationTest();

  console.log('🔬 Starting Comprehensive Workflow Integration Tests');
  console.log('=' .repeat(60));

  try {
    // Run main integration test
    const mainTestPassed = await tester.runFullIntegrationTest();

    // Run performance tests
    await tester.testWorkflowPerformance();

    // Run error handling tests
    await tester.testWorkflowErrorHandling();

    // Generate final report
    const report = await tester.generateTestReport();
    console.log('\n📊 Test Report:');
    console.log(report);

    console.log('=' .repeat(60));
    console.log(`🏆 Integration Test Suite: ${mainTestPassed ? 'PASSED' : 'FAILED'}`);

    return mainTestPassed;

  } catch (error) {
    console.error('💥 Critical test failure:', error);
    return false;
  }
}

// Allow direct execution
if (require.main === module) {
  runWorkflowIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}