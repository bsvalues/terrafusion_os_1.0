import '@testing-library/jest-dom';

describe('os-shell smoke', () => {
  it('has a working test harness in apps/os-shell', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });
});
