# badges - Quality and Coverage Badge System

**Status**: Operational ✅  
**Purpose**: Visual quality metrics and code coverage indicators  
**Integration**: CI/CD pipeline with real-time updates  
**Compliance**: Government accessibility and security standards

## Overview

The badges directory contains SVG quality indicators that provide immediate
visual feedback on code coverage, quality metrics, performance budgets, and
government compliance status for Terrafusion OS.

## Quick Start

### View Current Badges

```bash
# Browse badge directory
ls -la badges/

# View badge contents
cat badges/coverage-summary.svg
cat badges/quality.svg
cat badges/route-budgets.svg
```

### Generate Fresh Badges

```bash
# Generate all badges
npm run badges:generate

# Coverage badges only
npm run badges:coverage

# Quality assessment badges
npm run badges:quality

# Performance budget badges
npm run badges:performance
```

## Available Badges

### Code Coverage Badges

- **coverage-branches.svg** - Branch coverage percentage with government
  thresholds
- **coverage-functions.svg** - Function coverage tracking for critical systems
- **coverage-lines.svg** - Line-by-line coverage analysis
- **coverage-statements.svg** - Statement execution coverage for audit
  compliance
- **coverage-summary.svg** - Overall coverage summary for executive reporting

### Quality Assessment Badge

- **quality.svg** - Comprehensive code quality score combining:
  - Security compliance (FISMA controls)
  - Performance metrics (API response times)
  - Accessibility compliance (Section 508)
  - Code maintainability scores
  - Test coverage integration

### Performance Monitoring Badge

- **route-budgets.svg** - Bundle size and performance budget compliance:
  - JavaScript bundle sizes
  - CSS optimization metrics
  - Image asset optimization
  - API performance budgets

## Badge Integration

### In Documentation

```markdown
<!-- README.md integration -->

![Coverage](./badges/coverage-summary.svg) ![Quality](./badges/quality.svg)
![Performance](./badges/route-budgets.svg)

<!-- Detailed metrics -->

![Branch Coverage](./badges/coverage-branches.svg)
![Function Coverage](./badges/coverage-functions.svg)
```

### In CI/CD Pipeline

```yaml
# GitHub Actions integration
- name: Generate Badges
  run: |
    npm run test:coverage
    npm run badges:generate

- name: Commit Badge Updates
  run: |
    git add badges/
    git commit -m "Update quality badges"
```

## Government Compliance

### Accessibility Standards

All badges meet Section 508 and WCAG 2.1 AAA requirements:

- **Color Contrast**: 7:1 minimum contrast ratio
- **Screen Reader**: Alt text and ARIA labels
- **Keyboard Access**: Focusable when interactive
- **Color Independence**: Information not conveyed by color alone

### Security Compliance

Badges integrate with government security frameworks:

- **FISMA Controls**: Security implementation tracking
- **Audit Trails**: Badge generation audit logging
- **Data Protection**: No sensitive information in badges
- **Access Control**: Badge viewing permissions

## Quality Thresholds

### Coverage Requirements

```yaml
government_thresholds:
  branches: '>90%' # Green badge
  functions: '>95%' # Critical systems
  lines: '>92%' # Overall system
  statements: '>94%' # Audit compliance
```

### Quality Scoring

```yaml
quality_grades:
  A: '90-100%' # Exceeds government standards
  B: '80-89%' # Meets requirements
  C: '70-79%' # Acceptable with improvements
  D: '60-69%' # Below standards
  F: '<60%' # Does not meet requirements
```

### Performance Budgets

```yaml
performance_targets:
  api_response: '<10ms' # Government SLA
  bundle_size: '<2.5MB' # Optimized loading
  accessibility: '100%' # Section 508 compliance
  uptime: '>99.9%' # Government availability
```

## Badge Customization

### County-Specific Badges

```bash
# Benton County customization
npm run badges:county --county=benton

# Multi-county federation
npm run badges:federated --counties=benton,clark,spokane
```

