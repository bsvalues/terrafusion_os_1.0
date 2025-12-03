# Frontend Development - START HERE

## Quick Start

```bash
npm run dev
```

Open: http://localhost:5173

## What You're Building

The **React UI** that gets loaded by the WPF Native Shell.

## File Structure (What Matters)

```
frontend/src/
├── App.tsx                           ← Entry point (imports NativeShell)
├── components/native-shell/          ← YOUR WORK HERE
│   ├── NativeShell.v2.tsx           ← Main shell with design system
│   ├── ShellLayout.tsx              ← Layout components (TopBar, LeftRail, etc.)
│   ├── SuiteLauncher.tsx            ← Home screen
│   ├── SuperpowerCard.tsx           ← Card with explanations
│   ├── ModeToggle.tsx               ← County Staff ↔ Power User
│   ├── AIDrawer.tsx                 ← AI assistant
│   └── suites/
│       ├── AssessmentSuite.tsx      ← Assessment domain
│       ├── LevySuite.tsx            ← (TODO)
│       └── GISSuite.tsx             ← (TODO)
└── styles/
    ├── shell-tokens.css             ← Design system tokens
    └── shell-base.css               ← Component styles
```

## Design System V2

**Color Scheme**: Deep blue-gray OS aesthetic (not white SaaS)
**Typography**: Golden ratio scaling (φ = 1.618)
**Spacing**: Base-8 system
**Suite Accents**: 9 colors (assessment cyan, levy amber, gis green...)

## Current Status

✅ Design system created (tokens + base styles)
✅ ShellLayout with 3-tier structure
✅ NativeShell.v2 using design system
✅ AssessmentSuite with 3 SuperpowerCards
⏳ Visual testing needed
❌ More suites (Levy, GIS, Collections...)

## To Test Your Changes

**Dev mode**: `npm run dev` (hot reload, fast)

**Production mode** (what users see):
```bash
npm run build
cd ../backend
dotnet run --project TerraFusion.API
cd ../native-shell
dotnet run
```

## The Goal

"Calm OS, not busy SaaS dashboard"
- High signal, low noise
- Suite-specific visual identity
- Professional government-grade quality
- "Feels inevitable, not just good enough"

## Stop Here

This is the ONLY place you should be working for UI/UX.
Everything else is infrastructure that's already done.
