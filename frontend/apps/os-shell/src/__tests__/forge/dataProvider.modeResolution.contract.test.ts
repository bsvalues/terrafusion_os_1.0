/**
 * dataProvider.modeResolution.contract.test.ts
 *
 * CONTRACT: resolveDataMode() is the single authority that decides which
 * DataProvider is constructed and why. Every code path that cares about
 * data origin must derive from this function — never from independent network
 * calls or duplicate env reads.
 *
 * These tests exercise resolveDataMode() in isolation via its explicit `env`
 * parameter so no real import.meta.env is touched.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveDataMode,
  resetDataProvider,
  getDataProvider,
  getDataProviderDiagnostics,
} from '../../services/dataProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LIVE_ENV = {} as const;
const SNAP_ALLOWED = { VITE_DATA_MODE: 'snapshot', VITE_ALLOW_NON_LIVE_MODE: '1' } as const;
const FIX_ALLOWED = { VITE_DATA_MODE: 'fixtures', VITE_ALLOW_NON_LIVE_MODE: '1' } as const;
const SNAP_NO_FLAG = { VITE_DATA_MODE: 'snapshot' } as const;
const FIX_NO_FLAG = { VITE_DATA_MODE: 'fixtures' } as const;
const UNKNOWN_MODE = { VITE_DATA_MODE: 'turbo', VITE_ALLOW_NON_LIVE_MODE: '1' } as const;

// ── resolveDataMode() ─────────────────────────────────────────────────────────

describe('resolveDataMode — mode resolution contract', () => {
  it('returns live / env-default when VITE_DATA_MODE is unset', () => {
    const result = resolveDataMode(LIVE_ENV);
    expect(result).toEqual({ mode: 'live', reason: 'env-default' });
  });

  it('returns live / env-default when VITE_DATA_MODE is "live"', () => {
    const result = resolveDataMode({ VITE_DATA_MODE: 'live' });
    expect(result).toEqual({ mode: 'live', reason: 'env-default' });
  });

  it('returns snapshot / env-explicit when VITE_DATA_MODE=snapshot + VITE_ALLOW_NON_LIVE_MODE=1', () => {
    const result = resolveDataMode(SNAP_ALLOWED);
    expect(result).toEqual({ mode: 'snapshot', reason: 'env-explicit' });
  });

  it('returns fixtures / env-explicit when VITE_DATA_MODE=fixtures + VITE_ALLOW_NON_LIVE_MODE=1', () => {
    const result = resolveDataMode(FIX_ALLOWED);
    expect(result).toEqual({ mode: 'fixtures', reason: 'env-explicit' });
  });

  it('FAIL-FAST: throws when VITE_DATA_MODE=snapshot without VITE_ALLOW_NON_LIVE_MODE=1', () => {
    expect(() => resolveDataMode(SNAP_NO_FLAG)).toThrow(
      /VITE_DATA_MODE="snapshot" requires VITE_ALLOW_NON_LIVE_MODE=1/,
    );
  });

  it('FAIL-FAST: throws when VITE_DATA_MODE=fixtures without VITE_ALLOW_NON_LIVE_MODE=1', () => {
    expect(() => resolveDataMode(FIX_NO_FLAG)).toThrow(
      /VITE_DATA_MODE="fixtures" requires VITE_ALLOW_NON_LIVE_MODE=1/,
    );
  });

  it('FAIL-FAST: error message names the missing flag clearly', () => {
    expect(() => resolveDataMode(SNAP_NO_FLAG)).toThrow(/VITE_ALLOW_NON_LIVE_MODE=1/);
  });

  it('falls back to live for unknown VITE_DATA_MODE values (no throw)', () => {
    // Unknown values are silently treated as live — typo protection, not fail-fast
    const result = resolveDataMode(UNKNOWN_MODE);
    expect(result).toEqual({ mode: 'live', reason: 'env-default' });
  });
});

// ── getDataProviderDiagnostics() ──────────────────────────────────────────────

describe('getDataProviderDiagnostics — singleton diagnostics contract', () => {
  beforeEach(() => resetDataProvider());
  afterEach(() => resetDataProvider());

  it('returns mode=live and initializedAt=null before first getDataProvider() call', () => {
    const diag = getDataProviderDiagnostics();
    expect(diag.mode).toBe('live');
    expect(diag.initializedAt).toBeNull();
  });

  it('returns initializedAt as a Date after getDataProvider() constructs the singleton', () => {
    getDataProvider();
    const diag = getDataProviderDiagnostics();
    expect(diag.initializedAt).toBeInstanceOf(Date);
  });

  it('records reason from resolveDataMode() in the diagnostics', () => {
    getDataProvider();
    const diag = getDataProviderDiagnostics();
    expect(['env-default', 'env-explicit']).toContain(diag.reason);
  });

  it('reset clears diagnostics — next call returns null initializedAt again', () => {
    getDataProvider();
    resetDataProvider();
    const diag = getDataProviderDiagnostics();
    expect(diag.initializedAt).toBeNull();
  });
});
