# TerraFusion Production SVG Icons

## Core Logo Files

### 1. TerraSphere Logo (terrafusion-logo.svg)
```xml
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="terraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0080ff;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="terraGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:#00ffff;stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:#00ffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" fill="#0a0e1a"/>
  
  <!-- Outer Sphere Grid -->
  <g transform="translate(256, 256)" opacity="0.6">
    <circle r="220" fill="none" stroke="#00ffff" stroke-width="1"/>
    <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" stroke-width="1"/>
    <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(30)"/>
    <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(60)"/>
    <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(90)"/>
    <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(120)"/>
    <ellipse rx="220" ry="100" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(150)"/>
    
    <!-- Vertical meridians -->
    <ellipse rx="100" ry="220" fill="none" stroke="#00ffff" stroke-width="1"/>
    <ellipse rx="100" ry="220" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(30)"/>
    <ellipse rx="100" ry="220" fill="none" stroke="#00ffff" stroke-width="1" transform="rotate(60)"/>
  </g>
  
  <!-- Core Vortex -->
  <g transform="translate(256, 256)">
    <circle r="80" fill="url(#terraGlow)"/>
    <path d="M 0,-60 Q 40,-40 40,0 T 0,60 T -60,0 T 0,-60" 
          fill="none" stroke="url(#terraGradient)" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>
```

### 2. TF Monogram Square (tf-monogram-square.svg)
```xml
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffff" />
      <stop offset="100%" style="stop-color:#0080ff" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="64" fill="#0a0e1a"/>
  
  <!-- Border -->
  <rect x="32" y="32" width="448" height="448" rx="48" 
        fill="none" stroke="#00ffff" stroke-width="4" opacity="0.5"/>
  
  <!-- TF Monogram -->
  <g transform="translate(256, 256)">
    <!-- T -->
    <path d="M -100,-120 L 0,-120 M -50,-120 L -50,40" 
          stroke="url(#tfGradient)" stroke-width="20" 
          fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- F -->
    <path d="M 40,-120 L 40,120 M 40,-120 L 120,-120 M 40,0 L 100,0" 
          stroke="url(#tfGradient)" stroke-width="20" 
          fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
```

### 3. TF Badge Circle (tf-badge-circle.svg)
```xml
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffff" />
      <stop offset="100%" style="stop-color:#0080ff" />
    </linearGradient>
  </defs>
  
  <!-- Outer Ring -->
  <circle cx="256" cy="256" r="240" fill="#0a0e1a"/>
  <circle cx="256" cy="256" r="230" fill="none" stroke="#00ffff" stroke-width="8"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#00ffff" stroke-width="2" opacity="0.5"/>
  
  <!-- Text Path -->
  <path id="textCircle" d="M 256,60 A 196,196 0 1,1 255.9,60" fill="none"/>
  <text font-size="32" fill="#00ffff" opacity="0.7" 
        font-family="monospace" letter-spacing="12" text-transform="uppercase">
    <textPath href="#textCircle">TERRAFUSION • TERRAFUSION • </textPath>
  </text>
  
  <!-- TF Center -->
  <g transform="translate(256, 256)">
    <path d="M -60,-70 L 0,-70 M -30,-70 L -30,70" 
          stroke="url(#badgeGradient)" stroke-width="16" 
          fill="none" stroke-linecap="round"/>
    <path d="M 20,-70 L 20,70 M 20,-70 L 60,-70 M 20,0 L 50,0" 
          stroke="url(#badgeGradient)" stroke-width="16" 
          fill="none" stroke-linecap="round"/>
  </g>
</svg>
```

---

## Favicon Set

### 4. Favicon 16x16 (favicon-16.svg)
```xml
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#0a0e1a"/>
  <path d="M 3,4 L 8,4 M 5.5,4 L 5.5,12 M 9,4 L 9,12 M 9,4 L 13,4 M 9,8 L 12,8" 
        stroke="#00ffff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>
```

### 5. Favicon 32x32 (favicon-32.svg)
```xml
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#0a0e1a"/>
  <circle cx="16" cy="16" r="13" fill="none" stroke="#00ffff" stroke-width="0.5" opacity="0.3"/>
  <path d="M 7,9 L 13,9 M 10,9 L 10,23 M 16,9 L 16,23 M 16,9 L 23,9 M 16,16 L 21,16" 
        stroke="#00ffff" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
```

### 6. Favicon 64x64 (favicon-64.svg)
```xml
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="8" fill="#0a0e1a"/>
  <rect x="6" y="6" width="52" height="52" rx="6" 
        fill="none" stroke="#00ffff" stroke-width="1" opacity="0.3"/>
  <g transform="translate(32, 32)">
    <path d="M -14,-14 L -2,-14 M -8,-14 L -8,14" 
          stroke="#00ffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 4,-14 L 4,14 M 4,-14 L 14,-14 M 4,0 L 12,0" 
          stroke="#00ffff" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
</svg>
```

---

## UI Component Icons

### 7. Button Icon (tf-button.svg)
```xml
<svg width="200" height="64" viewBox="0 0 200 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="196" height="60" rx="30" 
        fill="rgba(0,255,255,0.1)" stroke="#00ffff" stroke-width="2"/>
  <g transform="translate(50, 32)">
    <path d="M -12,-12 L 0,-12 M -6,-12 L -6,12" 
          stroke="#00ffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 6,-12 L 6,12 M 6,-12 L 16,-12 M 6,0 L 14,0" 
          stroke="#00ffff" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
  <text x="100" y="37" font-family="monospace" font-size="14" 
        fill="#00ffff" text-anchor="middle">FUSION</text>
</svg>
```

