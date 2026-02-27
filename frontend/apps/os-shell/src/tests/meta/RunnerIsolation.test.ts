describe('Runner Isolation (Vitest)', () => {
  test('should be running in Vitest environment', () => {
    // Confirm vitest globals are available (globals: true in vitest.config.ts)
    // @ts-ignore
    expect(globalThis.vi).toBeDefined();
  });

  test('should be running in JSDOM', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });
});
