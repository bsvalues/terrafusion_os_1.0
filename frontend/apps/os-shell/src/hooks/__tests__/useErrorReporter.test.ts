/**
 * TerraFusion OS useErrorReporter Hook Tests
 * 
 * Tests for error reporting hook:
 * - Report errors with context
 * - Track error frequency
 * - Log to console
 * 
 * @module hooks/__tests__/useErrorReporter.test
 * @vitest-environment jsdom
 */

// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)
import { renderHook, act } from '@testing-library/react';

import { useErrorReporter, errorTracker } from '../useErrorReporter';

// Suppress console.error for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  // Clear error tracker
  errorTracker.clear();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe('useErrorReporter', () => {
  describe('reportError', () => {
    it('logs error to console', () => {
      const { result } = renderHook(() => useErrorReporter('TestComponent'));
      
      act(() => {
        result.current.reportError(new Error('Test error'));
      });
      
      expect(console.error).toHaveBeenCalled();
    });

    it('includes component name in log', () => {
      const { result } = renderHook(() => useErrorReporter('MyComponent'));
      
      act(() => {
        result.current.reportError(new Error('Test error'));
      });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('MyComponent'),
        expect.any(Error)
      );
    });

    it('includes additional context in log', () => {
      const { result } = renderHook(() => useErrorReporter('TestComponent'));
      
      act(() => {
        result.current.reportError(new Error('Test error'), {
          moduleId: 'gov-edition',
          action: 'loadModule',
        });
      });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Error),
        expect.objectContaining({
          moduleId: 'gov-edition',
          action: 'loadModule',
        })
      );
    });
  });

  describe('reportWarning', () => {
    it('logs warning to console', () => {
      const { result } = renderHook(() => useErrorReporter('TestComponent'));
      
      act(() => {
        result.current.reportWarning('Something suspicious');
      });
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('includes component name in warning', () => {
      const { result } = renderHook(() => useErrorReporter('WarningComponent'));
      
      act(() => {
        result.current.reportWarning('Test warning');
      });
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WarningComponent'),
        'Test warning'
      );
    });
  });

  describe('Error Tracking', () => {
    it('tracks error count per component', () => {
      const { result } = renderHook(() => useErrorReporter('TrackedComponent'));
      
      act(() => {
        result.current.reportError(new Error('Error 1'));
        result.current.reportError(new Error('Error 2'));
        result.current.reportError(new Error('Error 3'));
      });
      
      expect(errorTracker.getCount('TrackedComponent')).toBe(3);
    });

    it('tracks errors separately per component', () => {
      const { result: result1 } = renderHook(() => useErrorReporter('Component1'));
      const { result: result2 } = renderHook(() => useErrorReporter('Component2'));
      
      act(() => {
        result1.current.reportError(new Error('Error in 1'));
        result2.current.reportError(new Error('Error in 2'));
        result2.current.reportError(new Error('Another error in 2'));
      });
      
      expect(errorTracker.getCount('Component1')).toBe(1);
      expect(errorTracker.getCount('Component2')).toBe(2);
    });

    it('returns error count from hook', () => {
      const { result } = renderHook(() => useErrorReporter('CountedComponent'));
      
      expect(result.current.errorCount).toBe(0);
      
      act(() => {
        result.current.reportError(new Error('Error'));
      });
      
      expect(result.current.errorCount).toBe(1);
    });

    it('clears error count', () => {
      const { result } = renderHook(() => useErrorReporter('ClearableComponent'));
      
      act(() => {
        result.current.reportError(new Error('Error'));
        result.current.reportError(new Error('Error'));
      });
      
      expect(result.current.errorCount).toBe(2);
      
      act(() => {
        result.current.clearErrors();
      });
      
      expect(result.current.errorCount).toBe(0);
    });
  });

  describe('hasRecentErrors', () => {
    it('returns false when no errors', () => {
      const { result } = renderHook(() => useErrorReporter('NoErrorComponent'));
      
      expect(result.current.hasRecentErrors).toBe(false);
    });

    it('returns true after error reported', () => {
      const { result } = renderHook(() => useErrorReporter('ErrorComponent'));
      
      act(() => {
        result.current.reportError(new Error('Error'));
      });
      
      expect(result.current.hasRecentErrors).toBe(true);
    });
  });
});

describe('errorTracker', () => {
  it('getAllCounts returns all tracked components', () => {
    const { result: r1 } = renderHook(() => useErrorReporter('Comp1'));
    const { result: r2 } = renderHook(() => useErrorReporter('Comp2'));
    
    act(() => {
      r1.current.reportError(new Error('E1'));
      r2.current.reportError(new Error('E2'));
    });
    
    const counts = errorTracker.getAllCounts();
    expect(counts.Comp1).toBe(1);
    expect(counts.Comp2).toBe(1);
  });

  it('clear removes all tracked errors', () => {
    const { result } = renderHook(() => useErrorReporter('ClearTest'));
    
    act(() => {
      result.current.reportError(new Error('Error'));
    });
    
    expect(errorTracker.getCount('ClearTest')).toBe(1);
    
    errorTracker.clear();
    
    expect(errorTracker.getCount('ClearTest')).toBe(0);
  });
});
