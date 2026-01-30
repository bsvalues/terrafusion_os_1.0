describe('Runner Isolation (Jest)', () => {
  test('should not be running in Vitest environment', () => {
    // Ensure we haven't accidentally leaked Vitest globals into Jest
    // @ts-ignore
    expect(globalThis.vitest).toBeUndefined();
    // @ts-ignore
    expect(globalThis.vi).toBeUndefined();
  });

  test('should be running in JSDOM', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });
});
