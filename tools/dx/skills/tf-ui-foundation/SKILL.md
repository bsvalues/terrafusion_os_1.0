---
id: tf-ui-foundation
name: Government UI Foundation
version: 1.0.0
ownerLane: dev
riskLevel: read
triggers:
  - manual
  - component-generation
inputs:
  - component-name
  - variant
outputs:
  - component-code
  - style-tokens
dependencies: []
tags: [ui, components, wcag, government, shadcn, radix]
---

# Government UI Foundation

Provides TerraFusion's government-grade UI component patterns built on shadcn/ui + Radix primitives with Tailwind CSS 4.1.

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `terra-midnight` | `#0f172a` | Primary background |
| `terra-cyan` | `#06b6d4` | Primary accent, interactive elements |
| `terra-slate` | `#334155` | Secondary background, cards |
| `terra-emerald` | `#10b981` | Success states, healthy indicators |
| `terra-amber` | `#f59e0b` | Warning states, degraded indicators |
| `terra-red` | `#ef4444` | Error states, critical indicators |
| `terra-white` | `#f8fafc` | Text on dark backgrounds |

## Component Patterns

### Card Pattern
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card className="bg-terra-slate border-terra-cyan/20">
  <CardHeader>
    <CardTitle className="text-terra-white">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-terra-white/80">
    Content
  </CardContent>
</Card>
```

### Button Variants
```tsx
import { Button } from '@/components/ui/button';

// Primary action
<Button className="bg-terra-cyan hover:bg-terra-cyan/90 text-terra-midnight">
  Submit
</Button>

// Destructive action (requires confirmation)
<Button variant="destructive" className="bg-terra-red hover:bg-terra-red/90">
  Delete Record
</Button>

// Government action (elevated styling)
<Button className="bg-terra-emerald hover:bg-terra-emerald/90 text-white font-semibold">
  Approve Assessment
</Button>
```

### Data Table Pattern
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table className="border border-terra-cyan/20">
  <TableHeader className="bg-terra-midnight">
    <TableRow>
      <TableHead className="text-terra-cyan">Parcel ID</TableHead>
      <TableHead className="text-terra-cyan">Owner</TableHead>
      <TableHead className="text-terra-cyan text-right">Assessed Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-terra-slate/50">
      <TableCell className="text-terra-white font-mono">10-0505-001</TableCell>
      <TableCell className="text-terra-white/80">Smith, John</TableCell>
      <TableCell className="text-terra-white text-right">$245,000</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Form Pattern (Government Compliance)
```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

<div className="space-y-2">
  <Label htmlFor="parcel-id" className="text-terra-white">
    Parcel ID <span className="text-terra-red">*</span>
  </Label>
  <Input
    id="parcel-id"
    placeholder="XX-XXXX-XXX"
    className="bg-terra-midnight border-terra-cyan/30 text-terra-white"
    aria-required="true"
    aria-describedby="parcel-id-help"
  />
  <p id="parcel-id-help" className="text-sm text-terra-white/60">
    Enter the 10-digit parcel identification number
  </p>
</div>
```

## Import Aliases

All components use path aliases configured in `tsconfig.json`:
- `@/components/ui/*` → `frontend/src/components/ui/*`
- `@/hooks/*` → `frontend/src/hooks/*`
- `@/services/*` → `frontend/src/services/*`
- `@/lib/*` → `frontend/src/lib/*`

## Accessibility Requirements

- All interactive elements must have visible focus indicators
- Color contrast ratio must meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
- All form inputs must have associated labels
- All images must have alt text
- Keyboard navigation must work for all interactive elements
- Screen reader announcements for dynamic content changes
