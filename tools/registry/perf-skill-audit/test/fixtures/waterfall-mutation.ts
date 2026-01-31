// Fixture: Mutation between awaits - CANNOT be parallelized
declare function fetchFirst(): Promise<unknown>;
declare function fetchSecond(): Promise<unknown>;

async function fetchWithMutation() {
  const items: unknown[] = [];

  const first = await fetchFirst();
  items.push(first); // ❌ Mutation between awaits
  const second = await fetchSecond();
  items.push(second); // ❌ Mutation between awaits

  return items;
}

// This should NOT be transformed because of the array mutations
