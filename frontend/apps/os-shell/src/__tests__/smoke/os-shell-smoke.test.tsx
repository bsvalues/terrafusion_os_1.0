import '@testing-library/jest-dom';

// DIAGNOSTIC trigger (WO-CI-FASTGATE-003, temporary): forces classify to run the Frontend
// Fast Gate so the instrumented (verbose, 50-min) diagnostic actually executes. REVERT with the fix.

describe('os-shell smoke', () => {
  it('has a working test harness in apps/os-shell', () => {
    expect(true).toBe(true);
  });
});
