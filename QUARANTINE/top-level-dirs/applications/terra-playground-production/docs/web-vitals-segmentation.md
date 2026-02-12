# Web Vitals Segmentation Guide

This guide explains the implementation of our high-ROI web vitals segmentation features focusing on Network Quality and Page Type dimensions.

## Segmentation Dimensions

### Network Quality Segmentation

We capture network connection quality using the Network Information API's `effectiveType` property, which classifies connections into:

- **slow-2g**: Very slow connections (< 70kbps) - typically found in rural areas with poor coverage
- **2g**: Slow connections (70-150kbps) - equivalent to EDGE networks
- **3g**: Medium connections (150-700kbps) - equivalent to 3G networks
- **4g**: Fast connections (700+ kbps) - equivalent to 4G/LTE or fast WiFi

This dimension is crucial for:

- Understanding performance for users in low-connectivity areas
- Identifying features that don't work well on slow networks
- Creating adaptive experiences based on network quality

### Page Type Segmentation

We categorize different pages in the application by their type using the `page_type` dimension:

- **dashboard**: Main dashboard views with multiple data widgets
- **map-view**: Map-centric pages with GIS features
- **property-details**: Property detail pages with comprehensive information
- **report**: Report generation and view pages
- **settings**: Configuration and settings pages
- **search**: Search-related pages
- **editor**: Editor experiences for property data

This dimension helps:

- Identify which particular page types are underperforming
- Focus optimization efforts on the most critical pages
- Set appropriate performance budgets based on page complexity

## Implementation

### Client-side Implementation

The implementation uses two key components:

1. **PageTypeIdentifier Component**: This React component sets a `data-page-type` attribute on the document body, which is then captured when metrics are collected:

```jsx
<PageTypeIdentifier pageType="property-editor" attributes={{ complexity: 'high' }} />
```

2. **RealUserMonitoring Component**: Captures the page type from the DOM and network quality from the Network Information API and includes them in metrics data:

```javascript
// Extract network quality
network: (deviceInfo as any)?.effectiveConnectionType || 'unknown',

// Extract page type from document or derive from pathname
pageType: document.body.dataset.pageType || window.location.pathname.split('/')[1] || 'home',
```

### Server-side Implementation

1. **Prometheus Metrics Service**: Enhanced with new `network` and `page_type` dimensions:

```typescript
// Labels for metrics - enhanced with geo, device, network, and page segmentation
private readonly defaultLabels = [
  // ...existing labels...
  // New high-ROI segmentation dimensions
  'network',
  'page_type'
];
```

2. **Web Vitals Routes**: Process and store metrics with network and page type dimensions:

```typescript
// Extract network and page type for segmentation
network: metricData.effectiveConnectionType || (payload.tags as any)?.network || 'unknown',
pageType: (payload.tags as any)?.pageType || 'unknown'
```

## Monitoring & Alerting

### Dashboards

The segmented Web Vitals Dashboard provides filtering and visualization by:

- Network quality
- Page type
- Combined views (e.g., specific page types on specific networks)

Key panels include:

- LCP by Network and Page Type
- CLS by Network and Page Type
- Performance heatmaps segmented by both dimensions

### Alerts

Specialized alerts for:

- Slow performance on critical pages
- Poor performance on slow networks
- Mobile experience on varying network qualities
- Combined alerts for critical pages on slow networks

## Usage & Best Practices

1. **Adding Page Types**: Add the PageTypeIdentifier component to your page components:

```jsx
// In a dashboard component
return (
  <>
    <PageTypeIdentifier pageType="dashboard" attributes={{ widgets: 12 }} />
    <DashboardContent />
  </>
);
```

2. **Monitoring Best Practices**:

   - Review the segmented dashboard regularly
   - Prioritize issues on critical page types
   - Pay special attention to mobile + slow network segments
   - Set appropriate performance budgets for each page type

3. **Recommended Thresholds**:
   | Metric | Fast Networks | Slow Networks (3G) | Slow Networks (2G) |
   |--------|--------------|--------------------|--------------------|
   | LCP | < 2.5s | < 4.0s | < 6.0s |
   | FID | < 100ms | < 200ms | < 300ms |
   | CLS | < 0.1 | < 0.1 | < 0.15 |
   | TTFB | < 600ms | < 1.0s | < 1.5s |

## Future Enhancements

Planned enhancements for segmentation:

1. User role-based segmentation
2. Geographic region segmentation with more granularity
3. Feature flag-based segmentation for A/B testing
4. Cohort analysis across segmentation dimensions
