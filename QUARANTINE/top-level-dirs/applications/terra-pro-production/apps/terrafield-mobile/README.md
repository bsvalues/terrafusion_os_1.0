# TerraField Mobile App

This is the mobile companion application for TerraField, providing field appraisers with offline-first capabilities for data collection and synchronization.

## Key Features

- **Offline-First Architecture**: Continue working even without internet connectivity
- **CRDT Synchronization**: Conflict-free data merging when connectivity is restored
- **Photo Management**: Capture and enhance property photos in the field
- **Note Taking**: Take detailed notes about properties with automatic synchronization
- **Smart Data Collection**: Streamlined UI for efficient field data capture

## Technical Implementation

### CRDT Integration

The app uses Conflict-free Replicated Data Types (CRDT) via the Yjs library to enable sophisticated offline data handling:

- **Automatic Conflict Resolution**: No manual merge conflicts to resolve
- **Eventual Consistency**: All devices converge to the same data state
- **Operation-Based Synchronization**: Only transmit changes, not entire documents

### Photo Synchronization

The photo synchronization system allows for:

- Taking photos when offline
- Tracking sync status for each photo
- Batch synchronization when connection is restored
- Metadata preservation across devices

### Architecture

The app follows a clean architecture pattern:

- **Screens**: User interface components
- **Services**: Business logic for synchronization and data management
- **Components**: Reusable UI elements
- **Utils**: Helper functions and utilities

## Development Setup

1. Install dependencies:

```bash
cd apps/terrafield-mobile
npm install
# or
yarn install
```

1. Start the development server:

```bash
npm start
# or
yarn start
```

1. Use Expo Go on your device or an emulator to run the app

## Synchronization Workflow

1. Data is stored locally using Realm database
2. CRDT operations track all changes
3. When online, changes are synchronized with the server:
   - Send local changes
   - Receive and merge server changes
   - Update UI to reflect merged state
4. Synchronization is automatic but can be manually triggered

## API Endpoints

The mobile app communicates with the following server endpoints:

- [Photo synchronization](http://localhost:8080/api/sync/reports/:reportId/photos)
- [Parcel notes synchronization](http://localhost:8080/api/sync/parcels/:parcelId/notes)

All synchronization requests include CRDT updates encoded as Base64 strings.

## Execution Command

To execute the Terrafusion revolution, run the following command:

```bash
.\EXECUTE_NOW.bat
```

## Installation Steps

1. Install Rust (15 minutes)

```bash
choco install rust
```

1. Configure Environment (10 minutes)

```bash
cd terrafusion_rust
copy .env.example .env
# Add your API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY
```

1. Deploy Platform (30 minutes)

```bash
cargo build --release
docker-compose up -d
cargo run --release -- run
```

1. Verify All Systems (15 minutes)

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/agents
```
