# Terrafusion Grafana Configuration

This directory contains Grafana dashboards and provisioning configurations for Terrafusion's observability system.

## Directory Structure

- **`dashboards/`**: Contains JSON dashboard definitions
- **`provisioning/`**: Contains Grafana provisioning configuration
  - **`dashboards/`**: Dashboard provisioning configuration
  - **`datasources/`**: Data source provisioning configuration

## Dashboards

This repository includes the following dashboards:

- **`webvitals_segmented.json`**: Web Vitals dashboard with page type and network quality segmentation
- **`error_budget.json`**: SLO compliance and error budget consumption dashboard

### Web Vitals Segmented Dashboard

The Web Vitals Segmented dashboard provides detailed metrics on application performance across different dimensions:

- Visualizations for each core Web Vital (LCP, FID, CLS, TTFB, INP)
- Filtering by network quality (4g, 3g, 2g, slow-2g)
- Filtering by page type (dashboard, map-view, property-details, search, etc.)
- Time-series views for trend analysis
- Heat maps for correlation analysis

### Error Budget Dashboard

The Error Budget dashboard tracks SLO compliance and error budget consumption:

- Current compliance status for each SLO
- Remaining error budget visualization
- Burn rate trending over time
- SLO breach alerts and history
- Segment-specific panels for critical page types and network conditions

## Provisioning

Grafana dashboards and data sources are provisioned using Grafana's provisioning system, allowing for automated deployment and version control.

### Dashboard Provisioning

Dashboard provisioning configurations are in `provisioning/dashboards/`:

- `webvitals.yml`: Provisions the Web Vitals Segmented dashboard
- `error_budget.yml`: Provisions the Error Budget dashboard

### Datasource Provisioning

Data source provisioning configurations are in `provisioning/datasources/`:

- `prometheus.yml`: Configures the Prometheus data source

## Template Variables

Both dashboards use template variables for flexible filtering:

- `$pageType`: Filter by page type
- `$networkQuality`: Filter by network quality
- `$timeRange`: Adjust the time range for analysis

## Development and Testing

When creating or modifying dashboards:

1. Make changes in the Grafana UI
2. Export the dashboard JSON
3. Format the JSON for better diff-ability:
   ```bash
   jq . dashboards/my_dashboard.json > formatted.json
   mv formatted.json dashboards/my_dashboard.json
   ```
4. Run the verification script: `./scripts/run-observability-ci.sh --lint`

## Adding New Dashboards

To add a new dashboard:

1. Create a new JSON file in the `dashboards/` directory
2. Add a corresponding provisioning configuration in `provisioning/dashboards/`
3. Update this README with details about the new dashboard
4. Run the verification script to ensure the JSON is valid

## Dashboard IDs and UIDs

To avoid conflicts, use consistent IDs and UIDs:

- Web Vitals Segmented Dashboard: UID `terrafusion-webvitals-segmented`
- Error Budget Dashboard: UID `terrafusion-slo-error-budget`

## Links and Integration

Dashboards include links to related resources:

- Links to other dashboards for context switching
- Links to documentation and runbooks
- Links to source code for metrics and alerts

## References

- [Grafana Dashboard JSON Documentation](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/)
- [Grafana Provisioning Documentation](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Grafana Variables Documentation](https://grafana.com/docs/grafana/latest/dashboards/variables/)
