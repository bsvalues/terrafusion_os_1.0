# Loading States & Skeletons

**Production-ready loading indicators for TerraFusion OS**

Comprehensive loading UI components with skeleton loaders, spinners, progress bars, and overlays for seamless user experience during data fetches.

## Features

- ✅ **Skeleton Loaders**: Generic skeletons with pulse/shimmer/wave animations
- ✅ **Specialized Skeletons**: Table, card, and list loading states
- ✅ **Spinners**: Classic rotating spinners in multiple sizes
- ✅ **Progress Bars**: Determinate and indeterminate progress indicators
- ✅ **Loading Overlays**: Full-screen loading with blur backdrop
- ✅ **Accessibility**: aria-busy, aria-live, role="status" support
- ✅ **Dark Mode**: Built-in dark mode for all components
- ✅ **Zero Dependencies**: Pure React with inline CSS animations
- ✅ **TypeScript**: Full type safety with comprehensive interfaces

## Installation

```typescript
import {
  Skeleton,
  SkeletonTable,
  SkeletonCard,
  SkeletonList,
  Spinner,
  ProgressBar,
  LoadingOverlay,
  createTextSkeletons,
  createPropertySkeletons,
  createGridSkeleton,
} from '@/shared/lib/components/loading-states';
```

---

## Table of Contents

