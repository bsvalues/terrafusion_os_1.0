// Fixture: try/catch would change semantics - CANNOT be parallelized
declare function fetchFirst(): Promise<unknown>;
declare function fetchSecond(): Promise<unknown>;

async function fetchWithTryCatch() {
  try {
    const first = await fetchFirst();
    const second = await fetchSecond();
  } catch (err) {
    // If fetchFirst fails, fetchSecond won't run
    // But with Promise.all, fetchSecond would already be running
    console.error('Error:', err);
  }

  return null;
}

// This should NOT be transformed because try/catch semantics would change
// With Promise.all, both would start immediately, changing error behavior
