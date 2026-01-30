/**
 * PlaygroundTester Component
 * Championship-level frontend testing for Phase 4 Playground endpoints
 * Government. Transcended.
 */

import React, { useState } from 'react';
import {
  getPlaygroundHealth,
  getPlaygroundRun,
  listPlaygroundRuns,
  listPlaygroundScenarios,
  startPlaygroundScenario,
  type PlaygroundHealth,
  type PlaygroundRun,
  type PlaygroundScenario,
} from '../../services/PlaygroundEnvironmentService';

type TestResult = {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: unknown;
  duration?: number;
};

export const PlaygroundTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Health Check', status: 'pending' },
    { name: 'List Scenarios', status: 'pending' },
    { name: 'Start Scenario', status: 'pending' },
    { name: 'Get Run Status', status: 'pending' },
    { name: 'List All Runs', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdRunId, setCreatedRunId] = useState<string>('');

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults((prev) =>
      prev.map((result, i) => (i === index ? { ...result, ...updates } : result))
    );
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let currentRunId = '';

    // Test 1: Health Check
    try {
      updateTestResult(0, { status: 'running' });
      const start = Date.now();
      const health: PlaygroundHealth = await getPlaygroundHealth();
      const duration = Date.now() - start;
      updateTestResult(0, {
        status: 'success',
        message: `✅ Status: ${health.status} (${duration}ms)`,
        data: health,
        duration,
      });
    } catch (error) {
      updateTestResult(0, {
        status: 'error',
        message: `❌ ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 2: List Scenarios
    try {
      updateTestResult(1, { status: 'running' });
      const start = Date.now();
      const scenarios: PlaygroundScenario[] = await listPlaygroundScenarios();
      const duration = Date.now() - start;
      updateTestResult(1, {
        status: 'success',
        message: `✅ Found ${scenarios.length} scenario(s) (${duration}ms)`,
        data: scenarios,
        duration,
      });
    } catch (error) {
      updateTestResult(1, {
        status: 'error',
        message: `❌ ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 3: Start Scenario
    try {
      updateTestResult(2, { status: 'running' });
      const start = Date.now();
      const result = await startPlaygroundScenario('hello-world', {
        testParam: 'championship-test',
      });
      const duration = Date.now() - start;
      currentRunId = result.runId;
      setCreatedRunId(currentRunId);
      updateTestResult(2, {
        status: 'success',
        message: `✅ Started scenario: ${result.scenarioId}, Run ID: ${result.runId} (${duration}ms)`,
        data: result,
        duration,
      });
    } catch (error) {
      updateTestResult(2, {
        status: 'error',
        message: `❌ ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 4: Get Run Status
    if (currentRunId) {
      try {
        updateTestResult(3, { status: 'running' });
        const start = Date.now();
        const run: PlaygroundRun = await getPlaygroundRun(currentRunId);
        const duration = Date.now() - start;
        updateTestResult(3, {
          status: 'success',
          message: `✅ Run status: ${run.status}, Scenario: ${run.scenarioId} (${duration}ms)`,
          data: run,
          duration,
        });
      } catch (error) {
        updateTestResult(3, {
          status: 'error',
          message: `❌ ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    } else {
      updateTestResult(3, {
        status: 'error',
        message: '❌ No run ID available from previous test',
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 5: List All Runs
    try {
      updateTestResult(4, { status: 'running' });
      const start = Date.now();
      const runs: PlaygroundRun[] = await listPlaygroundRuns();
      const duration = Date.now() - start;
      updateTestResult(4, {
        status: 'success',
        message: `✅ Found ${runs.length} run(s) (${duration}ms)`,
        data: runs,
        duration,
      });
    } catch (error) {
      updateTestResult(4, {
        status: 'error',
        message: `❌ ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    setIsRunning(false);
  };

  const passedTests = testResults.filter((r) => r.status === 'success').length;
  const totalTests = testResults.length;
  const allPassed = passedTests === totalTests && !isRunning;

  return (
    <div className='terra-glass p-8 rounded-lg border border-[var(--tf-transcend-highlight)]/20 max-w-4xl mx-auto'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold mb-2 terra-gradient-quantum bg-clip-text text-transparent'>
          🧪 Playground Frontend Testing
        </h1>
        <p className='text-gray-400'>Government. Transcended.</p>
      </div>

      {/* Test Controls */}
      <div className='mb-6 flex justify-center'>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className={`px-8 py-3 rounded-full font-semibold uppercase transition-all duration-300 ${
            isRunning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'terra-gradient-quantum text-white hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:-translate-y-1'
          }`}
        >
          {isRunning ? '⏳ Running Tests...' : '🚀 Run All Tests'}
        </button>
      </div>

      {/* Test Results */}
      <div className='space-y-4 mb-6'>
        {testResults.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border transition-all duration-300 ${
              test.status === 'success'
                ? 'border-[var(--tf-accent-success)] bg-[var(--tf-accent-success)]/10'
                : test.status === 'error'
                  ? 'border-red-500 bg-red-500/10'
                  : test.status === 'running'
                    ? 'border-[var(--tf-transcend-highlight)] bg-[var(--tf-transcend-highlight)]/10 quantum-pulse'
                    : 'border-gray-700 bg-gray-900/50'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <span className='font-semibold text-white'>
                Test {index + 1}: {test.name}
              </span>
              <span className='text-sm'>
                {test.status === 'success' && '✅'}
                {test.status === 'error' && '❌'}
                {test.status === 'running' && '⏳'}
                {test.status === 'pending' && '⏸️'}
              </span>
            </div>
            {test.message && <div className='text-sm text-gray-300 font-mono'>{test.message}</div>}
            {test.data && (
              <details className='mt-2'>
                <summary className='cursor-pointer text-xs text-[var(--tf-transcend-highlight)] hover:text-[var(--tf-accent-success)]'>
                  View Response Data
                </summary>
                <pre className='mt-2 p-3 bg-black/50 rounded text-xs overflow-auto max-h-40'>
                  {JSON.stringify(test.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className='text-center p-6 terra-glass rounded-lg border border-[var(--tf-transcend-highlight)]/30'>
        <div className='text-2xl font-bold mb-2'>
          {allPassed ? (
            <span className='terra-gradient-quantum bg-clip-text text-transparent'>
              🏆 Championship Success!
            </span>
          ) : (
            <span className='text-white'>Test Results</span>
          )}
        </div>
        <div className='text-lg text-gray-300'>
          {passedTests}/{totalTests} Tests Passed
        </div>
        {allPassed && (
          <div className='mt-4 text-sm text-[var(--tf-transcend-highlight)]'>
            All Playground endpoints operational! 🚀
          </div>
        )}
        {createdRunId && (
          <div className='mt-4 text-xs text-gray-400'>
            Created Run ID: <code className='text-[var(--tf-accent-success)]'>{createdRunId}</code>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {testResults.some((r) => r.duration) && (
        <div className='mt-6 p-4 terra-glass rounded-lg border border-[var(--tf-transcend-highlight)]/20'>
          <h3 className='text-sm font-semibold text-[var(--tf-transcend-highlight)] mb-2'>⚡ Performance Metrics</h3>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            {testResults
              .filter((r) => r.duration)
              .map((test, index) => (
                <div key={index} className='flex justify-between text-gray-300'>
                  <span>{test.name}:</span>
                  <span className='font-mono text-[var(--tf-accent-success)]'>{test.duration}ms</span>
                </div>
              ))}
            {testResults.filter((r) => r.duration).length > 0 && (
              <div className='col-span-2 flex justify-between font-semibold text-white border-t border-gray-700 pt-2 mt-2'>
                <span>Average:</span>
                <span className='font-mono text-[var(--tf-transcend-highlight)]'>
                  {Math.round(
                    testResults
                      .filter((r) => r.duration)
                      .reduce((sum, r) => sum + (r.duration || 0), 0) /
                      testResults.filter((r) => r.duration).length
                  )}
                  ms
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaygroundTester;
