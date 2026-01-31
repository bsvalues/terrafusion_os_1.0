// Fixture: Reject path - mutation operators (pre/post increment, compound assignment)
// Pattern: setCount(++count) or setCount(count += 1) - REJECT (no-mutations guard fails)
// Expected: canApply=false, reason="mutation operator detected"
'use client';

import { useState } from 'react';

export function MutationExample() {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState(10);

  // NOTE: These are intentionally bad patterns for testing rejection
  // In real code, these would cause issues with React's state model

  return (
    <div>
      {/* REJECT: pre-increment mutation */}
      <button onClick={() => setCount(++count)}>Pre-increment</button>

      {/* REJECT: post-increment mutation */}
      <button onClick={() => setValue(value++)}>Post-increment</button>

      {/* REJECT: compound assignment mutation */}
      <button onClick={() => setCount((count += 1))}>Compound Add</button>

      {/* REJECT: pre-decrement mutation */}
      <button onClick={() => setValue(--value)}>Pre-decrement</button>

      <p>
        Count: {count}, Value: {value}
      </p>
    </div>
  );
}
