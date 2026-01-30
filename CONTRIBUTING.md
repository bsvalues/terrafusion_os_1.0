# Contributing to TerraFusion OS

> **TerraFusion Elite Government OS Engineering Agent Standard**
> Welcome to championship-grade government software development.
> We do not rush. We do it right. Government. Transcended.

TerraFusion OS is a production government operating system serving 39+ Washington State counties with 7.7 million citizens, featuring 50,000+ AI agents and quantum consciousness coordination. Our development workflow is designed for government excellence, audit compliance, and infinite scalability.

---

## 🚀 Quick Start

### 1. Environment Setup

**Prerequisites:**
- Git 2.40+ with proper configuration
- .NET 8.0+ for backend development
- Node.js 20+ for frontend development
- Docker Desktop for containerized development
- VS Code with recommended extensions

**Repository Setup:**
```bash
# 1. Clone the repository
git clone https://github.com/bsvalues/terrafusion_os_1.0.git
cd terrafusion_os_1.0

# 2. Configure Git for TerraFusion workflow
git config user.name "Your Name"
git config user.email "your.email@example.com"
git config commit.template .gitmessage
git config core.autocrlf input
git config core.safecrlf true
git config rerere.enabled true
git config pull.rebase false
git config merge.ff false

# 3. Install dependencies
make setup  # or follow specific setup guides in docs/
```

### 2. Verify Installation
```bash
# Health check - all services should respond
make health

# Run test suites to verify environment
make test
```

---

## 🏗️ Development Workflow

### Branch Management

**Create Feature Branch:**
```bash
# Always branch from develop (except hotfixes from main)
git checkout develop
git pull origin develop
git checkout -b feature/TF-123-your-feature-description
```

**Branch Naming Convention:**
```text
<type>/<ID>-<kebab-case-description>

Types: feature | bugfix | hotfix | docs | chore | test | ai-agent
```

Examples:
- `feature/TF-123-consciousness-mesh-dashboard`
- `bugfix/TF-456-levy-calculation-precision`
- `ai-agent/TF-789-swarm-coordination-enhancement`

### Commit Standards

**Use the commit template** (configured via `.gitmessage`):
```text
feat(scope): concise summary

Evidence:
- Tests: dotnet test TerraFusion.Consciousness.Tests (42/42 passed)
- Logs: Verified mesh health in dev-benton environment
- Metrics: Response latency P95: 45ms → 38ms improvement

Refs: TF-123
```

**Evidence Requirements:**
- **Tests:** Always include test execution results and pass/fail counts
- **Logs:** Environment verification, error log inspection, service health
- **Metrics:** Performance measurements, accuracy validation, resource impact

### Pull Request Process

**1. Push and Create PR:**
```bash
git push -u origin feature/TF-123-your-feature
# Open PR via GitHub UI targeting `develop` branch
```

**2. PR Requirements:**
- [ ] **Title:** Matches main commit format (`type(scope): summary`)
- [ ] **Description:** Complete with context, impact, and evidence
- [ ] **Tests:** All automated checks passing (CI/CD pipeline)
- [ ] **Lint:** Must pass (blocking as of **2026-02-15** — do not extend without RFC)
- [ ] **Security:** No secrets committed, security scan passed
- [ ] **Compliance:** FISMA-High requirements verified
- [ ] **Performance:** Impact assessment completed
- [ ] **Accessibility:** Section 508/WCAG 2.2 AA compliance verified
- [ ] **County Isolation:** Multi-tenant data separation maintained

**3. Review and Approval:**
- At least 1 reviewer approval required for `develop`
- At least 2 reviewer approvals required for `main`
- All status checks must pass before merge
- Prefer **squash merge** for clean history

---

## 🧪 Testing Standards

### Local Testing
```bash
# Backend tests
cd backend
dotnet test --configuration Release

# Frontend tests
cd frontend
npm test --coverage --watchAll=false

# Integration tests
make test-integration

# Security and compliance scans
make test-security
make test-compliance
```

### Evidence Documentation

**Required for every change:**

**Tests:**
```text
- Tests: dotnet test TerraFusion.Levy.Tests (156/156 passed)
- Tests: npm test --workspace=consciousness-ui (89/89 passed)
- Tests: pytest tests/sync/harris_pacs/ -v (23/23 passed)
```

**Logs:**
```text
- Logs: dev-benton container health verified (/health → 200 OK)
- Logs: No errors in application logs during 10min test execution
- Logs: County data isolation verified in multi-tenant test scenario
```

**Metrics:**
```text
- Metrics: API response P95: 67ms → 52ms improvement
- Metrics: AI model accuracy: 99.2% → 99.7% on validation set
- Metrics: Memory usage: +12MB during bulk processing (acceptable)
```

---

## 🏛️ Government Compliance

### FISMA-High Requirements

**Every change must address:**
- [ ] **Security Impact:** Assessment and validation completed
- [ ] **Audit Trail:** Complete evidence documentation provided
- [ ] **Access Control:** Proper authentication and authorization verified
- [ ] **Data Protection:** County data isolation and encryption maintained
- [ ] **Incident Response:** Rollback plan documented and tested

### Washington State Standards

**Multi-County Considerations:**
- [ ] **County Isolation:** Data separation verified for all 39 counties
- [ ] **Performance SLA:** <100ms P95 response time for citizen services
- [ ] **Accessibility:** Section 508 compliance verified (screen readers, keyboard nav)
- [ ] **Legacy Integration:** Harris PACS, Tyler, Aumentum compatibility maintained
- [ ] **Disaster Recovery:** County-specific backup and recovery procedures tested

