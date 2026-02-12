# Terrafusion Incident Management Runbook

This runbook provides standardized procedures for responding to performance alerts and incidents in the Terrafusion platform, with special focus on our new segmented Web Vitals monitoring.

## SLOs and Error Budgets

Terrafusion uses defined Service Level Objectives (SLOs) to set clear targets for web performance. Each SLO has an associated error budget (the amount of time the SLO can be violated). See the complete list of SLOs in [observability/slo/SLOs_and_error_budgets.md](../observability/slo/SLOs_and_error_budgets.md).

### Key SLOs by Page Type and Network

| Page Type        | Network | Metric | SLO Target                                 | Error Budget           |
| ---------------- | ------- | ------ | ------------------------------------------ | ---------------------- |
| Dashboard        | 4G      | LCP    | p75 < 2.0s, 99% of the time over 30 days   | 1% (7.2 hours/month)   |
| Dashboard        | 3G      | LCP    | p75 < 3.0s, 99% of the time over 30 days   | 1% (7.2 hours/month)   |
| Map View         | 4G      | LCP    | p75 < 2.5s, 99% of the time over 30 days   | 1% (7.2 hours/month)   |
| Property Details | 4G      | LCP    | p75 < 2.0s, 99.5% of the time over 30 days | 0.5% (3.6 hours/month) |
| Search           | 4G      | LCP    | p75 < 1.8s, 99.5% of the time over 30 days | 0.5% (3.6 hours/month) |

### Error Budget Burn Rate Alerts

Terrafusion uses automated burn rate alerts to detect when error budgets are being consumed too quickly:

| Alert Name                   | Trigger                             | Priority |
| ---------------------------- | ----------------------------------- | -------- |
| SLO\_\*\_ErrorBudgetBurn     | Error budget burn rate >5% over 24h | P3       |
| SLO\_\*\_HighErrorBudgetBurn | Error budget burn rate >10% over 6h | P2       |
| SLO_CriticalErrorBudgetBurn  | Error budget burn rate >25% over 1h | P1       |

## Standard Alert Types

### Standard Web Vitals Alerts

| Alert Name                | Trigger                     | Priority |
| ------------------------- | --------------------------- | -------- |
| WEBVITALS_LCP_95P_BREACH  | LCP 95th percentile > 2.5s  | P2       |
| WEBVITALS_TTFB_95P_BREACH | TTFB 95th percentile > 1.0s | P2       |
| WEBVITALS_CLS_95P_BREACH  | CLS 95th percentile > 0.1   | P2       |
| WEBVITALS_FCP_95P_BREACH  | FCP 95th percentile > 1.8s  | P2       |
| WEBVITALS_FID_95P_BREACH  | FID 95th percentile > 0.1s  | P2       |
| WEBVITALS_INP_95P_BREACH  | INP 95th percentile > 0.2s  | P2       |

### Segmented Alerts (Network Quality)

| Alert Name                  | Trigger                                               | Priority |
| --------------------------- | ----------------------------------------------------- | -------- |
| WEBVITALS_LCP_SLOW_NETWORK  | LCP 95th percentile > 4.0s on slow-2g/2g/3g networks  | P3       |
| WEBVITALS_TTFB_SLOW_NETWORK | TTFB 95th percentile > 1.5s on slow-2g/2g/3g networks | P3       |

### Segmented Alerts (Page Type)

| Alert Name                  | Trigger                                      | Priority |
| --------------------------- | -------------------------------------------- | -------- |
| WEBVITALS_LCP_CRITICAL_PAGE | LCP 95th percentile > 3.0s on critical pages | P2       |
| WEBVITALS_CLS_CRITICAL_PAGE | CLS 95th percentile > 0.15 on critical pages | P2       |
| WEBVITALS_FID_CRITICAL_PAGE | FID 95th percentile > 0.2s on critical pages | P2       |

### Combined Dimension Alerts

| Alert Name                               | Trigger                                                         | Priority |
| ---------------------------------------- | --------------------------------------------------------------- | -------- |
| WEBVITALS_LCP_CRITICAL_PAGE_SLOW_NETWORK | LCP 95th percentile > 5.0s on critical pages with slow networks | P1       |
| WEBVITALS_MOBILE_NETWORK_EXPERIENCE      | LCP 95th percentile > 4.5s on mobile devices with slow networks | P2       |
| WEBVITALS_BUDGET_BREACH_RATE_BY_PAGE     | > 20 budget breaches in 30m on critical pages                   | P2       |

## Incident Response

### Triage

1. **Determine Scope and Impact**

   - Check the alert details and determine which segment is affected
   - For network-related alerts: Is this affecting all networks or just slow ones?
   - For page-type alerts: Is this affecting all pages or just specific types?
   - For combined alerts: Check the specific combination of factors

2. **Assess Severity**
   | Severity | Definition | Response Time |
   |----------|------------|---------------|
   | Critical (P1) | User-blocking issues on critical pages or affecting >20% of users | Immediate |
   | High (P2) | Major performance degradation on important pages | < 2 hours |
   | Medium (P3) | Performance issues on non-critical pages or slow networks only | < 1 day |
   | Low (P4) | Minor degradation, limited impact | < 1 week |