### Custom Metrics

```bash
# AI agent performance badges
npm run badges:ai-agents

# Harris PACS integration badges
npm run badges:harris-integration

# Government compliance badges
npm run badges:compliance
```

## Automation

### Automated Updates

Badges update automatically on:

- Code pushes to main branch
- Test completion events
- Quality assessment runs
- Performance benchmark tests
- Security compliance scans

### Real-Time Monitoring

```bash
# Monitor badge health
npm run badges:health-check

# Validate badge accuracy
npm run badges:validate

# Performance impact assessment
npm run badges:performance-test
```

## Troubleshooting

### Common Issues

#### Badge Not Updating

```bash
# Clear badge cache
rm -rf badges/*.svg
npm run badges:generate

# Force refresh pipeline
npm run badges:force-refresh
```

#### Incorrect Metrics

```bash
# Validate data sources
npm run badges:validate-data

# Debug metric collection
npm run badges:debug-metrics

# Manual metric verification
npm run test:coverage -- --verbose
```

#### Performance Issues

```bash
# Optimize badge generation
npm run badges:optimize

# Check generation performance
npm run badges:benchmark

# Reduce badge file sizes
npm run badges:minify
```

### Health Checks

```bash
# Badge system health
curl -s http://localhost:\${{TF_API_PORT:-5000}}/health/badges

# Coverage data health
npm run test:coverage -- --reporter=json | jq '.coverage'

# Quality metrics health
npm run lint -- --format=json | jq '.errorCount'
```

## Integration Examples

### GitHub Integration

```markdown
<!-- GitHub README badges -->

[![Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen.svg)](./badges/coverage-summary.svg)
[![Quality](https://img.shields.io/badge/quality-A-brightgreen.svg)](./badges/quality.svg)
[![Performance](https://img.shields.io/badge/performance-passing-green.svg)](./badges/route-budgets.svg)
```

### Dashboard Integration

```typescript
// React dashboard integration
const BadgeDashboard: React.FC = () => {
  return (
    <div className="badge-dashboard">
      <img src="/badges/coverage-summary.svg" alt="Test Coverage" />
      <img src="/badges/quality.svg" alt="Code Quality" />
      <img src="/badges/route-budgets.svg" alt="Performance" />
    </div>
  );
};
```

### API Integration

```typescript
// Badge data API
app.get('/api/badges/metrics', async (req, res) => {
  const metrics = {
    coverage: await getCoverageMetrics(),
    quality: await getQualityScore(),
    performance: await getPerformanceBudgets(),
  };

  res.json(metrics);
});
```

## Government Deployment

### Multi-County Badge System

```bash
# Deploy badges for multiple counties
./scripts/deploy-county-badges.sh --counties="benton,clark,spokane"

# County-specific badge customization
./scripts/customize-county-badges.sh --county=benton --theme=government
```

### Compliance Reporting

```bash
# Generate compliance badge report
npm run badges:compliance-report

# Export badge metrics for audit
npm run badges:export-audit-data

# Government dashboard integration
npm run badges:dashboard-export
```

### Security Integration

```bash
# Security compliance badges
npm run badges:security-compliance

# FISMA control implementation badges
npm run badges:fisma-controls

# Audit readiness badges
npm run badges:audit-readiness
```

---

## Badge System Summary

### Visual Quality Indicators

- **Real-Time Metrics**: Live updates from CI/CD pipeline
- **Government Compliance**: Section 508 and FISMA integration
- **Performance Tracking**: Bundle budgets and API performance
- **Multi-Dimensional Quality**: Coverage, quality, performance, compliance

### Operational Excellence

- **Automated Generation**: CI/CD integrated badge updates
- **Government Standards**: Federal accessibility and security compliance
- **Multi-County Ready**: Scalable across government deployments
- **Audit Integration**: Complete badge generation audit trails

**Authority**: Terrafusion Quality Assurance Division  
**Last Updated**: August 27, 2025
