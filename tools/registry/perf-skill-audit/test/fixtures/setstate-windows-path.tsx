// Fixture: Windows path normalization test
// Path: C:\repo\os-platform\core\pilot\WindowsPathTest.tsx
// Tests that Windows backslash paths are normalized to forward slashes
// and that the strategy still operates correctly on Windows paths
'use client';

import { useState } from 'react';

/**
 * This component tests Windows path handling:
 * - Input path may contain C:\ prefix
 * - Input path may use backslashes: C:\repo\os-platform\core\...
 * - System should normalize to: os-platform/core/...
 * - Strategy should still detect and transform setState patterns
 */
export function WindowsPathComponent() {
  const [counter, setCounter] = useState(0);
  const [flag, setFlag] = useState(true);

  // Happy path patterns that should be detected after path normalization
  return (
    <div>
      <button onClick={() => setCounter(counter + 1)}>Win Increment</button>
      <button onClick={() => setFlag(!flag)}>Win Toggle</button>
      <span data-testid="windows-path">C:\\repo\\os-platform\\core\\pilot</span>
      <p>
        Counter: {counter}, Flag: {String(flag)}
      </p>
    </div>
  );
}
