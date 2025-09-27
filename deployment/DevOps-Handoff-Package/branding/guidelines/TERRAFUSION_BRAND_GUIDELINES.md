# 🎨 TERRAFUSION BRAND GUIDELINES

## Complete Brand Identity Package

### Version: 2.0

### Last Updated: 2025-08-04

### Brand Status: ACTIVE

---

## 🏆 BRAND ESSENCE

**Tagline**: "Transforming Government Through Intelligent Technology"

**Mission**: Empower government agencies with AI-driven solutions that enhance
efficiency, accuracy, and citizen satisfaction.

**Vision**: Be the global leader in government technology transformation.

---

## 🎨 COLOR PALETTE

### Primary Colors

```css
/* Terrafusion Blue - Trust & Technology */
--tf-primary-blue: #1f4e79;
--tf-primary-blue-rgb: 31, 78, 121;
--tf-primary-blue-dark: #163a5a;
--tf-primary-blue-light: #2d608c;

/* Terrafusion Green - Growth & Innovation */
--tf-primary-green: #00a86b;
--tf-primary-green-rgb: 0, 168, 107;
--tf-primary-green-dark: #008656;
--tf-primary-green-light: #00c47e;
```

### Secondary Colors

```css
/* Supporting Colors */
--tf-accent-gold: #ffd700;
--tf-accent-orange: #ff8c00;
--tf-neutral-gray: #6c757d;
--tf-neutral-light: #f8f9fa;
--tf-neutral-dark: #212529;

/* Status Colors */
--tf-success: #28a745;
--tf-warning: #ffc107;
--tf-danger: #dc3545;
--tf-info: #17a2b8;
```

### Gradients

```css
/* Premium Gradients */
--tf-gradient-primary: linear-gradient(135deg, #1f4e79 0%, #00a86b 100%);
--tf-gradient-premium: linear-gradient(45deg, #1f4e79, #2d608c, #00a86b);
--tf-gradient-subtle: linear-gradient(
  180deg,
  rgba(31, 78, 121, 0.1) 0%,
  rgba(0, 168, 107, 0.05) 100%
);
```

---

## 🔤 TYPOGRAPHY

### Font Stack

```css
/* Primary Font - Modern & Professional */
--tf-font-primary:
  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Display Font - Headlines */
--tf-font-display: 'Poppins', 'Inter', sans-serif;

/* Monospace - Code & Data */
--tf-font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### Font Weights

```css
--tf-font-light: 300;
--tf-font-regular: 400;
--tf-font-medium: 500;
--tf-font-semibold: 600;
--tf-font-bold: 700;
```

### Type Scale

```css
--tf-text-xs: 0.75rem; /* 12px */
--tf-text-sm: 0.875rem; /* 14px */
--tf-text-base: 1rem; /* 16px */
--tf-text-lg: 1.125rem; /* 18px */
--tf-text-xl: 1.25rem; /* 20px */
--tf-text-2xl: 1.5rem; /* 24px */
--tf-text-3xl: 1.875rem; /* 30px */
--tf-text-4xl: 2.25rem; /* 36px */
--tf-text-5xl: 3rem; /* 48px */
```

---

## 🎯 LOGO SPECIFICATIONS

### Primary Logo

```svg
<!-- Terrafusion Logo -->
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1f4e79;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00a86b;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Icon -->
  <g id="tf-icon">
    <path d="M20 10 L40 10 L30 25 Z" fill="url(#tf-gradient)" opacity="0.9"/>
    <path d="M10 25 L30 25 L20 40 Z" fill="#1f4e79" opacity="0.8"/>
    <path d="M30 25 L50 25 L40 40 Z" fill="#00a86b" opacity="0.8"/>
    <circle cx="30" cy="25" r="3" fill="#FFD700"/>
  </g>

  <!-- Wordmark -->
  <text x="60" y="28" font-family="Poppins, sans-serif" font-size="24" font-weight="600" fill="#1f4e79">
    Terra
  </text>
  <text x="110" y="28" font-family="Poppins, sans-serif" font-size="24" font-weight="600" fill="#00a86b">
    Fusion
  </text>

  <!-- Tagline -->
  <text x="60" y="42" font-family="Inter, sans-serif" font-size="10" fill="#6C757D">
    Intelligent Government Solutions
  </text>
