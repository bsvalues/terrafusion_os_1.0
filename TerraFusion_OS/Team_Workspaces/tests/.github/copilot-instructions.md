# TerraFusion OS Testing - Elite Government Engineering Instructions

## Project Architecture Overview

TerraFusion OS Testing implements championship-level quality assurance across all workspaces:
- `tests/` - Comprehensive testing orchestration (current workspace)
- `tests/backend/` - API testing, integration testing, and backend validation
- `tests/frontend/core/` - UI component testing and user experience validation
- `tests/accessibility/` - WCAG 2.1 AAA compliance and government accessibility standards
- `tests/performance/` - Performance benchmarking and optimization validation
- `tests/security/` - Security testing and vulnerability assessment
- `tests/integration/` - Cross-workspace integration testing

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Elite Testing Philosophy
- **Zero-Defect Tolerance**: All code must pass comprehensive testing gates
- **Government Standards**: Testing exceeds federal quality requirements
- **Accessibility Excellence**: Beyond WCAG 2.1 AAA compliance
- **Performance Excellence**: Sub-100ms response time validation
- **Security First**: Comprehensive security testing for all features

## Elite Testing Standards

### Backend Testing
- **API Testing**: Contract testing with OpenAPI validation
- **Integration Testing**: Cross-service communication validation
- **Load Testing**: Government-scale performance validation
- **Security Testing**: OWASP Top 10 and government security standards
- **Database Testing**: Data integrity and migration validation

### Frontend Testing
- **Component Testing**: Isolated component behavior validation
- **Integration Testing**: User workflow and experience validation
- **Accessibility Testing**: Automated and manual accessibility validation
- **Performance Testing**: Core Web Vitals and government performance budgets
- **Cross-Browser Testing**: Government-approved browser compatibility

### Cross-Workspace Testing
- **SDK Integration Testing**: API contract and integration validation
- **Configuration Testing**: Environment-specific configuration validation
- **Infrastructure Testing**: Deployment and scaling validation
- **Documentation Testing**: Example code and integration accuracy

## Project-Specific Conventions

### Testing Architecture
- `unit/` - Isolated component and function testing
- `integration/` - Cross-component and service testing
- `e2e/` - End-to-end user workflow testing
- `performance/` - Load testing and performance benchmarking
- `accessibility/` - WCAG compliance and usability testing
- `security/` - Vulnerability assessment and penetration testing

### Quality Gates
- **Code Coverage**: Minimum 95% code coverage for all workspaces
- **Performance Budgets**: Enforced response time and resource limits
- **Accessibility Compliance**: 100% WCAG 2.1 AAA compliance
- **Security Validation**: Zero high-severity vulnerabilities
- **Cross-Browser Support**: Government-approved browser compatibility

## Development Guidelines

### When Writing Tests
- Test-driven development (TDD) required for all features
- Include accessibility testing for all UI components
- Performance testing required for all API endpoints
- Security testing mandatory for all user-facing features

### When Running Tests
- All tests must pass before code commits
- Performance budgets validated on every build
- Accessibility tests run automatically on UI changes
- Security scans required for all deployment candidates

### Cross-Workspace Test Coordination
- **Backend Changes**: Trigger SDK and frontend integration tests
- **Frontend Changes**: Validate accessibility and performance impacts
- **Configuration Changes**: Test across all dependent workspaces
- **Infrastructure Changes**: Validate deployment and scaling tests

## Integration Patterns

### Testing Pipeline Flow
```
Code Change → Unit Tests → Integration Tests → Performance Tests → Security Tests → Deployment
```

### Quality Assurance Pipeline
```
Automated Testing → Manual Validation → Accessibility Review → Security Review → Performance Review
```

## Elite Testing Tools and Frameworks

### Backend Testing Stack
- **API Testing**: Postman/Newman, Jest, Supertest
- **Load Testing**: Artillery, K6, JMeter
- **Security Testing**: OWASP ZAP, Bandit, Safety
- **Database Testing**: Factory Boy, Faker, SQL testing frameworks

### Frontend Testing Stack
- **Unit Testing**: Jest, React Testing Library, Vitest
- **E2E Testing**: Playwright, Cypress
- **Accessibility Testing**: axe-core, Pa11y, Lighthouse
- **Performance Testing**: Lighthouse CI, Web Vitals, WebPageTest
- **Visual Testing**: Percy, Chromatic, Storybook

### Cross-Platform Testing
- **Contract Testing**: Pact, OpenAPI validators
- **Infrastructure Testing**: Terraform testing, Ansible molecule
- **Configuration Testing**: JSON Schema validation, environment testing

## Critical Commands & Tasks

### Test Execution
- Use "Deploy Production" VS Code task for comprehensive test validation
- Run accessibility tests before every UI commit
- Execute performance tests on every API change
- Security scans required for every deployment

### Quality Gates Validation
- All tests must achieve 95%+ pass rate
- Performance budgets cannot exceed defined thresholds
- Accessibility compliance must be 100%
- Security vulnerabilities must be resolved before deployment

## Getting Started Quickly
1. Review existing test suites and quality standards
2. Understand cross-workspace testing dependencies
3. Set up local testing environment with all required tools
4. Validate test execution with "Deploy Production" task
5. Coordinate with Quality Assurance and Performance Excellence teams
