# RACI Matrix Template

**Purpose:** Define Responsible, Accountable, Consulted, and Informed roles for each Atlas registry type.

## Legend

- **R** - Responsible: Does the work
- **A** - Accountable: Owns the outcome
- **C** - Consulted: Provides input
- **I** - Informed: Kept in the loop

## Services Registry

| Activity | Kernel Team | Platform Team | Security Team | Ops Team |
|----------|-------------|---------------|---------------|----------|
| Add new service | R/A | C | C | I |
| Update service | R/A | C | I | I |
| Deprecate service | R | A | C | I |
| Security review | C | C | R/A | I |
| Deploy service | C | I | I | R/A |

## Engines Registry

| Activity | Kernel Team | Platform Team | Performance Team | Ops Team |
|----------|-------------|---------------|------------------|----------|
| Add new engine | R/A | C | C | I |
| Optimize engine | R/A | I | C | I |
| FFI binding | R/A | C | I | I |
| Performance testing | C | I | R/A | I |

## Frontends Registry

| Activity | Frontend Team | Design Team | Platform Team | Marketing Team |
|----------|---------------|-------------|---------------|----------------|
| Add new frontend | R/A | C | C | I |
| UI/UX changes | R/A | R/A | I | C |
| Deploy frontend | R | C | I | A |
| Brand compliance | C | R/A | I | C |

## Agents Registry

| Activity | AI Team | Data Science Team | Platform Team | Ethics Committee |
|----------|---------|-------------------|---------------|------------------|
| Add new agent | R/A | C | C | I |
| Train model | R/A | R/A | I | C |
| Deploy agent | R | I | C | A |
| Ethics review | C | C | I | R/A |

## Modules Registry

| Activity | Plugins Team | Marketplace Team | QA Team | Support Team |
|----------|--------------|------------------|---------|--------------|
| Add new module | R/A | C | C | I |
| Test module | C | I | R/A | I |
| Publish to marketplace | C | R/A | C | I |
| Support requests | I | C | I | R/A |

## Datasets Registry

| Activity | Data Team | DBA Team | Security Team | Compliance Team |
|----------|-----------|----------|---------------|-----------------|
| Add new dataset | R/A | C | C | C |
| Schema changes | R/A | R/A | C | I |
| Data classification | C | I | R/A | R/A |
| Backup/restore | C | R/A | I | I |

## Pipelines Registry

| Activity | Ops Team | Dev Team | QA Team | Security Team |
|----------|----------|----------|---------|---------------|
| Add new pipeline | R/A | C | C | C |
| CI/CD changes | R/A | C | C | C |
| Pipeline failures | R | I | C | A |
| Security scanning | C | I | C | R/A |

## Brands Registry

| Activity | Marketing Team | Design Team | Legal Team | Platform Team |
|----------|----------------|-------------|------------|---------------|
| Add new brand | R/A | R/A | C | I |
| Brand guidelines | R/A | R/A | C | I |
| Trademark review | C | I | R/A | I |
| Asset management | R | C | I | A |

## Environments Registry

| Activity | Ops Team | Platform Team | Security Team | Dev Team |
|----------|----------|---------------|---------------|----------|
| Add new environment | R/A | C | C | I |
| Configure environment | R/A | C | C | C |
| Access control | C | C | R/A | I |
| Cost management | R | A | I | I |

## Deployments Registry

| Activity | Ops Team | Dev Team | Platform Team | QA Team |
|----------|----------|----------|---------------|---------|
| Add deployment config | R/A | C | C | I |
| Deploy to prod | R | C | C | A |
| Rollback | R/A | C | I | I |
| Deployment validation | C | I | I | R/A |

## Compliance Registry

| Activity | Compliance Team | Security Team | Legal Team | Leadership |
|----------|-----------------|---------------|------------|------------|
| Add compliance doc | R/A | C | C | I |
| Audit | R/A | R/A | C | I |
| Certification | R | C | R/A | A |
| Violation response | C | R | C | A |

## Partners Registry

| Activity | Partnerships Team | Legal Team | Platform Team | Support Team |
|----------|-------------------|------------|---------------|--------------|
| Add partner integration | R/A | C | C | I |
| Contract review | C | R/A | I | I |
| Integration support | C | I | R | A |
| Partner communication | R/A | C | I | C |

## Releases Registry

| Activity | Release Team | QA Team | Ops Team | Product Team |
|----------|--------------|---------|----------|--------------|
| Create release | R/A | C | C | C |
| Test release | C | R/A | I | I |
| Deploy release | C | C | R/A | I |
| Release notes | R | C | I | A |

## Components Registry

| Activity | Platform Team | Dev Team | Architecture Team | Ops Team |
|----------|---------------|----------|-------------------|----------|
| Add component | R/A | C | C | I |
| Update component | R/A | C | C | I |
| Architecture review | C | C | R/A | I |
| Deprecate component | R | I | R/A | A |

---

## How to Use This Matrix

1. **Identify the activity** you're planning
2. **Find the relevant registry** type
3. **Check who needs to be involved** at each level (R/A/C/I)
4. **Engage stakeholders** before starting work
5. **Update this matrix** if roles change

## Escalation Path

If conflicts arise:
1. R and A try to resolve
2. Escalate to team leads
3. Escalate to department heads
4. Escalate to CTO/VP Engineering

---

**Maintained by:** Platform Team  
**Last Updated:** 2025-10-05  
**Review Cycle:** Quarterly
