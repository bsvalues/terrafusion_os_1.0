# Shell Navigation Contract

> **Version:** 1.0.0  
> **Scope:** os-shell as canonical entry frame  
> **Last updated:** 2026-02-05

---

## Purpose

This contract defines how all TerraFusion suites integrate with os-shell for:
- Navigation & routing
- Deep-linking
- Session & auth handoff
- Error handling
- Trace propagation

---

## 1. Route Structure

### Base Pattern
```
/suites/<suite-id>/<workflow>/<params>
```

### Examples
```
/suites/terra-prime             → Property viewer home
/suites/terra-prime/search      → Property search
/suites/terra-prime/parcel/123  → Specific parcel view
/suites/terraforge              → AI valuation home
/suites/terraforge/appeal/456   → Specific appeal case
```

### Reserved Routes
| Route | Purpose |
|-------|---------|
| `/` | Desktop shell (default) |
| `/pilot` | Governance choke point |
| `/pilot/*` | Pilot subsystem |
| `/monitoring` | System monitoring |
| `/suites/*` | Suite wrappers |
| `/gen2/*` | Legacy gen2 routes (deprecating) |

---

## 2. Suite Integration Modes

### Mode A: Embedded Component
Suite is a React component imported directly into os-shell.

```tsx
// Router.tsx
<Route path="/suites/terra-prime/*" element={<TerraPrimeSuite />} />
```

**Pros:** Full control, shared context  
**Cons:** Requires suite to be part of shell build

### Mode B: Iframe Bridge
Suite runs on separate port, iframe embedded with message bridge.

```tsx
// TerraPrimeSuite.tsx
<IframeBridge 
  src={`http://localhost:${TF_TERRAPRIME_PORT || 5184}`}
  onError={(e) => handleError(e)}
  sessionToken={session.token}
/>
```

**Pros:** Isolation, independent deploys  
**Cons:** Complex message passing, CORS

### Mode C: Module Federation
Suite as remote entry via Webpack Module Federation.

**Status:** Not yet implemented. Future phase.

---

## 3. Session Handoff

### Current Pattern (Mode B)
1. Shell holds session token in context
2. Iframe receives token via URL param or postMessage
3. Suite validates token against Pilot API

### Token Format
```typescript
interface SessionToken {
  userId: string;
  expires: number;
  signature: string;
}
```

### Handoff Protocol
```typescript
// Shell → Suite (postMessage)
window.frames['suite-frame'].postMessage({
  type: 'TF_SESSION_HANDOFF',
  payload: { token, correlationId }
}, targetOrigin);

// Suite → Shell (postMessage)
parent.postMessage({
  type: 'TF_ERROR',
  payload: { correlationId, error }
}, parentOrigin);
```

---

## 4. Error Handling Contract

### All Errors Must Include
```typescript
interface SuiteError {
  correlationId: string;  // Format: corr-* | net-* | ebnd-*
  message: string;        // User-friendly message
  code: string;           // ENUM: NETWORK, AUTH, VALIDATION, HANDLER, UNKNOWN
  retryable: boolean;
  timestamp: string;
}
```

### Error Display Requirements
- **Always show:** correlationId (copyable)
- **Dev mode:** Show trace query hint
- **Retry button:** If `retryable === true`

### ErrorBoundary Requirement
Every suite wrapper MUST be wrapped:
```tsx
<ErrorBoundary FallbackComponent={SuiteErrorFallback}>
  <Suspense fallback={<SuiteLoader />}>
    <TerraPrimeSuite />
  </Suspense>
</ErrorBoundary>
```

---

## 5. Trace Propagation

### HTTP Headers
All API calls from suites MUST include:
```
X-Correlation-Id: <correlationId>
X-Suite-Id: <suite-id>
X-Session-Token: <token>
```

### Trace Query
```bash
pnpm run trace:query --correlation <correlationId>
```

---

## 6. Deep Link Protocol

### External Deep Links
Users can share links like:
```
https://terrafusion.county.gov/suites/terra-prime/parcel/123
```

### Suite-to-Suite Navigation
```typescript
// From TerraForge, open parcel in TerraPrime
navigate('/suites/terra-prime/parcel/123', { 
  state: { returnTo: '/suites/terraforge/appeal/456' }
});
```

### Shell Notification
When a suite wants to show a notification:
```typescript
parent.postMessage({
  type: 'TF_NOTIFY',
  payload: { 
    level: 'success' | 'warning' | 'error',
    message: 'Appeal saved successfully',
    correlationId 
  }
}, parentOrigin);
```

---

## 7. Desktop Icon Contract

### Module Manifest Fields
```typescript
interface ModuleManifest {
  id: string;                    // Unique identifier
  displayName: string;           // Icon label
  icon?: string;                 // Icon URL or component name
  intent: 'gen2' | 'legacy' | 'archive';
  status: 'active' | 'maintenance' | 'deprecated';
  runnable: boolean;
  entry: {
    type: 'route' | 'url';
    route?: string;              // For type=route: shell route
    url?: string;                // For type=url: external URL
  };
}
```

### Icon Click Behavior
1. `type: 'route'` → `navigate(entry.route)`
2. `type: 'url'` → Open in shell iframe or new tab (based on config)

---

## 8. Deprecation Banners

### For Legacy Suites
```tsx
<DeprecationBanner
  suite="costforge-ai"
  message="CostForge AI is being replaced by TerraForge"
  migrateTo="/suites/terraforge"
  deadline="2026-Q2"
/>
```

### Banner Requirement
All legacy modules MUST show deprecation banner on load.

---

## 9. Testing Requirements

### Every Suite Wrapper Must Have
1. **Smoke test:** Suite loads without crash
2. **Error test:** ErrorBoundary catches and displays correlationId
3. **Session test:** Token handoff works
4. **Deep link test:** Direct URL access works

### Test Location
```
frontend/apps/os-shell/src/__tests__/suites/<suite-id>.test.tsx
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial contract |

---

*Government. Transcended.*
