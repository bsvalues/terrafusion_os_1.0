# Shell V2 Quick Reference

## Design Token Categories

### Colors
```css
--tf-color-void: #0A0E1A          /* Background void */
--tf-color-bg: #0F1419            /* Main background */
--tf-color-surface: #1A1F2E       /* Card/panel surfaces */
--tf-color-primary: #00D9FF       /* Primary actions */

/* Suite Accents */
--tf-accent-assessment: #00D9FF   /* Cyan */
--tf-accent-levy: #FFA726         /* Amber */
--tf-accent-gis: #4CAF50          /* Green */
--tf-accent-collections: #26C6DA  /* Teal */
--tf-accent-sync: #7E57C2         /* Purple */
```

### Spacing (Base-8 + Golden Ratio)
```css
--tf-space-2: 0.5rem   /* 8px */
--tf-space-4: 1rem     /* 16px */
--tf-space-6: 1.5rem   /* 24px */
--tf-space-8: 2rem     /* 32px */
--tf-space-golden: 1.618rem  /* φ spacing */
```

### Typography (Golden Ratio Scale)
```css
--tf-text-sm: 0.875rem    /* 14px */
--tf-text-base: 1rem      /* 16px */
--tf-text-lg: 1.236rem    /* ~20px (φ × base) */
--tf-text-xl: 1.618rem    /* ~26px (φ² × base) */
--tf-text-2xl: 2rem       /* 32px */
```

## Component Classes

### Layout
```css
.tf-shell           /* Main OS container */
.tf-topbar          /* Top bar (56px) */
.tf-leftrail        /* Left suite nav (224px) */
.tf-workspace       /* Main content area */
.tf-rightdrawer     /* Right AI drawer (352px) */
```

### Components
```css
.tf-btn             /* Base button */
.tf-btn-primary     /* Primary button (cyan) */
.tf-btn-secondary   /* Secondary button (surface) */
.tf-btn-ghost       /* Ghost button (transparent) */

.tf-card            /* Card container */
.tf-card-header     /* Card header */
.tf-card-title      /* Card title */

.tf-input           /* Form input */
.tf-badge           /* Status badge */
.tf-divider         /* Horizontal divider */
```

### Suite Navigation
```css
.tf-suite-nav-item          /* Nav link */
.tf-suite-nav-item.active   /* Active suite (shows accent) */
.tf-suite-nav-item-icon     /* Suite icon */
.tf-suite-nav-item-badge    /* Notification badge */
```

## Suite-Specific Styling

Apply suite accent via `data-suite` attribute:

```tsx
<div data-suite="assessment">
  {/* Everything here uses --suite-accent = cyan */}
</div>

<div data-suite="levy">
  {/* Everything here uses --suite-accent = amber */}
</div>
```

Active nav items automatically show suite-specific left border and accent color.

## Component Usage

### ShellLayout
```tsx
<ShellLayout
  currentSuite="assessment"
  topBar={<TopBar countyName="Benton" />}
  leftRail={<LeftRail suites={SUITES} />}
  rightDrawer={<RightDrawer>AI content</RightDrawer>}
>
  {/* Main workspace content */}
</ShellLayout>
```

### Buttons
```tsx
<button className="tf-btn tf-btn-primary">Primary Action</button>
<button className="tf-btn tf-btn-secondary">Secondary</button>
<button className="tf-btn tf-btn-ghost">Ghost</button>
```

### Cards
```tsx
<div className="tf-card" data-suite="assessment">
  <div className="tf-card-header">
    <h3 className="tf-card-title">Card Title</h3>
    <p className="tf-card-description">Description</p>
  </div>
  {/* Card content */}
</div>
```

## Suite Accent Colors

| Suite        | ID             | Accent   | Hex     | Use Case              |
|--------------|----------------|----------|---------|------------------------|
| Assessment   | assessment     | Cyan     | #00D9FF | Property valuation     |
| Levy         | levy           | Amber    | #FFA726 | Tax calculations       |
| GIS          | gis            | Green    | #4CAF50 | Maps and geospatial    |
| Collections  | collections    | Teal     | #26C6DA | Payment tracking       |
| Sync         | sync           | Purple   | #7E57C2 | Data synchronization   |
| Flow         | flow           | Blue     | #42A5F5 | Workflow orchestration |
| Insights     | insights       | Pink     | #EC407A | Analytics dashboards   |
| Agent        | agent          | D.Purple | #AB47BC | AI swarm management    |
| Admin        | admin          | B.Gray   | #78909C | System administration  |

## File Locations

```
frontend/src/
├── styles/
│   ├── shell-tokens.css    ← Design tokens (400+ lines)
│   └── shell-base.css      ← Component styles (600+ lines)
└── components/native-shell/
    ├── ShellLayout.tsx     ← Layout components
    └── NativeShell.v2.tsx  ← Shell using design system
```

## Testing Command

```powershell
cd frontend
npm run dev
```

Open: http://localhost:5173

**Look for**:
- Deep blue-gray OS aesthetic (not white)
- Suite navigation in left rail
- Clean launcher grid
- Suite-specific accent colors on click
- Golden ratio typography and spacing
