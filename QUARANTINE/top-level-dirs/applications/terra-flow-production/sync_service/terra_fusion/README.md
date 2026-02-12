# Terrafusion Sync Service

This directory contains the enhanced DatabaseProjectSyncService implementation that aligns with the Terrafusion Platform architecture.

## Core Components

1. **Change Detector**: Detects changes between source and target databases
2. **Transformer**: Transforms data between different schemas and formats
3. **Validator**: Validates data integrity and schema compatibility
4. **Self-Healing Orchestrator**: Manages the sync process with resilience capabilities
5. **Conflict Resolver**: Resolves conflicts between source and target data
6. **Audit System**: Logs all sync operations for compliance and debugging

## Architecture

The Terrafusion Sync Service follows a modular, component-based architecture with clear separation of concerns:

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Change Detector   │────▶│   Transformer    │────▶│    Validator    │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
           │                         │                        │
           │                         │                        │
           ▼                         ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Self-Healing Orchestrator                         │
└─────────────────────────────────────────────────────────────────────┘
           │                         │                        │
           │                         │                        │
           ▼                         ▼                        ▼
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Conflict Resolver  │     │   Audit System   │     │ Data Type       │
│                     │     │                  │     │ Handlers        │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
```

## API Endpoints

- `/sync/full`: Full synchronization of all project data
- `/sync/incremental`: Incremental synchronization based on changes
- `/sync/validate`: Validate schema and data compatibility
- `/sync/conflicts`: View and resolve sync conflicts
- `/sync/status`: Check sync job status
- `/health`: Service health check endpoint