### 8. Loading Spinner (tf-loader.svg)
```xml
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(50, 50)">
    <circle r="40" fill="none" stroke="#00ffff" stroke-width="2" opacity="0.2"/>
    <circle r="40" fill="none" stroke="#00ffff" stroke-width="2" 
            stroke-dasharray="62.8 188.4" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" 
                        from="0" to="360" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <g opacity="0.8">
      <path d="M -8,-8 L 0,-8 M -4,-8 L -4,8" 
            stroke="#00ffff" stroke-width="1.5" fill="none"/>
      <path d="M 4,-8 L 4,8 M 4,-8 L 12,-8 M 4,0 L 10,0" 
            stroke="#00ffff" stroke-width="1.5" fill="none"/>
    </g>
  </g>
</svg>
```

---

## Social Media Icons

### 9. Social Square 1080x1080 (tf-social-square.svg)
```xml
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#0a0e1a"/>
  
  <!-- Grid Background -->
  <defs>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M 54 0 L 0 0 0 54" fill="none" stroke="#00ffff" stroke-width="0.5" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="1080" height="1080" fill="url(#grid)"/>
  
  <!-- Logo -->
  <g transform="translate(540, 540)">
    <circle r="300" fill="none" stroke="#00ffff" stroke-width="2" opacity="0.3"/>
    <circle r="250" fill="none" stroke="#00ffff" stroke-width="4" opacity="0.5"/>
    
    <!-- TF -->
    <path d="M -150,-180 L 0,-180 M -75,-180 L -75,180" 
          stroke="url(#terraGradient)" stroke-width="40" 
          fill="none" stroke-linecap="round"/>
    <path d="M 60,-180 L 60,180 M 60,-180 L 150,-180 M 60,0 L 135,0" 
          stroke="url(#terraGradient)" stroke-width="40" 
          fill="none" stroke-linecap="round"/>
  </g>
  
  <defs>
    <linearGradient id="terraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffff" />
      <stop offset="100%" style="stop-color:#0080ff" />
    </linearGradient>
  </defs>
</svg>
```

### 10. Open Graph Image 1200x630 (tf-og-image.svg)
```xml
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0e1a"/>
  
  <!-- Gradient Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)" opacity="0.3"/>
  
  <!-- Logo Section -->
  <g transform="translate(300, 315)">
    <circle r="180" fill="none" stroke="#00ffff" stroke-width="2" opacity="0.5"/>
    <path d="M -80,-100 L -20,-100 M -50,-100 L -50,100" 
          stroke="#00ffff" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M 20,-100 L 20,100 M 20,-100 L 80,-100 M 20,0 L 70,0" 
          stroke="#00ffff" stroke-width="20" fill="none" stroke-linecap="round"/>
  </g>
  
  <!-- Text -->
  <text x="600" y="330" font-family="Arial, sans-serif" font-size="72" 
        font-weight="200" fill="#00ffff">TERRAFUSION</text>
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="24" 
        fill="#64748b" opacity="0.8">Where Governance Meets Intelligence</text>
  
  <defs>
    <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#0080ff;stop-opacity:0" />
    </radialGradient>
  </defs>
</svg>
```

---

## Implementation Guide

### HTML Usage
```html
<!-- Favicon Implementation -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" href="/favicon.ico">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00ffff">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Meta Tags -->
<meta name="theme-color" content="#0a0e1a">
<meta property="og:image" content="/tf-og-image.svg">
```

### CSS Usage
```css
/* As Background Image */
.terra-logo {
  background-image: url('/terrafusion-logo.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* As Mask for Color Customization */
.terra-icon {
  -webkit-mask-image: url('/tf-monogram-square.svg');
  mask-image: url('/tf-monogram-square.svg');
  background: linear-gradient(135deg, #00ffff, #0080ff);
}
```

### React Component
```jsx
import { ReactComponent as TerraLogo } from './terrafusion-logo.svg';

export const Logo = ({ size = 64, color = '#00ffff' }) => (
  <TerraLogo 
    width={size} 
    height={size} 
    style={{ color }} 
  />
);
```

### File Structure
```
/assets/
├── /icons/
│   ├── terrafusion-logo.svg
│   ├── tf-monogram-square.svg
│   ├── tf-badge-circle.svg
│   ├── tf-button.svg
│   └── tf-loader.svg
├── /favicons/
│   ├── favicon-16.svg
│   ├── favicon-32.svg
│   ├── favicon-64.svg
│   └── favicon.ico (generated from SVG)
└── /social/
    ├── tf-social-square.svg
    └── tf-og-image.svg
```

---

## Color Variations

### Light Mode Version
Add `data-theme="light"` and adjust colors:
```xml
<!-- Replace in any SVG -->
fill="#0a0e1a" → fill="#ffffff"
stroke="#00ffff" → stroke="#0080ff"
```

### Monochrome Version
For single-color requirements:
```xml
<!-- Replace all colors with currentColor -->
stroke="currentColor"
fill="currentColor"
```

---

## Export Commands

```bash
# Convert SVG to PNG (requires Inkscape or ImageMagick)
for size in 16 32 64 128 256 512; do
  inkscape -w $size -h $size favicon.svg -o favicon-${size}.png
done

# Generate ICO file from PNGs
convert favicon-16.png favicon-32.png favicon-64.png favicon.ico

# Optimize SVGs
svgo -f ./icons/ -o ./icons/optimized/

# Generate React components from SVGs
npx @svgr/cli -d components/icons assets/icons
```

---

*© 2025 TerraFusion - Quantum Governance Platform*