3. **Check Dashboard**
   - View the [Segmented Web Vitals Dashboard](https://grafana.terrafusion.io/dashboards/webvitals_segmented)
   - Filter by the relevant network quality / page type mentioned in the alert
   - Look for abrupt changes or gradual degradation

### Investigation

#### SLO Error Budget Alerts

1. **SLO\_\*\_ErrorBudgetBurn (>5% over 24h)**

   - Check the [Error Budget Dashboard](https://grafana.terrafusion.io/dashboards/error_budget)
   - Identify which specific SLO is burning budget too quickly
   - Filter by the affected page type and network quality
   - Compare with recent deployments
   - Create a P3 ticket to investigate and address the issue within 8 hours

2. **SLO\_\*\_HighErrorBudgetBurn (>10% over 6h)**

   - Immediately notify the engineering team lead
   - Create a P2 ticket to investigate and address within 4 hours
   - Consider rolling back recent changes if the burn rate started after a deployment
   - Begin gathering performance traces for the affected page type and network combination

3. **SLO_CriticalErrorBudgetBurn (>25% over 1h)**

   - Create a P1 incident and establish a war room
   - Immediately begin root cause analysis
   - Consider enabling degraded mode for affected page types
   - If error budget is >50% consumed, halt all non-critical deployments
   - Gather real user data and traces to identify the specific component causing the issue

4. **Tools to Use for SLO Investigations**
   - Error Budget Dashboard in Grafana
   - Prometheus Query Browser for custom queries
   - WebPageTest with custom profiles for affected page types and network speeds
   - Real User Monitoring data in Grafana

#### Network Quality Issues

1. **Slow Network Investigation**

   - Check asset sizes (especially images, JS bundles)
   - Verify proper use of lazy loading and code splitting
   - Check for non-essential third-party resources loading eagerly
   - Verify network-aware loading strategies are working

2. **Tools to Use**
   - Chrome DevTools with Network Throttling set to match the affected network speed
   - WebPageTest with custom profiles matching the network conditions
   - Lighthouse CLI with custom throttling

#### Page Type Issues

1. **Critical Page Investigation**

   - Check recent deployments affecting that page type
   - Analyze performance budget reports
   - Check for reports of slow API responses feeding that page type
   - Verify if the issue is specific to certain routes within that page type

2. **Tools to Use**
   - Performance tab in Chrome DevTools
   - Trace analysis in Grafana
   - WebPageTest focused on the specific page type

#### Combined Issues

For issues affecting specific page types on specific networks:

1. **Check for Low-hanging Fruit**

   - Image optimization
   - Critical CSS extraction
   - Adaptive loading based on network conditions
   - Progressive enhancement strategies

2. **Check for Broken Network Detection**
   - Verify that the Network Information API is reporting correct values
   - Check if adaptive loading strategies are being bypassed

### Resolution Actions

#### Quick Fixes

1. **Asset Optimization**

   ```bash
   # Check current asset sizes
   npm run analyze-bundles

   # Apply automatic optimizations
   npm run optimize-for-slow-networks
   ```

2. **Temporarily Disable Heavy Features for Slow Networks**

   - Access the feature flags dashboard
   - Set network-dependent flags for heavy features

3. **Implement or Fix Network-aware Loading**
   ```javascript
   // Example fix in client code
   if (
     navigator.connection &&
     ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)
   ) {
     // Use lighter alternatives
     loadLightweightAlternative();
   } else {
     // Load full featured version
     loadFullFeaturedVersion();
   }
   ```

#### Long-term Fixes

1. **Implement Code Splitting for Critical Page Types**

   ```bash
   # Analyze current bundle split
   npm run analyze-bundle-by-page-type

   # Implement route-based code splitting
   # Update webpack/vite config as needed
   ```

2. **Set Up Adaptive Loading Based on Network Quality**

   - Implement proper handling of the Network Information API
   - Create variants of components for different network speeds
   - Set up fallbacks for browsers without Network Information API

3. **Create Specific Performance Budgets by Page Type**
   ```bash
   # Create performance budgets for specific page types
   npm run create-perf-budget -- --page-type=map-view --js=250 --images=400
   ```

## Post-Incident

### Documentation

Document the incident in the incident tracking system with the following information:

- Alert that triggered the incident
- Affected dimensions (network quality, page type, or both)
- Root cause
- Resolution steps taken
- Long-term recommendations
- Impact on error budgets

### SLO-Specific Follow-up

1. **Error Budget Impact Assessment**

   - Calculate how much of the error budget was consumed during the incident
   - Document in the post-mortem: `X% of our monthly error budget for [SLO] was consumed`
   - If >50% of any error budget was consumed, flag for immediate prioritization

2. **SLO Review**

   - If SLOs were breached repeatedly, review whether they are realistic
   - Consider adjusting SLO targets or error budget policies if needed
   - Document reasoning behind any changes

3. **Error Budget Policy Enforcement**
   - If an error budget is fully exhausted:
     - Enact the error budget policy (freeze feature deployments)
     - Focus engineering efforts on improving the affected SLI
     - Only resume normal development after error budget levels return to acceptable levels

### Standard Follow-up

1. Create or update a Performance Improvement Plan for the affected page type
2. Schedule a performance review focusing on the affected segment
3. Update performance budgets if needed
4. Consider adding more granular alerts for early detection

## Reference: Dimension Values

### Network Quality Values

- `slow-2g`: Very slow connections (<70kbps)
- `2g`: Slow connections (70-150kbps)
- `3g`: Medium connections (150-700kbps)
- `4g`: Fast connections (700+ kbps)

### Page Type Values

- `dashboard`: Main dashboard views
- `map-view`: Map-centric pages
- `property-details`: Property detail pages
- `report`: Report pages
- `settings`: Settings pages
- `search`: Search pages
- `editor`: Editor pages
