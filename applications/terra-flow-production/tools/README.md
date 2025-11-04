# Terrafusion Performance Analysis Tools

This directory contains tools for analyzing and optimizing the performance of the Terrafusion application.

## Prerequisites

Before using these tools, make sure you have Node.js installed. Then install the dependencies:

```bash
cd tools
npm install
```

## Available Tools

### 1. Performance Audit

Runs a comprehensive Lighthouse audit on key pages of the application.

```bash
npm run audit
```

This tool:
- Analyzes performance, accessibility, best practices, and SEO metrics
- Identifies performance bottlenecks
- Provides recommendations for improvements
- Saves detailed reports to `../performance_reports/[timestamp]/`

### 2. Map Performance Analysis

Analyzes the performance of map components specifically.

```bash
node map_performance_analysis.js
```

This tool:
- Measures loading and rendering times for map components
- Analyzes JavaScript and CSS usage efficiency
- Identifies slow-rendering map layers
- Monitors memory usage during map interactions
- Saves detailed reports to `../performance_reports/maps/[timestamp]/`

### 3. Render-Blocking Resources Identification

Identifies render-blocking resources that delay page rendering.

```bash
node identify_render_blocking.js
```

This tool:
- Finds CSS and JavaScript resources that block rendering
- Identifies resources loaded before First Paint
- Analyzes CSS specificity issues
- Provides recommendations for optimization
- Saves detailed reports to `../performance_reports/render-blocking/[timestamp]/`

## Using the Reports

After running these tools, detailed reports are saved in the `../performance_reports/` directory. These reports contain valuable information for optimizing the application, including:

1. Performance metrics for each page
2. Identified issues and bottlenecks
3. Recommendations for improvements
4. Screenshots of the pages
5. Detailed timing information

## Common Performance Issues and Solutions

### Slow Initial Load Time
- Implement code splitting
- Reduce JavaScript bundle size
- Optimize image loading
- Implement resource hints

### Map Rendering Performance
- Use clustering for large numbers of markers
- Implement progressive loading based on zoom level
- Use vector tiles when appropriate
- Optimize GeoJSON processing

### CSS Performance
- Reduce specificity
- Minimize unused CSS
- Implement critical CSS
- Use CSS containment

### JavaScript Performance
- Optimize event handlers
- Use Web Workers for heavy computations
- Implement virtualization for large lists
- Defer non-critical JavaScript