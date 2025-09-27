# CLAUDE-testing.md

Testing strategy and quality assurance guidance for Terrafusion OS comprehensive
testing suite.

## Testing Strategy Overview

### Multi-Layer Testing Approach

- **Unit Tests**: Individual component and service testing
- **Integration Tests**: API endpoints and service integration
- **E2E Tests**: Critical workflow validation with Playwright
- **AI Model Tests**: ML model accuracy and performance testing
- **Load Tests**: Performance and scalability validation

## Testing Commands

### Core Testing

```bash
# Run all tests
npm test

# Backend tests (.NET)
npm run backend:test

# Frontend tests (Jest)
npm run frontend:test

# End-to-end tests (Playwright)
cd frontend && npm run test:e2e
```

### Advanced Testing

```bash
# Load testing with k6
k6 run tests/load/api-load-test.js

# AI model testing
python backend/quantum-performance/quantum_performance_benchmark.py

# Security testing
./scripts/penetration-testing.sh --scope=full-system --standards=government

# Performance testing
./scripts/performance-regression-test.sh --baseline=v1.0.0
```

## Unit Testing

### Backend Unit Tests (.NET)

- Business logic testing with xUnit
- Repository pattern testing
- Service layer validation
- Entity mapping verification
- Database context mocking

### Frontend Unit Tests (Jest)

- React component testing with React Testing Library
- Hook testing and validation
- State management testing
- UI interaction testing
- Snapshot testing for components

### Testing Patterns

```bash
# Unit test execution patterns
dotnet test backend/Terrafusion.Tests/
npm test -- --coverage frontend/src/
```

## Integration Testing

### API Integration Tests

- Controller endpoint testing
- Authentication flow validation
- Data persistence verification
- External service integration
- Error handling validation

### Database Integration

- Entity Framework integration testing
- Migration testing
- Data seeding validation
- Query performance testing
- Transaction handling

### Test Configuration

- Test database setup
- Mock service configuration
- Test data management
- Environment isolation

## End-to-End Testing

### Playwright E2E Tests

```bash
# E2E test execution
cd frontend && npm run test:e2e

# Specific test suites
npx playwright test --project=chromium
npx playwright test tests/critical-workflows/
```

### Critical Workflows

- User authentication flows
- Property assessment workflows
- Data entry and validation
- Report generation processes
- Multi-user collaboration scenarios

### Cross-Browser Testing

- Chrome/Chromium testing
- Firefox compatibility
- Safari validation (when applicable)
- Mobile browser testing
- Accessibility testing

## Performance Testing

### Load Testing Strategy

```bash
# Government-grade load testing
./scripts/load-testing-government.sh --users=50000-concurrent --duration=24hours

# API performance testing
./scripts/api-performance-testing.sh --endpoints=all --concurrent-users=1000

# Database load testing
./scripts/database-load-testing.sh --connections=500 --duration=1hour
```

### Performance Metrics

- Response time monitoring
- Throughput measurement
- Resource utilization tracking
- Memory leak detection
- Database performance analysis

### AI Performance Testing

```bash
# AI agent performance testing
./scripts/ai-agent-performance-testing.sh --agents=1008 --workload=maximum

# ML model performance validation
./scripts/ml-model-performance-testing.sh --models=all --accuracy-threshold=99.5

# Quantum performance benchmarking
python backend/quantum-performance/quantum_performance_benchmark.py
```

## Security Testing

### Automated Security Testing

```bash
# Vulnerability assessment
./scripts/vulnerability-assessment.sh --tools=multiple --severity=all

# Penetration testing
./scripts/penetration-testing.sh --scope=full-system --white-box

# Security compliance validation
./scripts/security-compliance-testing.sh --standards=FISMA,NIST
```

### Security Test Categories

- Authentication and authorization
- Input validation and sanitization
- SQL injection prevention
- XSS protection validation
- CSRF protection testing

### Government Security Standards

