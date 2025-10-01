import React, {createContext, useContext, useReducer, ReactNode, useCallback} from 'react';

import {ErrorInfo} from '../hooks/useErrorHandler';

interface ErrorState {
  errors: ErrorInfo[];
  globalError: ErrorInfo | null;
  isLoading: boolean;
  retryCount: number;
}

type ErrorAction =
  | {type: 'ADD_ERROR'; payload: ErrorInfo}
  | {type: 'REMOVE_ERROR'; payload: string}
  | {type: 'SET_GLOBAL_ERROR'; payload: ErrorInfo | null}
  | {type: 'CLEAR_ERRORS'}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'INCREMENT_RETRY'}
  | {type: 'RESET_RETRY'};

interface ErrorContextType {
  state: ErrorState;
  reportError: (error: ErrorInfo) => void;
  removeError: (errorId: string) => void;
  setGlobalError: (error: ErrorInfo | null) => void;
  clearErrors: () => void;
  setLoading: (loading: boolean) => void;
  retry: () => void;
  hasErrors: boolean;
  criticalErrors: ErrorInfo[];
}

const initialState: ErrorState = {
  errors: [],
  globalError: null,
  isLoading: false,
  retryCount: 0,
};

const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors.slice(-9), action.payload], // Keep last 10 errors
      };

    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter((error) => error.errorId !== action.payload),
      };

    case 'SET_GLOBAL_ERROR':
      return {
        ...state,
        globalError: action.payload,
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
        globalError: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'INCREMENT_RETRY':
      return {
        ...state,
        retryCount: state.retryCount + 1,
      };

    case 'RESET_RETRY':
      return {
        ...state,
        retryCount: 0,
      };

    default:
      return state;
  }
};

const ErrorContext = createContext<ErrorContextType | null>(null);

interface ErrorProviderProps {children: ReactNode;
  maxErrors?: number;
  autoRetryAttempts?: number;}

/**
 * Global Error Context Provider
 * Manages application-wide error state and provides error handling utilities
 */
export const ErrorProvider: React.FC<ErrorProviderProps>= ({children,
  maxErrors = 10,
  autoRetryAttempts = 3,}) => {const [state, dispatch] = useReducer(errorReducer, initialState);

  const reportError = useCallback((error: ErrorInfo) => {
    console.error('🚨 Global Error Reported:', error);

    dispatch({ type: 'ADD_ERROR', payload: error});

    // Set as global error if it's critical
    if (error.context?.severity === 'critical') {dispatch({ type: 'SET_GLOBAL_ERROR', payload: error});
    }

    // Auto-remove non-critical errors after 10 seconds
    if (error.context?.severity !== 'critical') {setTimeout(() => {
        dispatch({ type: 'REMOVE_ERROR', payload: error.errorId});
      }, 10000);
    }

    // Send to analytics/monitoring
    sendErrorToMonitoring(error);
  }, []);

  const removeError = useCallback((errorId: string) => {dispatch({ type: 'REMOVE_ERROR', payload: errorId});
  }, []);

  const setGlobalError = useCallback((error: ErrorInfo | null) => {dispatch({ type: 'SET_GLOBAL_ERROR', payload: error});
  }, []);

  const clearErrors = useCallback(() => {dispatch({ type: 'CLEAR_ERRORS'});
    dispatch({type: 'RESET_RETRY'});
  }, []);

  const setLoading = useCallback((loading: boolean) => {dispatch({ type: 'SET_LOADING', payload: loading});
  }, []);

  const retry = useCallback(() => {if (state.retryCount< autoRetryAttempts) {
      dispatch({ type: 'INCREMENT_RETRY'});
      // Trigger a page reload or specific retry logic
      window.location.reload();
    }
  }, [state.retryCount, autoRetryAttempts]);

  const hasErrors = state.errors.length >0 || state.globalError !== null;

  const criticalErrors = state.errors.filter((error) => error.context?.severity === 'critical');

  const contextValue: ErrorContextType = {state,
    reportError,
    removeError,
    setGlobalError,
    clearErrors,
    setLoading,
    retry,
    hasErrors,
    criticalErrors,};

  return<ErrorContext.Provider value={contextValue}>{children}</ErrorContext.Provider>;
};

const sendErrorToMonitoring = async (error: ErrorInfo) =>{try {
    // Send to monitoring service
    await fetch('/api/errors/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',},
      body: JSON.stringify({...error,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: sessionStorage.getItem('sessionId') || 'unknown',}),
    });
  } catch (monitoringError) {console.warn('Failed to send error to monitoring:', monitoringError);}
};

/**
 * Hook to access the Error Context
 */
export const useErrorContext = (): ErrorContextType => {const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');}
  return context;
};

/**
 * Error Toast Component
 * Displays non-critical errors as dismissible toasts
 */
export const ErrorToast: React.FC = () => {const { state, removeError} = useErrorContext();

  const nonCriticalErrors = state.errors.filter((error) => error.context?.severity !== 'critical');

  if (nonCriticalErrors.length === 0) {return null;}

  return (<div className='fixed top-4 right-4 z-50 space-y-2'>{nonCriticalErrors.slice(-3).map((
          error // Show only last 3 errors
        ) => (<div
            key={error.errorId}
            className='bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right'
          ><div className='flex items-start justify-between'><div className='flex-1'><h4 className='text-sm font-medium text-red-800'>Error Occurred</h4><p className='text-sm text-red-700 mt-1'>{error.message}</p><p className='text-xs text-red-500 mt-1'>{new Date(error.timestamp).toLocaleTimeString()}</p></div><button
                onClick={() =>removeError(error.errorId)}
                className='ml-2 text-red-400 hover:text-red-600'
              >
                ×</button></div></div>)
      )}</div>);
};

/**
 * Global Error Display Component
 * Shows critical errors that require immediate attention
 */
export const GlobalErrorDisplay: React.FC = () => {const { state, setGlobalError, retry} = useErrorContext();

  if (!state.globalError) {return null;}

  return (<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'><div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'><div className='text-center'><div className='mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'><svg
              className='w-8 h-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            ><path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z' /></svg></div><h3 className='text-lg font-semibold text-gray-900 mb-2'>Critical Error</h3><p className='text-gray-600 mb-4'>{state.globalError.message}</p><div className='flex flex-col sm:flex-row gap-2 justify-center'><button
              onClick={retry}
              className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
            >Retry ({3 - state.retryCount} attempts left)</button><button
              onClick={() =>setGlobalError(null)}
              className='px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
            >
              Dismiss</button></div><p className='text-xs text-gray-500 mt-3'>Error ID: {state.globalError.errorId}</p></div></div></div>
  );
};

export {ErrorContext};
export default ErrorProvider;
