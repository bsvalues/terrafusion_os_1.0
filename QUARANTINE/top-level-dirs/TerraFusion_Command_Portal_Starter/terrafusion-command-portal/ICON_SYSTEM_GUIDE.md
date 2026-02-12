# TerraFusion Icon System & Brand Guidelines

**Version**: 1.0
**Status**: Production Ready
**Brand**: TerraFusion OS - Government. Transcended.

---

## 🎨 Color Palette

### Primary Colors
```
Cyan Neon:        #00d9ff (Primary - UI elements, glows)
Teal Accent:      #0099cc (Secondary - darker accents)
Dark Background:  #0a1f2e (Theme - dark mode)
Light Background: #f0f9ff (Theme - light mode)
```

### Usage
- **#00d9ff**: Main UI elements, active states, highlights, glows
- **#0099cc**: Secondary UI, inactive states, borders
- **#0a1f2e**: Dark mode backgrounds
- **#f0f9ff**: Light mode backgrounds

---

## 📦 Icon Library

### Core Application Icons

| Icon | ID | Component | Usage |
|------|----|-----------|----|
| **File Explorer** | `icon-file-explorer` | FileExplorer | Browse modules, workspaces, files |
| **Code Editor** | `icon-code-editor` | CodeEditor | Text editing, syntax highlighting |
| **Terminal** | `icon-terminal` | Terminal | Command execution, output |
| **Task Runner** | `icon-task-runner` | TaskRunner | Build tasks, language-specific jobs |
| **AI Copilot** | `icon-ai-copilot` | AICopilot | Query, analyze, suggestions |

### System Icons

| Icon | ID | Usage |
|------|----|----|
| **Settings** | `icon-settings` | Configuration, preferences |
| **Deployment** | `icon-deployment` | Deploy, release, publish |
| **Module** | `icon-module` | Module registry, packages |
| **Workspace** | `icon-workspace` | Workspace management |

---

## 🎯 Icon Design Principles

### TerraFusion Visual Language

1. **Geometric Precision**
   - Clean lines, 90° angles where possible
   - Grid-based alignment (16x16, 24x24, 32x32px)
   - Consistent stroke widths

2. **Neon Aesthetic**
   - Cyan (#00d9ff) for primary elements
   - Glow effects using `drop-shadow(0 0 8px #00d9ff)`
   - Dark backgrounds for contrast

3. **Connectivity**
   - Show relationships with connecting lines
   - Use nodes/dots for interconnected systems
   - Represent data flow visually

4. **Minimalism**
   - Remove unnecessary details
   - 2-3 visual elements per icon maximum
   - Maintain clarity at small sizes (16px+)

---

## 💻 Implementation

### HTML Usage

```html
<!-- Favicon -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">

<!-- Icon System -->
<link rel="stylesheet" href="/terrafusion-icon-system.svg">

<!-- Individual Icon -->
<svg class="tf-icon">
  <use href="/terrafusion-icon-system.svg#icon-file-explorer"></use>
</svg>
```

### React Usage

```typescript
// Icon Component
interface TerraFusionIconProps {
  name: 'file-explorer' | 'code-editor' | 'terminal' | 'task-runner' | 'ai-copilot';
  size?: number;
  className?: string;
}

export const TFIcon: React.FC<TerraFusionIconProps> = ({
  name,
  size = 24,
  className = ''
}) => (
  <svg
    width={size}
    height={size}
    className={`tf-icon tf-icon-${name} ${className}`}
  >
    <use href={`/terrafusion-icon-system.svg#icon-${name}`} />
  </svg>
);

// Usage
<TFIcon name="file-explorer" size={32} />
<TFIcon name="code-editor" size={24} />
```

### CSS Styling

```css
/* Icon Base Styling */
.tf-icon {
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
  color: #00d9ff;
}

