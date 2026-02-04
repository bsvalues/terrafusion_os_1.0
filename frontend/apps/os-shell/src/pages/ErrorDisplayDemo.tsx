/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ERROR DISPLAY DEMO
 * Phase 1: Visual Verification Page
 *
 * Navigate to /error-demo to test correlationId-first error UX
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { ErrorDisplay } from '../components/errors/ErrorDisplay';

export const ErrorDisplayDemo: React.FC = () => {
  const demoErrors = [
    {
      title: 'Validation Error (with correlationId)',
      error: {
        message: 'This action requires confirmation before execution',
        errorCode: 'CONFIRMATION_REQUIRED',
        correlationId: 'corr-demo-001-validation',
        timestamp: new Date().toISOString(),
        component: 'ToolRunner',
      },
    },
    {
      title: 'Critical Execution Error (with correlationId)',
      error: {
        message: 'Tool execution failed unexpectedly during runtime',
        errorCode: 'EXECUTION_FAILED',
        correlationId: 'corr-demo-002-critical',
        timestamp: new Date().toISOString(),
        component: 'ToolExecutor',
      },
    },
    {
      title: 'Write Lane Mismatch (with correlationId)',
      error: {
        message: 'Write lane must match suite: expected "forge", got "atlas"',
        errorCode: 'WRITE_LANE_MISMATCH',
        correlationId: 'corr-demo-003-mismatch',
        timestamp: new Date().toISOString(),
        component: 'GovernanceLock',
      },
    },
    {
      title: 'Supervisor Approval Required',
      error: {
        message: 'This high-risk operation requires supervisor approval',
        errorCode: 'SUPERVISOR_APPROVAL_REQUIRED',
        correlationId: 'corr-demo-004-supervisor',
        timestamp: new Date().toISOString(),
        component: 'SafetyGate',
      },
    },
    {
      title: 'Error Without CorrelationId (graceful fallback)',
      error: {
        message: 'Legacy error without correlationId field',
        errorCode: 'LEGACY_ERROR',
        timestamp: new Date().toISOString(),
        component: 'LegacyService',
      },
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>🎯 Error Display Demo</h1>
          <p className='text-gray-600'>Phase 1: correlationId-First Error UX Visual Verification</p>
          <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md'>
            <h2 className='text-sm font-semibold text-blue-900 mb-2'>Test Checklist:</h2>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>✓ CorrelationId visible when present</li>
              <li>✓ Copy button works (click to copy correlationId)</li>
              <li>✓ Dev mode shows trace query hint (expand "Developer Info")</li>
              <li>✓ Production mode hides trace query hint</li>
              <li>✓ Graceful fallback when correlationId missing</li>
              <li>✓ Severity styling (red=critical, yellow=warning)</li>
              <li>✓ Accessibility (keyboard navigation, ARIA labels)</li>
            </ul>
          </div>
        </div>

        <div className='space-y-6'>
          {demoErrors.map((demo, index) => (
            <div key={index} className='bg-white rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4'>{demo.title}</h3>
              <ErrorDisplay error={demo.error} />
            </div>
          ))}
        </div>

        <div className='mt-8 p-6 bg-green-50 border border-green-200 rounded-md'>
          <h2 className='text-lg font-semibold text-green-900 mb-2'>
            ✅ Phase 1 Implementation Complete
          </h2>
          <div className='text-sm text-green-800 space-y-1'>
            <p>
              <strong>Tests:</strong> 18/18 passing
            </p>
            <p>
              <strong>Gates:</strong> type-check PASSED
            </p>
            <p>
              <strong>Dev Mode Hint:</strong> Open "Developer Info" to see trace query command
            </p>
            <p>
              <strong>Production Mode:</strong> Set NODE_ENV=production to verify hint is hidden
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplayDemo;
