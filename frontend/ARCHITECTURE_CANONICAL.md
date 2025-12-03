# TerraFusion OS - Canonical Architecture

**Status**: ✅ LOCKED IN - One True Shell Implementation
**Date**: November 21, 2025

## Executive Summary

TerraFusion OS now has **ONE canonical shell** with clean architecture:

- ✅ **ONE Shell**: `shell/NativeShell.tsx`
- ✅ **Suite Manifests**: Data-driven suite system in `suites/`
- ✅ **Clean Components**: `shell/SuiteTile.tsx`, `shell/SuiteLauncher.tsx`, `shell/ShellLayout.tsx`
- ✅ **Boring Entrypoint**: `App.tsx` just renders `<NativeShell />`
- ✅ **Archived Duplicates**: Old shells moved to `__archive_old_shells/`
- ✅ **Backend Integration**: WPF ➔ ASP.NET Core ➔ React

## Directory Structure

```
frontend/src/
├── App.tsx                          # ⭐ ENTRYPOINT (boring, renders NativeShell)
├── main.tsx / index.tsx             # React bootstrap
│
├── shell/                           # ⭐ CANONICAL SHELL (new)
│   ├── NativeShell.tsx              # Main shell orchestrator
│   ├── ShellLayout.tsx              # 3-tier layout components
│   ├── SuiteLauncher.tsx            # Suite grid/launcher
│   └── SuiteTile.tsx                # Individual suite card
│
├── suites/                          # ⭐ SUITE MANIFEST SYSTEM (new)
│   ├── types.ts                     # TypeScript interfaces
│   ├── index.ts                     # SUITES registry
│   └── assessment/                  # Suite-specific components
│       └── AssessmentSuite.tsx
│
├── apps/                            # Standalone apps (Emergency, CostForge, etc.)
│   ├── EmergencyEliteQuantumInterface.tsx
│   ├── TerraFlowMinimalTest.tsx
│   └── CostForgeAI.tsx
│
├── styles/                          # Design System V2
│   ├── shell-tokens.css             # Design tokens
│   ├── shell-base.css               # Component styles
│   ├── terrafusion-os.css           # OS theme
│   └── terrafusion-brand.css        # Brand colors
│
├── components/                      # Shared components
├── hooks/                           # React hooks
├── utils/                           # Utilities
├── services/                        # API services
│
└── __archive_old_shells/            # ⚠️ OLD IMPLEMENTATIONS (archived)
    ├── TerraFusionQuantumOS.tsx
    ├── TerraFusionApp.tsx
    ├── TerraFusionApp.backup.tsx
    ├── TerraFusionApp.broken.tsx
    ├── TerraFusionApp.clean.tsx
    └── App.clean.tsx
```

## Architecture Layers

### Layer 1: WPF Native Shell (Windows Host)

