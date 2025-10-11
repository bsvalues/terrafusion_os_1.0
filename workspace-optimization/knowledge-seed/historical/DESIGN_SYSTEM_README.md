# TerraFusion Design System - Everything Pack 🎨

**Constitutional governance for sovereign design.** Complete design token infrastructure with cryptographic audit ledger, dual CLI tooling (Node + Rust), shader integration, marketplace auto-branding, and CI/CD validation.

---

## 📦 What's Inside

### 1. **Canonical Token File** (`design/tokens.json`)
Single source of truth for the entire design system:
- **Colors**: `terra-primary` (#4A6FDC), `terra-bg`, `terra-surface`, `terra-white`, `terra-alert`
- **Typography**: Inter font family, 5-step Fibonacci scale (8px → 55px)
- **Geometry**: Border radii (soft/dock), golden ratio (φ = 1.618)
- **Motion**: Harmonic easing curves, 3-tier duration scale (250ms–750ms)

### 2. **Node CLI** (`tools/tf-designctl-node/`)
**Immediate-use tooling** for rapid iteration:
```bash
npm install
node bin/tf-designctl.js validate -t design/tokens.json
node bin/tf-designctl.js sync design-sync -t design/tokens.json
node bin/tf-designctl.js watch design-sync -t design/tokens.json
```

**Generates**:
- `tokens.css` - CSS custom properties
- `tailwind.config.js` - Tailwind theme extension
- `theme.tsx` - React ThemeProvider component
- `figma-tokens.json` - Figma plugin import format

### 3. **Rust CLI** (`tools/tf-designctl-rust/`)
**Sovereign long-term tooling** with zero external dependencies:
```bash
cargo build --release
./target/release/tf-designctl validate -t design/tokens.json
./target/release/tf-designctl sync design-sync -t design/tokens.json
./target/release/tf-designctl watch design-sync -t design/tokens.json
```

Both CLIs provide **identical functionality** - choose Node for speed, Rust for sovereignty.

### 4. **WGSL Shader Constants** (`shaders/tokens.wgsl`)
Design tokens exported as **GPU shader constants** for the sovereign shell:
```wgsl
const TERRA_PRIMARY: vec4<f32> = vec4<f32>(0.290, 0.435, 0.863, 1.0);
const BLUR_RADIUS: f32 = 12.0;
const GLOW_INTENSITY: f32 = 0.60;
const PHI: f32 = 1.618;
```

Used by WGPU compositor for glass morphism, glows, and harmonic animations.

### 5. **Architecture Codex** (`docs/architecture_codex.svg`)
**7-layer system architecture** visualization:
1. OS Primitives (Linux, Docker)
2. Hardware Substrate (GPU, Kubernetes)
3. Quantum-Inspired Core
4. Sovereign Shell (WGPU + design tokens)
5. WASM Runtime
6. AI Swarm Orchestration
7. **Trust Fabric** (cryptographic ledger)

φ-axis aligned for visual harmony. Ready for posters/presentations.

### 6. **Marketplace Branding Templates** (`marketplace/templates/`)
**Auto-branded plugin assets**:
- `overlay_frame.svg` (640x360) - Wire-frame overlay for screenshots
- `tile_template.svg` (320x200) - Preview card template

Variables like `var(--terra-primary)` auto-inject brand colors. Consistent presentation across all marketplace plugins.

### 7. **Trust Fabric** (`trust-fabric/`)
**Cryptographic audit ledger** for design sovereignty:
- Every `tokens.json` change recorded with SHA256 fingerprint
- Ed25519 signatures for tamper-proof history
- Actor attribution + change justification
- Policy hooks: pre-commit validation, CI verification

See `trust-fabric/design-ledger.md` for full spec.

### 8. **CI/CD Pipeline** (`.github/workflows/designctl.yml`)
**Automated validation & artifact publishing**:
- ✅ Token integrity validation (Node CLI)
- ✅ Cross-platform Rust build
- ✅ Design-sync artifact generation
- 🔲 Ledger signature verification (TODO)

Runs on every PR touching `design/tokens.json`.

---

## 🚀 Quick Start

### Option 1: Node CLI (Fastest)
```bash
cd tools/tf-designctl-node
npm install
chmod +x bin/tf-designctl.js

# Validate tokens
node bin/tf-designctl.js validate -t ../../design/tokens.json

# Generate all outputs
node bin/tf-designctl.js sync ../../design-sync -t ../../design/tokens.json

# Watch for changes
node bin/tf-designctl.js watch ../../design-sync -t ../../design/tokens.json
```

### Option 2: Rust CLI (Most Sovereign)
```bash
cd tools/tf-designctl-rust
cargo build --release

# Validate tokens
./target/release/tf-designctl validate -t ../../design/tokens.json

# Generate CSS output
./target/release/tf-designctl sync ../../design-sync -t ../../design/tokens.json
```

### Option 3: CI/CD (Automated)
Push changes to `design/tokens.json` → GitHub Actions validates, builds, and publishes artifacts automatically.

---

## 🎯 Design Token Pipeline

```
design/tokens.json (SOURCE OF TRUTH)
        │
        ├─→ Node/Rust CLI Validation
        │
        ├─→ CSS Custom Properties (tokens.css)
        ├─→ Tailwind Config (tailwind.config.js)
        ├─→ React Theme (theme.tsx)
        ├─→ Figma Tokens (figma-tokens.json)
        ├─→ WGSL Shader Constants (shaders/tokens.wgsl)
        │
        ├─→ Marketplace SVG Templates (auto-branded)
        │
        └─→ Trust Fabric Ledger Entry (SHA256 + Ed25519)
```

---

## 📐 Design Token Schema

```json
{
  "colors": {
    "terra-primary": "#4A6FDC",  // Primary brand color
    "terra-bg": "#000000",        // Background (pure black)
    "terra-surface": "rgba(255, 255, 255, 0.05)",  // Glass morphism
    "terra-white": "#FFFFFF",     // Text/icons
    "terra-alert": "#FF4444"      // Error states
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "scale": {
      "xs": "8px",    // Fibonacci progression
      "sm": "13px",   // (each step ≈ φ ratio)
      "base": "21px",
      "lg": "34px",
      "xl": "55px"
    }
  },
  "geometry": {
    "borderRadius": {
      "soft": "6px",   // Subtle rounding
      "dock": "12px"   // Pronounced rounding
    },
    "phi": 1.618       // Golden ratio constant
  },
  "motion": {
    "easeHarmonic": "cubic-bezier(0.42, 0, 0.18, 1)",  // Natural motion
    "duration": {
      "quick": "250ms",   // Micro-interactions
      "normal": "500ms",  // Standard transitions
      "slow": "750ms"     // Emphasis/reveals
    }
  }
}
```

---

## 🔐 Trust Fabric Usage

### Recording a Design Change
```bash
# 1. Modify design/tokens.json
# 2. Generate fingerprint
sha256sum design/tokens.json > .trust-fabric/latest-fingerprint

# 3. Sign with Ed25519 key
openssl pkeyutl -sign -inkey .trust-fabric/signing-key.pem \
  -in .trust-fabric/latest-fingerprint \
  -out .trust-fabric/latest-signature

# 4. Commit ledger entry
git add trust-fabric/ledger/$(date +%Y-%m-%d-%H%M%S).json
git commit -m "design: Update terra-primary for WCAG AAA compliance"
```

### Verifying Design Integrity
```bash
# CI pipeline verifies signature matches public key
openssl pkeyutl -verify -pubin -inkey .trust-fabric/public-key.pem \
  -sigfile .trust-fabric/latest-signature \
  -in .trust-fabric/latest-fingerprint
```

---

## 🛠️ File Structure

```
terrafusion_os_1.0/
├── design/
│   └── tokens.json              # 🎯 CANONICAL TOKEN FILE
├── design-sync/                 # Generated outputs (gitignored)
│   ├── tokens.css
│   ├── tailwind.config.js
│   ├── theme.tsx
│   └── figma-tokens.json
├── tools/
│   ├── tf-designctl-node/       # Node.js CLI
│   │   ├── package.json
│   │   └── bin/tf-designctl.js
│   └── tf-designctl-rust/       # Rust CLI
│       ├── Cargo.toml
│       └── src/main.rs
├── shaders/
│   └── tokens.wgsl              # GPU shader constants
├── docs/
│   └── architecture_codex.svg   # 7-layer architecture poster
├── marketplace/
│   └── templates/
│       ├── overlay_frame.svg    # Screenshot overlay
│       └── tile_template.svg    # Plugin preview card
├── trust-fabric/
│   ├── design-ledger.md         # Cryptographic audit spec
│   └── examples/
│       └── entry-2025-10-02.json
└── .github/
    └── workflows/
        └── designctl.yml        # CI/CD pipeline
```

---

## 🎨 Using Design Tokens

### In CSS
```css
@import url('design-sync/tokens.css');

.button {
  background: var(--terra-primary);
  color: var(--terra-white);
  border-radius: var(--border-radius-soft);
  transition: all var(--duration-quick) var(--ease-harmonic);
}
```

### In Tailwind
```javascript
// tailwind.config.js
import terraTokens from './design-sync/tailwind.config.js';
export default terraTokens;
```
```html
<button class="bg-terra-primary text-terra-white rounded-soft transition-quick ease-harmonic">
  Click Me
</button>
```

### In React
```tsx
import { ThemeProvider, useTheme } from './design-sync/theme';

function App() {
  return (
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );
}

function MyComponent() {
  const theme = useTheme();
  return <div style={{ color: theme.colors['terra-primary'] }}>Hello</div>;
}
```

### In Figma
1. Install **Figma Tokens** plugin
2. Import `design-sync/figma-tokens.json`
3. Tokens auto-sync to Figma styles

### In WGPU Shaders
```wgsl
// shaders/my-shader.wgsl
#import "tokens.wgsl"

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return TERRA_PRIMARY * GLOW_INTENSITY;
}
```

---

## 🔮 Future Enhancements

- [ ] **Contrast Audit Script**: WCAG AAA compliance checker
- [ ] **WGSL Generator**: Auto-derive shader constants from `tokens.json`
- [ ] **Poster Export**: SVG → PNG pipeline for `architecture_codex.svg`
- [ ] **Ledger Signing Script**: Automated pre-commit hook integration
- [ ] **Multi-Theme Support**: Light/dark/high-contrast variants
- [ ] **Animation Presets**: Predefined motion curves library

---

## 📜 Philosophy

**Design tokens are constitutional law.** Every pixel, color, and animation follows from a single canonical source (`tokens.json`). Changes are:

1. **Validated** - Schema enforcement prevents invalid values
2. **Audited** - Cryptographic ledger records all modifications
3. **Propagated** - Auto-generated outputs ensure consistency
4. **Sovereign** - Rust CLI provides zero-dependency tooling

This isn't just a design system - it's **design governance**.

---

## 🏆 Benefits

✅ **Single Source of Truth** - One file to rule them all  
✅ **Zero Drift** - Generated outputs always in sync  
✅ **Constitutional Governance** - Cryptographic audit trail  
✅ **Cross-Platform** - CSS, Tailwind, React, Figma, WGSL  
✅ **Dual Tooling** - Node (fast) + Rust (sovereign)  
✅ **CI/CD Ready** - Automated validation & publishing  
✅ **Marketplace Branding** - Auto-inject brand identity  
✅ **GPU Integration** - Shader constants for sovereign shell  

---

## 📞 Support

- **Documentation**: `trust-fabric/design-ledger.md`
- **Examples**: `trust-fabric/examples/`
- **Architecture**: `docs/architecture_codex.svg`
- **CI Pipeline**: `.github/workflows/designctl.yml`

---

**TerraFusion Design System v1.0.0**  
*Constitutional governance for sovereign design*  
🎯 Design tokens → 🔐 Trust Fabric → 🚀 Everything, Everywhere, All at Once
