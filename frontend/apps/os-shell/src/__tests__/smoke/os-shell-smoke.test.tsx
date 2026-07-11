import '@testing-library/jest-dom';

// WO-CI-FASTGATE-003: this frontend touch makes `classify` run the (now sharded) Frontend
// Fast Gate on this PR so the 3-way shard is validated before merge. Harmless comment.

describe('os-shell smoke', () => {
  it('has a working test harness in apps/os-shell', () => {
    expect(true).toBe(true);
  });
});
