# TerraFusion OS Design System Platform - AI Coding Agent Instructions

## Project Architecture Overview

TerraFusion OS Design System Platform creates government-grade UI components:
- `platform/design-system/` - Reusable component library (current workspace)
- `TERRAFUSION BRAND CODEX - The Divine Design System/` - Brand guidelines and design tokens
- `frontend/` - Primary consumer of design system components
- `tests/accessibility/` - WCAG 2.1 AA compliance validation for all components
- `tests/performance/` - Component performance benchmarks and optimization
- `docs/frontend/` - Component documentation and usage examples

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Component Development Lifecycle
1. **Design Token Integration**: All components MUST use tokens from Brand Codex
2. **Accessibility-First**: Components built with WCAG 2.1 AA compliance from start
3. **Performance Validation**: Each component tested for government performance standards
4. **Documentation**: Comprehensive usage examples and API documentation required

## Project-Specific Conventions

### Component Architecture Patterns
- **Styled Components**: CSS-in-JS with design tokens: `styled(BaseComponent).withConfig()`
- **Government Patterns**: Specialized components for federal compliance
- **Token Integration**: `import { tokens } from '@terrafusion/design-tokens'`
- **Accessibility Hooks**: Built-in ARIA patterns and screen reader support

### Quality Standards
- **Federal Compliance**: All components must meet Section 508 requirements
- **Performance Budgets**: Component bundle size limits enforced
- **Cross-Browser Testing**: IE11, Chrome, Firefox, Safari, Edge government versions
- **Mobile-First**: Responsive design with government accessibility standards

## Development Guidelines

### When Creating New Components
- Start with design tokens and accessibility patterns
- Implement keyboard navigation and ARIA attributes
- Add performance monitoring and bundle analysis
- Create comprehensive Storybook documentation
- Write accessibility tests using axe-core

### When Updating Existing Components
- Maintain backward compatibility for consuming applications
- Update component version following semantic versioning
- Coordinate with frontend workspace for breaking changes
- Validate performance impact across all consuming applications

### Government Compliance Requirements
- Section 508 compliance validation required
- WCAG 2.1 AA accessibility testing mandatory
- Performance budgets for government network constraints
- Color contrast validation for accessibility standards

## Integration Patterns

### Design Token Flow
```
Brand Codex → Design Tokens → Styled Components → Frontend Applications
```

### Component Distribution
```
Design System Platform → NPM Package → Frontend Workspace → Government Applications
```

### Quality Assurance Pipeline
```
Component Tests → Accessibility Tests → Performance Tests → Cross-Browser Validation
```

## Critical Commands & Tasks

### Component Development
- Use "Deploy Production" VS Code task for component library deployment
- Run accessibility tests with `@axe-core/react` before component release
- Performance testing with Lighthouse CI for component optimization
- Storybook documentation updates for all component changes

### Quality Gates
- All components must pass WCAG 2.1 AA accessibility standards
- Performance budgets enforced for component bundle sizes
- Cross-browser compatibility validated for government browser support
- Design token compliance checked at build time

## Government-Specific Patterns

### Federal UI Components
- `<GovButton>` - 508-compliant button with government styling
- `<GovForm>` - Accessible form patterns with federal validation
- `<GovDataTable>` - High-performance, accessible data tables
- `<GovNavigation>` - Government-compliant navigation patterns

### Accessibility-First Development
- Screen reader compatibility built into all components
- Keyboard navigation patterns standardized
- Focus management for complex interactions
- High contrast mode support for government accessibility

## Getting Started Quickly
1. Review Brand Codex for latest design tokens and patterns
2. Set up component development environment with accessibility testing
3. Use existing government component patterns as templates
4. Run accessibility and performance tests early and often
5. Coordinate with frontend workspace for component integration testing
