import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createLogger, useLogger } from '../../hooks/useLogger';

describe('createLogger', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy  = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy  = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes messages with [TF:<scope>]', () => {
    const logger = createLogger('TestScope');
    logger.warn('hello');
    expect(warnSpy).toHaveBeenCalledWith('[TF:TestScope]', 'hello');
  });

  it('warn is always emitted', () => {
    const logger = createLogger('X');
    logger.warn('bad thing');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('error is always emitted', () => {
    const logger = createLogger('X');
    logger.error('boom', new Error('oops'));
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('debug is emitted in test environment (non-production)', () => {
    const logger = createLogger('X');
    logger.debug('debug msg');
    // In test env (not PROD), debug should fire
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it('info is emitted in test environment (non-production)', () => {
    const logger = createLogger('X');
    logger.info('info msg');
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('passes extra args through', () => {
    const logger = createLogger('Y');
    const obj = { id: 1 };
    logger.warn('ctx', obj);
    expect(warnSpy).toHaveBeenCalledWith('[TF:Y]', 'ctx', obj);
  });
});

describe('useLogger', () => {
  it('returns a stable Logger object across re-renders', () => {
    const { result, rerender } = renderHook(() => useLogger('MyComponent'));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first); // same reference (useMemo)
  });

  it('returns all four log methods', () => {
    const { result } = renderHook(() => useLogger('MyComponent'));
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');
  });

  it('does not throw when called in a render', () => {
    expect(() => renderHook(() => useLogger('Safe'))).not.toThrow();
  });
});
