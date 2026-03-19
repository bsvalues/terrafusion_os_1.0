import React from 'react';
import { Warning, Refresh, Settings, ArrowLeft } from '@mui/icons-material';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

import { ErrorBoundary } from './ErrorBoundary';

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
  moduleName?: string;
  moduleId?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  fallbackComponent?: React.ComponentType<any>;
}

/**
 * Specialized Error Boundary for Terrafusion Modules
 * Provides module-specific error handling and recovery options
 */
export const ModuleErrorBoundary: React.FC<ModuleErrorBoundaryProps> = ({
  children,
  moduleName = 'Unknown Module',
  moduleId,
  onRetry,
  onGoBack,
  fallbackComponent: FallbackComponent,
}) => {
  const handleModuleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log module-specific error
    console.error(`📍 Module Error in ${moduleName}:`, error);
    console.error('🔍 Error Info:', errorInfo);

    // Send module error to monitoring
    fetch('/api/errors/module', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleName,
        moduleId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
    });
  };

  const ModuleFallback = () => {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <div className='p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200'>
        <Card className='w-full max-w-md mx-auto'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-3 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
              <Warning className='w-6 h-6 text-red-600' />
            </div>
            <CardTitle className='text-xl font-bold text-red-900'>Module Error</CardTitle>
            <CardDescription className='text-red-700'>
              {moduleName} encountered an unexpected error
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <Alert className='border-red-200 bg-red-50'>
              <Warning className='h-4 w-4 text-red-600' />

              <AlertTitle className='text-red-800'>What happened?</AlertTitle>
              <AlertDescription className='text-red-700'>
                The {moduleName} module stopped working due to an unexpected error. This might be
                due to corrupted data, network issues, or a temporary system problem.
              </AlertDescription>
            </Alert>

            <div className='flex flex-col sm:flex-row gap-2'>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className='flex-1 flex items-center justify-center gap-2'
                  variant='default'
                >
                  <Refresh className='w-4 h-4' />
                  Retry Module
                </Button>
              )}

              {onGoBack && (
                <Button
                  onClick={onGoBack}
                  className='flex-1 flex items-center justify-center gap-2'
                  variant='outline'
                >
                  <ArrowLeft className='w-4 h-4' />
                  Go Back
                </Button>
              )}

              <Button
                onClick={() => window.location.reload()}
                className='flex-1 flex items-center justify-center gap-2'
                variant='outline'
              >
                <Refresh className='w-4 h-4' />
                Reload
              </Button>
            </div>

            <div className='text-center'>
              <Button
                onClick={() => (window.location.href = '/settings')}
                variant='ghost'
                size='sm'
                className='text-red-600 hover:text-red-800'
              >
                <Settings className='w-4 h-4 mr-1' />
                Module Settings
              </Button>
            </div>

            {moduleId && (
              <div className='text-center text-xs text-red-500'>Module ID: {moduleId}</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallback={<ModuleFallback />}
      onError={handleModuleError}
      resetKeys={[moduleId || 'unknown', moduleName]}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Error Boundary specifically for Property Assessment Module
 */
export const PropertyAssessmentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ModuleErrorBoundary
      moduleName='Property Assessment'
      moduleId='property-assessment'
      onRetry={() => {
        // Clear property cache and retry
        localStorage.removeItem('propertyCache');
        window.location.reload();
      }}
      onGoBack={() => {
        window.location.href = '/dashboard';
      }}
    >
      {children}
    </ModuleErrorBoundary>
  );
};

/**
 * Error Boundary for AI Processing Modules
 */
export const AIProcessingErrorBoundary: React.FC<{
  children: React.ReactNode;
  processingType?: string;
}> = ({ children, processingType = 'AI Processing' }) => {
  const AIFallback = () => (
    <div className='p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-3 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
            <Warning className='w-6 h-6 text-blue-600' />
          </div>
          <CardTitle className='text-xl font-bold text-blue-900'>AI Processing Error</CardTitle>
          <CardDescription className='text-blue-700'>
            {processingType} is temporarily unavailable
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <Alert className='border-blue-200 bg-blue-50'>
            <Warning className='h-4 w-4 text-blue-600' />

            <AlertTitle className='text-blue-800'>AI Service Issue</AlertTitle>
            <AlertDescription className='text-blue-700'>
              The AI processing service is experiencing issues. This could be due to:
              <ul className='mt-2 list-disc list-inside text-sm'>
                <li>High processing load</li>
                <li>Model initialization</li>
                <li>Network connectivity</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className='flex flex-col gap-2'>
            <Button
              onClick={() => window.location.reload()}
              className='flex items-center justify-center gap-2'
            >
              <Refresh className='w-4 h-4' />
              Retry AI Processing
            </Button>

            <Button
              onClick={() => (window.location.href = '/dashboard')}
              variant='outline'
              className='flex items-center justify-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={<AIFallback />}
      onError={(error, errorInfo) => {
        console.error(`🤖 AI Processing Error in ${processingType}:`, error);
        // Send to AI monitoring service
        fetch('/api/errors/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            processingType,
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ModuleErrorBoundary;
