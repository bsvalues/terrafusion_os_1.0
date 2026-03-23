/// <reference types="vitest" />

import { describe, expect, it, vi } from 'vitest';

import {
  getTrustedShellOrigin,
  openTrustedShellPopup,
  resolveTrustedShellUrl,
} from '../../lib/trustedShellUrl';

describe('trustedShellUrl', () => {
  it('accepts same-origin relative module paths', () => {
    const trusted = resolveTrustedShellUrl('/modules/terra-levy/index.html', {
      baseOrigin: 'http://localhost:3102',
    });

    expect(trusted).toBe('http://localhost:3102/modules/terra-levy/index.html');
  });

  it('rejects javascript protocol payloads', () => {
    const trusted = resolveTrustedShellUrl('javascript:alert(1)', {
      baseOrigin: 'http://localhost:3102',
    });

    expect(trusted).toBeNull();
  });

  it('rejects non-allowlisted absolute origins', () => {
    const trusted = resolveTrustedShellUrl('https://evil.example.com/frame', {
      baseOrigin: 'http://localhost:3102',
    });

    expect(trusted).toBeNull();
  });

  it('accepts explicitly allowlisted suite origins', () => {
    const trusted = resolveTrustedShellUrl('http://localhost:5184/property-record', {
      allowedOrigins: ['http://localhost:5184', 'https://localhost:5184'],
      allowRelative: false,
      baseOrigin: 'http://localhost:3102',
    });

    expect(trusted).toBe('http://localhost:5184/property-record');
    expect(trusted ? getTrustedShellOrigin(trusted) : null).toBe('http://localhost:5184');
  });

  it('opens trusted popups with noopener and noreferrer', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({ opener: window } as Window);
    const trusted = resolveTrustedShellUrl('/property', {
      baseOrigin: window.location.origin,
    });

    expect(trusted).not.toBeNull();
    if (!trusted) {
      openSpy.mockRestore();
      return;
    }

    const opened = openTrustedShellPopup(trusted);

    expect(openSpy).toHaveBeenCalledWith(trusted, '_blank', 'noopener,noreferrer');
    expect(opened?.opener).toBeNull();

    openSpy.mockRestore();
  });
});