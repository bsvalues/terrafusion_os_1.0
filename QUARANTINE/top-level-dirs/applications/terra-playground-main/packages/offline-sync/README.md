# Terrafusion Offline Sync

A comprehensive module for offline-first synchronization capabilities in the Terrafusion platform. This package provides robust offline functionality with conflict-free data management, local storage, background synchronization, and offline GIS capabilities.

## Key Features

### CRDT-Based Data Layer

- Conflict-free replicated data types for seamless merging of offline changes
- Built on Yjs for reliable distributed data management
- Document versioning and awareness for collaborative editing
- Automatic conflict detection and resolution

### Local Storage

- IndexedDB storage for web applications
- Realm integration (planned) for mobile applications
- Asset storage for binary data like images and files
- Metadata management for tracking sync state

### Background Synchronization

- Multiple sync modes: immediate, background, scheduled, manual
- Retry logic with exponential backoff
- Service worker integration for web applications
- Background tasks for mobile applications

### Offline GIS Capabilities

- Vector and raster tile caching
- Offline editing of spatial features
- Map area management for selective downloads
- Coordinate transformations and spatial operations

### Conflict Resolution System

- Automated conflict detection and resolution
- Manual resolution UI for complex conflicts
- Conflict auditing and tracking
- Support for various resolution strategies

## Installation

```bash
npm install @terrafusion/offline-sync
```

## Usage

### Initializing the offline sync system

```typescript
import {
  createStorageManager,
  createCRDTDocumentManager,
  createBackgroundSyncManager,
  createConflictResolutionManager,
  createOfflineGISManager,
} from '@terrafusion/offline-sync';

// Initialize storage
const storage = await createStorageManager();

// Initialize CRDT document manager
const crdtManager = await createCRDTDocumentManager(storage);

// Initialize background sync manager
const syncManager = createBackgroundSyncManager(storage, crdtManager);
await syncManager.initialize();

// Initialize conflict resolution manager
const conflictManager = createConflictResolutionManager(crdtManager, storage);
await conflictManager.initialize();

// Initialize offline GIS manager
const gisManager = createOfflineGISManager(storage);
await gisManager.initialize();
```

### Working with documents

```typescript
// Create a document
const doc = await crdtManager.createDocument('property-123', {
  address: '123 Main St',
  owner: 'Jane Smith',
  value: 450000,
});

// Get a document
const property = crdtManager.getDocument('property-123');

// Update a document
property.value = 475000;
await crdtManager.saveDocument('property-123');

// Delete a document
await crdtManager.deleteDocument('property-123');
```

### Handling synchronization

```typescript
// Start syncing all documents
syncManager.syncAll();

// Sync a specific document
syncManager.syncDocument('property-123');

// Configure sync behavior
syncManager.updateConfig({
  mode: SyncMode.BACKGROUND,
  retryLimit: 5,
  retryDelay: 5000,
  syncOnNetworkChange: true,
});

// Listen for sync events
syncManager.on('sync:started', () => console.log('Sync started'));
syncManager.on('sync:completed', () => console.log('Sync completed'));
syncManager.on('sync:error', ({ docId, error }) =>
  console.error(`Sync error for ${docId}:`, error)
);

// Get sync statistics
const stats = syncManager.getSyncStats();
console.log(
  `Total syncs: ${stats.totalSyncs}, successful: ${stats.successfulSyncs}, failed: ${stats.failedSyncs}`
);
```

### Managing conflicts

```typescript
// Get unresolved conflicts
const conflicts = conflictManager.getUnresolvedConflicts();

// Resolve a conflict
conflictManager.resolveConflict(conflictId, ResolutionStrategy.TAKE_REMOTE, userId);

// Listen for conflict events
conflictManager.on('conflict:detected', conflict => {
  console.log(`Conflict detected in ${conflict.docId} at path ${conflict.path}`);
});

conflictManager.on('conflict:resolved', conflict => {
  console.log(`Conflict resolved in ${conflict.docId}`);
});
```

### Working with offline GIS

```typescript
// Create a map area for offline use
const area = await gisManager.createMapArea({
  name: 'Downtown',
  description: 'Downtown area for offline use',
  bounds: {
    north: 47.623,
    south: 47.615,
    east: -122.32,
    west: -122.34,
  },
  center: [-122.33, 47.62],
  minZoom: 14,
  maxZoom: 18,
  layers: ['streets', 'buildings', 'parcels'],
});

// Download map area for offline use
await gisManager.startDownload(area.id);

// Listen for download events
gisManager.on('download:progress', progress => {
  console.log(`Download progress: ${progress.progress * 100}%`);
});

gisManager.on('download:completed', result => {
  console.log(`Download completed: ${result.downloadedTiles} tiles, ${result.size} bytes`);
});

// Get offline map stats
const stats = gisManager.getOfflineMapStats();
console.log(`Total size: ${stats.totalSize} bytes, total tiles: ${stats.totalTiles}`);
```

## Architecture

The offline sync package consists of several integrated components:

1. **Storage Manager** - Provides storage capabilities for documents, assets, configuration, and sync queue.
2. **CRDT Document Manager** - Manages CRDT-based documents using Yjs for conflict-free replication.
3. **Background Sync Manager** - Handles synchronization between local and remote data stores.
4. **Conflict Resolution Manager** - Detects and helps resolve data conflicts that cannot be automatically merged.
5. **Offline GIS Manager** - Provides offline mapping and geospatial capabilities.

## License

MIT