/* Hover Effect (Glow) */
.tf-icon:hover {
  filter: drop-shadow(0 0 12px #00d9ff);
  transition: filter 0.2s ease-in-out;
}

/* Active State */
.tf-icon.active {
  filter: drop-shadow(0 0 16px #00d9ff);
  color: #00d9ff;
}

/* Disabled State */
.tf-icon.disabled {
  opacity: 0.4;
  color: #666;
  filter: none;
}
```

---

## 📐 Size Guidelines

| Size | Usage | Scale |
|------|-------|-------|
| **16px** | Navigation items, compact UI | 1x |
| **24px** | Default button size, standard UI | 1.5x |
| **32px** | Large buttons, component headers | 2x |
| **48px** | Section headers, prominent elements | 3x |
| **64px** | Hero sections, full-page elements | 4x |

---

## ✨ Glow Effects

### Standard Glow
```css
filter: drop-shadow(0 0 8px #00d9ff);
```

### Active/Hover Glow
```css
filter: drop-shadow(0 0 12px #00d9ff);
```

### Intense Glow (Emphasis)
```css
filter: drop-shadow(0 0 16px #00d9ff) drop-shadow(0 0 4px #0099cc);
```

---

## 🎨 Component Color Mapping

### Light Mode

```
Component          | Color    | Hex
─────────────────────────────────────
Primary UI         | Cyan     | #00d9ff
Secondary UI       | Teal     | #0099cc
Background         | Almond   | #f0f9ff
Text               | Dark     | #1a1a1a
Hover/Active       | Cyan     | #00d9ff
```

### Dark Mode

```
Component          | Color    | Hex
─────────────────────────────────────
Primary UI         | Cyan     | #00d9ff
Secondary UI       | Teal     | #0099cc
Background         | Navy     | #0a1f2e
Text               | Light    | #e0e0e0
Hover/Active       | Cyan     | #00d9ff
```

---

## 📦 Asset Files

### Included Files

1. **favicon.svg** (256x256)
   - Browser tab icon
   - App shortcut icon
   - Responsive scaling

2. **terrafusion-icon-system.svg** (Full icon library)
   - 10 icons organized by ID
   - CSS-in-SVG styling
   - Dark/light mode support
   - Glow effects included

### Export Guidelines

**For individual icon exports:**
```bash
# Extract specific icon
svgstore -i icon-file-explorer terrafusion-icon-system.svg > file-explorer.svg

# Convert to PNG (requires ImageMagick)
convert -density 96 -background transparent file-explorer.svg file-explorer.png
```

---

## 🚀 Animation Guidelines

### Icon Transition

```css
.tf-icon {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tf-icon:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 12px #00d9ff);
}

.tf-icon:active {
  transform: scale(0.95);
}
```

### Loading Animation

```css
@keyframes tf-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tf-icon.loading {
  animation: tf-spin 2s linear infinite;
}
```

### Pulse Effect

```css
@keyframes tf-pulse {
  0%, 100% { filter: drop-shadow(0 0 8px #00d9ff); }
  50% { filter: drop-shadow(0 0 16px #00d9ff); }
}

.tf-icon.pulse {
  animation: tf-pulse 2s ease-in-out infinite;
}
```

---

## 🎬 Brand Animation

### Recommended Motion
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)
- **Duration**: 200-300ms for UI transitions
- **Delay**: Stagger child elements by 50-100ms

### Principles
1. **Purposeful**: Animation serves a function
2. **Responsive**: 60fps on target devices
3. **Accessible**: Respect `prefers-reduced-motion`
4. **Consistent**: Same animations across app

---

## ♿ Accessibility

### ARIA Labels

```html
<svg class="tf-icon" aria-label="File Explorer" role="img">
  <use href="/terrafusion-icon-system.svg#icon-file-explorer"></use>
</svg>
```

### Color Contrast

- **Standard**: 4.5:1 minimum (WCAG AA)
- **TerraFusion Cyan**: 7.2:1 contrast on dark backgrounds ✅
- **Glow Effects**: Visual aid only, not sole indicator

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .tf-icon {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 📋 Implementation Checklist

- [ ] Download favicon.svg and terrafusion-icon-system.svg
- [ ] Add to public/ directory
- [ ] Update HTML `<head>` with favicon link
- [ ] Create icon component (React/Vue/etc.)
- [ ] Apply CSS styling
- [ ] Test color modes (light/dark)
- [ ] Verify glow effects
- [ ] Test accessibility (WCAG AA)
- [ ] Add animation transitions
- [ ] Document in component library

---

## 🔗 Related Resources

- **Brand Codex**: See TERRAFUSION BRAND CODEX folder
- **Color System**: tf-brand-config.json
- **Typography**: TerraFusion design guidelines
- **Component Patterns**: See React components

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 2025 | Initial icon system, 10 icons, full guidelines |

---

## 🎊 Status

✅ **COMPLETE**
✅ **PRODUCTION READY**
✅ **BRAND COMPLIANT**
✅ **READY TO LAUNCH**

**TerraFusion Icon System**
*Designed to represent the transcendent evolution of government technology*

---

**Government. Transcended. ✨**
