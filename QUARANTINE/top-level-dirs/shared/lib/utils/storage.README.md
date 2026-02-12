# Storage Utilities

**Type-safe localStorage and sessionStorage utilities for TerraFusion OS**

Production-ready browser storage management with advanced features for persistent state, caching, and cross-tab synchronization.

## Features

- ✅ **Type-Safe**: Full TypeScript support with generics
- ✅ **Expiration/TTL**: Automatic expiration for time-limited cache
- ✅ **Cache Invalidation**: Pattern-based and version-based invalidation
- ✅ **Cross-Tab Sync**: Automatic synchronization via storage events
- ✅ **Quota Management**: Automatic LRU eviction when quota exceeded
- ✅ **SSR Support**: Fallback to in-memory storage for server-side rendering
- ✅ **React Hooks**: Automatic re-renders on storage changes
- ✅ **Error Handling**: Graceful fallbacks for unavailable storage
- ✅ **Namespacing**: Key prefixing to avoid collisions

## Installation

```typescript
import { 
  localStorage, 
  sessionStorage, 
  useLocalStorage, 
  useSessionStorage,
  createStorage 
} from '@/shared/lib/utils/storage';
```

---

## Table of Contents

1. [Example 1: Table Preferences (Day 13 Integration)](#example-1-table-preferences-day-13-integration)
2. [Example 2: Property Search Filter Persistence](#example-2-property-search-filter-persistence)
3. [Example 3: User Dashboard Settings](#example-3-user-dashboard-settings)
4. [Example 4: Cache Management with TTL](#example-4-cache-management-with-ttl)
5. [Example 5: Cross-Tab Synchronization](#example-5-cross-tab-synchronization)
6. [Example 6: Form State Persistence (Day 6 Integration)](#example-6-form-state-persistence-day-6-integration)
7. [Example 7: Multi-Day Integration](#example-7-multi-day-integration)
8. [API Reference](#api-reference)
9. [Best Practices](#best-practices)

---

## Example 1: Table Preferences (Day 13 Integration)

Save user preferences for the Table component from Day 13 (sort order, page size, filters, column visibility).

```typescript
import { Table, TableColumn } from '@/shared/lib/components/ui-components';
import { useLocalStorage } from '@/shared/lib/utils/storage';
import { useState, useEffect } from 'react';

interface TablePreferences {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  pageSize: number;
  filterText: string;
  visibleColumns: string[];
}

interface Property {
  parcelId: string;
  owner: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  taxYear: number;
  status: 'active' | 'inactive';
}

function PropertyTable() {
  // Load saved preferences (persists across sessions)
  const [preferences, setPreferences, resetPreferences] = useLocalStorage<TablePreferences>(
    'property-table-preferences',
    {
      sortColumn: 'parcelId',
      sortDirection: 'asc',
      pageSize: 25,
      filterText: '',
      visibleColumns: ['parcelId', 'owner', 'address', 'assessedValue', 'status'],
    }
  );

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Update preferences when user changes sort
  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    setPreferences({
      ...preferences,
      sortColumn: column,
      sortDirection: direction,
    });
  };

  // Update preferences when user changes page size
  const handlePageSizeChange = (size: number) => {
    setPreferences({
      ...preferences,
      pageSize: size,
    });
    setCurrentPage(1); // Reset to first page
  };

  // Update preferences when user filters
  const handleFilterChange = (text: string) => {
    setPreferences({
      ...preferences,
      filterText: text,
    });
    setCurrentPage(1); // Reset to first page
  };

  // Toggle column visibility
  const handleToggleColumn = (columnKey: string) => {
    const isVisible = preferences.visibleColumns.includes(columnKey);
    setPreferences({
      ...preferences,
      visibleColumns: isVisible
        ? preferences.visibleColumns.filter(c => c !== columnKey)
        : [...preferences.visibleColumns, columnKey],
    });
  };

  // Define all available columns
  const allColumns: TableColumn<Property>[] = [
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
    { key: 'taxYear', label: 'Tax Year', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  // Filter columns based on user preferences
  const visibleColumns = allColumns.filter(col => 
    preferences.visibleColumns.includes(col.key)
  );

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {/* Filter input */}
        <input
          type="text"
          placeholder="Filter properties..."
          value={preferences.filterText}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{ padding: '0.5rem', flex: 1 }}
        />

        {/* Reset preferences */}
        <button onClick={resetPreferences}>
          Reset Preferences
        </button>

        {/* Column visibility toggles */}
        <details>
          <summary>Columns</summary>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {allColumns.map(col => (
              <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={preferences.visibleColumns.includes(col.key)}
                  onChange={() => handleToggleColumn(col.key)}
                />
                {col.label}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* Table with saved preferences */}
      <Table
        columns={visibleColumns}
        data={properties}
        sortable
        hoverable
        selectable
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        filterText={preferences.filterText}
        pagination={{
          currentPage,
          pageSize: preferences.pageSize,
          totalRows: properties.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <p>Your table preferences are automatically saved and will persist across sessions.</p>
        <p>Current preferences: Sort by {preferences.sortColumn} ({preferences.sortDirection}), {preferences.pageSize} rows per page, {preferences.visibleColumns.length} visible columns</p>
      </div>
    </div>
  );
}

export default PropertyTable;
```

**Key Benefits:**
- Table preferences persist across browser sessions
- User doesn't need to reconfigure sort/filter/columns each time
- Instant load of last state (no flicker)
- Reset button to restore defaults

---

## Example 2: Property Search Filter Persistence

Save property search filters so users can quickly re-run their last search.

```typescript
import { useLocalStorage } from '@/shared/lib/utils/storage';
import { useState, useEffect } from 'react';

interface PropertyFilters {
  parcelId: string;
  ownerName: string;
  address: string;
  minValue: number;
  maxValue: number;
  taxYear: number;
  propertyType: string[];
  status: string[];
}

function PropertySearch() {
  // Load last search filters (persists across sessions)
  const [filters, setFilters, clearFilters] = useLocalStorage<PropertyFilters>(
    'property-search-filters',
    {
      parcelId: '',
      ownerName: '',
      address: '',
      minValue: 0,
      maxValue: 10000000,
      taxYear: new Date().getFullYear(),
      propertyType: [],
      status: ['active'],
    }
  );

  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Automatically run last search on mount (if filters are not default)
  useEffect(() => {
    const hasCustomFilters = 
      filters.parcelId !== '' ||
      filters.ownerName !== '' ||
      filters.address !== '' ||
      filters.propertyType.length > 0 ||
      filters.status.length !== 1 ||
      filters.status[0] !== 'active';

    if (hasCustomFilters) {
      handleSearch();
    }
  }, []); // Run only on mount

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Search API call with filters
      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      const data = await response.json();
      setResults(data.properties);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilters = () => {
    clearFilters();
    setResults([]);
  };

  return (
    <div>
      <h2>Property Search</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        {/* Parcel ID */}
        <div>
          <label>Parcel ID</label>
          <input
            type="text"
            value={filters.parcelId}
            onChange={(e) => handleFilterChange('parcelId', e.target.value)}
            placeholder="123-456-789"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label>Owner Name</label>
          <input
            type="text"
            value={filters.ownerName}
            onChange={(e) => handleFilterChange('ownerName', e.target.value)}
            placeholder="John Doe"
          />
        </div>

        {/* Address */}
        <div>
          <label>Address</label>
          <input
            type="text"
            value={filters.address}
            onChange={(e) => handleFilterChange('address', e.target.value)}
            placeholder="123 Main St"
          />
        </div>

        {/* Tax Year */}
        <div>
          <label>Tax Year</label>
          <input
            type="number"
            value={filters.taxYear}
            onChange={(e) => handleFilterChange('taxYear', parseInt(e.target.value, 10))}
          />
        </div>

        {/* Value Range */}
        <div>
          <label>Min Value</label>
          <input
            type="number"
            value={filters.minValue}
            onChange={(e) => handleFilterChange('minValue', parseInt(e.target.value, 10))}
          />
        </div>

        <div>
          <label>Max Value</label>
          <input
            type="number"
            value={filters.maxValue}
            onChange={(e) => handleFilterChange('maxValue', parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        <button onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Results */}
      <div>
        <h3>Results ({results.length})</h3>
        {results.length > 0 ? (
          <ul>
            {results.map(property => (
              <li key={property.parcelId}>
                {property.parcelId} - {property.owner} - {property.address}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results found. Adjust your filters and try again.</p>
        )}
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <p>Your search filters are automatically saved. When you return, your last search will be ready to run.</p>
      </div>
    </div>
  );
}

export default PropertySearch;
```

**Key Benefits:**
- Last search filters are saved automatically
- On page load, if custom filters exist, search runs automatically
- Reduces repetitive data entry for common searches
- Clear button to reset to defaults

---

## Example 3: User Dashboard Settings

Save user dashboard layout, widget visibility, and collapsed state.

```typescript
import { useLocalStorage } from '@/shared/lib/utils/storage';
import { useState } from 'react';

interface DashboardSettings {
  layout: 'grid' | 'list';
  visibleWidgets: string[];
  collapsedPanels: string[];
  theme: 'light' | 'dark';
  notifications: boolean;
}

interface Widget {
  id: string;
  title: string;
  content: React.ReactNode;
}

function UserDashboard() {
  const [settings, setSettings, resetSettings] = useLocalStorage<DashboardSettings>(
    'user-dashboard-settings',
    {
      layout: 'grid',
      visibleWidgets: ['recent', 'stats', 'notifications', 'tasks'],
      collapsedPanels: [],
      theme: 'light',
      notifications: true,
    }
  );

  const allWidgets: Widget[] = [
    { id: 'recent', title: 'Recent Properties', content: <div>Recent properties content...</div> },
    { id: 'stats', title: 'Statistics', content: <div>Statistics content...</div> },
    { id: 'notifications', title: 'Notifications', content: <div>Notifications content...</div> },
    { id: 'tasks', title: 'Tasks', content: <div>Tasks content...</div> },
    { id: 'calendar', title: 'Calendar', content: <div>Calendar content...</div> },
    { id: 'reports', title: 'Reports', content: <div>Reports content...</div> },
  ];

  const visibleWidgets = allWidgets.filter(w => 
    settings.visibleWidgets.includes(w.id)
  );

  const toggleWidget = (widgetId: string) => {
    setSettings({
      ...settings,
      visibleWidgets: settings.visibleWidgets.includes(widgetId)
        ? settings.visibleWidgets.filter(id => id !== widgetId)
        : [...settings.visibleWidgets, widgetId],
    });
  };

  const togglePanel = (panelId: string) => {
    setSettings({
      ...settings,
      collapsedPanels: settings.collapsedPanels.includes(panelId)
        ? settings.collapsedPanels.filter(id => id !== panelId)
        : [...settings.collapsedPanels, panelId],
    });
  };

  const toggleLayout = () => {
    setSettings({
      ...settings,
      layout: settings.layout === 'grid' ? 'list' : 'grid',
    });
  };

  const toggleTheme = () => {
    setSettings({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light',
    });
  };

  return (
    <div style={{ 
      background: settings.theme === 'dark' ? '#1a1a1a' : '#fff',
      color: settings.theme === 'dark' ? '#fff' : '#000',
      minHeight: '100vh',
      padding: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Layout toggle */}
          <button onClick={toggleLayout}>
            {settings.layout === 'grid' ? 'List View' : 'Grid View'}
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme}>
            {settings.theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>

          {/* Reset button */}
          <button onClick={resetSettings}>
            Reset Dashboard
          </button>

          {/* Widget visibility menu */}
          <details>
            <summary>Widgets</summary>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {allWidgets.map(widget => (
                <label key={widget.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.visibleWidgets.includes(widget.id)}
                    onChange={() => toggleWidget(widget.id)}
                  />
                  {widget.title}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Widgets */}
      <div
        style={{
          display: settings.layout === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {visibleWidgets.map(widget => {
          const isCollapsed = settings.collapsedPanels.includes(widget.id);

          return (
            <div
              key={widget.id}
              style={{
                border: '1px solid',
                borderColor: settings.theme === 'dark' ? '#444' : '#ddd',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: isCollapsed ? 0 : '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => togglePanel(widget.id)}
              >
                <h3>{widget.title}</h3>
                <span>{isCollapsed ? '▶' : '▼'}</span>
              </div>

              {!isCollapsed && <div>{widget.content}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.875rem', opacity: 0.7 }}>
        <p>Your dashboard settings (layout, widgets, theme) are saved automatically.</p>
      </div>
    </div>
  );
}

export default UserDashboard;
```

**Key Benefits:**
- Dashboard layout persists across sessions
- Widget visibility and collapse state saved
- Theme preference (light/dark) remembered
- Instant load of personalized dashboard

---

## Example 4: Cache Management with TTL

Cache frequently accessed property data with automatic expiration.

```typescript
import { localStorage, createStorage } from '@/shared/lib/utils/storage';
import { useEffect, useState } from 'react';

interface Property {
  parcelId: string;
  owner: string;
  address: string;
  assessedValue: number;
}

// Create namespaced storage for property cache
const propertyCache = createStorage('property_cache');

function PropertyDetails({ parcelId }: { parcelId: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [parcelId]);

  const loadProperty = async () => {
    setIsLoading(true);
    setCacheHit(false);

    // Try to load from cache first
    const cached = propertyCache.get<Property>(parcelId);
    if (cached) {
      console.log('Cache hit:', parcelId);
      setProperty(cached);
      setCacheHit(true);
      setIsLoading(false);
      return;
    }

    // Cache miss - fetch from API
    console.log('Cache miss:', parcelId);
    try {
      const response = await fetch(`/api/properties/${parcelId}`);
      const data = await response.json();
      
      setProperty(data);

      // Cache for 1 hour (3600000 ms)
      propertyCache.set(parcelId, data, { ttl: 3600000 });
    } catch (error) {
      console.error('Failed to load property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProperty = async () => {
    // Force refresh (ignore cache)
    propertyCache.remove(parcelId);
    loadProperty();
  };

  const clearCache = () => {
    propertyCache.clear();
    console.log('Property cache cleared');
  };

  if (isLoading) {
    return <div>Loading property...</div>;
  }

  if (!property) {
    return <div>Property not found</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Property Details</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={refreshProperty}>Refresh</button>
          <button onClick={clearCache}>Clear All Cache</button>
        </div>
      </div>

      {cacheHit && (
        <div style={{ 
          padding: '0.5rem', 
          background: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          ✓ Loaded from cache (expires in 1 hour)
        </div>
      )}

      <dl>
        <dt>Parcel ID</dt>
        <dd>{property.parcelId}</dd>

        <dt>Owner</dt>
        <dd>{property.owner}</dd>

        <dt>Address</dt>
        <dd>{property.address}</dd>

        <dt>Assessed Value</dt>
        <dd>${property.assessedValue.toLocaleString()}</dd>
      </dl>
    </div>
  );
}

// Advanced: Cache recent searches with TTL
function RecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from cache
    const recent = localStorage.get<string[]>('recent-searches') || [];
    setSearches(recent);
  }, []);

  const addSearch = (query: string) => {
    const updated = [query, ...searches.filter(s => s !== query)].slice(0, 10);
    setSearches(updated);
    
    // Cache for 7 days
    localStorage.set('recent-searches', updated, { 
      ttl: 7 * 24 * 60 * 60 * 1000 
    });
  };

  const clearSearches = () => {
    setSearches([]);
    localStorage.remove('recent-searches');
  };

  return (
    <div>
      <h3>Recent Searches</h3>
      {searches.length > 0 ? (
        <>
          <ul>
            {searches.map((search, index) => (
              <li key={index}>{search}</li>
            ))}
          </ul>
          <button onClick={clearSearches}>Clear History</button>
        </>
      ) : (
        <p>No recent searches</p>
      )}
    </div>
  );
}

export { PropertyDetails, RecentSearches };
```

**Key Benefits:**
- API calls reduced by caching frequently accessed data
- Automatic expiration prevents stale data
- Manual refresh option for latest data
- Recent searches with 7-day expiration

---

## Example 5: Cross-Tab Synchronization

Synchronize user preferences across multiple browser tabs/windows.

```typescript
import { useLocalStorage } from '@/shared/lib/utils/storage';
import { useEffect, useState } from 'react';

interface UserPreferences {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  notifications: boolean;
}

function PreferencesPanel() {
  // Automatically syncs across tabs via storage events
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'user-preferences',
    {
      language: 'en-US',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      notifications: true,
    }
  );

  const [syncCount, setSyncCount] = useState(0);

  // Listen for sync events (cross-tab updates)
  useEffect(() => {
    const handleSync = () => {
      setSyncCount(c => c + 1);
      console.log('Preferences synced from another tab');
    };

    // The useLocalStorage hook already handles storage events,
    // but we can add additional logic here if needed
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <div>
      <h2>User Preferences</h2>

      {syncCount > 0 && (
        <div style={{ 
          padding: '0.5rem', 
          background: '#cfe2ff', 
          color: '#084298', 
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          ↻ Preferences synced {syncCount} time(s) from other tabs
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Language */}
        <div>
          <label>Language</label>
          <select
            value={preferences.language}
            onChange={(e) => handleChange('language', e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label>Timezone</label>
          <select
            value={preferences.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          >
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/New_York">Eastern Time</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label>Currency</label>
          <select
            value={preferences.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label>Date Format</label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        {/* Notifications */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) => handleChange('notifications', e.target.checked)}
            />
            Enable Notifications
          </label>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <p><strong>Cross-Tab Synchronization:</strong></p>
        <p>Open this page in multiple tabs or windows. Changes made in one tab will automatically sync to all other tabs.</p>
        <p>Try changing a preference in this tab and watch it update in others!</p>
      </div>
    </div>
  );
}

export default PreferencesPanel;
```

**Key Benefits:**
- Changes in one tab automatically sync to all open tabs
- No page refresh needed to see updates
- Works for any user preferences or settings
- Prevents out-of-sync state across windows

---

## Example 6: Form State Persistence (Day 6 Integration)

Save partially completed forms so users can resume later.

```typescript
import { useLocalStorage } from '@/shared/lib/utils/storage';
import { useForm, validators } from '@/shared/lib/utils/form-management';
import { useEffect } from 'react';

interface AssessmentForm {
  parcelId: string;
  propertyType: string;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  notes: string;
  assessorName: string;
  assessmentDate: string;
}

function PropertyAssessmentForm() {
  // Load saved draft (persists across sessions)
  const [savedDraft, setSavedDraft, clearDraft] = useLocalStorage<Partial<AssessmentForm> | null>(
    'assessment-form-draft',
    null
  );

  const form = useForm<AssessmentForm>({
    parcelId: {
      initialValue: savedDraft?.parcelId || '',
      validators: [validators.required('Parcel ID is required')],
    },
    propertyType: {
      initialValue: savedDraft?.propertyType || 'residential',
      validators: [validators.required('Property type is required')],
    },
    landValue: {
      initialValue: savedDraft?.landValue || 0,
      validators: [
        validators.required('Land value is required'),
        validators.min(0, 'Land value must be positive'),
      ],
    },
    improvementValue: {
      initialValue: savedDraft?.improvementValue || 0,
      validators: [
        validators.required('Improvement value is required'),
        validators.min(0, 'Improvement value must be positive'),
      ],
    },
    totalValue: {
      initialValue: savedDraft?.totalValue || 0,
      validators: [validators.min(0, 'Total value must be positive')],
    },
    notes: {
      initialValue: savedDraft?.notes || '',
    },
    assessorName: {
      initialValue: savedDraft?.assessorName || '',
      validators: [validators.required('Assessor name is required')],
    },
    assessmentDate: {
      initialValue: savedDraft?.assessmentDate || new Date().toISOString().split('T')[0],
      validators: [validators.required('Assessment date is required')],
    },
  });

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const values = form.getValues();
      setSavedDraft(values);
      console.log('Draft auto-saved');
    }, 5000);

    return () => clearInterval(interval);
  }, [form, setSavedDraft]);

  // Calculate total value when land or improvement changes
  useEffect(() => {
    const landValue = form.fields.landValue.value || 0;
    const improvementValue = form.fields.improvementValue.value || 0;
    form.setFieldValue('totalValue', landValue + improvementValue);
  }, [form.fields.landValue.value, form.fields.improvementValue.value]);

  const handleSubmit = async (values: AssessmentForm) => {
    try {
      // Submit assessment to API
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        console.log('Assessment saved successfully');
        
        // Clear draft after successful submission
        clearDraft();
        form.reset();
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
    }
  };

  const handleDiscard = () => {
    if (confirm('Discard this draft? This cannot be undone.')) {
      clearDraft();
      form.reset();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Property Assessment Form</h2>
        
        {savedDraft && (
          <div style={{ 
            padding: '0.5rem 1rem', 
            background: '#fff3cd', 
            color: '#856404', 
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}>
            💾 Draft auto-saved (every 5 seconds)
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {/* Parcel ID */}
          <div>
            <label>Parcel ID *</label>
            <input
              type="text"
              {...form.register('parcelId')}
              placeholder="123-456-789"
            />
            {form.fields.parcelId.error && (
              <span style={{ color: 'red', fontSize: '0.875rem' }}>
                {form.fields.parcelId.error}
              </span>
            )}
          </div>

          {/* Property Type */}
          <div>
            <label>Property Type *</label>
            <select {...form.register('propertyType')}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="agricultural">Agricultural</option>
            </select>
          </div>

          {/* Land Value */}
          <div>
            <label>Land Value *</label>
            <input
              type="number"
              {...form.register('landValue')}
              placeholder="0"
            />
            {form.fields.landValue.error && (
              <span style={{ color: 'red', fontSize: '0.875rem' }}>
                {form.fields.landValue.error}
              </span>
            )}
          </div>

          {/* Improvement Value */}
          <div>
            <label>Improvement Value *</label>
            <input
              type="number"
              {...form.register('improvementValue')}
              placeholder="0"
            />
            {form.fields.improvementValue.error && (
              <span style={{ color: 'red', fontSize: '0.875rem' }}>
                {form.fields.improvementValue.error}
              </span>
            )}
          </div>

          {/* Total Value (calculated) */}
          <div>
            <label>Total Value</label>
            <input
              type="number"
              {...form.register('totalValue')}
              disabled
              style={{ background: '#f5f5f5' }}
            />
          </div>

          {/* Assessment Date */}
          <div>
            <label>Assessment Date *</label>
            <input
              type="date"
              {...form.register('assessmentDate')}
            />
          </div>

          {/* Assessor Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <label>Assessor Name *</label>
            <input
              type="text"
              {...form.register('assessorName')}
              placeholder="John Doe"
            />
            {form.fields.assessorName.error && (
              <span style={{ color: 'red', fontSize: '0.875rem' }}>
                {form.fields.assessorName.error}
              </span>
            )}
          </div>

          {/* Notes */}
          <div style={{ gridColumn: 'span 2' }}>
            <label>Notes</label>
            <textarea
              {...form.register('notes')}
              rows={4}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? 'Saving...' : 'Submit Assessment'}
          </button>
          <button type="button" onClick={handleDiscard}>
            Discard Draft
          </button>
        </div>
      </form>

      <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
        <p>Your progress is automatically saved every 5 seconds. You can safely close this page and return later to continue.</p>
      </div>
    </div>
  );
}

export default PropertyAssessmentForm;
```

**Key Benefits:**
- Form state auto-saved every 5 seconds
- Users can close browser and resume later
- No lost work due to accidental page close
- Draft cleared after successful submission

---

## Example 7: Multi-Day Integration

Comprehensive example integrating storage utilities with multiple previous days.

```typescript
import { useLocalStorage } from '@/shared/lib/utils/storage';
import { Table, Tabs, Tooltip, Badge } from '@/shared/lib/components/ui-components'; // Day 13
import { Dialog, Dropdown, Select } from '@/shared/lib/components/advanced-ui'; // Day 7
import { Button, Input, Card } from '@/shared/lib/components/ui-elements'; // Day 3

interface AppSettings {
  // Day 3: UI Element preferences
  buttonSize: 'sm' | 'md' | 'lg';
  inputVariant: 'outline' | 'filled' | 'underline';
  
  // Day 7: Dialog & Dropdown preferences
  dialogSize: 'sm' | 'md' | 'lg' | 'xl';
  dropdownPosition: 'top' | 'bottom' | 'left' | 'right';
  
  // Day 13: Table preferences
  tablePageSize: number;
  tableStriped: boolean;
  tableCompact: boolean;
}

function IntegratedApp() {
  // Persist all app settings
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    'app-settings',
    {
      buttonSize: 'md',
      inputVariant: 'outline',
      dialogSize: 'md',
      dropdownPosition: 'bottom',
      tablePageSize: 25,
      tableStriped: true,
      tableCompact: false,
    }
  );

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div>
      <h1>TerraFusion App</h1>

      <Tabs
        tabs={[
          {
            id: 'ui-elements',
            label: 'UI Elements (Day 3)',
            content: (
              <div>
                <h2>Button Size Preference</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Button 
                    size="sm" 
                    onClick={() => updateSetting('buttonSize', 'sm')}
                    variant={settings.buttonSize === 'sm' ? 'primary' : 'outline'}
                  >
                    Small
                  </Button>
                  <Button 
                    size="md" 
                    onClick={() => updateSetting('buttonSize', 'md')}
                    variant={settings.buttonSize === 'md' ? 'primary' : 'outline'}
                  >
                    Medium
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={() => updateSetting('buttonSize', 'lg')}
                    variant={settings.buttonSize === 'lg' ? 'primary' : 'outline'}
                  >
                    Large
                  </Button>
                </div>

                <p>Current button size: <Badge variant="info">{settings.buttonSize}</Badge></p>
              </div>
            ),
          },
          {
            id: 'advanced-ui',
            label: 'Advanced UI (Day 7)',
            content: (
              <div>
                <h2>Dialog Size Preference</h2>
                <Select
                  value={settings.dialogSize}
                  onChange={(val) => updateSetting('dialogSize', val as any)}
                  options={[
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                    { value: 'xl', label: 'Extra Large' },
                  ]}
                />

                <p style={{ marginTop: '1rem' }}>
                  Current dialog size: <Badge variant="info">{settings.dialogSize}</Badge>
                </p>
              </div>
            ),
          },
          {
            id: 'table',
            label: 'Table (Day 13)',
            content: (
              <div>
                <h2>Table Preferences</h2>

                <div style={{ marginBottom: '1rem' }}>
                  <label>Page Size</label>
                  <Select
                    value={settings.tablePageSize}
                    onChange={(val) => updateSetting('tablePageSize', Number(val))}
                    options={[
                      { value: 10, label: '10 rows' },
                      { value: 25, label: '25 rows' },
                      { value: 50, label: '50 rows' },
                      { value: 100, label: '100 rows' },
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={settings.tableStriped}
                      onChange={(e) => updateSetting('tableStriped', e.target.checked)}
                    />
                    Striped rows
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={settings.tableCompact}
                      onChange={(e) => updateSetting('tableCompact', e.target.checked)}
                    />
                    Compact mode
                  </label>
                </div>

                <p style={{ marginTop: '1rem' }}>
                  Table settings: <Badge variant="info">{settings.tablePageSize} rows, {settings.tableStriped ? 'striped' : 'plain'}, {settings.tableCompact ? 'compact' : 'normal'}</Badge>
                </p>

                {/* Example table using saved preferences */}
                <Table
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Name' },
                  ]}
                  data={[
                    { id: 1, name: 'Example 1' },
                    { id: 2, name: 'Example 2' },
                  ]}
                  striped={settings.tableStriped}
                  compact={settings.tableCompact}
                  pagination={{
                    currentPage: 1,
                    pageSize: settings.tablePageSize,
                    totalRows: 2,
                    onPageChange: () => {},
                  }}
                />
              </div>
            ),
          },
        ]}
        defaultActiveTab="ui-elements"
      />

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <p><strong>Multi-Day Integration:</strong></p>
        <p>All preferences above are saved using storage utilities from Day 14.</p>
        <p>Try changing settings and refreshing the page - your choices persist!</p>
      </div>
    </div>
  );
}

export default IntegratedApp;
```

**Key Benefits:**
- Unified settings management across all UI components
- Settings persist across sessions
- Integrates seamlessly with Days 3, 7, 13
- Single source of truth for user preferences

---

## API Reference

### Storage Class

#### Constructor

```typescript
new Storage(backendType?: StorageBackend, prefix?: string)
```

- `backendType`: `'localStorage'` | `'sessionStorage'` | `'memory'` (default: `'localStorage'`)
- `prefix`: Key prefix for namespacing (default: `'tf_'`)

#### Methods

##### `get<T>(key: string): T | null`

Get an item from storage. Returns `null` if not found or expired.

```typescript
const value = storage.get<number>('counter');
```

##### `set<T>(key: string, value: T, options?: StorageSetOptions): boolean`

Set an item in storage. Returns `true` if successful.

```typescript
storage.set('counter', 42);
storage.set('cached-data', data, { ttl: 3600000 }); // 1 hour TTL
storage.set('api-response', response, { version: 'v1' });
```

Options:
- `ttl`: Time to live in milliseconds
- `version`: Version string for cache invalidation

##### `remove(key: string): void`

Remove an item from storage.

```typescript
storage.remove('counter');
```

##### `clear(): void`

Clear all items with this storage's prefix.

```typescript
storage.clear();
```

##### `keys(): string[]`

Get all keys (without prefix).

```typescript
const allKeys = storage.keys();
```

##### `has(key: string): boolean`

Check if a key exists and is not expired.

```typescript
if (storage.has('cached-data')) {
  // Data is available
}
```

##### `getItem<T>(key: string): StorageItem<T> | null`

Get the raw storage item with metadata.

```typescript
const item = storage.getItem<number>('counter');
if (item) {
  console.log('Value:', item.value);
  console.log('Created at:', new Date(item.createdAt));
  console.log('Expires at:', item.expiresAt ? new Date(item.expiresAt) : 'Never');
}
```

##### `invalidatePattern(pattern: RegExp): number`

Invalidate all items matching a pattern. Returns number of items invalidated.

```typescript
// Invalidate all user-specific cache
const count = storage.invalidatePattern(/^user_/);
console.log(`Invalidated ${count} items`);
```

##### `invalidateVersion(version: string): number`

Invalidate all items with a specific version.

```typescript
// Invalidate all v1 API responses
const count = storage.invalidateVersion('v1');
```

##### `pruneExpired(): number`

Remove all expired items. Returns number of items removed.

```typescript
const count = storage.pruneExpired();
console.log(`Removed ${count} expired items`);
```

##### `async getStats(): Promise<StorageStats>`

Get storage statistics.

```typescript
const stats = await storage.getStats();
console.log(`Items: ${stats.itemCount}`);
console.log(`Size: ${(stats.estimatedSize / 1024).toFixed(2)} KB`);
if (stats.availableQuota) {
  console.log(`Quota: ${(stats.usedQuota! / 1024 / 1024).toFixed(2)} MB / ${(stats.availableQuota / 1024 / 1024).toFixed(2)} MB`);
}
```

##### `export<T>(): Record<string, T>`

Export all storage data.

```typescript
const backup = storage.export();
console.log(JSON.stringify(backup, null, 2));
```

##### `import<T>(data: Record<string, T>, options?: StorageSetOptions): void`

Import storage data.

```typescript
storage.import(backup);
```

##### `getBackendType(): StorageBackend`

Get the backend type.

```typescript
const type = storage.getBackendType(); // 'localStorage' | 'sessionStorage' | 'memory'
```

---

### React Hooks

#### `useLocalStorage<T>`

Persist state in localStorage with automatic synchronization.

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: StorageSetOptions
): [T, (value: T | ((prev: T) => T)) => void, () => void]
```

**Returns:** `[value, setValue, remove]`

**Example:**
```typescript
const [count, setCount, resetCount] = useLocalStorage('counter', 0);

<button onClick={() => setCount(c => c + 1)}>Increment</button>
<button onClick={resetCount}>Reset</button>
```

#### `useSessionStorage<T>`

Persist state in sessionStorage with automatic synchronization.

```typescript
function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: StorageSetOptions
): [T, (value: T | ((prev: T) => T)) => void, () => void]
```

**Returns:** `[value, setValue, remove]`

**Example:**
```typescript
const [token, setToken, clearToken] = useSessionStorage('auth-token', null);
```

#### `useStorage`

Create a custom storage instance.

```typescript
function useStorage(
  backendType?: StorageBackend,
  prefix?: string
): Storage
```

**Example:**
```typescript
const propertyStorage = useStorage('localStorage', 'property_');
propertyStorage.set('recent', recentProperties);
```

---

### Utility Functions

#### `createStorage`

Create a namespaced storage instance.

```typescript
function createStorage(
  namespace: string,
  backendType?: StorageBackend
): Storage
```

**Example:**
```typescript
const userStorage = createStorage('user');
const cacheStorage = createStorage('cache');
```

#### `isStorageAvailable`

Check if storage is available.

```typescript
function isStorageAvailable(
  type: 'localStorage' | 'sessionStorage'
): boolean
```

**Example:**
```typescript
if (isStorageAvailable('localStorage')) {
  // Use localStorage
} else {
  // Fallback to in-memory
}
```

#### `migrateStorage`

Migrate data from one storage to another.

```typescript
function migrateStorage(
  from: Storage,
  to: Storage,
  options?: StorageSetOptions
): void
```

**Example:**
```typescript
// Migrate from sessionStorage to localStorage
migrateStorage(sessionStorage, localStorage);
```

---

## Best Practices

### 1. Use Namespacing for Organization

```typescript
const userStorage = createStorage('user');
const cacheStorage = createStorage('cache');
const settingsStorage = createStorage('settings');
```

### 2. Set Appropriate TTL for Cache

```typescript
// Short TTL for frequently changing data
storage.set('stock-price', price, { ttl: 60000 }); // 1 minute

// Medium TTL for semi-static data
storage.set('user-profile', profile, { ttl: 3600000 }); // 1 hour

// Long TTL for rarely changing data
storage.set('app-config', config, { ttl: 86400000 }); // 1 day
```

### 3. Handle Storage Quota Gracefully

```typescript
const success = storage.set('large-data', data);
if (!success) {
  // Storage quota exceeded
  storage.pruneExpired(); // Try cleaning up
  // Or reduce data size
}
```

### 4. Use Versioning for API Responses

```typescript
// When API changes, increment version
storage.set('api-data', data, { version: 'v2' });

// Later, invalidate old versions
storage.invalidateVersion('v1');
```

### 5. Regularly Prune Expired Items

```typescript
// On app start or periodically
useEffect(() => {
  const count = localStorage.pruneExpired();
  console.log(`Cleaned up ${count} expired items`);
}, []);
```

### 6. Be Mindful of Security

```typescript
// ❌ Don't store sensitive data
storage.set('password', password); // BAD!
storage.set('credit-card', cardNumber); // BAD!

// ✅ Store non-sensitive data only
storage.set('theme', 'dark'); // Good
storage.set('user-id', userId); // Good (if not sensitive)
```

### 7. Use Cross-Tab Sync for User Preferences

```typescript
// useLocalStorage automatically syncs across tabs
const [theme, setTheme] = useLocalStorage('theme', 'light');

// Changes in one tab update all tabs
```

### 8. Validate Stored Data

```typescript
const cached = storage.get<UserData>('user-data');
if (cached && isValidUserData(cached)) {
  // Use cached data
} else {
  // Fetch fresh data
}
```

### 9. Export/Import for Backup

```typescript
// Export all settings
const backup = storage.export();
localStorage.setItem('settings-backup', JSON.stringify(backup));

// Restore from backup
const backup = JSON.parse(localStorage.getItem('settings-backup')!);
storage.import(backup);
```

### 10. Monitor Storage Usage

```typescript
async function checkStorageUsage() {
  const stats = await localStorage.getStats();
  console.log(`Using ${(stats.estimatedSize / 1024).toFixed(2)} KB`);
  
  if (stats.availableQuota) {
    const usage = (stats.usedQuota! / stats.availableQuota) * 100;
    console.log(`Storage usage: ${usage.toFixed(2)}%`);
    
    if (usage > 80) {
      console.warn('Storage usage high, consider cleanup');
    }
  }
}
```

---

## Integration with Previous Days

### Day 3: UI Elements
```typescript
// Save button size preferences
const [buttonSize, setButtonSize] = useLocalStorage('button-size', 'md');
<Button size={buttonSize}>Click Me</Button>
```

### Day 6: Form Management
```typescript
// Auto-save form drafts
const [formDraft, setFormDraft] = useLocalStorage('form-draft', {});
useEffect(() => {
  const interval = setInterval(() => {
    setFormDraft(form.getValues());
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

### Day 7: Advanced UI
```typescript
// Save dialog sizes and positions
const [dialogSize, setDialogSize] = useLocalStorage('dialog-size', 'md');
<Dialog size={dialogSize}>...</Dialog>
```

### Day 13: UI Components
```typescript
// Save table preferences (sort, filter, pagination)
const [tablePrefs, setTablePrefs] = useLocalStorage('table-prefs', {
  sortColumn: 'id',
  sortDirection: 'asc',
  pageSize: 25,
  filterText: '',
});
```

---

## Troubleshooting

### Storage Not Available (Private Browsing)

```typescript
const storage = new Storage('localStorage');
if (storage.getBackendType() === 'memory') {
  console.warn('Using in-memory storage (browser storage unavailable)');
}
```

### Quota Exceeded

```typescript
// Automatic LRU eviction is handled internally
// But you can also manually control:
storage.pruneExpired(); // Remove expired items
storage.invalidatePattern(/^old_/); // Remove old data
```

### Cross-Tab Sync Not Working

```typescript
// Ensure you're using the hook, not the Storage class directly
const [value, setValue] = useLocalStorage('key', defaultValue);
// ✅ Hook provides cross-tab sync

// ❌ Direct Storage class doesn't automatically sync in React
```

### SSR/Next.js Compatibility

```typescript
// Storage utilities automatically handle SSR
// Falls back to in-memory storage when `window` is undefined
const [value, setValue] = useLocalStorage('key', defaultValue);
// Works in both SSR and client-side rendering
```

---

## Summary

The storage utilities module provides production-ready browser storage management with:

- **Type Safety**: Full TypeScript support with generics
- **Advanced Features**: TTL, cache invalidation, cross-tab sync, quota management
- **Developer Experience**: Simple API, React hooks, error handling
- **Performance**: Automatic LRU eviction, efficient serialization
- **Reliability**: Fallback to in-memory storage, SSR support

Perfect for persisting user preferences, caching data, saving form drafts, and synchronizing state across tabs in the TerraFusion property assessment platform.
