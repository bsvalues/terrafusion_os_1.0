import { describe, expect, it } from 'vitest';
import { describeOperationalScope, parseSegmentIdentity } from '../utils/segmentIdentity';

describe('segmentIdentity', () => {
  it('does not derive reval area from numeric neighborhood codes alone', () => {
    const identity = parseSegmentIdentity('63000 · C · UNKNOWN', { neighborhoodCode: '63000' });

    expect(identity.neighborhoodCode).toBe('63000');
    expect(identity.revalArea).toBeNull();
    expect(identity.classCode).toBe('C');
    expect(identity.marketTag).toBeNull();
    expect(describeOperationalScope(identity)).toBe('Neighborhood 63000 · C');
  });

  it('does not invent reval area from building-type tokens', () => {
    const identity = parseSegmentIdentity('NBHD-K1 · R1 · STANDARD', { neighborhoodCode: 'NBHD-K1' });

    expect(identity.neighborhoodCode).toBe('NBHD-K1');
    expect(identity.revalArea).toBeNull();
    expect(identity.classCode).toBe('R1');
    expect(identity.marketTag).toBe('STANDARD');
    expect(describeOperationalScope(identity)).toBe('Neighborhood NBHD-K1 · R1 · STANDARD');
  });

  it('trusts explicit reval metadata over label tokens', () => {
    const identity = parseSegmentIdentity('63000 · C · UNKNOWN', {
      neighborhoodCode: '63000',
      revalArea: 6,
      buildingType: 'C',
      qualityGrade: 'UNKNOWN',
    });

    expect(identity.neighborhoodCode).toBe('63000');
    expect(identity.revalArea).toBe('6');
    expect(identity.classCode).toBe('C');
    expect(identity.marketTag).toBeNull();
    expect(describeOperationalScope(identity)).toBe('Neighborhood 63000 · Reval 6');
  });

  it('extracts Benton neighborhood codes from compound labels without deriving reval from hood', () => {
    const identity = parseSegmentIdentity('52100 401B · R · UNKNOWN');

    expect(identity.neighborhoodCode).toBe('52100 401B');
    expect(identity.revalArea).toBeNull();
    expect(identity.classCode).toBe('R');
    expect(identity.marketTag).toBeNull();
    expect(describeOperationalScope(identity)).toBe('Neighborhood 52100 401B · R');
  });

  it('preserves explicit hood_cd values without deriving reval from them', () => {
    const identity = parseSegmentIdentity('52100 401B · R · UNKNOWN', {
      neighborhoodCode: '52100 401B',
    });

    expect(identity.neighborhoodCode).toBe('52100 401B');
    expect(identity.revalArea).toBeNull();
    expect(identity.classCode).toBe('R');
    expect(identity.marketTag).toBeNull();
    expect(describeOperationalScope(identity)).toBe('Neighborhood 52100 401B · R');
  });

  it('accepts explicit reval tokens when they are actually present', () => {
    const identity = parseSegmentIdentity('52100 · Reval 5 · 401B · R');

    expect(identity.neighborhoodCode).toBe('52100');
    expect(identity.revalArea).toBe('5');
    expect(identity.classCode).toBe('401B');
    expect(identity.marketTag).toBe('R');
    expect(describeOperationalScope(identity)).toBe('Neighborhood 52100 · Reval 5');
  });

  it('treats numeric Benton hood codes as neighborhoods without inventing reval from the first digit', () => {
    const identity = parseSegmentIdentity('999999 · UNKNOWN · UNKNOWN', {
      neighborhoodCode: '999999',
    });

    expect(identity.neighborhoodCode).toBe('999999');
    expect(identity.revalArea).toBeNull();
    expect(describeOperationalScope(identity)).toBe('Neighborhood 999999');
  });
});