</svg>
```

### Logo Variations

1. **Full Color** - Primary usage
2. **Monochrome** - Single color applications
3. **Reversed** - Dark backgrounds
4. **Icon Only** - Small spaces
5. **Stacked** - Vertical layouts

### Clear Space

- Minimum clear space = 0.5x icon height
- No elements within clear space
- Maintain proportions

---

## 🎨 UI COMPONENTS CSS

### Base Styles

```css
/* Terrafusion Base CSS */
.tf-root {
  --tf-border-radius: 8px;
  --tf-border-radius-sm: 4px;
  --tf-border-radius-lg: 12px;
  --tf-border-radius-xl: 16px;

  --tf-shadow-sm: 0 1px 2px rgba(31, 78, 121, 0.05);
  --tf-shadow: 0 4px 6px rgba(31, 78, 121, 0.1);
  --tf-shadow-lg: 0 10px 15px rgba(31, 78, 121, 0.15);
  --tf-shadow-xl: 0 20px 25px rgba(31, 78, 121, 0.2);

  --tf-transition-fast: 150ms ease-in-out;
  --tf-transition-base: 250ms ease-in-out;
  --tf-transition-slow: 350ms ease-in-out;
}

/* Button Styles */
.tf-button {
  font-family: var(--tf-font-primary);
  font-weight: var(--tf-font-medium);
  padding: 0.75rem 1.5rem;
  border-radius: var(--tf-border-radius);
  transition: all var(--tf-transition-base);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.tf-button-primary {
  background: var(--tf-primary-blue);
  color: white;
}

.tf-button-primary:hover {
  background: var(--tf-primary-blue-dark);
  transform: translateY(-1px);
  box-shadow: var(--tf-shadow);
}

.tf-button-success {
  background: var(--tf-primary-green);
  color: white;
}

/* Card Component */
.tf-card {
  background: white;
  border-radius: var(--tf-border-radius-lg);
  box-shadow: var(--tf-shadow);
  padding: 1.5rem;
  border: 1px solid rgba(31, 78, 121, 0.1);
  transition: all var(--tf-transition-base);
}

.tf-card:hover {
  box-shadow: var(--tf-shadow-lg);
  transform: translateY(-2px);
}

/* Form Elements */
.tf-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(31, 78, 121, 0.2);
  border-radius: var(--tf-border-radius);
  font-family: var(--tf-font-primary);
  transition: all var(--tf-transition-fast);
}

.tf-input:focus {
  outline: none;
  border-color: var(--tf-primary-blue);
  box-shadow: 0 0 0 3px rgba(31, 78, 121, 0.1);
}

/* Badge Styles */
.tf-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--tf-border-radius-xl);
  font-size: var(--tf-text-sm);
  font-weight: var(--tf-font-medium);
}

.tf-badge-primary {
  background: rgba(31, 78, 121, 0.1);
  color: var(--tf-primary-blue);
}

.tf-badge-success {
  background: rgba(0, 168, 107, 0.1);
  color: var(--tf-primary-green);
}
```

---

## 🎭 ICON SYSTEM

### Terrafusion Icon Set

```svg
<!-- Assessment Icon -->
<svg class="tf-icon tf-icon-assessment" width="24" height="24" viewBox="0 0 24 24">
  <path d="M9 2L3 8V22H21V2H9Z" stroke="currentColor" fill="none" stroke-width="2"/>
  <path d="M9 2V8H3" stroke="currentColor" fill="none" stroke-width="2"/>
  <path d="M7 12H17M7 16H17" stroke="currentColor" stroke-width="2"/>
</svg>

<!-- AI Brain Icon -->
<svg class="tf-icon tf-icon-ai" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="2"/>
  <path d="M8 12C8 12 9 8 12 8C15 8 16 12 16 12C16 12 15 16 12 16C9 16 8 12 8 12Z"
        fill="currentColor" opacity="0.3"/>
  <circle cx="12" cy="12" r="2" fill="currentColor"/>
</svg>

<!-- Dashboard Icon -->
<svg class="tf-icon tf-icon-dashboard" width="24" height="24" viewBox="0 0 24 24">
  <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
  <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
  <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
  <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.5"/>
</svg>
```

---

## 🏢 APPLICATION BRANDING

### Header Component

```html
<header class="tf-header">
  <div class="tf-header-container">
    <div class="tf-logo-wrapper">
      <img
        src="/assets/logos/terrafusion-logo.svg"
        alt="Terrafusion"
        class="tf-logo"
      />
    </div>
    <nav class="tf-nav">
      <a href="#" class="tf-nav-link tf-nav-link-active">Dashboard</a>
      <a href="#" class="tf-nav-link">Properties</a>
      <a href="#" class="tf-nav-link">Analytics</a>
      <a href="#" class="tf-nav-link">AI Assistant</a>
    </nav>
    <div class="tf-user-menu">
      <span class="tf-user-name">John Doe</span>
      <img src="/assets/avatars/user.jpg" alt="User" class="tf-avatar" />
    </div>
  </div>
