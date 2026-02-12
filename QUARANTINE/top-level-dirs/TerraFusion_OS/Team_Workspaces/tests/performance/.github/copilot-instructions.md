# TerraFusion OS Performance Testing - AI Coding Agent Instructions

## Project Architecture Overview

TerraFusion OS Performance Testing ensures government-grade performance across all workspaces:
- `tests/performance/` - Performance benchmarks and quality gates (current workspace)
- `frontend/` - UI applications with performance monitoring integration
- `platform/design-system/` - Component performance validation and optimization
- `backend/` - API performance testing and load validation
- `monitoring/qa/` - Real-time performance metrics and regression detection

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Government Performance Standards
- **Web Vitals**: Core Web Vitals compliance for federal websites
- **Load Performance**: Sub-3-second load times for government network conditions
- **Accessibility Performance**: Performance impact of accessibility features measured
- **Mobile Performance**: Government mobile device performance requirements

## Project-Specific Conventions

### Elite Performance Testing Stack
- **Performance Prophecy**: `@terrafusion/performance-prophet` - ML-based regression prediction
- **Lighthouse CI**: Automated performance testing with government budgets
- **Web Vitals**: Real User Monitoring (RUM) with `web-vitals` package
- **Bundle Analysis**: webpack-bundle-analyzer for government deployment optimization
- **Load Testing**: K6 or Artillery for backend API performance validation
- **Predictive Optimization**: AI-driven performance bottleneck prediction and auto-remediation

### Performance Budget Enforcement
- Component-level performance budgets enforced at build time
- Page-level performance gates for government compliance
- Bundle size limits for federal network constraints
- Accessibility feature performance impact monitoring

## Development Guidelines

### When Testing Frontend Performance
- Run Lighthouse CI with government performance budgets
- Monitor Core Web Vitals (LCP, FID, CLS) for federal compliance
- Validate performance on government-standard network conditions
- Test accessibility feature performance impact

### When Testing Component Performance
- Measure component render times and memory usage
- Validate bundle size impact of new components
- Test performance across government browser matrix
- Monitor performance regression with component updates

### Government-Specific Performance Requirements
- **Network Constraints**: Testing on government network speeds and latencies
- **Device Standards**: Performance on government-issued devices
- **Accessibility Impact**: Performance cost of accessibility features measured
- **Security Overhead**: Performance impact of government security requirements

## Integration Patterns

### Performance Testing Flow
```
Component Development → Performance Tests → Budget Validation → Quality Gates → Production
```

### Cross-Workspace Performance Monitoring
```
Design System → Frontend Apps → Backend APIs → Performance Testing → QA Dashboard
```

### Performance Quality Assurance
```
Performance Tests → Regression Detection → Alert System → Performance Optimization
```

## Critical Commands & Tasks

### Performance Testing
- Use "Deploy Production" VS Code task for performance deployment validation
- Run comprehensive performance test suite: `npm run test:performance`
- Generate Lighthouse performance reports: `npm run lighthouse:ci`
- Monitor real-time performance metrics in QA dashboard

### Quality Gates
- All components must meet government performance budgets
- Lighthouse CI scores must meet federal website standards
- Bundle size limits enforced for government network constraints
- Performance regression tests required for all changes

## Performance Testing Tools & Patterns

### Automated Performance Testing
```javascript
// Lighthouse CI configuration
module.exports = {
  ci: {
    collect: {
      settings: {
        // Government performance budgets
        budgets: [{
          resourceTypes: ['script', 'stylesheet'],
          budget: 200 // KB limit for government networks
        }]
      }
    }
  }
}

// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
```

### Performance Budget Configuration
- **JavaScript Budget**: 200KB for government network constraints
- **CSS Budget**: 50KB for efficient government interface loading
- **Image Budget**: Optimized for government device capabilities
- **Font Budget**: Web font loading optimized for accessibility

## Government Performance Requirements

### Federal Standards
- **Load Time**: Sub-3-second load times on government networks
- **Time to Interactive**: Under 5 seconds for government accessibility compliance
- **Lighthouse Score**: Minimum 90/100 performance score for federal websites
- **Core Web Vitals**: All vitals must be in "Good" range for government compliance

### Testing Matrix
- **Networks**: Government network speeds (slow 3G, regular 3G, WiFi)
- **Devices**: Government-issued desktop and mobile devices
- **Browsers**: Performance across government-supported browser versions
- **Accessibility**: Performance impact of screen readers and assistive technology

## Performance Optimization Patterns

### Frontend Optimization
- **Code Splitting**: Route-based and component-based splitting for government apps
- **Lazy Loading**: Progressive loading for government data-heavy interfaces
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Asset Optimization**: Image, font, and resource optimization for government networks

### Component Performance
- **React Optimization**: useMemo, useCallback, React.memo for government performance
- **Virtual Scrolling**: Large dataset handling for government data interfaces
- **Debouncing**: Input handling optimization for government forms
- **Memory Management**: Preventing memory leaks in long-running government applications

## Getting Started Quickly
1. Set up performance testing environment with Lighthouse CI and Web Vitals
2. Review government performance budgets and requirements
3. Run baseline performance tests on target applications or components
4. Coordinate with frontend and design system teams for optimization implementation
5. Monitor performance metrics through QA dashboard for continuous improvement
