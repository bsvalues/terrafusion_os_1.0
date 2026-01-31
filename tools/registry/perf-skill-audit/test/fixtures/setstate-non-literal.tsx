// Fixture: Reject path - RHS contains non-literal identifier
// Pattern: setCount(count + delta) - REJECT (binary-id-op-literal guard fails)
// Expected: canApply=false, reason="RHS not a literal"
'use client';

import { useState } from 'react';

interface Props {
  delta: number;
  multiplier: number;
}

export function Counter({ delta, multiplier }: Props) {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState(10);

  return (
    <div>
      {/* REJECT: count + delta - delta is not a literal */}
      <button onClick={() => setCount(count + delta)}>Add Delta</button>

      {/* REJECT: value * multiplier - multiplier is not a literal */}
      <button onClick={() => setValue(value * multiplier)}>Multiply</button>

      {/* REJECT: count + value - value is not a literal */}
      <button onClick={() => setCount(count + value)}>Add Value</button>

      <p>
        Count: {count}, Value: {value}
      </p>
    </div>
  );
}
