import React, { useEffect, useState } from 'react';
import { getViteEnv } from '@/shared/viteEnv';

interface APITestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  responseTime?: number;
}

export const APIConnectionTest: React.FC = () => {
  const [results, setResults] = useState<APITestResult[]>([]);

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const testEndpoint = async (endpoint: string, name: string): Promise<APITestResult> => {
    const startTime = performance.now();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const endTime = performance.now();

      if (response.ok) {
        const data = await response.json();
        return {
          endpoint: name,
          status: 'success',
          data,
          responseTime: Math.round(endTime - startTime),
        };
      } else {
        return {
          endpoint: name,
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime: Math.round(endTime - startTime),
        };
      }
    } catch (error: any) {
      const endTime = performance.now();
      return {
        endpoint: name,
        status: 'error',
        error: error.message || 'Network error',
        responseTime: Math.round(endTime - startTime),
      };
    }
  };

  const testAllEndpoints = async () => {
    const apiBase = getViteEnv().VITE_API_URL || '/api';
    const endpoints = [
      { url: `${apiBase}/health`, name: 'Backend Health' },
      { url: `${apiBase}/ai/consciousness`, name: 'AI Consciousness' },
      { url: `${apiBase}/government/excellence`, name: 'Government Excellence' },
    ];

    setResults(endpoints.map((ep) => ({ endpoint: ep.name, status: 'loading' })));

    const testResults = await Promise.all(endpoints.map((ep) => testEndpoint(ep.url, ep.name)));

    setResults(testResults);
  };

  return (
    <div className='bg-terra-midnight/90 p-6 rounded-xl border border-terra-cyan/30 m-4'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-terra-cyan'>🔧 TerraFusion API Connection Test</h2>
        <button
          onClick={testAllEndpoints}
          className='px-4 py-2 bg-terra-cyan/20 border border-terra-cyan/50 rounded-lg text-terra-cyan hover:bg-terra-cyan/30 transition-colors'
        >
          🔄 Refresh Tests
        </button>
      </div>

      <div className='space-y-4'>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              result.status === 'success'
                ? 'bg-green-500/10 border-green-500/30'
                : result.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-lg font-semibold text-white'>
                {result.status === 'success' && '✅'}
                {result.status === 'error' && '❌'}
                {result.status === 'loading' && '⏳'} {result.endpoint}
              </h3>
              {result.responseTime && (
                <span className='text-sm text-terra-cyan'>{result.responseTime}ms</span>
              )}
            </div>

            {result.status === 'success' && result.data && (
              <div className='mt-3 p-3 bg-white/5 rounded border border-terra-cyan/20'>
                <h4 className='text-sm font-semibold text-terra-cyan mb-2'>Response Data:</h4>
                <pre className='text-xs text-green-300 overflow-x-auto'>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.status === 'error' && (
              <div className='text-sm text-red-300'>Error: {result.error}</div>
            )}

            {result.status === 'loading' && (
              <div className='text-sm text-yellow-300'>Testing connection...</div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && results.every((r) => r.status === 'success') && (
        <div className='mt-6 p-4 bg-gradient-to-r from-terra-cyan/10 to-green-500/10 border border-terra-cyan/30 rounded-lg'>
          <h3 className='text-lg font-bold text-terra-cyan mb-2'>🎉 ALL SYSTEMS OPERATIONAL</h3>
          <p className='text-terra-cyan/80'>
            Frontend successfully connected to all TerraFusion backend services! Your AI models and
            government services are now functional.
          </p>
        </div>
      )}
    </div>
  );
};

export default APIConnectionTest;
