# TerraField Mobile Integration

This document describes the integration between the TerraField mobile app and the AppraisalCore backend. The integration uses Conflict-free Replicated Data Types (CRDT) to enable offline-first data synchronization.

## Architecture Overview

The integration consists of the following components:

1. **Mobile App**:

   - React Native application with offline storage capabilities
   - Uses CRDT package to manage data synchronization
   - Provides offline photo capture and notes functionality

2. **Backend Server**:

   - Express.js API with WebSocket support
   - CRDT synchronization endpoints
   - Database storage for synchronized data

3. **CRDT Package**:
   - Shared library used by both mobile app and backend
   - Built on Yjs for conflict-free data structures
   - Handles state merging and conflict resolution

## Offline-First Data Flow

The TerraField mobile app follows an offline-first approach:

1. Users can create, update, and delete data without an active internet connection
2. Changes are stored locally using CRDT structures
3. When connectivity is restored, data is synchronized with the server
4. Conflicts are automatically resolved using CRDT merge algorithms

## API Endpoints

### Photo Synchronization

**GET /api/sync/reports/:reportId/photos**

Retrieves the current state of photos for a specific report.

```
Request:
- reportId: The ID of the report to retrieve photos for

Response:
{
  "update": "<encoded CRDT state>",
  "photos": [
    {
      "id": "123",
      "reportId": "456",
      "photoType": "SUBJECT",
      "url": "https://example.com/photos/123.jpg",
      "caption": "Front view",
      "dateTaken": "2025-04-24T12:34:56Z",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "isOffline": false,
      "status": "synced"
    },
    ...
  ]
}
```

**POST /api/sync/reports/:reportId/photos**

Synchronizes photo updates from the client with the server.

```
Request:
{
  "update": "<encoded CRDT update>"
}

Response:
{
  "mergedUpdate": "<encoded merged CRDT state>",
  "photos": [
    {
      "id": "123",
      "reportId": "456",
      "photoType": "SUBJECT",
      "url": "https://example.com/photos/123.jpg",
      "caption": "Front view",
      "dateTaken": "2025-04-24T12:34:56Z",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "isOffline": false,
      "status": "synced"
    },
    ...
  ]
}
```

### Parcel Notes Synchronization

**GET /api/sync/parcels/:parcelId/notes**

Retrieves the current state of notes for a specific parcel.

```
Request:
- parcelId: The ID of the parcel to retrieve notes for

Response:
{
  "update": "<encoded CRDT state>",
  "data": {
    "notes": [
      {
        "id": "123",
        "parcelId": "456",
        "text": "Property has a new roof",
        "createdAt": "2025-04-24T12:34:56Z",
        "createdBy": "John Appraiser"
      },
      ...
    ]
  }
}
```

**PUT /api/sync/parcels/:parcelId/notes**

Updates parcel notes from the client with the server.

```
Request:
{
  "update": "<encoded CRDT update>"
}

Response:
{
  "mergedUpdate": "<encoded merged CRDT state>",
  "data": {
    "notes": [
      {
        "id": "123",
        "parcelId": "456",
        "text": "Property has a new roof",
        "createdAt": "2025-04-24T12:34:56Z",
        "createdBy": "John Appraiser"
      },
      ...
    ]
  }
}
```

### WebSocket Real-time Updates

**WebSocket Connection: /ws**

Enables real-time updates for collaborative editing.

```
Client -> Server: {
  "type": "join",
  "parcelId": "456"
}

Server -> Client: {
  "type": "init",
  "data": { ... }
}

Client -> Server: {
  "type": "update",
  "update": "<encoded CRDT update>"
}

Server -> Client: {
  "type": "update",
  "update": "<encoded CRDT update>",
  "data": { ... }
}

Client -> Server: {
  "type": "leave",
  "parcelId": "456"
}
```

## Mobile Client API Service

The mobile app uses the `ApiService` class to communicate with the backend:

```typescript
// Get singleton instance
const api = ApiService.getInstance({
  baseUrl: "https://api.example.com",
  wsBaseUrl: "wss://api.example.com",
});

// Authentication
api.setAuthToken("token");
const isAuthenticated = api.isAuthenticated();

// CRDT Sync operations
const notesResult = await api.getParcelNotes("parcel123");
const syncResult = await api.syncParcelNotes("parcel123", encodedUpdate);

const photosResult = await api.getReportPhotos("report456");
const photoSyncResult = await api.syncReportPhotos("report456", encodedUpdate);

// WebSocket for real-time updates
const ws = api.createWebSocket("/ws");
```

## Photo Sync Service

The mobile app includes a `PhotoSyncService` for managing photo synchronization:

```typescript
// Get singleton instance
const photoSync = PhotoSyncService.getInstance("https://api.example.com");

// Add new photo
const photoId = photoSync.addPhoto({
  reportId: "report456",
  photoType: "SUBJECT",
  url: "",
  caption: "Front view",
  dateTaken: new Date().toISOString(),
  latitude: 37.7749,
  longitude: -122.4194,
  isOffline: true,
  localPath: "/path/to/local/photo.jpg",
});

// Update photo metadata
photoSync.updatePhoto(photoId, "report456", {
  caption: "Updated caption",
});

// Remove photo
photoSync.removePhoto(photoId, "report456");

// Get all photos for a report
const photos = photoSync.getPhotos("report456");

// Get pending photos (not yet synced)
const pendingPhotos = photoSync.getPendingPhotos("report456");

// Sync with server
await photoSync.syncReport("report456");

// Initialize from server
await photoSync.initializeFromServer("report456");
```

## AI-Powered Photo Enhancement

The TerraField mobile app integrates with OpenAI and Anthropic APIs to provide AI-powered photo enhancements:

1. Automatic property feature detection
2. Image quality improvements
3. Lighting and exposure correction
4. Image cropping and straightening

For detailed information on the AI photo enhancement implementation, see the [Photo Enhancement API documentation](PhotoEnhancementAPI.md).

## Error Handling

The TerraField mobile app implements robust offline error handling:

1. Network connectivity monitoring
2. Automatic retry mechanisms
3. Status tracking for sync operations
4. Conflict resolution using CRDT merge algorithms

## Testing

A testing interface is available at `/photo-sync-test` in the web application, which demonstrates:

1. Adding new photos with metadata
2. Offline storage simulation
3. Synchronization with the server
4. Error state handling and recovery
5. Real-time updates via WebSocket