- FISMA compliance testing
- NIST framework validation
- Section 508 accessibility testing
- Government security standard adherence

## AI & ML Testing

### Model Validation Testing

```bash
# Model accuracy testing
./scripts/ai-model-accuracy-testing.sh --models=property-valuation --threshold=99%

# Bias detection testing
./scripts/ai-bias-testing.sh --models=all --fairness-metrics=demographic-parity

# Model drift detection
./scripts/model-drift-testing.sh --baseline=production --threshold=2%
```

### AI Agent Testing

- Agent behavior validation
- Swarm coordination testing
- Performance under load
- Failure recovery testing
- Communication protocol validation

### ML Pipeline Testing

- Data pipeline validation
- Feature engineering testing
- Model training verification
- Deployment pipeline testing
- Rollback capability testing

## Quality Assurance Automation

### Continuous Testing

```bash
# CI/CD test automation
./scripts/ci-test-pipeline.sh --parallel-execution --fail-fast

# Quality gate validation
./scripts/quality-gate-validation.sh --coverage=90% --security=passing

# Automated regression testing
./scripts/regression-test-suite.sh --baseline=previous-release
```

### Test Automation Framework

- Automated test execution
- Test result reporting
- Failure analysis automation
- Test data management
- Environment provisioning

### Code Quality Testing

```bash
# Code quality analysis
sonar-scanner -Dsonar.projectKey=terrafusion-os

# Static code analysis
./scripts/static-code-analysis.sh --languages=csharp,typescript

# Dependency vulnerability scanning
npm audit --audit-level=high
dotnet list package --vulnerable
```

## Government Compliance Testing

### Accessibility Testing

```bash
# Section 508 compliance testing
./scripts/accessibility-testing.sh --standard=section-508 --automated

# Screen reader compatibility
./scripts/screen-reader-testing.sh --tools=nvda,jaws

# Keyboard navigation testing
./scripts/keyboard-navigation-testing.sh --comprehensive
```

### Compliance Automation

- FISMA control testing
- Privacy regulation compliance
- Data retention policy validation
- Audit trail verification
- Documentation compliance

## Test Data Management

### Test Data Strategy

- Synthetic data generation
- Production data masking
- Test environment isolation
- Data privacy protection
- County-specific test data

### Data Management Commands

```bash
# Generate test data
./scripts/generate-test-data.sh --county=benton --size=large

# Mask production data for testing
./scripts/mask-production-data.sh --privacy-level=maximum

# Reset test environment
./scripts/reset-test-environment.sh --preserve-config
```

## Multi-County Testing

### County-Specific Testing

```bash
# Test county deployment
./scripts/test-county-deployment.sh --county=new-county --template=benton

# Multi-county integration testing
./scripts/multi-county-integration-testing.sh --counties=all

# County performance validation
./scripts/county-performance-testing.sh --county=whatcom --load=production-level
```

### Cross-County Testing

- Data synchronization testing
- Multi-county workflow validation
- Resource sharing testing
- Performance isolation verification

## Monitoring & Reporting

### Test Reporting

- Comprehensive test reports
- Coverage analysis
- Performance metrics
- Security scan results
- Compliance validation reports

### Continuous Monitoring

```bash
# Real-time test monitoring
./scripts/test-monitoring-dashboard.sh --real-time --all-environments

# Test result analysis
./scripts/test-result-analysis.sh --trends --predictions

# Quality metrics tracking
./scripts/quality-metrics-tracking.sh --kpis=coverage,performance,security
```

## Troubleshooting Testing Issues

### Common Testing Problems

- **Test Environment Issues**: Environment configuration and isolation
- **Flaky Tests**: Non-deterministic test behavior
- **Performance Test Failures**: Resource constraints and bottlenecks
- **Data Dependencies**: Test data consistency and availability

### Testing Best Practices

- Test isolation and independence
- Consistent test data management
- Parallel test execution optimization
- Clear failure reporting and analysis
- Regular test maintenance and updates
