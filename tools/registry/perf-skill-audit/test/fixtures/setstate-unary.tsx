// Fixture: Happy path - unary NOT expression with state identifier
// Pattern: setOpen(!open) → setOpen(prev => !prev)
// Expected: Tier 0, canApply=true, semanticGuards=all pass
'use client';

import { useState } from 'react';

export function Toggle() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  return (
    <div>
      <button onClick={() => setOpen(!open)}>Toggle Open</button>
      <button onClick={() => setEnabled(!enabled)}>Toggle Enabled</button>
      <p>
        Open: {String(open)}, Enabled: {String(enabled)}
      </p>
    </div>
  );
}
