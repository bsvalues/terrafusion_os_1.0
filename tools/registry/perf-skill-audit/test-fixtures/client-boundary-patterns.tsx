/**
 * Client-Boundary Test Fixtures (Phase 4M3)
 * Intentional patterns for scanner validation
 *
 * Classifications tested:
 * 1. missing-use-client - File uses client hooks without directive
 * 2. server-imports-client - Server file imports client module
 * 3. dynamic-candidate - Heavy module static import
 * 4. serialization-trim - Large prop spread
 * 5. unstable-server-action - Revalidation patterns
 * 6. rsc-cache-candidate - Repeated fetch without cache
 * 7. boundary-churn - Server→client→server loop
 * 8. client-fetch-in-render - Fetch in render phase
 * 9. suppressed - Pragma ignores
 * 10. clean - No issues
 */

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 1: Missing "use client" (auto-fixable)
// File uses useState without "use client" directive
// ══════════════════════════════════════════════════════════════════════════════

// Note: This fixture intentionally lacks "use client"
import { useState } from 'react';

export function MissingUseClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 2: Server imports client module (review-only)
// Server file importing from a client-indicating path
// ══════════════════════════════════════════════════════════════════════════════

import { ClientButton } from '../hooks/use-client-button';
import { SomeUI } from './components/ui/button';

export function ServerComponent() {
  return <ClientButton />;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 3: Dynamic import candidate (auto-fixable in client files)
// Heavy modules that should use dynamic()
// ══════════════════════════════════════════════════════════════════════════════

import { Chart } from 'recharts';
import { DatePicker } from 'react-datepicker';
import Editor from '@monaco-editor/react';

export function HeavyImportsComponent() {
  return (
    <div>
      <Chart data={[]} />
      <DatePicker />
      <Editor value="" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 4: Serialization trim (review-only)
// Large object spread into client component
// ══════════════════════════════════════════════════════════════════════════════

export async function SerializationPage() {
  const hugeData = await fetchHugeDataset(); // Large API response
  return <DataViewer {...hugeData} />;
}

interface HugeData {
  items: Array<{ id: string; name: string; metadata: Record<string, unknown> }>;
  pagination: { page: number; total: number; pageSize: number };
  filters: Record<string, unknown>;
  [key: string]: unknown;
}

async function fetchHugeDataset(): Promise<HugeData> {
  return { items: [], pagination: { page: 1, total: 100, pageSize: 10 }, filters: {} };
}

function DataViewer(props: HugeData) {
  return <div>{JSON.stringify(props)}</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 5: Suppressed with pragma (should not flag)
// ══════════════════════════════════════════════════════════════════════════════

// perf-skill:ignore-client-boundary
import { useEffect } from 'react';

export function SuppressedComponent() {
  useEffect(() => {
    console.log('Effect');
  }, []);
  return <div>Suppressed</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 6: Clean component with "use client" (should not flag)
// ══════════════════════════════════════════════════════════════════════════════

// Note: In a real file, this would be at the top
// "use client"
// For testing purposes, we simulate a clean file

export function CleanClientComponent() {
  // This would be in a proper "use client" file
  return <div>Clean</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 7: Heavy component name pattern (review-only)
// Components matching *Viewer, *Chart, *Editor patterns
// ══════════════════════════════════════════════════════════════════════════════

import { PDFViewer } from './pdf-components';
import { MapVisualization } from './map-components';

export function HeavyComponentNames() {
  return (
    <div>
      <PDFViewer />
      <MapVisualization />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE 8: Browser globals without "use client"
// ══════════════════════════════════════════════════════════════════════════════

export function BrowserGlobalsComponent() {
  const width = window.innerWidth;
  const element = document.getElementById('root');
  const stored = localStorage.getItem('key');
  return <div>{width}</div>;
}
