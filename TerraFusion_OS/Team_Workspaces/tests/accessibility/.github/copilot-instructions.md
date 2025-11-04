# TerraFusion OS Accessibility Testing - AI Coding Agent Instructions

## Project Architecture Overview

TerraFusion OS Accessibility Testing ensures federal compliance across all workspaces:
- `tests/accessibility/` - WCAG 2.1 AA compliance testing suite (current workspace)
- `frontend/` - UI components tested for accessibility compliance
- `platform/design-system/` - Component library accessibility validation
- `TERRAFUSION BRAND CODEX - The Divine Design System/` - Design token accessibility verification
- `monitoring/qa/` - Real-time accessibility compliance dashboards

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Government Accessibility Standards
- **WCAG 2.1 AA Compliance**: All components must meet Level AA standards
- **Section 508 Compliance**: Federal accessibility requirements mandatory
- **Government Browser Support**: IE11, Chrome, Firefox, Safari, Edge testing
- **Assistive Technology**: Screen reader, keyboard navigation, voice control testing

## Project-Specific Conventions

### Elite Testing Framework Stack
- **AI-Powered Testing**: `@terrafusion/ai-accessibility-prophet` for predictive compliance validation
- **Automated Testing**: `@axe-core/react`, `jest-axe`, `cypress-axe` for comprehensive coverage
- **Manual Testing**: Screen reader testing with JAWS, NVDA, VoiceOver
- **Government Tools**: Government-specific accessibility validation tools
- **Performance Impact**: Accessibility feature performance monitoring
- **Predictive Analytics**: ML models predict WCAG violations before code deployment

### Compliance Validation Pipeline
- Component-level accessibility tests run on every change
- Integration accessibility tests for complete user workflows
- Cross-browser accessibility validation for government browser matrix
- Real-time accessibility regression monitoring

## Development Guidelines

### When Testing Components
- Run `@axe-core/react` tests for all interactive elements
- Validate keyboard navigation patterns and focus management
- Test color contrast ratios against WCAG 2.1 AA standards
- Verify screen reader compatibility with semantic HTML

### When Testing User Flows
- Complete end-to-end accessibility validation for government workflows
- Test form accessibility including error states and validation
- Validate navigation accessibility across government interface patterns
- Ensure data table accessibility for government reporting requirements

### Government-Specific Testing
- **Federal Forms**: Specialized testing for government form patterns
- **Data Visualization**: Accessibility testing for charts, graphs, dashboards
- **Document Accessibility**: PDF and document accessibility compliance
- **Multi-Language**: Accessibility testing for government multilingual requirements

## Integration Patterns

### Testing Flow
```
Component Development → Accessibility Tests → Government Compliance Review → Production
```

### Cross-Workspace Validation
```
Design Tokens → Component Library → Frontend Apps → Accessibility Testing
```

### Quality Assurance Integration
```
Accessibility Tests → Performance Impact → QA Dashboard → Compliance Reports
```

## Critical Commands & Tasks

### Accessibility Testing
- Use "Deploy Production" VS Code task for accessibility deployment validation
- Run comprehensive accessibility test suite: `npm run test:accessibility`
- Generate accessibility compliance reports for government review
- Monitor real-time accessibility metrics in QA dashboard

### Quality Gates
- All components must pass automated accessibility tests
- Manual screen reader testing required for complex interactions
- Government compliance review mandatory for public-facing features
- Performance impact assessment for accessibility features

## Testing Tools & Patterns

### Automated Testing Suite
```javascript
// Component accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

// Government compliance testing
import { govAccessibilityTest } from '@terrafusion/gov-testing'
```

### Manual Testing Protocols
- **Screen Reader Testing**: JAWS, NVDA, VoiceOver validation protocols
- **Keyboard Navigation**: Tab order, focus management, keyboard shortcuts
- **High Contrast**: Government high contrast mode compliance
- **Zoom Testing**: 200% zoom accessibility requirement validation

## Government Compliance Requirements

### Federal Standards
- Section 508 compliance for all interactive elements
- WCAG 2.1 AA color contrast ratios (4.5:1 normal text, 3:1 large text)
- Keyboard accessibility for all functionality
- Screen reader compatibility with semantic markup

### Testing Matrix
- **Browsers**: IE11, Chrome, Firefox, Safari, Edge (government versions)
- **Screen Readers**: JAWS, NVDA, VoiceOver, Dragon NaturallySpeaking
- **Devices**: Desktop, tablet, mobile accessibility validation
- **Operating Systems**: Windows, macOS, iOS, Android government configurations

## Getting Started Quickly
1. Set up accessibility testing environment with government compliance tools
2. Review existing accessibility test patterns and government requirements
3. Run baseline accessibility tests on target components or workflows
4. Coordinate with frontend and design system teams for compliance implementation
5. Monitor accessibility compliance through QA dashboard integration