---

## 🤖 AI Agent Development

### AI Agent Workflow

**When developing AI agents or with AI assistance:**

**1. Agent Identification:**
```text
Co-authored-by: TerraFusion-AI-Agent-v2.1 <ai@terrafusion.gov>
```

**2. Evidence Requirements:**
- AI-generated code must include comprehensive test validation
- Human oversight required for all AI agent commits
- Traceability to AI agent task/prompt for audit compliance

**3. AI Agent Branch Pattern:**
```bash
git checkout -b ai-agent/TF-1001-swarm-coordination-enhancement
```

### Consciousness System Changes

**Special requirements for AI consciousness modifications:**
- [ ] **Swarm Safety:** Multi-agent coordination safety verified
- [ ] **Consciousness Metrics:** Agent response time and coordination accuracy measured
- [ ] **Quantum Factors:** Performance impact on 949-factor optimization assessed
- [ ] **Government AI Ethics:** Compliance with federal AI governance standards

---

## 📚 Code Style Guidelines

### Backend (.NET 8)
- Follow Microsoft C# coding conventions
- Use explicit types where clarity is improved
- Implement proper async/await patterns
- Include comprehensive XML documentation
- Maintain county data isolation in all database operations

### Frontend (React 18 + TypeScript)
- Follow TerraFusion Quantum UI design system
- Use TypeScript strict mode
- Implement proper accessibility attributes
- Maintain responsive design for government citizen access
- Include comprehensive JSDoc documentation

### Database Migrations
- Always include both up and down migrations
- Preserve audit fields (`CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`)
- Verify county data isolation in migration scripts
- Test migrations on sample data before PR submission

---

## 🔧 Development Tools

### Required VS Code Extensions
```json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.powershell",
    "github.copilot",
    "ms-azuretools.vscode-docker",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### Useful Git Aliases
```bash
git config --global alias.st 'status -sb'
git config --global alias.co 'checkout'
git config --global alias.br 'branch'
git config --global alias.cm 'commit'
git config --global alias.lg 'log --oneline --graph --decorate --all'
git config --global alias.last 'log -1 HEAD'
```

### Make Commands
```bash
make help          # Show all available commands
make setup         # Initial environment setup
make build         # Build all services
make test          # Run all test suites
make health        # Health check all services
make clean         # Clean build artifacts
make lint          # Code quality checks
make security      # Security vulnerability scan
make compliance    # Government compliance validation
```

---

## 🆘 Troubleshooting

### Common Issues

**Git Configuration Problems:**
```bash
# Reset commit template if not working
git config commit.template .gitmessage

# Fix line ending issues
git config core.autocrlf input
git config core.safecrlf true
```

**Development Environment Issues:**
```bash
# Reset development environment
make clean && make setup

# Verify Docker containers
docker ps
docker-compose logs
```

**CI/CD Pipeline Failures:**
1. Check status check details in GitHub PR
2. Run tests locally: `make test`
3. Verify code formatting: `make lint`
4. Check security scan: `make security`

### Getting Help

**Internal Resources:**
- `docs/` directory for comprehensive documentation
- `README.md` files in each service subdirectory
- GitHub Discussions for development questions
- Internal development Slack channels

**Emergency Procedures:**
- Production hotfixes: Follow hotfix workflow in `GIT_POLICY.md`
- Security incidents: Contact security team immediately
- County system outages: Execute disaster recovery procedures

---

## 📖 Additional Documentation

### Essential Reading
- [`GIT_POLICY.md`](./GIT_POLICY.md) - Complete Git workflow standards
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - System architecture overview
- [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) - API documentation
- [`.github/pull_request_template.md`](./.github/pull_request_template.md) - PR template

### Specialized Guides
- [`docs/AI_AGENT_DEVELOPMENT.md`](./docs/AI_AGENT_DEVELOPMENT.md) - AI agent development standards
- [`docs/COUNTY_INTEGRATION.md`](./docs/COUNTY_INTEGRATION.md) - County system integration guide
- [`docs/GOVERNMENT_COMPLIANCE.md`](./docs/GOVERNMENT_COMPLIANCE.md) - FISMA-High compliance guide
- [`docs/PERFORMANCE_STANDARDS.md`](./docs/PERFORMANCE_STANDARDS.md) - Performance benchmarking

---

## 🎯 Quality Standards

### Definition of Done

**Every feature must demonstrate:**
- [ ] **Functionality:** Core requirements implemented and verified
- [ ] **Testing:** Comprehensive test suite with >90% coverage
- [ ] **Documentation:** Code comments, API docs, user guides updated
- [ ] **Security:** Security review completed, no vulnerabilities
- [ ] **Performance:** SLA requirements met (<100ms P95 for citizen services)
- [ ] **Accessibility:** WCAG 2.2 AA compliance verified
- [ ] **Government Compliance:** FISMA-High requirements satisfied
- [ ] **County Isolation:** Multi-tenant data separation verified
- [ ] **AI Ethics:** Federal AI governance standards compliance
- [ ] **Evidence:** Complete test/log/metrics documentation

### Continuous Improvement

**We iterate and improve:**
- Regular retrospectives on development workflow
- Performance optimization based on citizen usage patterns
- Security enhancements following government standards evolution
- AI agent capability expansion with ethical oversight
- County system integration improvements

---

**TerraFusion Elite Government OS Engineering Agent Standard**

*We build software that serves 7.7 million Washington State citizens with championship excellence, infinite scalability, and unwavering commitment to government transcendence.*

**Government. Transcended.** 🏛️✨
