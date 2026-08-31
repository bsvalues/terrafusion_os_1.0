import { describe, expect, it } from 'vitest';
import {
  resolveWashingtonLaunchDataProxy,
  WASHINGTON_LAUNCH_DATA_PATH,
  WASHINGTON_LAUNCH_DATA_PROXY_CONTEXT,
} from '../../frontend/apps/os-shell/vite/washingtonLaunchDataProxy';

const MANIFEST_SHA256 = 'a'.repeat(64);

describe('Washington launch data Vite proxy', () => {
  it('keeps an unconfigured runtime in navigation-only mode', () => {
    expect(resolveWashingtonLaunchDataProxy({})).toBeUndefined();
    expect(resolveWashingtonLaunchDataProxy({ manifestSha256: '', sourceUrl: '  ' }))
      .toBeUndefined();
  });

  it('bridges the canonical same-origin route to a validated public origin', () => {
    expect(resolveWashingtonLaunchDataProxy({
      manifestSha256: MANIFEST_SHA256.toUpperCase(),
      sourceUrl: `https://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}/`,
    })).toEqual({
      target: 'https://public-data.example.gov',
      changeOrigin: true,
      secure: true,
    });
  });

  it.each([
    '/launch-data/washington/manifest.json',
    '/launch-data/washington/counties/status.json',
    '/launch-data/washington/counties/001.json',
    '/launch-data/washington/sales/by-county/077.json',
  ])('matches an exact runtime package route: %s', (requestPath) => {
    expect(new RegExp(WASHINGTON_LAUNCH_DATA_PROXY_CONTEXT).test(requestPath)).toBe(true);
  });

  it.each([
    '/launch-data/washington',
    '/launch-data/washington-extra/manifest.json',
    '/launch-data/washington/counties/1.json',
    '/launch-data/washington/counties/001.json/extra',
    '/launch-data/washington/%2e%2e/api',
    '/launch-data/washington/manifest.json?redirect=/api',
  ])('does not proxy a sibling or non-canonical route: %s', (requestPath) => {
    expect(new RegExp(WASHINGTON_LAUNCH_DATA_PROXY_CONTEXT).test(requestPath)).toBe(false);
  });

  it('requires the public source and browser trust pin together', () => {
    expect(() => resolveWashingtonLaunchDataProxy({
      manifestSha256: MANIFEST_SHA256,
    })).toThrow(/WASHINGTON_LAUNCH_DATA_SOURCE_URL is required/);

    expect(() => resolveWashingtonLaunchDataProxy({
      sourceUrl: `https://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}`,
    })).toThrow(/VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256/);

    expect(() => resolveWashingtonLaunchDataProxy({
      manifestSha256: 'not-a-digest',
      sourceUrl: `https://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}`,
    })).toThrow(/64-character SHA-256 digest/);
  });

  it.each([
    `http://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}`,
    `https://user:password@public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}`,
    `https://public-data.example.gov:8443${WASHINGTON_LAUNCH_DATA_PATH}`,
    `https://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}?version=1`,
    `https://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}#manifest`,
    'https://public-data.example.gov/launch-data/oregon',
    `https://public-data.example.gov${WASHINGTON_LAUNCH_DATA_PATH}/manifest.json`,
  ])('rejects an unsafe or non-canonical package source: %s', (sourceUrl) => {
    expect(() => resolveWashingtonLaunchDataProxy({
      manifestSha256: MANIFEST_SHA256,
      sourceUrl,
    })).toThrow(/credential-free HTTPS URL/);
  });

  it('rejects a non-URL source without falling back to another county data path', () => {
    expect(() => resolveWashingtonLaunchDataProxy({
      manifestSha256: MANIFEST_SHA256,
      sourceUrl: 'not-a-url',
    })).toThrow(/must be an absolute URL/);
  });
});
