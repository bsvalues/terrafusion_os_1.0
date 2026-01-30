/**
 * Waterfall Scanner Self-Test Fixtures
 * Phase 4N: Scanner Validation Harness
 *
 * These fixtures intentionally contain performance patterns
 * to validate scanner detection and classification.
 *
 * LOCATION: This file is in tools/registry/** (allowed surface)
 * so it WILL appear in actionable reports if scanner is working.
 */

// ============================================================
// FIXTURE 1: safe-parallel (should be detected, eligible)
// Three independent API calls that can run in parallel
// ============================================================
export async function fetchDashboardData() {
  // perf-skill:test-fixture:safe-parallel
  const users = await fetchUsers();
  const projects = await fetchProjects();
  const metrics = await fetchMetrics();
  return { users, projects, metrics };
}

// ============================================================
// FIXTURE 2: dependent (should be detected, review-only)
// Second call depends on first call's result
// ============================================================
export async function fetchUserWithProfile() {
  // perf-skill:test-fixture:dependent
  const user = await fetchUser(userId);
  const profile = await fetchProfile(user.profileId);
  return { user, profile };
}

// ============================================================
// FIXTURE 3: loop-seq (should be suppressed, no finding)
// Sequential awaits inside a loop - intentional pattern
// ============================================================
export async function processItemsSequentially(items: string[]) {
  // perf-skill:test-fixture:loop-seq
  const results = [];
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// ============================================================
// FIXTURE 4: retry-seq (should be suppressed, no finding)
// Sequential awaits in try/catch retry pattern
// ============================================================
export async function fetchWithRetry(url: string) {
  // perf-skill:test-fixture:retry-seq
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    const retryResponse = await fetch(url);
    const retryData = await retryResponse.json();
    return retryData;
  }
}

// ============================================================
// FIXTURE 5: batch-candidate (should be detected)
// Multiple calls to same base that could be batched
// ============================================================
export async function fetchMultipleUsers() {
  // perf-skill:test-fixture:batch-candidate
  const user1 = await api.getUser(1);
  const user2 = await api.getUser(2);
  const user3 = await api.getUser(3);
  return [user1, user2, user3];
}

// ============================================================
// FIXTURE 6: pragma-ignored (should be suppressed)
// Has explicit ignore pragma on await lines
// ============================================================
export async function legacyCodePath() {
  // perf-skill:ignore-waterfall
  const step1 = await legacyStep1(); // perf-skill:ignore-waterfall
  const step2 = await legacyStep2(); // perf-skill:ignore-waterfall
  const step3 = await legacyStep3(); // perf-skill:ignore-waterfall
  return { step1, step2, step3 };
}

// ============================================================
// Stub functions (no implementation needed)
// ============================================================
declare function fetchUsers(): Promise<any>;
declare function fetchProjects(): Promise<any>;
declare function fetchMetrics(): Promise<any>;
declare function fetchUser(id: any): Promise<any>;
declare function fetchProfile(id: any): Promise<any>;
declare function processItem(item: any): Promise<any>;
declare function legacyStep1(): Promise<any>;
declare function legacyStep2(): Promise<any>;
declare function legacyStep3(): Promise<any>;
declare const userId: string;
declare const api: { getUser(id: number): Promise<any> };
