# Terrafusion SLO Definitions and Error Budget Policies

This document defines the Service Level Indicators (SLIs), Service Level Objectives (SLOs), and error budget policies for the Terrafusion application. These definitions are segmented by both page type and network quality to provide granular monitoring and alerting.

## Critical Segments

We've identified the following critical segments for our SLO definitions:

### Page Types

- **dashboard**: Main dashboard views with multiple data widgets
- **map-view**: Map-centric pages with GIS features
- **property-details**: Property detail pages with comprehensive information
- **search**: Search-related pages

### Network Quality

- **4g**: High-quality connections (700+ kbps)
- **3g**: Medium-quality connections (150-700 kbps)
- **2g/slow-2g**: Low-quality connections (<150 kbps)

## SLI and SLO Definitions

### Dashboard Pages

| SLI              | Definition                                     | SLO Target                                    | Error Budget           |
| ---------------- | ---------------------------------------------- | --------------------------------------------- | ---------------------- |
| Dashboard-LCP-4G | 75th percentile LCP on dashboard pages over 4G | p75 LCP < 2.0s, 99% of the time over 30 days  | 1% (7.2 hours/month)   |
| Dashboard-LCP-3G | 75th percentile LCP on dashboard pages over 3G | p75 LCP < 3.0s, 99% of the time over 30 days  | 1% (7.2 hours/month)   |
| Dashboard-LCP-2G | 75th percentile LCP on dashboard pages over 2G | p75 LCP < 4.5s, 99% of the time over 30 days  | 1% (7.2 hours/month)   |
| Dashboard-CLS    | 75th percentile CLS on dashboard pages         | p75 CLS < 0.1, 99.5% of the time over 30 days | 0.5% (3.6 hours/month) |
| Dashboard-INP-4G | 75th percentile INP on dashboard pages over 4G | p75 INP < 200ms, 99% of the time over 30 days | 1% (7.2 hours/month)   |
| Dashboard-INP-3G | 75th percentile INP on dashboard pages over 3G | p75 INP < 300ms, 99% of the time over 30 days | 1% (7.2 hours/month)   |

### Map View Pages

| SLI            | Definition                                    | SLO Target                                     | Error Budget           |
| -------------- | --------------------------------------------- | ---------------------------------------------- | ---------------------- |
| MapView-LCP-4G | 75th percentile LCP on map-view pages over 4G | p75 LCP < 2.5s, 99% of the time over 30 days   | 1% (7.2 hours/month)   |
| MapView-LCP-3G | 75th percentile LCP on map-view pages over 3G | p75 LCP < 3.5s, 99% of the time over 30 days   | 1% (7.2 hours/month)   |
| MapView-LCP-2G | 75th percentile LCP on map-view pages over 2G | p75 LCP < 5.0s, 99% of the time over 30 days   | 1% (7.2 hours/month)   |
| MapView-CLS    | 75th percentile CLS on map-view pages         | p75 CLS < 0.15, 99.5% of the time over 30 days | 0.5% (3.6 hours/month) |
| MapView-FID-4G | 75th percentile FID on map-view pages over 4G | p75 FID < 100ms, 99% of the time over 30 days  | 1% (7.2 hours/month)   |
| MapView-FID-3G | 75th percentile FID on map-view pages over 3G | p75 FID < 200ms, 99% of the time over 30 days  | 1% (7.2 hours/month)   |

### Property Details Pages

| SLI                     | Definition                                             | SLO Target                                      | Error Budget           |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------- | ---------------------- |
| PropertyDetails-LCP-4G  | 75th percentile LCP on property-details pages over 4G  | p75 LCP < 2.0s, 99.5% of the time over 30 days  | 0.5% (3.6 hours/month) |
| PropertyDetails-LCP-3G  | 75th percentile LCP on property-details pages over 3G  | p75 LCP < 3.0s, 99.5% of the time over 30 days  | 0.5% (3.6 hours/month) |
| PropertyDetails-LCP-2G  | 75th percentile LCP on property-details pages over 2G  | p75 LCP < 4.0s, 99% of the time over 30 days    | 1% (7.2 hours/month)   |
| PropertyDetails-CLS     | 75th percentile CLS on property-details pages          | p75 CLS < 0.1, 99.5% of the time over 30 days   | 0.5% (3.6 hours/month) |
| PropertyDetails-TTFB-4G | 75th percentile TTFB on property-details pages over 4G | p75 TTFB < 600ms, 99% of the time over 30 days  | 1% (7.2 hours/month)   |
| PropertyDetails-TTFB-3G | 75th percentile TTFB on property-details pages over 3G | p75 TTFB < 1000ms, 99% of the time over 30 days | 1% (7.2 hours/month)   |

### Search Pages

| SLI           | Definition                                  | SLO Target                                      | Error Budget           |
| ------------- | ------------------------------------------- | ----------------------------------------------- | ---------------------- |
| Search-LCP-4G | 75th percentile LCP on search pages over 4G | p75 LCP < 1.8s, 99.5% of the time over 30 days  | 0.5% (3.6 hours/month) |
| Search-LCP-3G | 75th percentile LCP on search pages over 3G | p75 LCP < 2.8s, 99.5% of the time over 30 days  | 0.5% (3.6 hours/month) |
| Search-LCP-2G | 75th percentile LCP on search pages over 2G | p75 LCP < 3.8s, 99% of the time over 30 days    | 1% (7.2 hours/month)   |
| Search-INP-4G | 75th percentile INP on search pages over 4G | p75 INP < 150ms, 99.5% of the time over 30 days | 0.5% (3.6 hours/month) |
| Search-INP-3G | 75th percentile INP on search pages over 3G | p75 INP < 250ms, 99% of the time over 30 days   | 1% (7.2 hours/month)   |

## Error Budget Policy

Error budgets represent the acceptable amount of time that our SLOs can be violated within a 30-day rolling window. Once an error budget is exhausted for a particular SLI, the following actions should be taken:

### Error Budget Consumption Rate Alerts

| Burn Rate      | Response                                                   |
| -------------- | ---------------------------------------------------------- |
| > 5% over 24h  | Alert sent to engineering team; investigate within 8 hours |
| > 10% over 6h  | Alert sent to engineering team; investigate within 4 hours |
| > 25% over 1h  | P2 incident created; immediate investigation required      |
| > 50% over 15m | P1 incident created; war room established                  |

### When Error Budget is Exhausted (>100% consumed)

1. Halt deployment of new features for the affected segment
2. Prioritize performance improvements for the affected segment
3. Schedule a post-mortem to identify root causes
4. Implement fixes for identified performance issues
5. Only resume feature deployments when error budget is below 50% consumed

## Implementation Details

These SLOs are implemented as Prometheus recording and alerting rules in the `prometheus/rules/slo.rules.yml` file. The recording rules compute the current error rate and error budget consumption for each SLI, while the alerting rules fire when burn rates exceed the thresholds defined above.

The SLOs are visualized in the Grafana dashboard, with panels showing:

- Current error rates per SLI
- Error budget consumption over time
- Burn rate trends
- SLO compliance status

## Review Process

SLOs and error budget policies will be reviewed quarterly to ensure they align with user expectations and business requirements. Adjustments may be made based on:

1. Changes in user behavior or expectations
2. Feedback from support or sales teams
3. Technical capabilities and constraints
4. Strategic business priorities

## References

- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Prometheus SLO Implementation Examples](https://prometheus.io/docs/practices/slos/)
- [Performance Budget Documentation](https://web.dev/articles/performance-budgets-101)
