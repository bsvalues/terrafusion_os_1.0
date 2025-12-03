# TerraFusion OS - Final Architecture (NO MORE CONFUSION)

## The Stack (Bottom to Top)

### 1. WPF Native Shell (`native-shell/`)
- **What**: C# WPF desktop app with WebView2
- **Does**: 
  - Windows authentication
  - Certificate validation
  - Security policies
  - Loads `http://localhost:5000/index.html` in WebView2
- **Don't touch this**: It's working

### 2. Backend API (`backend/`)
- **What**: .NET 8 ASP.NET Core
- **Does**:
  - Serves static files from `frontend/dist/`
  - Provides REST APIs
  - Runs on port 5000
- **Build**: `dotnet run --project TerraFusion.API`

### 3. Frontend React UI (`frontend/`)
- **What**: React 18 + Vite + TypeScript
- **Does**:
  - Suite System (what you see)
  - Design System V2 (the styling)
  - Dual-mode UX
  - SuperpowerCards
- **Dev**: `npm run dev` (port 5173 for hot reload)
- **Build**: `npm run build` → outputs to `dist/`

## The Flow

```
User double-clicks TerraFusion icon
    ↓
native-shell/Terrafusion.Shell.exe launches
    ↓
WebView2 loads http://localhost:5000/index.html
    ↓
Backend serves frontend/dist/index.html
    ↓
React UI renders inside WebView2
    ↓
User sees Suite System with Design System V2
```

## What You Care About (UI/UX)

**Work in**: `frontend/src/components/native-shell/`

**Files**:
- `NativeShell.v2.tsx` - Main shell with design system
- `ShellLayout.tsx` - Layout components
- `suites/AssessmentSuite.tsx` - Suite implementations
- `SuperpowerCard.tsx` - Card components

**Styles**:
- `frontend/src/styles/shell-tokens.css` - Design tokens
- `frontend/src/styles/shell-base.css` - Component styles

## To See Your Work

**Option A: Dev Mode (Fast iteration)**
```bash
cd frontend
npm run dev
```
Open: http://localhost:5173

**Option B: Production Mode (What users see)**
```bash
# Terminal 1: Build frontend
cd frontend
npm run build

# Terminal 2: Run backend
cd backend
dotnet run --project TerraFusion.API

# Terminal 3: Run native shell
cd native-shell
dotnet run
```

The WPF window opens with your React UI inside.

## Stop Working All Over The Place

**ONE PLACE**: `frontend/src/components/native-shell/`

That's it. That's where the UI/UX lives.