**Location**: `native-shell/` (C# WPF project)

**Responsibilities**:
- Windows desktop application
- WebView2 host
- Windows authentication
- Certificate validation
- Security policies

**Entry Point**:
```csharp
// MainWindow.xaml.cs
ShellWebView.CoreWebView2.Navigate("http://localhost:5173"); // Dev
ShellWebView.CoreWebView2.Navigate("http://localhost:5000"); // Prod
```

### Layer 2: ASP.NET Core Backend

**Location**: `backend/TerraFusion.API/`

**Responsibilities**:
- Serve static React files from `wwwroot/`
- REST APIs (`/api/*`)
- TF-Substrate coordination
- Suite lifecycle management

**Entry Point**:
```csharp
// Program.cs
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");
```

### Layer 3: React Frontend (This Repo)

**Location**: `frontend/src/`

**Responsibilities**:
- UI rendering
- Suite orchestration
- User interaction
- API calls to backend

**Entry Point**:
```typescript
// App.tsx
import { NativeShell } from "./shell/NativeShell";
export default function App() {
  return <NativeShell />;
}
```

## Component Flow

### 1. Application Startup

```
User launches WPF Native Shell
  ↓
WPF navigates WebView2 to http://localhost:5000 (or 5173 in dev)
  ↓
ASP.NET Core serves index.html + assets
  ↓
React bootstraps, renders <App />
  ↓
App.tsx renders <NativeShell />
  ↓
NativeShell renders ShellLayout + SuiteLauncher
  ↓
User sees suite tiles
```

### 2. Suite Selection

```
User clicks "Assessment" suite tile
  ↓
SuiteLauncher calls onOpenSuite("assessment")
  ↓
Route changes to #/suite/assessment
  ↓
NativeShell detects route change
  ↓
NativeShell renders suite-specific component (TODO)
  ↓
Suite loads web apps, native modules, engines
  ↓
User works in Assessment suite
```

### 3. Backend API Calls

```
React component needs data
  ↓
Calls fetch("/api/suites")
  ↓
ASP.NET Core handles request
  ↓
Backend coordinates with TF-Substrate (Rust)
  ↓
Returns JSON to React
  ↓
React updates UI
```

## Suite Manifest System

### Suite Definition (Data-Driven)

```typescript
// suites/index.ts
export const SUITES: SuiteManifest[] = [
  {
    id: "assessment",
    label: "Appraisal / Valuation",
    icon: "📊",
    category: "core",
    description: "Mass appraisal, CostForge AI, property workbench.",
    level: "Core",
    hotSwappable: true,
    webApps: ["terra-assessor-production", "costforge-ai"],
    nativeModules: ["assessment-desktop-panel"],
    engines: ["valuation-engine", "gis-engine"],
    apis: ["assessment-api"],
    aiAgents: ["assessment-assistant"],
    permissions: ["ROLE_APPRAISER"],
    accentColor: "#00D9FF",
  },
  // ... 8 more suites
];
```

### Suite Rendering

```typescript
// shell/SuiteLauncher.tsx
SUITES.map((suite) => (
  <SuiteTile
    key={suite.id}
    suite={suite}
    onOpen={handleOpenSuite}
  />
))
```

**Benefits**:
- No hardcoded suite lists
- Easy to add/remove suites
- Backend can override manifests via API
- Hot-swappable suite deployment
- License-based suite filtering

## Routing System

### Hash-Based Routing

```typescript
// NativeShell.tsx
const [currentRoute, setCurrentRoute] = useState<string>("/");

useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash.slice(1) || "/";
    setCurrentRoute(hash);
  };
  window.addEventListener("hashchange", handleHashChange);
}, []);

// Routes:
// #/                    → SuiteLauncher
// #/suite/assessment    → AssessmentSuite
// #/suite/levy          → LevySuite
// #/apps/emergency      → EmergencyApp (future)
```

**Why hash routing?**
- Works with ASP.NET Core `MapFallbackToFile`
- No server-side route configuration needed
- WPF WebView2 handles hashes correctly
- Simple to implement

## Design System Integration

### CSS Architecture

```
shell-tokens.css          ← Design tokens (colors, spacing, typography)
  ↓
shell-base.css            ← Component styles using tokens
  ↓
terrafusion-os.css        ← OS-specific styling
  ↓
terrafusion-brand.css     ← Brand colors and voice
```

### Token Usage

```tsx
<div style={{
  padding: "var(--tf-space-6)",
  fontSize: "var(--tf-text-xl)",
  color: "var(--tf-color-text-primary)",
  backgroundColor: "var(--tf-color-background)",
  borderRadius: "var(--tf-radius-lg)",
}}>
  Content
</div>
```

**Benefits**:
- Consistent spacing (base-8 system)
- Consistent typography (golden ratio scale)
- Consistent colors (terra-cyan theme)
- Easy theme switching
- Accessibility built-in

## Next Steps

### Phase 1: Suite Implementation (Current)

- ✅ Suite manifest system
- ✅ SuiteTile component
- ✅ SuiteLauncher grid
- ⏳ Suite-specific components (AssessmentSuite, LevySuite, etc.)
- ⏳ Backend API endpoints (`/api/suites`)

### Phase 2: App Mounting

- Load web apps in iframes/portals
- Load native modules via WPF interop
- Coordinate engine startup via backend
- AI agent deployment per suite

### Phase 3: Advanced Features

- Window manager (if desktop OS needed)
- Dock system (if desktop OS needed)
- Menu bar (if desktop OS needed)
- Multi-window support
- Inter-app communication

### Phase 4: Backend Integration

- TF-Substrate coordination
- Suite lifecycle APIs
- AI agent management
- Real-time sync status

## FAQ

### Q: What happened to TerraFusionQuantumOS.tsx?

**A**: Archived in `__archive_old_shells/`. We now have ONE shell: `shell/NativeShell.tsx`.

### Q: What happened to the multiple TerraFusionApp variants?

**A**: Archived. App.tsx is now boring and just renders `<NativeShell />`.

### Q: Do we need a desktop OS shell with dock/windows?

**A**: Not immediately. Current architecture (single shell + suite launcher) works for MVP. Desktop OS features can be added later if needed.

### Q: How do suites load their apps?

**A**: Suite-specific components (e.g., `AssessmentSuite.tsx`) will mount web apps, coordinate native modules, and manage engines. Implementation in progress.

### Q: Where is the router?

**A**: Hash-based routing in `NativeShell.tsx`. No React Router needed yet. Can add later if complexity grows.

### Q: How does WPF communicate with React?

**A**: WebView2 provides `window.chrome.webview.postMessage()` for WPF ➔ React and `WebView2.CoreWebView2.WebMessageReceived` for React ➔ WPF. Not implemented yet but available when needed.

## Conclusion

We now have **ONE clean architecture** with:

1. ✅ Canonical shell (`shell/NativeShell.tsx`)
2. ✅ Data-driven suites (`suites/index.ts`)
3. ✅ Clean components (`shell/Suite*.tsx`)
4. ✅ Design System V2 applied
5. ✅ Backend integration documented
6. ✅ Duplicate shells archived

**No more "working all over the place."**

**Government. Transcended.**