1. [Example 1: Table Loading (Day 13 Integration)](#example-1-table-loading-day-13-integration)
2. [Example 2: Property Card Loading](#example-2-property-card-loading)
3. [Example 3: Dashboard Widget Loading](#example-3-dashboard-widget-loading)
4. [Example 4: Form Submission Loading](#example-4-form-submission-loading)
5. [Example 5: Page Transition Loading](#example-5-page-transition-loading)
6. [Example 6: List Loading State](#example-6-list-loading-state)
7. [Example 7: Multi-Day Integration](#example-7-multi-day-integration)
8. [API Reference](#api-reference)
9. [Best Practices](#best-practices)

---

## Example 1: Table Loading (Day 13 Integration)

Show skeleton loading state during property data fetch for Day 13 Table component.

```typescript
import { useState, useEffect } from 'react';
import { Table, TableColumn } from '@/shared/lib/components/ui-components';
import { SkeletonTable } from '@/shared/lib/components/loading-states';
import { useLocalStorage } from '@/shared/lib/utils/storage'; // Day 14

interface Property {
  parcelId: string;
  owner: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  status: 'active' | 'inactive';
}

function PropertyListingTable() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Day 14: Load saved preferences
  const [tablePrefs] = useLocalStorage('property-table-prefs', {
    pageSize: 25,
    sortColumn: 'parcelId',
    sortDirection: 'asc' as const,
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      // Simulate API call (2-3 seconds for 10,000 properties)
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data.properties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Define columns
  const columns: TableColumn<Property>[] = [
    { key: 'parcelId', label: 'Parcel ID', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    {
      key: 'assessedValue',
      label: 'Assessed Value',
      sortable: true,
      render: (val) => `$${val.toLocaleString()}`,
    },
    {
      key: 'marketValue',
      label: 'Market Value',
      sortable: true,
      render: (val) => `$${val.toLocaleString()}`,
    },
    { key: 'status', label: 'Status', sortable: true },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Property Listings</h2>
        <button onClick={loadProperties} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        // Show skeleton while loading
        <SkeletonTable
          rows={10}
          columns={6}
          showHeader
          animation="shimmer"
        />
      ) : (
        // Show real table when loaded
        <Table
          columns={columns}
          data={properties}
          sortable
          hoverable
          selectable
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
          pagination={{
            currentPage,
            pageSize: tablePrefs.pageSize,
            totalRows: properties.length,
            onPageChange: setCurrentPage,
          }}
        />
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        {isLoading
          ? 'Loading property data...'
          : `Showing ${properties.length} properties`}
      </p>
    </div>
  );
}

export default PropertyListingTable;
```

**Key Benefits:**
- **Smooth UX**: Users see structured skeleton instead of blank screen
- **Perceived Performance**: Skeleton loads instantly, feels faster than spinner
- **Accurate Layout**: Skeleton matches final table layout (6 columns, header)
- **Integration**: Works seamlessly with Day 13 Table and Day 14 Storage

---

## Example 2: Property Card Loading

Skeleton for property card grid during data fetching.

```typescript
import { useState, useEffect } from 'react';
import { SkeletonCard } from '@/shared/lib/components/loading-states';
import { Card } from '@/shared/lib/components/ui-elements'; // Day 3

interface Property {
  parcelId: string;
  owner: string;
  address: string;
  assessedValue: number;
  imageUrl: string;
  taxYear: number;
}

function PropertyCardGrid() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/properties/recent');
      const data = await response.json();
      setProperties(data.properties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Recent Property Assessments</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem',
      }}>
        {isLoading ? (
          // Show 6 skeleton cards while loading
          <SkeletonCard
            count={6}
            showImage
            lines={3}
            animation="shimmer"
          />
        ) : (
          // Show real property cards
          properties.map((property) => (
            <Card key={property.parcelId}>
              <img
                src={property.imageUrl}
                alt={property.address}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
              />
              <div style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{property.address}</h3>
                <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                  Owner: {property.owner}
                </p>
                <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                  Parcel: {property.parcelId}
                </p>
                <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                  ${property.assessedValue.toLocaleString()}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default PropertyCardGrid;
```

**Key Benefits:**
- **Grid Layout**: Skeleton cards fill the grid, showing final layout
- **Image Placeholder**: Shows where property images will appear
- **Consistent Height**: Skeleton matches actual card height
- **Fast Loading**: 6 skeleton cards appear instantly

---

## Example 3: Dashboard Widget Loading

Skeleton for dashboard statistics, charts, and recent activities.

```typescript
import { useState, useEffect } from 'react';
import { Skeleton, SkeletonCard, SkeletonList } from '@/shared/lib/components/loading-states';
import { useLocalStorage } from '@/shared/lib/utils/storage'; // Day 14

interface DashboardData {
  stats: {
    totalProperties: number;
    totalValue: number;
    pendingAssessments: number;
    completedToday: number;
  };
  recentActivities: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
}

function AssessorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Day 14: Load dashboard settings
  const [settings] = useLocalStorage('dashboard-settings', {
    theme: 'light',
    visibleWidgets: ['stats', 'recentActivities'],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Assessor Dashboard</h1>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem',
        marginBottom: '2rem',
      }}>
        {isLoading ? (
          // Show 4 skeleton cards for statistics
          <>
            <Skeleton width="100%" height="120px" variant="rounded" animation="shimmer" />
            <Skeleton width="100%" height="120px" variant="rounded" animation="shimmer" />
            <Skeleton width="100%" height="120px" variant="rounded" animation="shimmer" />
            <Skeleton width="100%" height="120px" variant="rounded" animation="shimmer" />
          </>
        ) : (
          // Show real statistics
          <>
            <StatCard title="Total Properties" value={data!.stats.totalProperties.toLocaleString()} />
            <StatCard title="Total Value" value={`$${data!.stats.totalValue.toLocaleString()}`} />
            <StatCard title="Pending Assessments" value={data!.stats.pendingAssessments.toLocaleString()} />
            <StatCard title="Completed Today" value={data!.stats.completedToday.toLocaleString()} />
          </>
        )}
      </div>

      {/* Recent Activities */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Activities</h3>

        {isLoading ? (
          // Show skeleton list for recent activities
          <SkeletonList
            items={5}
            showAvatar
            lines={2}
            animation="shimmer"
          />
        ) : (
          // Show real activities
          <div>
            {data!.recentActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                }}>
                  {activity.user.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>{activity.action}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export default AssessorDashboard;
```

**Key Benefits:**
- **Multiple Widget Types**: Skeletons for stats cards, lists, charts
- **Instant Feedback**: Dashboard structure visible immediately
- **Professional UX**: Smooth transition from skeleton to real data
- **Accessibility**: aria-busy and role="status" for screen readers

---

## Example 4: Form Submission Loading

Spinner with overlay during form save operation.

```typescript
import { useState } from 'react';
import { Spinner, LoadingOverlay } from '@/shared/lib/components/loading-states';
import { useForm, validators } from '@/shared/lib/utils/form-management'; // Day 6
import { useLocalStorage } from '@/shared/lib/utils/storage'; // Day 14

interface AssessmentForm {
  parcelId: string;
  propertyType: string;
  landValue: number;
  improvementValue: number;
  assessorName: string;
}

function PropertyAssessmentForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Day 14: Clear draft on successful save
  const [, , clearDraft] = useLocalStorage<Partial<AssessmentForm> | null>('assessment-draft', null);

  const form = useForm<AssessmentForm>({
    parcelId: {
      initialValue: '',
      validators: [validators.required('Parcel ID is required')],
    },
    propertyType: {
      initialValue: 'residential',
      validators: [validators.required('Property type is required')],
    },
    landValue: {
      initialValue: 0,
      validators: [validators.min(0, 'Land value must be positive')],
    },
    improvementValue: {
      initialValue: 0,
      validators: [validators.min(0, 'Improvement value must be positive')],
    },
    assessorName: {
      initialValue: '',
      validators: [validators.required('Assessor name is required')],
    },
  });

  const handleSubmit = async (values: AssessmentForm) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Simulate API call (1-2 seconds)
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to save assessment');
      }

      console.log('Assessment saved successfully');
      clearDraft(); // Clear draft from Day 14 storage
      form.reset();
      
      // Show success message
      alert('Assessment saved successfully!');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to save assessment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2>Property Assessment Form</h2>

      {saveError && (
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          Error: {saveError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label>Parcel ID *</label>
            <input type="text" {...form.register('parcelId')} placeholder="123-456-789" />
            {form.fields.parcelId.error && <span style={{ color: 'red', fontSize: '0.875rem' }}>{form.fields.parcelId.error}</span>}
          </div>

          <div>
            <label>Property Type *</label>
            <select {...form.register('propertyType')}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div>
            <label>Land Value</label>
            <input type="number" {...form.register('landValue')} />
          </div>

          <div>
            <label>Improvement Value</label>
            <input type="number" {...form.register('improvementValue')} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label>Assessor Name *</label>
            <input type="text" {...form.register('assessorName')} placeholder="John Doe" />
            {form.fields.assessorName.error && <span style={{ color: 'red', fontSize: '0.875rem' }}>{form.fields.assessorName.error}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Submit Assessment'}
          </button>
          {isSaving && <Spinner size="sm" color="#3b82f6" />}
        </div>
      </form>

      {/* Full-screen loading overlay during save */}
      <LoadingOverlay
        visible={isSaving}
        message="Saving assessment..."
        spinnerSize="lg"
        blur
      />
    </div>
  );
}

export default PropertyAssessmentForm;
```

**Key Benefits:**
- **Inline Spinner**: Small spinner next to button shows immediate feedback
- **Full-Screen Overlay**: Prevents interaction during save (prevents double submit)
- **Blur Backdrop**: Focuses attention on loading state
- **Error Handling**: Clear error messaging if save fails

---

## Example 5: Page Transition Loading

Progress bar at top of page during navigation or data refresh.

```typescript
import { useState, useEffect } from 'react';
import { ProgressBar } from '@/shared/lib/components/loading-states';

function AppWithProgressBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate page transition or data loading
  const handleRefresh = async () => {
    setIsLoading(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // API call
      await fetch('/api/refresh');
      setProgress(100);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div>
      {/* Progress bar at top (fixed position) */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        }}>
          <ProgressBar
            variant="determinate"
            value={progress}
            height="4px"
            color="#3b82f6"
          />
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '2rem' }}>
        <h1>Property Assessment Portal</h1>
        <button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? `Refreshing... ${progress}%` : 'Refresh Data'}
        </button>

        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          {isLoading ? 'Loading latest data...' : 'All data up to date'}
        </p>
      </div>
    </div>
  );
}

export default AppWithProgressBar;
```

**Key Benefits:**
- **Non-Intrusive**: Progress bar at top doesn't block content
- **Determinate Progress**: Users see exact progress percentage
- **Smooth Animation**: Linear progression feels responsive
- **Professional**: Similar to YouTube, GitHub loading bars

---

## Example 6: List Loading State

Skeleton for search results or property lists.

```typescript
import { useState, useEffect } from 'react';
import { SkeletonList } from '@/shared/lib/components/loading-states';

interface SearchResult {
  id: string;
  parcelId: string;
  owner: string;
  address: string;
  lastUpdated: string;
}

function PropertySearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query) {
      searchProperties(query);
    }
  }, [query]);

  const searchProperties = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3>Search Results for "{query}"</h3>

      {isLoading ? (
        // Show skeleton list while searching
        <SkeletonList
          items={8}
          showAvatar={false}
          lines={3}
          animation="shimmer"
        />
      ) : results.length > 0 ? (
        // Show real search results
        <div>
          {results.map((result) => (
            <div
              key={result.id}
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
              onClick={() => console.log('Navigate to', result.parcelId)}
            >
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{result.address}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Parcel: {result.parcelId} | Owner: {result.owner}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Last updated: {result.lastUpdated}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          No results found for "{query}"
        </p>
      )}
    </div>
  );
}

export default PropertySearchResults;
```

**Key Benefits:**
- **Instant Feedback**: Skeleton appears immediately on search
- **List Layout**: Matches final search result structure
- **Multiple Lines**: Shows title, metadata, timestamp structure
- **No Avatar**: Customized for property search (no user avatars needed)

---

## Example 7: Multi-Day Integration

Comprehensive loading state integration across Days 4, 13, 14.

```typescript
import { useState, useEffect } from 'react';
import { Table, Tabs } from '@/shared/lib/components/ui-components'; // Day 13
import { Button } from '@/shared/lib/components/ui-elements'; // Day 3
import { useLocalStorage } from '@/shared/lib/utils/storage'; // Day 14
import { SkeletonTable, Spinner, LoadingOverlay } from '@/shared/lib/components/loading-states'; // Day 15

interface Property {
  parcelId: string;
  owner: string;
  address: string;
  assessedValue: number;
}

function IntegratedPropertyApp() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Day 14: Persistent cache
  const [cachedProperties, setCachedProperties] = useLocalStorage<Property[]>(
    'cached-properties',
    []
  );

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoadingProperties(true);

    // Try cache first (Day 14)
    if (cachedProperties.length > 0) {
      console.log('Loading from cache');
      setProperties(cachedProperties);
      setIsLoadingProperties(false);
      
      // Refresh in background
      refreshPropertiesInBackground();
    } else {
      // No cache - fetch from API (Day 4)
      await fetchProperties();
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      
      setProperties(data.properties);
      setCachedProperties(data.properties); // Cache for next load
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const refreshPropertiesInBackground = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      
      // Silently update cache
      setCachedProperties(data.properties);
      setProperties(data.properties);
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/properties/sync', { method: 'POST' });
      await fetchProperties();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <Tabs
        tabs={[
          {
            id: 'properties',
            label: 'Properties',
            content: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2>Property Listings</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button onClick={loadProperties} disabled={isLoadingProperties}>
                      {isLoadingProperties ? <><Spinner size="sm" /> Loading...</> : 'Refresh'}
                    </Button>
                    <Button onClick={handleSync} disabled={isSyncing} variant="secondary">
                      {isSyncing ? 'Syncing...' : 'Sync'}
                    </Button>
                  </div>
                </div>

                {isLoadingProperties && cachedProperties.length === 0 ? (
                  // Show skeleton on first load (no cache)
                  <SkeletonTable rows={10} columns={4} showHeader animation="shimmer" />
                ) : (
                  // Show table (from cache or fresh data)
                  <Table
                    columns={[
                      { key: 'parcelId', label: 'Parcel ID', sortable: true },
                      { key: 'owner', label: 'Owner', sortable: true },
                      { key: 'address', label: 'Address', sortable: true },
                      {
                        key: 'assessedValue',
                        label: 'Value',
                        sortable: true,
                        render: (val) => `$${val.toLocaleString()}`,
                      },
                    ]}
                    data={properties}
                    sortable
                    hoverable
                  />
                )}

                <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {cachedProperties.length > 0 && isLoadingProperties
                    ? 'Showing cached data, refreshing in background...'
                    : `${properties.length} properties loaded`}
                </p>
              </div>
            ),
          },
        ]}
        defaultActiveTab="properties"
      />

      {/* Full-screen overlay for sync operation */}
      <LoadingOverlay
        visible={isSyncing}
        message="Synchronizing property data..."
        spinnerSize="lg"
        blur
      />
    </div>
  );
}

export default IntegratedPropertyApp;
```

**Key Benefits:**
- **Day 4 Integration**: API fetching with loading states
- **Day 13 Integration**: Table with skeleton loading
- **Day 14 Integration**: Cache-first loading (instant from cache, refresh in background)
- **Day 15 Integration**: Multiple loading indicators (spinner, skeleton, overlay)
- **Professional UX**: Cached data loads instantly, skeleton only on first load

---

## API Reference

### Skeleton

Generic skeleton loader with customizable shape and animation.

```typescript
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circle' | 'rect' | 'rounded';
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  animationSpeed?: number;
  className?: string;
  style?: CSSProperties;
  darkMode?: boolean;
}
```

**Example:**
```tsx
<Skeleton width="100%" height="20px" />
<Skeleton width="60px" height="60px" variant="circle" />
<Skeleton variant="text" animation="shimmer" />
```

### SkeletonTable

Skeleton loader for table layouts.

```typescript
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  className?: string;
  darkMode?: boolean;
}
```

**Example:**
```tsx
<SkeletonTable rows={5} columns={4} showHeader animation="shimmer" />
```

### SkeletonCard

Skeleton loader for card layouts.

```typescript
interface SkeletonCardProps {
  count?: number;
  showImage?: boolean;
  lines?: number;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  className?: string;
  darkMode?: boolean;
}
```

**Example:**
```tsx
<SkeletonCard count={3} showImage lines={4} animation="shimmer" />
```

### SkeletonList

Skeleton loader for list views.

```typescript
interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  lines?: number;
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  className?: string;
  darkMode?: boolean;
}
```

**Example:**
```tsx
<SkeletonList items={5} showAvatar lines={2} animation="shimmer" />
```

### Spinner

Classic loading spinner.

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  label?: string;
}
```

**Example:**
```tsx
<Spinner size="lg" color="#3b82f6" label="Loading..." />
```

### ProgressBar

Progress bar with determinate and indeterminate modes.

```typescript
interface ProgressBarProps {
  value?: number; // 0-100
  variant?: 'determinate' | 'indeterminate';
  color?: string;
  height?: string | number;
  showPercentage?: boolean;
  className?: string;
  darkMode?: boolean;
}
```

**Example:**
```tsx
<ProgressBar value={75} showPercentage />
<ProgressBar variant="indeterminate" />
```

### LoadingOverlay

Full-screen loading overlay with backdrop.

```typescript
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
  blur?: boolean;
  className?: string;
}
```

**Example:**
```tsx
<LoadingOverlay visible={isLoading} message="Saving..." blur />
```

---

## Best Practices

### 1. Choose the Right Loading Indicator

**Use Skeletons when:**
- Loading structured content (tables, cards, lists)
- Content layout is known beforehand
- Want to show perceived performance
- Data takes 1-3 seconds to load

**Use Spinners when:**
- Loading indeterminate content
- Small inline operations (button actions)
- Content structure is unknown
- Quick operations (<1 second)

**Use Progress Bars when:**
- Long-running operations (>3 seconds)
- Can track actual progress
- File uploads, data processing
- Page transitions

**Use Overlays when:**
- Blocking operations (form submit, sync)
- Prevent user interaction
- Critical operations that shouldn't be interrupted

### 2. Animation Timing

```typescript
// Fast animations for quick operations
<Skeleton animation="pulse" animationSpeed={800} />

// Standard animations for normal loading
<Skeleton animation="shimmer" animationSpeed={1500} />

// Slow animations for very long operations
<Skeleton animation="wave" animationSpeed={2500} />
```

### 3. Accessibility

```typescript
// Always include aria attributes
<Skeleton aria-busy="true" aria-live="polite" />
<Spinner role="status" aria-label="Loading data" />
<LoadingOverlay role="dialog" aria-label="Saving..." />

// Use semantic roles
<div role="status">
  <SkeletonTable rows={5} columns={4} />
</div>
```

### 4. Dark Mode Support

```typescript
// Enable dark mode on all components
<Skeleton darkMode />
<SkeletonTable darkMode />
<ProgressBar darkMode />

// Dark mode changes:
// - baseColor: #e5e7eb → #2a2a2a
// - highlightColor: #f3f4f6 → #3a3a3a
```

### 5. Skeleton Count Guidelines

**Table Rows**: Show 5-10 rows (match typical page size)  
**Card Grids**: Show 3-6 cards (match grid columns)  
**List Items**: Show 5-8 items (match viewport height)  
**Text Lines**: Show 3-4 lines (match content density)

### 6. Cache-First Loading (Day 14 Integration)

```typescript
// Load from cache first, show skeleton only on first load
const [cached] = useLocalStorage('data', []);

if (cached.length > 0) {
  // Show cached data immediately
  setData(cached);
  // Refresh in background
  refreshInBackground();
} else {
  // Show skeleton on first load
  <SkeletonTable />
}
```

### 7. Prevent Layout Shift

```typescript
// Skeleton should match final content dimensions
<Skeleton height="120px" />  // Matches card height
<SkeletonTable rows={10} />  // Matches page size
<Skeleton variant="circle" width="48px" height="48px" />  // Matches avatar
```

### 8. Inline Spinners for Button Actions

```typescript
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner size="sm" /> Saving...
    </>
  ) : (
    'Save'
  )}
</button>
```

### 9. Progressive Loading

```typescript
// Show skeleton → Show partial data → Show complete data
{isLoading && !data ? (
  <SkeletonTable rows={10} />
) : data && data.length < totalCount ? (
  <>
    <Table data={data} />
    <p>Loading more... ({data.length}/{totalCount})</p>
    <Spinner size="sm" />
  </>
) : (
  <Table data={data} />
)}
```

### 10. Error States

```typescript
// Show error after loading fails
{isLoading ? (
  <SkeletonTable />
) : error ? (
  <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
    <p>Failed to load properties</p>
    <button onClick={retry}>Retry</button>
  </div>
) : (
  <Table data={properties} />
)}
```

---

## Integration with Previous Days

### Day 4: API Client
```tsx
const { data, isLoading, error } = useFetch(fetchProperties);
{isLoading ? <SkeletonTable rows={10} /> : <Table data={data} />}
```

### Day 13: Table Component
```tsx
<Table loading={isLoading} loadingComponent={<SkeletonTable rows={10} columns={6} />} />
```

### Day 14: Storage Utilities
```tsx
// Cache-first loading
const [cached] = useLocalStorage('properties', []);
{cached.length > 0 ? <Table data={cached} /> : <SkeletonTable />}
```

---

## Troubleshooting

### Skeleton Not Animating

**Problem**: Skeleton appears but doesn't animate

**Solution**: Ensure keyframes are injected (component includes `<style>` tag):
```tsx
<Skeleton animation="shimmer" />
// Component automatically injects @keyframes
```

### Layout Shift on Load

**Problem**: Content jumps when skeleton replaced with real data

**Solution**: Match skeleton dimensions to final content:
```tsx
// ❌ Generic skeleton
<Skeleton width="100%" height="20px" />

// ✅ Match actual content
<Skeleton width="100%" height="120px" /> // Card height
<SkeletonTable rows={10} columns={6} /> // Table size
```

### Spinner Not Spinning

**Problem**: Spinner appears but doesn't rotate

**Solution**: Ensure `@keyframes spin` is injected:
```tsx
<Spinner size="md" />
// Component includes inline <style> with @keyframes
```

### Overlay Not Blocking Clicks

**Problem**: User can still click elements behind overlay

**Solution**: Overlay uses `position: fixed` and `z-index: 9999`:
```tsx
<LoadingOverlay visible={isLoading} />
// Automatically prevents interaction with backdrop
```

---

## Summary

The loading states module provides production-ready loading indicators with:

- **7 Components**: Skeleton, SkeletonTable, SkeletonCard, SkeletonList, Spinner, ProgressBar, LoadingOverlay
- **3 Utility Functions**: createTextSkeletons, createPropertySkeletons, createGridSkeleton
- **4 Animation Styles**: pulse, shimmer, wave, none
- **Accessibility**: aria-busy, aria-live, role="status" on all components
- **Dark Mode**: Built-in support for dark themes
- **TypeScript**: Full type safety with 9 interfaces
- **Zero Dependencies**: Pure React with inline CSS animations

Perfect for seamless loading experiences in the TerraFusion property assessment platform, integrating with Days 4 (API), 13 (Table), and 14 (Storage) for optimal performance and user experience.
