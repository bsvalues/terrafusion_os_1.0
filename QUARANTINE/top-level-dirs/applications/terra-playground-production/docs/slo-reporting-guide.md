# Web Vitals SLO Reporting Guide

This guide explains how to set up, maintain, and interpret the Monthly Health Reports for Terrafusion's Web Vitals.

## Setting Up SLO Dashboards in Grafana

### Monthly SLO Dashboard Configuration

1. Create a new dashboard named "Web Vitals SLO Dashboard"

2. Add the following variables:

   - `timeframe`: Dropdown with options "Last 7 days", "Last 30 days", "Last 90 days"
   - `route`: Multi-select with data from Prometheus label values
   - `environment`: Options for "production", "staging", "development"

3. Configure the dashboard with the following panels:

#### 1. SLO Compliance Overview

Create an "SLO Compliance" panel:

```
# LCP SLO Compliance Rate
sum(rate(web_vitals_lcp_bucket{le="2.5"}[30d]))
/
sum(rate(web_vitals_lcp_bucket{le="+Inf"}[30d]))
```

The query above calculates what percentage of LCP measurements were under the 2.5s budget threshold.

Configure similar queries for all Web Vitals metrics:

- TTFB: le="0.6"
- CLS: le="0.1"
- FID: le="0.1"
- INP: le="0.2"
- FCP: le="1.8"

Format the panel as a gauge chart with thresholds:

- Green: > 99.5%
- Yellow: 95% - 99.5%
- Red: < 95%

#### 2. Trend Panel

Create a "SLO Performance Over Time" panel showing how compliance has changed:

```
# LCP SLO Weekly Compliance
sum(rate(web_vitals_lcp_bucket{le="2.5"}[7d] offset $offset))
/
sum(rate(web_vitals_lcp_bucket{le="+Inf"}[7d] offset $offset))
```

Use a variable `offset` that steps back by 7 days each time (0d, 7d, 14d, etc.)
Display as a line graph showing the trend over the past 12 weeks.

#### 3. Error Budget Panel

```
# LCP Error Budget Consumption
100 - (
  sum(rate(web_vitals_lcp_bucket{le="2.5"}[30d]))
  /
  sum(rate(web_vitals_lcp_bucket{le="+Inf"}[30d]))
  * 100
)
```

This calculates how much of your "error budget" has been consumed (assuming a 99.5% SLO target).

#### 4. Route Breakdown Panel

```
# LCP Per Route
sum by (route) (rate(web_vitals_lcp_bucket{le="2.5"}[30d]))
/
sum by (route) (rate(web_vitals_lcp_bucket{le="+Inf"}[30d]))
```

This shows compliance broken down by each route, to identify problematic pages.

## Automating Monthly Reports

### Grafana Reporting Configuration

1. Install the [Grafana Reporting App](https://grafana.com/docs/grafana/latest/setup-grafana/plugins-and-data-sources/plugins/grafana-reporting-app/)

2. Configure a scheduled report:
   - Dashboard: "Web Vitals SLO Dashboard"
   - Schedule: Monthly (first day of month)
   - Format: PDF
   - Recipients: DevOps team, Engineering leads, Product managers

### Slack Integration

Configure Grafana to send a summary to Slack:

```
curl -X POST --data-urlencode "payload={\"channel\": \"#performance-monitoring\", \"username\": \"SLO Bot\", \"text\": \"Monthly Web Vitals SLO Report Available: <https://grafana.example.com/dashboards/web-vitals-slo|View Report>. LCP compliance: ${lcp_compliance}%, CLS compliance: ${cls_compliance}%\", \"icon_emoji\": \":chart_with_upwards_trend:\"}" https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## Interpreting the Reports

### Key Metrics to Watch

1. **SLO Compliance**: Should be > 99.5% for critical metrics
2. **Trend Direction**: Watch for negative trends over multiple reports
3. **Error Budget**: If > 50% consumed before mid-month, investigate
4. **Route Outliers**: Routes with significantly worse performance

### Taking Action Based on Reports

1. If SLO compliance drops below target:

   - Conduct detailed analysis of regression
   - Create JIRA ticket for investigation
   - Schedule performance review in engineering meeting

2. If trend shows consistent decline:

   - Review recent deployments
   - Evaluate third-party script impact
   - Check for backend service degradation

3. For route-specific issues:
   - Assign specialized optimization tasks to page owners
   - Test with reduced feature set to identify problematic components

## Monthly Report Presentation Template

### Executive Summary

- Overall SLO compliance status (Green/Yellow/Red)
- Most significant changes since last month
- Key action items

### Detailed Metrics

- Compliance percentage for each Web Vital
- Breakdown by device type (Mobile vs Desktop)
- Breakdown by geographic region

### Performance Improvements

- Changes implemented in the past month
- Impact of those changes on metrics
- Planned improvements for next month

### Technical Deep Dive

- Root causes of any SLO violations
- Recommended architectural changes
- Resource estimates for proposed fixes
