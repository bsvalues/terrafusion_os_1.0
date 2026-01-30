/**
 * TerraFusion Elite API Test Dashboard
 * Comprehensive testing interface for the Elite API Service
 * Validates offline-first capabilities and government data generation
 */
import React from 'react';
import { terraFusionAPI } from '../../services/TerraFusionEliteAPI';

export const EliteAPITestDashboard: React.FC = () => {
  const [testResults, setTestResults] = React.useState<any[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);

  const runAPITests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Health Check',
        endpoint: '/api/health',
        test: () => terraFusionAPI.getSystemHealth(),
      },
      {
        name: 'Government Metrics',
        endpoint: '/api/government/metrics',
        test: () => terraFusionAPI.getGovernmentMetrics(),
      },
      {
        name: 'Property Assessment',
        endpoint: '/api/government/property-assessment',
        test: () => terraFusionAPI.getPropertyAssessmentData(),
      },
      {
        name: 'Citizen Services',
        endpoint: '/api/government/citizen-services',
        test: () => terraFusionAPI.getCitizenServicesData(),
      },
      {
        name: 'Budget Analysis',
        endpoint: '/api/government/budget-analysis',
        test: () => terraFusionAPI.getBudgetAnalysisData(),
      },
      {
        name: 'Security Status',
        endpoint: '/api/security',
        test: () => terraFusionAPI.makeEliteAPICall('/api/security'),
      },
    ];

    const results = [];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await test.test();
        const endTime = Date.now();

        results.push({
          name: test.name,
          endpoint: test.endpoint,
          success: response.success,
          responseTime: endTime - startTime,
          source: response.source,
          hasData: !!response.data,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (error) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      // Add small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'BACKEND':
        return '🌐';
      case 'ELITE_CACHE':
        return '⚡';
      case 'QUANTUM_SIMULATION':
        return '🚀';
      default:
        return '❓';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'BACKEND':
        return 'text-green-400';
      case 'ELITE_CACHE':
        return 'text-yellow-400';
      case 'QUANTUM_SIMULATION':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className='bg-gradient-to-br from-slate-900/90 to-blue-900/40 backdrop-blur-lg
                    border border-cyan-500/30 rounded-xl p-6 shadow-xl max-w-4xl mx-auto'
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <div className='text-3xl'>🧪</div>
          <div>
            <h2 className='text-xl font-bold text-cyan-400'>Elite API Test Dashboard</h2>
            <p className='text-slate-400 text-sm'>
              TerraFusion Offline-First API Service Validation
            </p>
          </div>
        </div>

        <button
          onClick={runAPITests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${
            isRunning
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isRunning ? (
            <span className='flex items-center space-x-2'>
              <span className='animate-spin'>⚙️</span>
              <span>TESTING...</span>
            </span>
          ) : (
            'RUN ELITE TESTS'
          )}
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-lg font-bold text-cyan-300 mb-4'>📊 Test Results</h3>

          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <span className='text-xl'>{result.success ? '✅' : '❌'}</span>
                  <div>
                    <div className='font-semibold text-white'>{result.name}</div>
                    <div className='text-sm text-slate-400'>{result.endpoint}</div>
                  </div>
                </div>

                <div className='text-right'>
                  {result.success ? (
                    <div className='space-y-1'>
                      <div className='flex items-center space-x-2'>
                        <span className={getSourceColor(result.source)}>
                          {getSourceIcon(result.source)} {result.source}
                        </span>
                      </div>
                      <div className='text-xs text-slate-400'>
                        {result.responseTime}ms • {result.timestamp}
                      </div>
                      {result.hasData && (
                        <div className='text-xs text-green-400'>✓ Data Available</div>
                      )}
                    </div>
                  ) : (
                    <div className='text-red-400 text-sm'>{result.error || 'Test Failed'}</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className='mt-6 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/20'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
              <div>
                <div className='text-2xl font-bold text-green-400'>
                  {testResults.filter((r) => r.success).length}
                </div>
                <div className='text-sm text-slate-400'>Passed</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-red-400'>
                  {testResults.filter((r) => !r.success).length}
                </div>
                <div className='text-sm text-slate-400'>Failed</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-cyan-400'>
                  {testResults.filter((r) => r.source === 'QUANTUM_SIMULATION').length}
                </div>
                <div className='text-sm text-slate-400'>Quantum Sim</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-yellow-400'>
                  {Math.round(
                    testResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) /
                      testResults.length
                  )}
                  ms
                </div>
                <div className='text-sm text-slate-400'>Avg Response</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {testResults.length === 0 && !isRunning && (
        <div className='text-center py-8'>
          <div className='text-6xl mb-4'>🚀</div>
          <h3 className='text-xl font-bold text-cyan-400 mb-2'>Ready for Elite Testing</h3>
          <p className='text-slate-400 mb-4'>
            Click "RUN ELITE TESTS" to validate the TerraFusion API service offline-first
            capabilities.
          </p>
          <div className='text-sm text-slate-500'>
            Tests will verify quantum simulation, cache functionality, and government data
            generation.
          </div>
        </div>
      )}
    </div>
  );
};