</header>
```

### Footer Component

```html
<footer class="tf-footer">
  <div class="tf-footer-container">
    <div class="tf-footer-brand">
      <img
        src="/assets/logos/terrafusion-icon.svg"
        alt="TF"
        class="tf-footer-icon"
      />
      <p class="tf-footer-text">
        © 2025 Terrafusion. Transforming Government Through Intelligent
        Technology.
      </p>
    </div>
    <div class="tf-footer-links">
      <a href="#" class="tf-footer-link">Privacy</a>
      <a href="#" class="tf-footer-link">Terms</a>
      <a href="#" class="tf-footer-link">Support</a>
    </div>
  </div>
</footer>
```

---

## 🎯 DESIGN TOKENS

### JavaScript/JSON Format

```json
{
  "terrafusion": {
    "colors": {
      "primary": {
        "blue": "#1f4e79",
        "blue-dark": "#163a5a",
        "blue-light": "#2d608c",
        "green": "#00a86b",
        "green-dark": "#008656",
        "green-light": "#00c47e"
      },
      "accent": {
        "gold": "#FFD700",
        "orange": "#FF8C00"
      },
      "neutral": {
        "gray": "#6C757D",
        "light": "#F8F9FA",
        "dark": "#212529"
      },
      "status": {
        "success": "#28a745",
        "warning": "#ffc107",
        "danger": "#dc3545",
        "info": "#17a2b8"
      }
    },
    "typography": {
      "fontFamily": {
        "primary": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        "display": "'Poppins', 'Inter', sans-serif",
        "mono": "'JetBrains Mono', monospace"
      },
      "fontSize": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem"
      },
      "fontWeight": {
        "light": 300,
        "regular": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700
      }
    },
    "spacing": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem",
      "2xl": "3rem",
      "3xl": "4rem"
    },
    "borderRadius": {
      "sm": "4px",
      "base": "8px",
      "lg": "12px",
      "xl": "16px",
      "full": "9999px"
    },
    "shadows": {
      "sm": "0 1px 2px rgba(31, 78, 121, 0.05)",
      "base": "0 4px 6px rgba(31, 78, 121, 0.1)",
      "lg": "0 10px 15px rgba(31, 78, 121, 0.15)",
      "xl": "0 20px 25px rgba(31, 78, 121, 0.2)"
    },
    "animation": {
      "duration": {
        "fast": "150ms",
        "base": "250ms",
        "slow": "350ms",
        "slower": "500ms"
      },
      "easing": {
        "linear": "linear",
        "in": "ease-in",
        "out": "ease-out",
        "inOut": "ease-in-out"
      }
    }
  }
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```css
/* Mobile First Approach */
--tf-screen-sm: 640px; /* Small devices */
--tf-screen-md: 768px; /* Tablets */
--tf-screen-lg: 1024px; /* Desktops */
--tf-screen-xl: 1280px; /* Large screens */
--tf-screen-2xl: 1536px; /* Extra large */

/* Media Queries */
@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}
```

---

## 🚀 BRAND IMPLEMENTATION

### Application Loading Screen

```html
<div class="tf-loader">
  <svg class="tf-loader-logo" width="100" height="100">
    <!-- Animated Terrafusion logo -->
  </svg>
  <div class="tf-loader-text">Transforming Government...</div>
  <div class="tf-loader-progress">
    <div class="tf-loader-progress-bar"></div>
  </div>
</div>
```

### Success Messages

```html
<div class="tf-alert tf-alert-success">
  <svg class="tf-alert-icon"><!-- Success icon --></svg>
  <div class="tf-alert-content">
    <h4 class="tf-alert-title">Success!</h4>
    <p class="tf-alert-message">Your assessment has been saved.</p>
  </div>
</div>
```

---

## 📋 USAGE GUIDELINES

### Do's ✅

- Always use official color palette
- Maintain consistent spacing
- Follow typography hierarchy
- Use approved icons
- Keep animations subtle

### Don'ts ❌

- Don't alter logo proportions
- Don't use off-brand colors
- Don't mix font families
- Don't create new icons without approval
- Don't use excessive animations

---

## 🎯 BRAND PROMISE

**Every Terrafusion touchpoint should convey:**

- Professional excellence
- Technological innovation
- Government expertise
- Trustworthiness
- Forward-thinking approach

---

**BRAND ASSETS LOCATION**: `/Terrafusion-Packaging-Templates/assets/`

_Maintaining brand consistency ensures Terrafusion's premium positioning in the
government technology market._
