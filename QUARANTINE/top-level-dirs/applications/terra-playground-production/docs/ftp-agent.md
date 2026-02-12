# FTP Agent Documentation

## Overview

The FTP Agent is a dedicated component within the property assessment system responsible for synchronizing data from the Benton County FTP server. This agent automates the retrieval and processing of property assessment data files, ensuring that the application always has access to the most up-to-date information.

## Architecture

The FTP Agent consists of several key components:

1. **FTP Service**: Handles direct communication with the FTP server, including connection management, directory traversal, and file transfers.
2. **FTP Data Agent**: Orchestrates the synchronization process and manages the overall data flow.
3. **FTP Data Processor**: Parses and processes the fixed-width data files retrieved from the FTP server.
4. **Scheduler**: Manages automated synchronization at scheduled intervals.
5. **API Endpoints**: Provides REST API access to FTP functionality and data processing capabilities.

## Key Features

### Robust FTP Synchronization

- **Incremental Sync**: Only downloads new or modified files based on timestamp comparison.
- **Directory Mirroring**: Maintains the same directory structure as the source FTP server.
- **Resume Capability**: Can resume interrupted downloads.
- **Retry Mechanism**: Implements configurable retry logic for handling transient network issues.
- **Detailed Logging**: Provides comprehensive logging of all FTP operations.

### Automated Scheduling

- **Configurable Schedule**: Supports cron-like scheduling expressions for flexible timing control.
- **Lock Mechanism**: Prevents overlapping sync jobs from running simultaneously.
- **Stale Lock Detection**: Automatically cleans up stale locks to prevent system hangs.
- **One-Time Sync Option**: Supports manually triggered one-time synchronization.

### Fixed-Width File Processing

- **Configurable Parsing**: Supports custom field mappings and configurations for different file types.
- **Entity Type Mapping**: Maps files to specific entity types (property, valuation, tax records, etc.).
- **Data Validation**: Performs basic validation on parsed data.
- **Data Transformation**: Converts raw text data into structured objects for database storage.

### API Integration

- **REST API Endpoints**: Provides HTTP endpoints for triggering synchronization and retrieving status.
- **Data Processing Endpoints**: Offers endpoints for processing and querying the parsed data.
- **Status Reporting**: Includes detailed status reporting for ongoing and completed operations.

## Configuration

### FTP Connection Settings

The FTP connection is configured through environment variables:

```
FTP_HOST=ftp.bentoncounty.gov
FTP_PORT=21
FTP_USER=username
FTP_PASSWORD=password
FTP_SECURE=false
```

### Synchronization Settings

Synchronization behavior can be configured through environment variables:

```
FTP_SYNC_RETRY_ATTEMPTS=3
FTP_SYNC_RETRY_DELAY=5000
FTP_SYNC_PARALLEL_TRANSFERS=5
FTP_SYNC_MAX_CONCURRENT=2
```

### Data Processing Settings

Data processing settings for fixed-width files:

```
FTP_PROCESSOR_BATCH_SIZE=1000
FTP_PROCESSOR_VALIDATE=true
```

## Usage

### Command Line

The FTP agent can be used from the command line:

```bash
# Run a one-time synchronization
node scripts/setup-ftp-cron.js --now

# Schedule regular synchronization (every 6 hours by default)
node scripts/setup-ftp-cron.js --schedule "0 */6 * * *"

# Run FTP tests
./scripts/run-ftp-tests.sh
```

### API Endpoints

The FTP agent provides the following REST API endpoints:

#### FTP Synchronization

- `GET /api/ftp/status`: Get the status of the FTP synchronization service
- `POST /api/ftp/sync`: Trigger a manual synchronization
- `GET /api/ftp/logs`: Get the synchronization logs

#### Data Processing

- `GET /api/ftp-data-processor/configs`: Get all fixed-width file configurations
- `GET /api/ftp-data-processor/field-mappings`: Get all field mappings
- `POST /api/ftp-data-processor/parse`: Parse file content with specified entity type
- `GET /api/ftp-data-processor/status`: Get the status of the data processor

## Implementation Details

### FTP Service

The FTP Service uses the `basic-ftp` package to manage FTP connections and file transfers. It implements methods for:

- Establishing secure and non-secure FTP connections
- Traversing directory structures
- Comparing file timestamps
- Downloading files with progress tracking
- Handling retries and connection failures

### FTP Data Agent

The FTP Data Agent orchestrates the synchronization process:

1. Connects to the FTP server
2. Recursively traverses directories
3. Identifies new or modified files
4. Downloads files to the local storage
5. Tracks progress and reports status
6. Logs operations for auditing

### FTP Data Processor

The FTP Data Processor handles parsing fixed-width files:

1. Reads configurations for different file types
2. Applies field mappings to extract structured data
3. Validates extracted data against schemas
4. Transforms raw data into application domain objects
5. Provides interfaces for querying and analyzing parsed data

### Scheduler

The scheduler uses `node-cron` to manage scheduled synchronization:

1. Parses cron expressions for scheduling
2. Creates and manages file locks to prevent overlapping jobs
3. Handles graceful shutdown of running jobs
4. Provides status reporting for scheduled jobs

## Testing

The FTP agent includes comprehensive test coverage:

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test the interaction between components
3. **End-to-End Tests**: Test the full synchronization process
4. **API Tests**: Test the REST API endpoints

Run tests using the provided testing script:

```bash
./scripts/run-ftp-tests.sh
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Verify network connectivity and FTP server availability
2. **Authentication Failures**: Check FTP credentials in environment variables
3. **Parsing Errors**: Verify file format matches the configured field mappings
4. **Stale Locks**: Check for and manually remove lock files in case of unexpected termination

### Debugging

1. Enable debug logging by setting `LOG_LEVEL=debug`
2. Check application logs for detailed error messages
3. Use the status API endpoints to monitor synchronization progress
4. Check system resources (disk space, memory, network bandwidth) for potential bottlenecks

## Maintenance

### Regular Maintenance Tasks

1. **Log Rotation**: Implement log rotation to prevent excessive disk usage
2. **Stale File Cleanup**: Periodically clean up old downloaded files
3. **Configuration Updates**: Update field mappings when file formats change
4. **Performance Monitoring**: Monitor synchronization times and adjust parallel transfer settings

### Upgrading

1. Back up existing configuration files
2. Update code using version control
3. Test the upgrade in a staging environment
4. Deploy the upgrade to production
5. Verify synchronization still works as expected

## Future Enhancements

1. **Improved Error Handling**: Enhance error detection and recovery mechanisms
2. **File Filtering**: Add support for filtering files based on patterns or metadata
3. **Delta Processing**: Implement more efficient delta processing for large files
4. **Real-time Notifications**: Add support for notifications on sync completion or failures
5. **Web Dashboard**: Create a web-based dashboard for monitoring synchronization status
