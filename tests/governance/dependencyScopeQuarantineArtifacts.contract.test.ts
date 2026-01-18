import { describe, expect, it } from 'vitest';

describe('Dependency Scope Quarantine Artifacts Schema', () => {
  interface QuarantineItem {
    package: string;
    bucket: string;
    localUsage: number;
    totalUsage: number;
    wiring: string;
  }

  const validateItem = (item: any): item is QuarantineItem => {
    return (
      typeof item.package === 'string' &&
      typeof item.bucket === 'string' &&
      typeof item.localUsage === 'number' &&
      typeof item.totalUsage === 'number' &&
      typeof item.wiring === 'string'
    );
  };

  it('validates a correct quarantine item record', () => {
    const item = {
      package: 'example-pkg',
      bucket: 'QUARANTINE',
      localUsage: 10,
      totalUsage: 20,
      wiring: 'kernel-gateway-ref',
    };
    expect(validateItem(item)).toBe(true);
  });

  it('rejects an invalid record', () => {
    const item = {
      package: 'example-pkg',
      // bucket missing
      localUsage: '10', // wrong type
      totalUsage: 20,
    };
    expect(validateItem(item)).toBe(false);
  });
});
