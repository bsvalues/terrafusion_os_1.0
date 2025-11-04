# Observability CI/CD Pipeline

This document explains how to use the CI/CD pipeline for Terrafusion's observability components, including Prometheus rules, Grafana dashboards, and associated documentation.

## Overview

The Observability CI/CD pipeline ensures that all monitoring configurations are properly validated before deployment. It includes:

1. **Linting**: Validates YAML syntax and Prometheus rule semantics
2. **Smoke Testing**: Verifies metrics endpoints, WebSocket connectivity, and more
3. **Deployment**: Automates the deployment to staging environments

## Running Locally

You can run the CI/CD pipeline locally to validate your changes before committing:

```bash
# Run the full verification pipeline
./scripts/run-observability-ci.sh --verify

# Run only the linting step
./scripts/run-observability-ci.sh --lint

# Run only the smoke tests
./scripts/run-observability-ci.sh --test

# Run verification and deploy to staging (if you have permissions)
./scripts/run-observability-ci.sh --verify --deploy
```

## GitHub Actions Workflow

The pipeline is also automated via GitHub Actions, triggering on:

- Pull requests that modify observability configurations
- Pushes to the main branch

The workflow is defined in `.github/workflows/observability-ci.yml` and includes:

1. **Lint Job**: Validates all configuration files
2. **Smoke Test Job**: Tests connectivity and functionality
3. **Deploy Job**: (For main branch only) Deploys to staging

## Deployment Workflow

When changes are approved and merged:

1. GitHub Actions automatically deploys the changes to staging
2. The commit is tagged with `observability-staging-deployed-TIMESTAMP`
3. After verification in staging, changes can be promoted to production

## Error Budget Alert Testing

To test the error budget alerting system:

1. Verify the SLO recording rules are working:

   ```bash
   curl -s "http://localhost:9090/api/v1/query?query=slo:dashboard_lcp_4g_sli:ratio" | jq
   ```

2. Verify error budget consumption metrics:

   ```bash
   curl -s "http://localhost:9090/api/v1/query?query=slo:dashboard_lcp_4g:error_budget_remaining" | jq
   ```

3. Simulate an alert by temporarily modifying the alerting threshold:
   ```bash
   # This is a temporary change for testing only
   sed -i.bak 's/>0.05/>0.001/g' prometheus/rules/slo.rules.yml
   ```

## Extending the Pipeline

To add new validation to the pipeline:

1. Update `scripts/observability-lint.js` with new linting rules
2. Add new tests to `scripts/observability-test.js`
3. Update the GitHub Actions workflow as needed

## Requirements for Pull Requests

All observability-related pull requests should:

1. Include all necessary Prometheus rules, Grafana dashboards, and documentation
2. Pass the CI pipeline without errors
3. Include before/after screenshots of affected dashboards
4. Document any changes to SLOs or alerting thresholds

## Troubleshooting

If the pipeline fails:

1. Check the lint output for YAML syntax issues
2. Verify that all Prometheus rules are syntactically correct
3. Ensure the application is running during smoke tests
4. Check that WebSocket endpoints are accessible
5. Validate that all metrics are properly exposed

## Related Documentation

- [Service Level Objectives (SLOs)](./slo/SLOs_and_error_budgets.md)
- [Incident Management Runbook](../docs/incident-management-runbook.md)
- [Prometheus Configuration](../prometheus/README.md)
- [Grafana Dashboard Management](../grafana/README.md)
