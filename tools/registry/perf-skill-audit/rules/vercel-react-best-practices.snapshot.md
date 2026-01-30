# Vercel React Best Practices Snapshot

**Pinned Version**: January 2026
**Source**: Vercel React Performance Guidelines
**Last Updated**: 2026-01-30

---

## Purpose

This file pins the performance rules used by the audit scanner. This ensures:

1. **Determinism**: Results don't shift silently when upstream changes
2. **Auditability**: We know exactly what rules were in effect
3. **Controlled Updates**: Rule changes are explicit commits

---

## CRITICAL Severity Rules

### Rule 1.1: Eliminate Async Waterfalls

**Pattern**: Sequential `await` statements that could be parallelized.

```typescript
// ❌ BAD: Sequential fetching (waterfall)
const user = await fetchUser(id);
const posts = await fetchPosts(id);
const comments = await fetchComments(id);

// ✅ GOOD: Parallel fetching
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id)
]);
```

**Detection Heuristics**:
- 3+ consecutive `await` on independent operations
- Same-scope fetches without data dependency

### Rule 1.2: Bundle Size / Barrel Imports

**Pattern**: Re-exporting entire modules through `index.ts` barrels.

```typescript
// ❌ BAD: Barrel import pulling entire module tree
import { Button } from '@/components';

// ✅ GOOD: Direct import
import { Button } from '@/components/Button';
```

**Detection Heuristics**:
- `index.ts` files with 5+ re-exports
- Import paths ending in directory (implicit barrel)

---

## HIGH Severity Rules

### Rule 2.1: Server/Client Boundary Serialization

**Pattern**: Large objects crossing server/client boundary.

```typescript
// ❌ BAD: Passing large unfiltered data to client
<ClientComponent data={fullDatabaseRecord} />

// ✅ GOOD: Minimal serialization
<ClientComponent data={{ id, name, summary }} />
```

**Detection Heuristics**:
- `'use client'` files importing server modules
- Props with spread operators from server data

### Rule 2.2: Client Component Cascade

**Pattern**: `'use client'` too high in component tree.

```typescript
// ❌ BAD: Client boundary at page level
'use client';
export default function DashboardPage() { ... }

// ✅ GOOD: Client boundary at leaf components
// Page is server, only interactive parts are client
```

**Detection Heuristics**:
- `'use client'` in route-level components
- High import count from server modules

---

## MEDIUM Severity Rules

### Rule 3.1: Inline Object Props (Rerender Triggers)

**Pattern**: Creating new object references on each render.

```typescript
// ❌ BAD: New object every render
<Chart options={{ color: 'blue' }} />

// ✅ GOOD: Stable reference
const chartOptions = useMemo(() => ({ color: 'blue' }), []);
<Chart options={chartOptions} />
```

**Detection Heuristics**:
- Object/array literals in JSX props
- Missing `useMemo`/`useCallback` in list renders

### Rule 3.2: Unstable Callback Props

**Pattern**: Arrow functions in props causing child re-renders.

```typescript
// ❌ BAD: New function every render
<Button onClick={() => handleClick(id)} />

// ✅ GOOD: Stable callback
const handleItemClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleItemClick} />
```

**Detection Heuristics**:
- Arrow functions in frequently-rendered lists
- Missing `useCallback` with stable deps

---

## Configuration

These rules can be tuned via environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `PERF_AUDIT_MAX_FINDINGS` | 200 | Cap findings per run |
| `PERF_AUDIT_SEVERITY_THRESHOLD` | medium | Minimum severity to report |
| `PERF_AUDIT_INCLUDE_PATHS` | `**/*.{ts,tsx}` | Glob for files to scan |

---

## Changelog

- **2026-01-30**: Initial snapshot for Phase 4G launch
