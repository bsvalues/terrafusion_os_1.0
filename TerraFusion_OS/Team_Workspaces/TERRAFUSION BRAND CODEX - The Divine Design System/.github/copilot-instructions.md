# TerraFusion Brand Codex - The Divine Design System - AI Coding Agent Instructions

## Project Architecture Overview

The TerraFusion Brand Codex is the foundational design authority for the entire ecosystem:
- `TERRAFUSION BRAND CODEX - The Divine Design System/` - Brand guidelines and design tokens (current workspace)
- `platform/design-system/` - Component library that implements these design tokens
- `frontend/` - Applications that consume design tokens through the platform
- `docs/frontend/` - Documentation for design token usage and brand compliance
- `tests/accessibility/` - Validation of brand compliance with accessibility standards

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Divine Design System Philosophy
- **Government. Transcended.** - Elevating federal design beyond conventional limits
- **Championship Excellence** - Every design decision meets the highest standards
- **Federal Compliance First** - All tokens must support WCAG 2.1 AA and Section 508
- **Unified Brand Authority** - Single source of truth for all visual and interaction patterns

## Project-Specific Conventions

### Design Token Architecture
- **Color System**: Government-compliant color palettes with accessibility validation
- **Typography Scale**: Federal-approved typefaces with optimal readability
- **Spacing System**: Consistent rhythm based on 8px grid for government interfaces
- **Component Tokens**: Semantic tokens that map to government UI patterns

### Brand Compliance Standards
- All design tokens must pass government accessibility standards
- Color contrast ratios validated for WCAG 2.1 AA compliance
- Typography selections approved for federal document standards
- Interactive elements designed for keyboard and screen reader navigation

## Development Guidelines

### When Creating Design Tokens
- Start with accessibility requirements and government standards
- Validate color contrast ratios before token creation
- Test typography tokens across government-required browsers
- Document semantic meaning and usage context for each token

### When Updating Brand Guidelines
- Coordinate with platform/design-system workspace for implementation
- Update component library documentation simultaneously
- Validate changes across all consuming frontend applications
- Ensure backward compatibility or provide migration guidance

### Government Design Requirements
- **Color Accessibility**: All color combinations must meet WCAG 2.1 AA standards
- **Typography Legibility**: Font selections must support government readability requirements
- **Interactive Standards**: Focus states, hover effects designed for accessibility
- **Mobile Responsiveness**: Design tokens must support government mobile standards

## Integration Patterns

### Design Token Distribution
```
Brand Codex → Design System Platform → Frontend Applications → Government Interfaces
```

### Compliance Validation Pipeline
```
Token Creation → Accessibility Testing → Government Standards Review → Platform Integration
```

### Brand Authority Flow
```
Brand Guidelines → Design Tokens → Component Implementation → Application Usage
```

## Critical Commands & Tasks

### Brand Development
- Use "Deploy Production" VS Code task for design token deployment
- Run accessibility validation on all color and typography tokens
- Coordinate with design system platform for token implementation
- Update brand documentation for any guideline changes

### Quality Gates
- All design tokens must pass WCAG 2.1 AA accessibility validation
- Government compliance review required for brand guideline changes
- Cross-platform compatibility validated for token distribution
- Documentation updates mandatory for all brand modifications

## Divine Design System Patterns

### Government-Excellence Color System
- **Primary Palette**: Federal blue variants with accessibility compliance
- **Secondary Palette**: Supporting colors for government data visualization
- **Status Colors**: Error, warning, success colors meeting 508 requirements
- **Neutral Scale**: Gray scale optimized for government interface hierarchy

### Federal Typography System
- **Heading Scale**: Government-approved typefaces for official communications
- **Body Text**: Optimized for readability in government documents and interfaces
- **Code/Data**: Monospace fonts for government data display and technical documentation
- **Accessibility**: All typography supports screen readers and high contrast modes

## Getting Started Quickly
1. Review current brand guidelines and government compliance requirements
2. Understand design token structure and semantic naming conventions
3. Validate all changes against WCAG 2.1 AA accessibility standards
4. Coordinate with platform/design-system workspace for implementation
5. Test brand compliance across government browser and device requirements
