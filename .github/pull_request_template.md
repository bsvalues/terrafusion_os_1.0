<!-- Pull Request Template for TerraFusion OS -->

## Summary
- Briefly describe the change and which subsystem it touches (frontend / backend / AI / plugin).

## Checklist (required)
- [ ] Description and scope included
- [ ] Tests added/updated (unit/integration). Commands to run: `npm test` (frontend) / `dotnet test` (backend)
- [ ] EF Migration included if entities changed (include migration name)
- [ ] Audit fields preserved (CreatedAt/UpdatedAt/CreatedBy/UpdatedBy)
- [ ] Health check added/verified for new service (`IHealthCheck`)
- [ ] Security/Compliance note: confirm no production county data modified; list any secret or env var changes
- [ ] Docs updated if public/API surface changed
- [ ] Reviewer guidance: list focused review areas (e.g., "check audit interceptor", "verify SignalR hub registration")

## Local verification steps
1. Build and run the subsystem locally (example):
   - Frontend: `npm run dev` and validate UI flows
   - Backend: `dotnet run --project backend/TerraFusion.API`
2. Run tests: `npm test` / `dotnet test`
3. If DB changed: `dotnet ef database update` (development only)

## Notes for AI-swarm / production-risk changes
- If PR touches AI swarm coordination, mark with `AI-SWARM` label and include a short safety plan for rollout and tests.
# TerraFusion Government Service Pull Request

## 🏛️ Government Compliance Checklist

### Security & Compliance
- [ ] Code follows government security standards
- [ ] No sensitive data exposed in code
- [ ] All dependencies scanned for vulnerabilities
- [ ] FISMA compliance requirements met
- [ ] Security review completed

### Accessibility (WCAG 2.2 AA / Section 508)
- [ ] Screen reader compatibility tested
- [ ] Keyboard navigation functional
- [ ] Color contrast ratios validated (4.5:1 minimum)
- [ ] Alternative text for images provided
- [ ] Form labels properly associated
- [ ] Focus indicators visible

### Performance & Quality
- [ ] Performance benchmarks met (100ms response time)
- [ ] Load testing completed (1000+ concurrent users)
- [ ] Code coverage >= 80%
- [ ] ESLint and Prettier rules followed
- [ ] TypeScript compilation successful

### Testing Requirements
- [ ] Unit tests written and passing
- [ ] Integration tests completed
- [ ] Accessibility tests passing
- [ ] Performance tests validated
- [ ] Security tests executed

### Documentation
- [ ] Code documented with JSDoc/comments
- [ ] README updated if needed
- [ ] Government compliance documentation updated
- [ ] API documentation updated

## 📋 Change Description

### What changed?
<!-- Describe the changes in this PR -->

### Why was this change necessary?
<!-- Explain the business/technical justification -->

### Government Impact Assessment
<!-- Describe impact on citizen services -->

### Testing Performed
<!-- Detail all testing completed -->

## 🔒 Security Review

### Security Considerations
<!-- List any security implications -->

### Data Privacy Impact
<!-- Describe any data privacy considerations -->

### Audit Trail
<!-- Reference any audit requirements -->

## 🎯 Deployment Checklist

- [ ] Staging deployment successful
- [ ] Government approval obtained
- [ ] Audit trail documentation complete
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

## 📊 Performance Impact

### Before/After Metrics
<!-- Include performance benchmarks -->

### Resource Usage
<!-- Describe CPU/memory/storage impact -->

## 👥 Review Requirements

This PR requires approval from:
- [ ] Technical Lead
- [ ] Security Team
- [ ] Compliance Officer
- [ ] Government Liaison (for citizen-facing changes)

---

**Government Service Standards**: This change meets all federal accessibility, security, and performance requirements for citizen services.
