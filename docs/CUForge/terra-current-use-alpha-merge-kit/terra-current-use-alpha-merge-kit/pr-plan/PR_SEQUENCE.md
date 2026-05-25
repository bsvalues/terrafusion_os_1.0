# Current Use Alpha PR Sequence

## PR 1 — Frontend Core Tab

Title:

```txt
feat(current-use): add Current Use workbench tab
```

Includes:

- `src/modules/terra-current-use`
- tab registration
- mock adapter
- rollback UI
- notice preview placeholder

Do not include:

- AI
- GIS
- Treasurer
- analytics
- multi-county

## PR 2 — Backend Core API

Title:

```txt
feat(current-use): add Current Use backend API scaffold
```

Includes:

- controller
- DTOs
- rollback calculator
- service registration
- smoke HTTP file

## PR 3 — Rollback Hardening

Title:

```txt
test(current-use): add rollback calculation tests
```

Includes:

- frontend rollback tests
- backend rollback tests
- OpenAPI contract
- hardening checklist

## PR 4 — Policy + Trace

Title:

```txt
feat(current-use): add policy version and trace audit scaffolding
```

Includes:

- policy governance pack
- TerraTrace audit pack
- calculation policy version display
- trace panel

## PR 5 — Security + Observability

Title:

```txt
feat(current-use): add RBAC and diagnostics
```

Includes:

- security/RBAC
- observability
- support runbook

## PR 6 — Demo Validation

Title:

```txt
docs(current-use): add assessor demo validation kit
```

Includes:

- demo scenarios
- feedback form
- assessor acceptance tests
- first demo runbook
