import { describe, expect, it } from 'vitest';

const analyzeItem = (item, promotions) => {
  // If exact match in promotions, use that
  if (promotions[item.package]) {
    return promotions[item.package].target;
  }
  return item.bucket;
};

const validatePromotion = (item, targetBucket, roots) => {
  if (targetBucket === 'DEV') {
    const hasRuntimeRoots = roots.some(
      r => !r.includes('Dev') && !r.includes('Test') && !r.includes('Starter')
    );
    if (hasRuntimeRoots) {
      return { valid: false, reason: 'DEV target requires non-runtime roots' };
    }
  }
  return { valid: true };
};

describe('Dependency Scope Promotion Rules', () => {
  const promoSet = {
    'example-pkg': { target: 'DEV' },
  };

  it('respects promotion overrides', () => {
    const item = { package: 'example-pkg', bucket: 'QUARANTINE' };
    expect(analyzeItem(item, promoSet)).toBe('DEV');
  });

  it('defaults to original bucket if no promotion', () => {
    const item = { package: 'other-pkg', bucket: 'QUARANTINE' };
    expect(analyzeItem(item, promoSet)).toBe('QUARANTINE');
  });

  it('validates DEV promotion criteria (safe)', () => {
    const result = validatePromotion({ package: 'p1' }, 'DEV', [
      'Dev/Root1',
      'TerraFusion_Command_Portal_Starter',
    ]);
    expect(result.valid).toBe(true);
  });

  it('validates DEV promotion criteria (unsafe)', () => {
    const result = validatePromotion({ package: 'p1' }, 'DEV', ['Dev/Root1', 'TerraFusion.Data']);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/requires non-runtime roots/);
  });
});
