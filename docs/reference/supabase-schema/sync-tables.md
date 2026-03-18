# TFR-074: Sync-Related Database Tables

Reference schema for the canon-sync subsystem. These tables support synchronization, connectors, and orchestration.

## sync_jobs

Tracks individual sync job executions.

| Column              | Type         | Nullable | Default           | Description                          |
|---------------------|--------------|----------|-------------------|--------------------------------------|
| id                  | uuid         | NO       | gen_random_uuid() | Primary key                          |
| name                | varchar(200) | NO       |                   | Human-readable job name              |
| connector_name      | varchar(100) | NO       |                   | FK to connector_configs.name         |
| status              | varchar(20)  | NO       | 'queued'          | queued, running, completed, failed, cancelled |
| mode                | varchar(10)  | NO       | 'full'            | full or delta                        |
| direction           | varchar(15)  | NO       | 'inbound'         | inbound, outbound, bidirectional     |
| progress            | integer      | NO       | 0                 | Percentage 0-100                     |
| records_processed   | integer      | NO       | 0                 | Records processed so far             |
| records_total       | integer      | NO       | 0                 | Total expected records               |
| records_failed      | integer      | NO       | 0                 | Records that failed validation/load  |
| error_message       | text         | YES      |                   | Error details if failed              |
| started_at          | timestamptz  | YES      |                   | When the job began running           |
| completed_at        | timestamptz  | YES      |                   | When the job finished                |
| created_at          | timestamptz  | NO       | now()             | Row creation timestamp               |
| created_by          | varchar(100) | NO       |                   | User or system that created the job  |

## sync_runs

Stores results and metrics for completed sync runs.

| Column              | Type         | Nullable | Default           | Description                          |
|---------------------|--------------|----------|-------------------|--------------------------------------|
| id                  | uuid         | NO       | gen_random_uuid() | Primary key                          |
| job_id              | uuid         | NO       |                   | FK to sync_jobs.id                   |
| status              | varchar(20)  | NO       |                   | Final status of the run              |
| records_inserted    | integer      | NO       | 0                 | New records inserted                 |
| records_updated     | integer      | NO       | 0                 | Existing records updated             |
| records_skipped     | integer      | NO       | 0                 | Records skipped (no changes)         |
| records_failed      | integer      | NO       | 0                 | Records that failed                  |
| errors              | jsonb        | YES      | '[]'              | Array of error objects               |
| duration_ms         | integer      | NO       | 0                 | Run duration in milliseconds         |
| completed_at        | timestamptz  | NO       | now()             | Completion timestamp                 |

## connector_configs

Configuration for each data connector.

| Column              | Type         | Nullable | Default           | Description                          |
|---------------------|--------------|----------|-------------------|--------------------------------------|
| name                | varchar(100) | NO       |                   | Primary key, unique connector name   |
| type                | varchar(20)  | NO       |                   | sql-server, odbc, csv, excel, api, pacs |
| display_name        | varchar(200) | YES      |                   | Human-friendly label                 |
| connection_string   | text         | YES      |                   | Encrypted connection string          |
| file_path           | text         | YES      |                   | File path for CSV/Excel sources      |
| description         | text         | YES      |                   | Description of the connector         |
| enabled             | boolean      | NO       | true              | Whether connector is active          |
| version             | varchar(20)  | YES      |                   | Connector version                    |
| created_at          | timestamptz  | NO       | now()             | Row creation timestamp               |
| updated_at          | timestamptz  | NO       | now()             | Last update timestamp                |

## connector_health_log

Time-series health check records for each connector.

| Column                | Type         | Nullable | Default           | Description                          |
|-----------------------|--------------|----------|-------------------|--------------------------------------|
| id                    | uuid         | NO       | gen_random_uuid() | Primary key                          |
| connector_name        | varchar(100) | NO       |                   | FK to connector_configs.name         |
| status                | varchar(20)  | NO       |                   | healthy, degraded, unhealthy, unknown|
| latency_ms            | integer      | YES      |                   | Response time in milliseconds        |
| consecutive_failures  | integer      | NO       | 0                 | Count of consecutive failures        |
| error_message         | text         | YES      |                   | Error details if unhealthy           |
| checked_at            | timestamptz  | NO       | now()             | When the check occurred              |

## field_mappings

Stores source-to-target field mapping configurations for imports.

| Column                | Type         | Nullable | Default           | Description                          |
|-----------------------|--------------|----------|-------------------|--------------------------------------|
| id                    | uuid         | NO       | gen_random_uuid() | Primary key                          |
| connector_name        | varchar(100) | NO       |                   | FK to connector_configs.name         |
| table_name            | varchar(200) | YES      |                   | Source table name                    |
| source_field          | varchar(200) | NO       |                   | Column name in the source            |
| target_field          | varchar(200) | NO       |                   | Target field in TerraFusion schema   |
| transform_expression  | text         | YES      |                   | Optional transformation expression   |
| required              | boolean      | NO       | false             | Whether mapping is required          |
| default_value         | text         | YES      |                   | Default if source value is null      |
| created_at            | timestamptz  | NO       | now()             | Row creation timestamp               |
| updated_at            | timestamptz  | NO       | now()             | Last update timestamp                |

## data_sources

Registry of all configured data sources (superset of connectors).

| Column              | Type         | Nullable | Default           | Description                          |
|---------------------|--------------|----------|-------------------|--------------------------------------|
| id                  | uuid         | NO       | gen_random_uuid() | Primary key                          |
| name                | varchar(200) | NO       |                   | Unique source name                   |
| type                | varchar(20)  | NO       |                   | sql-server, odbc, csv, excel, api, pacs |
| connection_string   | text         | YES      |                   | Encrypted connection string          |
| file_path           | text         | YES      |                   | File path for file-based sources     |
| description         | text         | YES      |                   | Source description                   |
| enabled             | boolean      | NO       | true              | Whether source is active             |
| created_at          | timestamptz  | NO       | now()             | Row creation timestamp               |
| updated_at          | timestamptz  | NO       | now()             | Last update timestamp                |
