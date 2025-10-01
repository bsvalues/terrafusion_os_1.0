// Tesla Memory Optimization Hooks
import { useCallback, useMemo, useRef, useEffect } from 'react';

// Memory-efficient state management
export const useMemoryEfficientState = <T>(initialValue: T) => {
  const stateRef = useRef<T>(initialValue);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const getValue = useCallback(() => stateRef.current, []);

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const value =
      typeof newValue === 'function' ? (newValue as (prev: T) => T)(stateRef.current) : newValue;

    if (value !== stateRef.current) {
      stateRef.current = value;
      listenersRef.current.forEach(listener => listener());
    }
  }, []);

  return [getValue, setValue] as const;
};

// Memory leak prevention
export const useCleanup = (cleanup: () => void) => {
  useEffect(() => cleanup, [cleanup]);
};

// Efficient memoization with size limit
export const useLimitedMemo = <T>(factory: () => T, deps: React.DependencyList, maxSize = 100) => {
  const cacheRef = useRef<Map<string, T>>(new Map());

  return useMemo(() => {
    const key = JSON.stringify(deps);

    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }

    // Limit cache size
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey);
      }
    }

    const value = factory();
    cacheRef.current.set(key, value);
    return value;
  }, deps);
};

// Memory-efficient event listeners
export const useEventListener = (
  eventName: string,
  handler: (event: Event) => void,
  element: HTMLElement | Window = window
) => {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: Event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);

    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
};
