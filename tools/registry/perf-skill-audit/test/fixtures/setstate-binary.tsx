// Fixture: Happy path - binary expression with state identifier and literal
// Pattern: setCount(count + 1) → setCount(prev => prev + 1)
// Expected: Tier 0, canApply=true, semanticGuards=all pass
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState(10);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setValue(value - 1)}>Decrement</button>
      <p>
        Count: {count}, Value: {value}
      </p>
    </div>
  );
}
