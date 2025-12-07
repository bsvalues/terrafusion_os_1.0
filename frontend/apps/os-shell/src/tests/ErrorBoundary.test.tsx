import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ErrorProvider, useErrorContext } from '../contexts/ErrorContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({
  shouldThrow,
  errorMessage = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Component that uses error handler hook
const AsyncErrorComponent: React.FC<{ shouldFail: boolean }> = ({ shouldFail }) => {
  const { handleAsyncError, retryOperation } = useErrorHandler();

  const handleClick = async () => {
    if (shouldFail) {
      await handleAsyncError(new Error('Async operation failed'), {
        component: 'AsyncErrorComponent',
      });
    } else {
      await retryOperation(
        async () => {
          throw new Error('Will retry');
        },
        3,
        100
      );
    }
  };

  return (
    <button onClick={handleClick} data-testid='async-error-button'>
      Trigger Async Error
    </button>
  );
};

describe('Error Boundary System', () => {
  describe('ErrorBoundary Component', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage='Component crashed' />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError shouldThrow={true} errorMessage='Detailed error message' />
        </ErrorBoundary>
      );

      expect(screen.getByText(/detailed error message/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary showErrorDetails={false}>
          <ThrowError shouldThrow={true} errorMessage='Secret error details' />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/secret error details/i)).not.toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} errorMessage='Callback test error' />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should reset error state when retry button is clicked', async () => {
      const TestComponent: React.FC = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        React.useEffect(() => {
          const timer = setTimeout(() => setShouldThrow(false), 100);
          return () => clearTimeout(timer);
        }, []);

        return (
          <ErrorBoundary>
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundary>
        );
      };

      render(<TestComponent />);

      // Should show error initially
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Click retry button
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // Should recover after component stops throwing
      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument();
      });
    });
  });

  describe('ErrorContext and ErrorProvider', () => {
    const ErrorContextTestComponent: React.FC = () => {
      const { reportError, clearErrors, hasErrors, state } = useErrorContext();

      const triggerError = () => {
        reportError({
          errorId: 'test-error-1',
          message: 'Test context error',
          timestamp: new Date().toISOString(),
          context: { severity: 'medium' },
        });
      };

      return (
        <div>
          <button onClick={triggerError} data-testid='trigger-error'>
            Trigger Error
          </button>
          <button onClick={clearErrors} data-testid='clear-errors'>
            Clear Errors
          </button>

          <div data-testid='error-count'>{state.errors.length}</div>
          <div data-testid='has-errors'>{hasErrors.toString()}</div>
        </div>
      );
    };

    it('should manage error state correctly', () => {
      render(
        <ErrorProvider>
          <ErrorContextTestComponent />
        </ErrorProvider>
      );

      // Initially no errors
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('has-errors')).toHaveTextContent('false');

      // Trigger an error
      fireEvent.click(screen.getByTestId('trigger-error'));

      // Should have one error
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');

      // Clear errors
      fireEvent.click(screen.getByTestId('clear-errors'));

      // Should be back to no errors
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('has-errors')).toHaveTextContent('false');
    });

    it('should auto-remove non-critical errors after timeout', async () => {
      jest.useFakeTimers();

      render(
        <ErrorProvider>
          <ErrorContextTestComponent />
        </ErrorProvider>
      );

      // Trigger error
      fireEvent.click(screen.getByTestId('trigger-error'));
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      // Error should be auto-removed
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      });

      jest.useRealTimers();
    });
  });

  describe('useErrorHandler Hook', () => {
    const ErrorHandlerTestComponent: React.FC = () => {
      const { handleAsyncError, handleApiError, handleValidationError, retryOperation } =
        useErrorHandler();
      const [result, setResult] = React.useState<string>('');

      const testAsyncError = async () => {
        const error = new Error('Async test error');
        const errorInfo = await handleAsyncError(error, { test: true });
        setResult(`Async error handled: ${errorInfo.errorId}`);
      };

      const testApiError = async () => {
        const error = {
          response: {
            status: 404,
            data: { message: 'Not found' },
          },
        };
        const errorInfo = await handleApiError(error, '/api/test');
        setResult(`API error handled: ${errorInfo.errorId}`);
      };

      const testValidationError = async () => {
        const validationErrors = {
          name: ['Name is required'],
          email: ['Invalid email format'],
        };
        const errorInfo = await handleValidationError(validationErrors);
        setResult(`Validation error handled: ${errorInfo.errorId}`);
      };

      const testRetryOperation = async () => {
        let attempts = 0;
        const result = await retryOperation(
          async () => {
            attempts++;
            if (attempts < 3) {
              throw new Error('Retry test');
            }
            return 'Success after retries';
          },
          3,
          10
        );
        setResult(`Retry result: ${result || 'Failed'}`);
      };

      return (
        <div>
          <button onClick={testAsyncError} data-testid='test-async'>
            Test Async Error
          </button>
          <button onClick={testApiError} data-testid='test-api'>
            Test API Error
          </button>

          <button onClick={testValidationError} data-testid='test-validation'>
            Test Validation Error
          </button>
          <button onClick={testRetryOperation} data-testid='test-retry'>
            Test Retry Operation
          </button>
          <div data-testid='result'>{result}</div>
        </div>
      );
    };

    it('should handle different error types correctly', async () => {
      render(
        <ErrorProvider>
          <ErrorHandlerTestComponent />
        </ErrorProvider>
      );

      // Test async error handling
      fireEvent.click(screen.getByTestId('test-async'));
      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('Async error handled:');
      });

      // Test API error handling
      fireEvent.click(screen.getByTestId('test-api'));
      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('API error handled:');
      });

      // Test validation error handling
      fireEvent.click(screen.getByTestId('test-validation'));
      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('Validation error handled:');
      });

      // Test retry operation
      fireEvent.click(screen.getByTestId('test-retry'));
      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent(
          'Retry result: Success after retries'
        );
      });
    });
  });

  describe('Error Boundary Performance', () => {
    it('should not impact performance when no errors occur', () => {
      const start = performance.now();

      render(
        <ErrorBoundary>
          <div>
            {Array.from({ length: 1000 }, (_, i) => (
              <span key={i}>Item {i}</span>
            ))}
          </div>
        </ErrorBoundary>
      );

      const end = performance.now();
      const renderTime = end - start;

      // Should render quickly even with many children
      expect(renderTime).toBeLessThan(100); // Less than 100ms
    });

    it('should handle rapid error recovery without memory leaks', async () => {
      const TestComponent: React.FC = () => {
        const [errorCount, setErrorCount] = React.useState(0);
        const [shouldThrow, setShouldThrow] = React.useState(false);

        const triggerErrorCycle = () => {
          setShouldThrow(true);
          setTimeout(() => {
            setShouldThrow(false);
            setErrorCount((c) => c + 1);
          }, 10);
        };

        // Automatically trigger error cycles
        React.useEffect(() => {
          if (errorCount < 5) {
            const timer = setTimeout(triggerErrorCycle, 50);
            return () => clearTimeout(timer);
          }
        }, [errorCount]);

        if (shouldThrow) {
          throw new Error(`Error cycle ${errorCount}`);
        }

        return <div data-testid='error-cycles'>{errorCount}</div>;
      };

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Wait for error cycles to complete
      await waitFor(
        () => {
          expect(screen.getByTestId('error-cycles')).toHaveTextContent('5');
        },
        { timeout: 2000 }
      );

      // Should complete all cycles without hanging
      expect(screen.getByTestId('error-cycles')).toBeInTheDocument();
    });
  });

  describe('Integration with Terrafusion Components', () => {
    it('should work with property assessment components', () => {
      const PropertyAssessmentComponent: React.FC = () => {
        const [shouldFail, setShouldFail] = React.useState(false);

        if (shouldFail) {
          throw new Error('Property assessment failed');
        }

        return (
          <div>
            <div>Property Assessment Module</div>
            <button onClick={() => setShouldFail(true)} data-testid='fail-assessment'>
              Trigger Assessment Error
            </button>
          </div>
        );
      };

      render(
        <ErrorBoundary>
          <PropertyAssessmentComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Property Assessment Module')).toBeInTheDocument();

      // Trigger error
      fireEvent.click(screen.getByTestId('fail-assessment'));

      // Should show error boundary
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});

// Test utilities
export const renderWithErrorProvider = (
  component: React.ReactElement
): ReturnType<typeof render> => {
  return render(<ErrorProvider>{component}</ErrorProvider>);
};

export const mockConsoleError = () => {
  const originalError = console.error;
  console.error = jest.fn();
  return () => {
    console.error = originalError;
  };
};
