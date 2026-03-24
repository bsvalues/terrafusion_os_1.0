/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';
import {
  buildModuleLoadingContext,
  resolveModulePermissions,
  resolveModuleSecurityLevel,
} from '../../services/QuantumModuleManager';
import type { Session } from '../../auth/session';

function createToken(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `header.${encoded}.signature`;
}

describe('Wave 1 — QuantumModuleManager auth threading', () => {
  it('uses session permissions when they are available', () => {
    const session: Session = {
      userId: 'appraiser-1',
      countyId: 'benton',
      permissions: ['read', 'write'],
      role: 'appraiser',
      mode: 'pilot',
    };

    expect(resolveModulePermissions(session, ['appraiser'])).toEqual(['read', 'write']);
  });

  it('elevates security level for privileged roles', () => {
    expect(resolveModuleSecurityLevel(null, ['admin'])).toBe('MAXIMUM');
    expect(resolveModuleSecurityLevel(null, ['appraiser'])).toBe('ELEVATED');
    expect(resolveModuleSecurityLevel(null, ['viewer'])).toBe('STANDARD');
  });

  it('builds module loading context from token claims plus session fallback', () => {
    const session: Session = {
      userId: 'reviewer-1',
      countyId: 'yakima',
      role: 'viewer',
      mode: 'pilot',
    };
    const token = createToken({
      userId: 'reviewer-1',
      countyId: 'benton',
      roles: ['admin'],
    });

    const context = buildModuleLoadingContext(() => 'session-123', session, token);

    expect(context).toEqual({
      countyId: 'benton',
      sessionId: 'session-123',
      permissions: ['read', 'write', 'execute', 'admin'],
      securityLevel: 'MAXIMUM',
      quantumOptimization: 949,
    });
  });
});
