# Terrafusion Performance Monitoring Setup

This document provides a comprehensive overview of the performance monitoring infrastructure set up for Terrafusion.

## Monitoring Architecture

Our monitoring infrastructure follows a multi-layered approach:

```
┌────────────────┐      ┌───────────────┐      ┌───────────────┐      ┌────────────────┐
│                │      │               │      │               │      │                │
│  Real User     │──────▶  Web Vitals   │──────▶  Prometheus   │──────▶   Grafana      │
│  Monitoring    │      │  API Endpoint │      │   Server      │      │   Dashboards   │
│  (Browser)     │      │               │      │               │      │                │
└────────────────┘      └───────────────┘      └───────────┬───┘      └────────────────┘
                                                           │
                                                           │
                                                 ┌─────────▼───────────┐
                                                 │                     │
                                                 │   AlertManager      │──┐
                                                 │                     │  │
                                                 └─────────────────────┘  │
                                                                          │
                                                                          │
┌────────────────┐      ┌───────────────┐                      ┌──────────▼─────────┐
│                │      │               │                      │                    │
│  Lighthouse CI │──────▶  GitHub       │──────────────────────▶  PagerDuty/        │
│  Tests         │      │  Actions      │                      │  Opsgenie          │
│                │      │               │                      │                    │
└────────────────┘      └───────────────┘                      └────────────────────┘
```

### Core Components

1. **Real User Monitoring (RUM)**

   - Implemented in `client/src/components/monitoring/RealUserMonitoring.tsx`
   - Collects Web Vitals and sends them to our API

2. **Web Vitals API**

   - Defined in `server/routes/web-vitals-routes.ts`
   - Processes and stores Web Vitals measurements

3. **Prometheus Metrics Endpoint**

   - Implemented in `server/services/prometheus-metrics-service.ts`
   - Exposes metrics in Prometheus format for scraping

4. **Grafana Dashboards**

   - Configured in `grafana/dashboards/webvitals.json`
   - Visualizes performance metrics and SLOs

5. **Lighthouse CI**
   - Configured in `lighthouse-ci/lighthouserc.js` and `.github/workflows/lighthouse-ci.yml`
   - Runs synthetic performance tests on each build

## Metrics Collection

### Real User Metrics

The RealUserMonitoring component captures and reports:

- **LCP (Largest Contentful Paint)**: Visual loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **TTFB (Time to First Byte)**: Server response time
- **FCP (First Contentful Paint)**: Initial rendering
- **INP (Interaction to Next Paint)**: Responsiveness

Implementation details:

- Uses the `web-vitals` library
- Sends batched reports to prevent network overload
- Includes exponential backoff for retries
- Handles offline scenarios via:
  - localStorage caching
  - navigator.sendBeacon for unload events

### Synthetic Metrics

Lighthouse CI runs on each pull request and measures:

- Overall performance score
- Individual Web Vitals
- Resource size budgets
- Accessibility metrics
- Best practices compliance

## Alerting Configuration

### Prometheus Alerts

Alert rules are defined in `prometheus/alerts/webvitals.rules.yml` and include:

1. **Critical Alerts**

   - LCP > 4s for > 5% of users for 10+ minutes
   - CLS > 0.25 for > 5% of users for 10+ minutes
   - Error rate > 5% for 5+ minutes

2. **Warning Alerts**
   - LCP > 2.5s for > 10% of users for 10+ minutes
   - FID > 100ms for > 10% of users for 10+ minutes
   - CLS > 0.1 for > 10% of users for 10+ minutes

### Incident Management

Alerts flow to PagerDuty/Opsgenie according to:

- **P1 (Critical)**: Page on-call engineer immediately
- **P2 (High)**: Page if not acknowledged within 15 minutes
- **P3 (Medium)**: Email notification only
- **P4 (Low)**: Slack notification only

## SLO Reporting

We track performance against defined SLOs:

- **LCP**: 99.5% of page loads < 2.5s
- **FID**: 99.5% of interactions < 100ms
- **CLS**: 99.5% of page loads < 0.1
- **TTFB**: 99.5% of requests < 600ms

Monthly SLO reports are generated automatically and distributed to stakeholders.

## Installation & Setup Instructions

### Prometheus Setup

1. Install Prometheus:

   ```bash
   # Download and extract Prometheus
   wget https://github.com/prometheus/prometheus/releases/download/v2.47.1/prometheus-2.47.1.linux-amd64.tar.gz
   tar xvfz prometheus-2.47.1.linux-amd64.tar.gz
   ```

2. Configure Prometheus:

   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s

   scrape_configs:
     - job_name: 'terrafusion'
       static_configs:
         - targets: ['localhost:3000']
       metrics_path: '/metrics'

   rule_files:
     - 'alerts/webvitals.rules.yml'

   alerting:
     alertmanagers:
       - static_configs:
           - targets:
               - localhost:9093
   ```

3. Run Prometheus:
   ```bash
   ./prometheus --config.file=prometheus.yml
   ```

### Grafana Setup

1. Install Grafana:

   ```bash
   # Download and install Grafana
   wget https://dl.grafana.com/oss/release/grafana_10.1.0_amd64.deb
   sudo dpkg -i grafana_10.1.0_amd64.deb
   ```

2. Configure Grafana:

   - Add Prometheus data source
   - Import dashboards from `grafana/dashboards/`
   - Configure alert notifications

3. Run Grafana:
   ```bash
   sudo systemctl start grafana-server
   ```

### Lighthouse CI Setup

1. Install Lighthouse CI globally:

   ```bash
   npm install -g @lhci/cli
   ```

2. Run locally for testing:

   ```bash
   lhci autorun --config=./lighthouse-ci/lighthouserc.js
   ```

3. GitHub integration is configured via `.github/workflows/lighthouse-ci.yml`

## Troubleshooting

### Common Issues

1. **Missing Metrics**

   - Check if RealUserMonitoring component is mounted
   - Verify browser supports Performance API
   - Check for CSP issues blocking the reporting

2. **False Positives in Alerts**

   - Adjust alert thresholds in rules file
   - Increase evaluation periods to reduce noise

3. **Lighthouse Test Failures**
   - Check if performance budgets are too strict
   - Verify test environment has consistent resources

## Extending the Monitoring Setup

### Adding New Metrics

1. Define new metric in the Prometheus service:

   ```javascript
   // server/services/prometheus-metrics-service.ts
   const newMetric = new client.Histogram({
     name: 'web_vitals_new_metric',
     help: 'Description of the new metric',
     buckets: [100, 200, 400, 800, 1600, 3200, 6400],
   });
   ```

2. Add collection in RealUserMonitoring component
3. Update Grafana dashboards to visualize the new metric

### Adding New Dashboard Panels

1. Design the query in Grafana UI
2. Export dashboard JSON
3. Update `grafana/dashboards/webvitals.json`
4. Update provisioning config if needed

## References

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
