# TerraFusion Atlas Developer Guide

## 🎯 Overview

The TerraFusion Atlas is our **authoritative system of record** for all platform components. Before writing code for any new feature, you must register it in the Atlas.

> **"Register before you code"** - Atlas Principle #1

## 🚀 Quick Start

### For New Features

**Step 1: Plan your component**
- Choose the right registry type (service, engine, frontend, agent, module, etc.)
- Define ownership (which team owns this?)
- Identify dependencies
- Choose meaningful tags

**Step 2: Register in Atlas**

```bash
cd terrafusion-atlas

# Example: Register a new service
python3 scripts/atlas_seed.py \
  --type service \
  --id "payments.processor" \
  --name "Payment Processing Service" \
  --description "Handles credit card and ACH transactions" \
  --owner "platform-team" \
  --tags "payments,critical,pci-dss" \
  --path "src/services/payment-processor"

# Verify registration
python3 scripts/atlas_validate.py
```

**Step 3: Create your code**

Now that your component is registered, create your code in the path you specified.

**Step 4: Update Atlas as needed**

If your component's details change:
- Manually edit `terrafusion-atlas/registries/<registry>.json`
- Or use `atlas_seed.py` with `--update` flag (if implemented)

## 📋 Registry Types

Choose the appropriate registry:

| Registry | Use For | Examples |
|----------|---------|----------|
| **services** | Backend APIs, microservices | REST APIs, GraphQL servers, gRPC services |
| **engines** | Core processing logic | Valuation engine, GIS processor, ML models |
| **frontends** | User interfaces | React apps, admin dashboards, mobile apps |
| **agents** | AI assistants | Property analyzer, research assistant, chatbots |
| **modules** | Reusable libraries | Auth module, logging, utilities |
| **datasets** | Data collections | Property data, GIS layers, training data |
| **pipelines** | ETL/data workflows | Data sync, transformations, migrations |
| **deployments** | Infrastructure | K8s clusters, Docker configs, Helm charts |
| **environments** | Runtime configs | Dev, staging, production, sandbox |
| **brands** | Partner/client branding | White-label configs, themes |
| **compliance** | Security/regulatory | Audit logs, certifications, policies |
| **partners** | External integrations | Harris County, Woolpert, third-party APIs |
| **releases** | Version management | Release notes, changelogs, versions |
| **components** | Miscellaneous | Anything not fitting above categories |

## 🏷️ Tagging Strategy

**Every Atlas item should have 2-5 tags.** Use tags for:

### Functional Tags
- `ai`, `ml`, `nlp` - AI/ML functionality
- `gis`, `geospatial`, `mapping` - Geographic features
- `payments`, `billing` - Financial operations
- `auth`, `security`, `rbac` - Security features
- `analytics`, `reporting` - Business intelligence

### Technical Tags
- `rust`, `typescript`, `python` - Primary language
- `kubernetes`, `docker` - Infrastructure
- `graphql`, `rest`, `grpc` - API style
- `postgresql`, `redis`, `s3` - Data stores

### Operational Tags
- `critical` - Mission-critical (99.99% uptime)
- `experimental` - Not production-ready
- `deprecated` - Scheduled for removal
- `beta` - In testing phase

### Partner Tags
- `harris`, `woolpert`, `benton` - Partner-specific
- `white-label` - Customizable for clients
- `marketplace` - Marketplace platform components

## 👥 Ownership

Every component must have an owner:

- `platform-team` - Core platform services
- `ai-team` - AI agents and ML models
- `frontend-team` - UI/UX components
- `ops-team` - Infrastructure and deployments
- `data-team` - Data pipelines and datasets
- `security-team` - Security and compliance
- `partnerships-team` - Partner integrations

## 🔄 Workflow Integration

### Pre-commit Hooks

Install Atlas pre-commit hooks:

```bash
# Set up git hooks directory
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit

# Now commits will check for Atlas registration
git add src/new-service/
git commit -m "Add new service"
# → Hook verifies Atlas registration before committing
```

### Pull Request Process

1. **Create your PR** using the template
2. **Fill out Atlas section** in PR description
3. **Tag appropriate teams** for review
4. **Wait for CI checks** including `atlas-validation`
5. **Address feedback** and update Atlas if needed
6. **Merge** once approved and all checks pass

### CI/CD Pipeline

Our CI automatically runs:

```yaml
# .github/workflows/atlas-validation.yml
- Atlas validation (JSON schemas)
- Duplicate ID check
- Ownership verification
- Tag presence check
- Source path validation
- Statistics generation
```

**PRs will not merge if Atlas validation fails.**

## 🧪 Testing

### Test Your Registration

```bash
# Validate all registries
python3 scripts/atlas_validate.py

# View statistics
python3 scripts/atlas_summary.py

# Check for unregistered items
python3 scripts/check_unregistered.py

# Find specific item
grep -r "your.component.id" terrafusion-atlas/registries/
```

### Common Issues

**❌ "Duplicate ID detected"**
```bash
# Solution: Choose a unique ID
python3 scripts/atlas_seed.py --id "unique.name.v2" ...
```

**❌ "Missing required field: owner"**
```bash
# Solution: Always specify owner
python3 scripts/atlas_seed.py --owner "platform-team" ...
```

**❌ "Source path does not exist"**
```bash
# Solution: Create directory first
mkdir -p src/services/my-service
python3 scripts/atlas_seed.py --path "src/services/my-service" ...
```

## 📊 Best Practices

### ✅ DO

- Register components before writing code
- Use descriptive, hierarchical IDs (`payments.stripe.processor`)
- Include 2-5 relevant tags
- Document dependencies
- Keep descriptions concise (1-2 sentences)
- Update Atlas when components change
- Link related Atlas items

### ❌ DON'T

- Don't bypass pre-commit hooks (except emergencies)
- Don't create vague IDs (`service1`, `test`)
- Don't leave owner blank
- Don't register test files or utilities
- Don't duplicate existing registrations
- Don't forget to update during refactoring

## 🆘 Getting Help

**Questions about Atlas?**
- Read: `terrafusion-atlas/docs/ATLAS_PLAYBOOK.md`
- Ask: #atlas-help Slack channel
- Review: Existing registries for examples

**Technical issues?**
- Check: `atlas_validate.py` error messages
- Run: `atlas_summary.py` for health status
- Contact: @platform-team

**Process questions?**
- Review: This guide
- Check: PR template requirements
- Ask: Your team lead

## 📈 Metrics & Monitoring

Track Atlas health:

```bash
# Generate health report
python3 scripts/atlas_summary.py

# Expected metrics:
# - 100% ownership coverage
# - 80%+ tagging coverage
# - 0 duplicate IDs
# - 0 invalid JSON
```

## 🔄 Maintenance

### Monthly Review

Teams should review their Atlas entries monthly:

- Update lifecycle status (active, deprecated, archived)
- Verify ownership is current
- Add missing tags
- Update descriptions
- Remove obsolete entries

### Quarterly Audit

Platform team conducts quarterly audits:

- Find unregistered components
- Check for orphaned Atlas entries
- Validate dependencies
- Update documentation
- Generate partner reports

---

## 🎓 Training Resources

- **Atlas Playbook**: `terrafusion-atlas/docs/ATLAS_PLAYBOOK.md`
- **Quick Reference**: `QUICK_REFERENCE.md`
- **Video Tutorial**: [Link to internal video]
- **Example Registrations**: Browse `terrafusion-atlas/registries/`

---

**Remember: Atlas is not bureaucracy—it's our shared map of the codebase. Keep it accurate, and it will guide the whole team.**

*Last updated: 2025-01-05*
