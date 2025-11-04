
# Terrafusion Branding Implementation Guide for BSIncomeValuation

## Quick Start
1. Import the branding system:
   ```python
   from terrafusion_branding.flask_branding import inject_terrafusion_branding, render_with_tf_branding
   ```

2. Add to your Flask app:
   ```python
   app.context_processor(inject_terrafusion_branding)
   ```

3. Use in templates:
   ```html
   <link rel="stylesheet" href="/static/terrafusion-brand.css">
   <div class="tf-navbar">
       {{ tf_logo_svg | safe }}
   </div>
   ```

## Brand Colors
- Cosmic Blue: #0891b2
- Quantum Teal: #00d2ff
- Neural Purple: #667eea

## CSS Classes
- .tf-navbar - Navigation bar
- .tf-card - Content cards
- .tf-btn-primary - Primary buttons
- .tf-title - Main titles
- .tf-tagline - "Intelligence That Counties Envy"

## Logo Assets
- SVG Logo: /static/terrafusion-logo.svg
- Brand CSS: /static/terrafusion-brand.css
- Official Assets: /static/animated_logo.png, /static/ai_tagline_logo.png

## Implementation Status
✅ Logo standardization complete
✅ Brand system deployed
✅ CSS framework ready
✅ Template integration available

Intelligence That Counties Envy - Terrafusion Branding System
            