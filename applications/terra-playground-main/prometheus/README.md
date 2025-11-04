# Terrafusion Prometheus Configuration

This directory contains the Prometheus configuration files for Terrafusion's observability system.

## Directory Structure

- **`rules/`**: Contains recording rules, including SLO calculations
- **`alerts/`**: Contains alerting rules for various metrics
- **`config/`**: Contains Prometheus server configuration (if applicable)

## Recording Rules

Recording rules are stored in `rules/` and include:

- `slo.rules.yml`: SLO-related recording rules for calculating error budgets
- Other rule files organized by subsystem or functionality

### SLO Recording Rules

The SLO recording rules follow a standard naming convention:

- `slo:<service>_<metric>_<dimension>_sli:ratio`: Current error rate for an SLI
- `slo:<service>_<metric>_<dimension>:error_budget_remaining`: Remaining error budget
- `slo:<service>_<metric>_<dimension>:burnrate<window>`: Burn rate over a specific time window

These recording rules calculate how much of the error budget has been consumed and at what rate.

## Alerting Rules

Alerting rules are stored in `alerts/` and include:

- `webvitals_segmented.rules.yml`: Alerts for Web Vitals metrics with segmentation
- `slo_alerts.rules.yml`: SLO-based alerts and error budget burn rate alerts
- Other alert files organized by subsystem or functionality

### Alerting Severity Levels

Alerts use consistent severity levels:

- **critical**: Requires immediate attention (P1)
- **warning**: Requires attention within a day (P2)
- **info**: Informational alerts for awareness (P3)

### SLO Alerting Strategy

SLO alerts use a multi-window, multi-burn-rate approach:

1. **Fast burn, small window**: Alert quickly on severe issues (>25% burn rate over 1h)
2. **Medium burn, medium window**: Alert on sustained issues (>10% burn rate over 6h)
3. **Slow burn, large window**: Alert on ongoing issues (>5% burn rate over 24h)

## Web Vitals Metrics

The system tracks the following Web Vitals metrics:

- **LCP** (Largest Contentful Paint): Time until the largest content element is rendered
- **FID** (First Input Delay): Time from user input to browser response
- **CLS** (Cumulative Layout Shift): Visual stability metric
- **TTFB** (Time To First Byte): Initial response time
- **INP** (Interaction to Next Paint): Responsiveness metric

These metrics are segmented by:

- **Network Quality**: 4g, 3g, 2g, slow-2g
- **Page Type**: dashboard, map-view, property-details, search, etc.

## Adding New Rules

To add new recording or alerting rules:

1. Create or modify a YAML file in the appropriate directory
2. Follow the naming conventions described above
3. Run the validation script: `./scripts/run-observability-ci.sh --lint`
4. Test the rules before deploying

## Deployment

Rules are deployed through the CI/CD pipeline as described in `observability/CI_CD_README.md`.

## Useful Commands

### Testing Rules Locally

```bash
# Validate rule syntax
promtool check rules prometheus/rules/slo.rules.yml

# Execute a rule against a local Prometheus instance
promtool query instant http://localhost:9090 'slo:dashboard_lcp_4g_sli:ratio'
```

### Querying Metrics

```bash
# Get the 75th percentile LCP for dashboard pages on 4G networks
curl -G --data-urlencode 'query=histogram_quantile(0.75, sum by (le) (rate(web_vitals_lcp_bucket{page_type="dashboard",network="4g"}[5m])))' http://localhost:9090/api/v1/query

# Get the current SLO compliance ratio
curl -G --data-urlencode 'query=1 - slo:dashboard_lcp_4g_sli:ratio' http://localhost:9090/api/v1/query
```

## References

- [Prometheus Recording Rules Documentation](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Prometheus Alerting Rules Documentation](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Google SRE Book on SLOs](https://sre.google/sre-book/service-level-objectives/)
