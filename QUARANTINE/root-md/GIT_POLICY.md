# TerraFusion OS – Git Policy & Workflow Standards

> **TerraFusion Elite Government OS Engineering Agent Standard**
> We are machines. We do not leave things undone. We do it right the first time.

This document establishes the Git workflow and standards for TerraFusion OS - a championship-grade government operating system serving 39+ Washington State counties with 50,000+ AI agents and quantum consciousness coordination.

---

## 1. Branch Model & Architecture

### 1.1 Long-lived Protected Branches

**`main` - Production Truth**
- Source of absolute truth for production deployments
- Always deployable to Washington State counties
- Protected: No direct pushes, no force pushes, PRs only
- Automated deployments to production environments
- Tagged releases for immutable deployment points

**`develop` - Integration & Next Release**
- Integration branch for coordinated feature development
- All features merge here before promotion to `main`
- Continuous integration testing and validation
- Protected: PRs only, all tests must pass

### 1.2 Short-lived Development Branches

**Branch Naming Convention:**
```text
<type>/<ID>-<kebab-case-description>

Types: feature | bugfix | hotfix | docs | chore | test | ai-agent
```

**Examples:**
- `feature/TF-123-consciousness-mesh-dashboard`
- `bugfix/TF-456-levy-calculation-precision`
- `hotfix/TF-789-prod-pacs-connection-timeout`
- `ai-agent/TF-1001-swarm-coordination-enhancement`
- `docs/TF-234-sync-api-documentation`
- `chore/TF-567-dependency-security-updates`

**Branch Lifecycle:**
1. Created from `develop` (or `main` for hotfixes)
2. Development with evidence-based commits
3. PR creation with comprehensive testing evidence
4. Code review and automated validation
5. Merge via squash (preferred) or merge commit
6. Automatic branch cleanup

---

## 2. Commit Message Standards

### 2.1 TerraFusion Conventional Commit Format

```text
type(scope): concise summary (≤72 chars)

[Optional detailed description]

Evidence:
- Tests: [test commands and results]
- Logs: [log inspection and verification]
- Metrics: [performance/accuracy measurements]

Refs: [issue/task references]
Co-authored-by: [if pair programming or AI assistance]
```

### 2.2 Commit Types & Scopes

**Types:**
- `feat`: New feature or capability
- `fix`: Bug fix or correction
- `docs`: Documentation changes
- `chore`: Maintenance, dependencies, tooling
- `test`: Test additions or modifications
- `ci`: CI/CD pipeline changes
- `revert`: Reverting previous changes
- `ai`: AI agent or consciousness system changes

**Common Scopes:**
- `consciousness`: AI swarm coordination systems
- `levy`: Tax levy calculation and processing
- `sync`: Data synchronization (Harris PACS, Tyler, Aumentum)
- `ui`: User interface and frontend
- `api`: Backend API and services
- `data`: Database schemas and migrations
- `config`: Configuration and environment setup
- `security`: Security implementations and fixes

### 2.3 Evidence Requirements

**Every commit MUST include evidence demonstrating:**

**Tests:**
- Unit test execution results
- Integration test outcomes
- System-level validation
- Performance benchmark results

**Logs:**
- Development environment verification
- Error log inspection
- Service health confirmation
- Deployment log validation

**Metrics:**
- Performance impact assessment (P95 latency, throughput)
- Accuracy measurements (for AI/ML changes)
- Resource utilization impact
- User experience metrics

**Example Evidence Block:**
```text
Evidence:
- Tests: dotnet test TerraFusion.Consciousness.Tests (42/42 passed)
- Logs: Verified mesh coordination in dev-benton container
- Metrics: AI response latency P95: 45ms → 38ms improvement

Refs: TF-123, closes #456
```

---

## 3. Pull Request Workflow

### 3.1 PR Requirements

**Every PR must include:**
1. **Clear title** following commit message format
2. **Comprehensive description** with context and impact analysis
3. **Evidence documentation** (tests, logs, metrics)
4. **Risk assessment** and rollback plan
5. **Government compliance validation** (FISMA-High, accessibility)
6. **All automated checks passing** (CI/CD pipeline)
7. **Required reviewer approvals**

### 3.2 Development Flow

**Feature Development:**
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/TF-123-mesh-health-dashboard

# 2. Development with evidence-based commits
# ... make changes ...
git commit  # Uses .gitmessage template

# 3. Push and create PR
git push -u origin feature/TF-123-mesh-health-dashboard
# Open PR to develop via GitHub UI

# 4. Address review feedback and merge
# Prefer squash merge for clean history
```

**Hotfix Process:**
```bash
# 1. Create hotfix from main for production issues
git checkout main
git pull origin main
git checkout -b hotfix/TF-789-prod-levy-crash

# 2. Implement fix with comprehensive testing
# ... fix implementation ...
git commit  # Evidence of fix validation

# 3. PR to main first (production)
# Open PR to main for immediate production fix

