# TerraFusion Pre-Deployment Validation

Run quality gates before deployment.

## Quality Targets:
- Test Coverage: 97%+ statements
- Branch Coverage: 90%+
- LCP (Largest Contentful Paint): ≤2500ms
- Accessibility Violations: 0

## Checks to Run:

### 1. Build Validation
```bash
cd backend && dotnet build TerraFusion.sln
cd frontend && npm run build
```

### 2. Test Execution
```bash
cd backend && dotnet test
cd frontend && npm test
```

### 3. Type Checking
```bash
cd frontend && npx tsc --noEmit
```

### 4. Lint Check
```bash
cd frontend && npm run lint
```

### 5. Security Scan
- Check for hardcoded secrets
- Verify no .env files in commit
- Check for SQL injection patterns

### 6. Performance Check
- Bundle size analysis
- Lighthouse score targets

### 7. Compliance Check
- FISMA controls validation
- Audit trail verification

## Deployment Checklist:
- [ ] All tests pass (716 tests, 91.9%+ pass rate)
- [ ] No type errors
- [ ] No lint errors
- [ ] Security scan clean
- [ ] Performance targets met
- [ ] Compliance validated

## Output:
GO/NO-GO decision with detailed breakdown.
