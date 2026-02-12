# Database Synchronization Services

This module provides database synchronization services for the GeoAssessmentPro application, including the original DatabaseProjectSyncService and the enhanced Terrafusion Sync Service.

## Overview

The sync services allow synchronization of project data between different database environments, such as development, training, and production. They handle schema validation, data transformation, and conflict resolution.

## Services

### Original DatabaseProjectSyncService

The original sync service provides basic functionality for synchronizing project data. It is accessible through the following routes:

- `/sync/dashboard` - Sync dashboard
- `/sync/jobs` - Sync jobs list
- `/sync/job/<job_id>` - Job details
- `/sync/conflicts` - View conflicts

### Enhanced Terrafusion Sync Service

The Terrafusion Sync Service is an enhanced implementation that aligns with the Terrafusion Platform architecture. It provides improved reliability, performance, and features:

#### API Endpoints

- `/api/sync/full` - Start a full synchronization
- `/api/sync/incremental` - Start an incremental synchronization
- `/api/sync/status/<job_id>` - Get job status
- `/api/sync/stop/<job_id>` - Stop a sync job
- `/api/sync/resume/<job_id>` - Resume a stopped/failed job
- `/api/sync/conflicts/<job_id>` - Get conflicts for a job
- `/api/sync/conflicts/<job_id>/<conflict_id>/resolve` - Resolve a specific conflict
- `/api/sync/conflicts/<job_id>/resolve-all` - Resolve all conflicts
- `/api/sync/audit/<job_id>` - Get audit events for a job
- `/api/sync/audit/<job_id>/report` - Generate audit report
- `/api/sync/validate/<job_id>/<table_name>` - Validate schema
- `/api/sync/health` - Check service health

#### Web UI

- `/sync/terra_fusion` or `/sync/terra_fusion/dashboard` - Terrafusion dashboard
- `/sync/terra_fusion/job/<job_id>` - Job details
- `/sync/terra_fusion/conflicts/<job_id>` - View and resolve conflicts

## Key Features

The Terrafusion Sync Service provides several enhancements over the original service:

1. **Change Detection**: Multiple strategies for detecting changes:
   - Primary key comparison
   - Timestamp-based
   - Content-based
   - CDC (Change Data Capture)
   - Hash-based

2. **Transformation**: Transform data between schemas:
   - Schema mapping
   - Type conversion
   - Custom transformations
   - AI-assisted transformations

3. **Validation**: Validate data integrity:
   - Schema validation
   - Data validation rules
   - Custom validation rules

4. **Orchestration**: Manage the sync process:
   - Parallel processing
   - Error recovery
   - Checkpointing
   - Resumable operations

5. **Conflict Resolution**: Resolve conflicts between sources:
   - Multiple strategies (source wins, target wins, newer wins)
   - Field-level conflict resolution
   - Manual resolution UI

6. **Audit**: Track all operations:
   - Comprehensive event logging
   - Filtering and search
   - Reports and statistics

## Architecture

The Terrafusion Sync Service follows a modular, component-based architecture:

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

## Usage

### Starting a Sync Job

To start a sync job using the Terrafusion Sync Service API:

```python
import requests
import json

# Start a full sync
response = requests.post(
    "http://localhost:5000/api/sync/full",
    json={
        "source_connection": "postgresql://user:password@source_host:5432/source_db",
        "target_connection": "postgresql://user:password@target_host:5432/target_db",
        "config": {
            "batch_size": 1000,
            "detection_strategy": "hash",
            "conflict_strategy": "source_wins"
        }
    }
)

# Get the job ID
job_id = response.json()["job_id"]

# Check status
status = requests.get(f"http://localhost:5000/api/sync/status/{job_id}").json()
```

### Web UI

The Terrafusion Sync Service provides a comprehensive web UI for managing sync jobs:

1. Go to `/sync/terra_fusion` to access the dashboard
2. Start a new sync job using the form
3. Monitor job progress and status
4. View and resolve conflicts as needed
5. Check audit logs for detailed information

## Configuration

The Terrafusion Sync Service can be configured with various options:

- `batch_size`: Number of records to process in a batch (default: 1000)
- `detection_strategy`: Strategy for change detection (default: "hash")
- `conflict_strategy`: Strategy for conflict resolution (default: "source_wins")
- `max_parallel_tables`: Maximum number of tables to process in parallel (default: 1)
- `max_parallel_operations`: Maximum operations per table in parallel (default: 5)
- `audit_level`: Level of auditing detail (default: "standard")

## Integration

Both sync services are automatically registered with the Flask application at startup through the `sync_service/integration.py` module. Status information is available through the `/api/v1/status` endpoint.