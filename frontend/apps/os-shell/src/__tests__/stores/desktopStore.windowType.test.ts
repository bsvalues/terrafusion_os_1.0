import { describe, expect, it } from 'vitest';
import { deriveWindowType } from '../../stores/desktopStore';

describe('deriveWindowType', () => {
  it('returns companion for os-pilot', () => {
    expect(deriveWindowType('os-pilot')).toBe('companion');
  });

  it('returns workbench for property-workbench', () => {
    expect(deriveWindowType('property-workbench')).toBe('workbench');
  });

  it('returns suite for moduleIds starting with suite-', () => {
    expect(deriveWindowType('suite-forge')).toBe('suite');
    expect(deriveWindowType('suite-atlas')).toBe('suite');
  });

  it('returns normal for unrecognised moduleId', () => {
    expect(deriveWindowType('terra-levy')).toBe('normal');
    expect(deriveWindowType('some-unknown')).toBe('normal');
  });
});