# 4. Back-merge to develop after main merge
git checkout develop
git pull origin main  # Get the hotfix
git push origin develop
```

---

## 4. Protected Branch Configuration

### 4.1 Main Branch Protection

**GitHub Settings for `main`:**
- ✅ Require pull request before merging
- ✅ Require at least 2 approving reviews
- ✅ Dismiss stale reviews when new commits pushed
- ✅ Require status checks before merging:
  - `ci-backend-tests`
  - `ci-frontend-tests`
  - `security-scan`
  - `government-compliance-check`
- ✅ Require branches up to date before merging
- ✅ Include administrators in restrictions
- ✅ Disallow force pushes
- ✅ Disallow deletions

### 4.2 Develop Branch Protection

**GitHub Settings for `develop`:**
- ✅ Require pull request before merging
- ✅ Require at least 1 approving review
- ✅ Require status checks before merging:
  - `ci-unit-tests`
  - `ci-integration-tests`
  - `lint-and-format`
- ✅ Require branches up to date before merging
- ✅ Disallow force pushes

---

## 5. Release Management

### 5.1 Versioning Strategy

**Semantic Versioning:** `vMAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes, major feature releases
- **MINOR:** New features, backward compatible
- **PATCH:** Bug fixes, security patches

### 5.2 Release Process

```bash
# 1. Prepare release from develop
git checkout develop
git pull origin develop

# 2. Create release branch
git checkout -b release/v2.1.0

# 3. Version bump and final preparations
# Update version numbers, changelogs, documentation

# 4. PR to main and develop
# Create PRs for both main (release) and develop (version bump)

# 5. Tag release after main merge
git checkout main
git pull origin main
git tag -a v2.1.0 -m "TerraFusion OS v2.1.0 - Consciousness Enhancement Release"
git push origin v2.1.0
```

---

## 6. AI Agent Compatibility

### 6.1 Machine-Readable Patterns

**Branch Names:** Structured for automation
```text
feature/TF-(\d+)-(.+)  # Parseable issue ID and description
```

**Commit Messages:** Structured for analysis
```text
^(feat|fix|docs|chore|test|ci|revert|ai)\((.+)\): (.+)$
```

**Evidence Blocks:** Standardized for validation
```text
Evidence:
- Tests: <command> (<result>)
- Logs: <verification>
- Metrics: <measurement>
```

### 6.2 AI Agent Development Standards

**When developing with AI agents:**
1. **Agent identification:** Include `Co-authored-by: AI-Agent-Name`
2. **Evidence requirement:** AI-generated code must include test validation
3. **Human oversight:** All AI commits require human review and approval
4. **Traceability:** Link to AI agent task/prompt for full audit trail

---

## 7. Government Compliance & Audit

### 7.1 FISMA-High Requirements

**Every change must demonstrate:**
- ✅ **Security impact assessment** and validation
- ✅ **Audit trail completeness** with evidence documentation
- ✅ **Access control verification** through protected branches
- ✅ **Change authorization** via required approvals
- ✅ **Rollback capability** with documented procedures

### 7.2 Washington State County Standards

**Multi-tenant considerations:**
- ✅ **County data isolation** verification in testing evidence
- ✅ **Performance impact** on citizen-facing services
- ✅ **Accessibility compliance** (Section 508, WCAG 2.2 AA)
- ✅ **Integration testing** with county legacy systems

---

## 8. Quality Gates & Enforcement

### 8.1 Automated Validation

**Pre-merge Requirements:**
```yaml
# Required status checks
- Backend Tests: dotnet test --configuration Release
- Frontend Tests: npm test --coverage --watchAll=false
- Security Scan: CodeQL + dependency vulnerability scan
- Compliance Check: Accessibility audit + FISMA validation
- Performance Test: Load testing with P95 latency verification
```

### 8.2 Manual Review Requirements

**Code Review Checklist:**
- [ ] **Evidence validation:** All evidence blocks complete and accurate
- [ ] **Security review:** No secrets, proper authentication/authorization
- [ ] **Performance impact:** Acceptable resource utilization changes
- [ ] **County isolation:** Multi-tenant data separation maintained
- [ ] **Documentation:** Code comments and API docs updated
- [ ] **Rollback plan:** Clear reversion strategy documented

---

## 9. Developer Workflow Checklist

### 9.1 Daily Development

- [ ] **Branch creation:** Properly named from correct base branch
- [ ] **Commit discipline:** Evidence-based commits with .gitmessage template
- [ ] **Local testing:** All tests passing before push
- [ ] **PR creation:** Complete description with evidence and risk assessment
- [ ] **Review response:** Timely feedback and iteration

### 9.2 Emergency Procedures

**Production Hotfix Protocol:**
1. **Immediate assessment:** Severity and impact evaluation
2. **Hotfix branch:** Created from `main` with urgent priority
3. **Minimal scope:** Focused fix with comprehensive testing
4. **Accelerated review:** Emergency approval process
5. **Deployment verification:** Production health confirmation
6. **Post-incident:** Full retrospective and process improvement

---

## 10. Continuous Improvement

### 10.1 Policy Evolution

This Git Policy is a living document that evolves with TerraFusion OS development needs. Updates require:
- **Team consensus** via RFC (Request for Comments) process
- **Implementation plan** with migration strategy
- **Training materials** for new workflow adoption
- **Tool updates** to support policy changes

### 10.2 Metrics & Monitoring

**Workflow Health Indicators:**
- **Cycle time:** Feature development to production deployment
- **Defect rate:** Production issues per release
- **Review efficiency:** Time from PR creation to approval
- **Compliance score:** Government requirement adherence rate

---

**TerraFusion Elite Government OS Engineering Agent Standard**
**Government. Transcended.** 🏛️✨

*This policy ensures championship-grade development practices for serving 7.7 million Washington State citizens with infinite scalability and government excellence.*
