# FTP Testing Framework Documentation

## Overview

The FTP Testing Framework provides a comprehensive suite of tools for testing the FTP synchronization and data processing functionality within the Property Assessment Platform. It allows for systematic testing of various components of the FTP integration, including connection validation, directory structure verification, data processor configuration, and scheduler operations.

## Main Test Runner

The `run-ftp-tests.sh` script serves as the main entry point for running FTP-related tests. It offers a flexible command-line interface that allows for running all tests or specific test groups.

### Usage

```bash
./scripts/run-ftp-tests.sh [options]
```

### Options

- `--help`: Display the help message
- `--connection`: Run only FTP connection tests
- `--directories`: Run only directory structure tests
- `--processor`: Run only data processor tests
- `--scheduler`: Run only scheduler and lock mechanism tests
- `--all`: Run all tests (this is the default if no options are specified)

## Test Components

The testing framework is divided into several key components:

### 1. Connection Tests

Tests the ability to connect to the FTP server and perform a small synchronization operation.

**Command:** `node scripts/test-ftp-sync.js --small-sync-only`

### 2. Directory Structure Tests

Validates the FTP server's directory structure and ensures that the expected directories exist.

**Command:** `node scripts/test-ftp-sync.js --check-dirs --no-small-sync`

### 3. Data Processor Tests

Tests the FTP data processor, which is responsible for parsing fixed-width files from the property assessment system.

**Commands:**
- **Config Tests:** `node scripts/test-ftp-data-processor.js --test-configs`
- **Field Mapping Tests:** `node scripts/test-ftp-data-processor.js --test-mappings`
- **Parsing Tests:** `node scripts/test-ftp-data-processor.js --test-parsing`

### 4. Scheduler Tests

Tests the synchronization scheduler and the locking mechanism that prevents multiple synchronization jobs from running simultaneously.

**Commands:**
- **Scheduler Test:** `node scripts/setup-ftp-cron.js --test`
- **Lock Mechanism Test:** `node tests/ftp-agent-scheduler.test.js`

## Individual Test Scripts

### test-ftp-sync.js

This script tests the FTP connection and synchronization functionality. It supports the following command-line arguments:

- `--small-sync-only`: Perform only a small synchronization test
- `--test-connection`: Test only the FTP connection
- `--check-dirs`: Check the FTP directory structure
- `--check-dirs-only`: Check only the directory structure, don't perform any sync
- `--no-small-sync`: Skip the small synchronization test
- `--help`: Display help information

### test-ftp-data-processor.js

This script tests the FTP data processor functionality. It supports the following command-line arguments:

- `--test-configs`: Test fixed-width configurations
- `--test-mappings`: Test field mappings
- `--test-parsing`: Test file parsing
- `--test-all`: Run all tests
- `--help`: Display help information

### setup-ftp-cron.js

This script sets up the cron job for FTP synchronization and can also be used to test the scheduler. It supports the following command-line arguments:

- `--test`: Test the scheduler without setting up the cron job
- `--force`: Force setup even if a lock file exists
- `--remove`: Remove the cron job
- `--help`: Display help information

### ftp-agent-scheduler.test.js

This script specifically tests the locking mechanism used by the FTP agent scheduler to prevent multiple concurrent synchronization jobs.

## Test Output

The test runner provides informative output, including:

- Color-coded test results (green for passed, red for failed)
- A summary of total tests, tests passed, and tests failed
- Detailed output for each test, including the command being executed

## Example Runs

### Running All Tests

```bash
./scripts/run-ftp-tests.sh
```

### Running Only Connection Tests

```bash
./scripts/run-ftp-tests.sh --connection
```

### Running Data Processor Tests

```bash
./scripts/run-ftp-tests.sh --processor
```

### Running Scheduler Tests

```bash
./scripts/run-ftp-tests.sh --scheduler
```

## Error Handling

The test runner tracks the exit codes of each test and provides a summary at the end. If any test fails, the runner will exit with a non-zero exit code, which can be used in continuous integration environments to detect test failures.

## Prerequisites

Before running the tests, ensure that:

1. The required directories (`downloads`, `downloads/test-data`, and `logs`) exist or can be created by the test runner
2. FTP credentials are properly configured in the application environment
3. The necessary test data is available on the FTP server

## Integration with CI/CD

The test runner can be integrated into CI/CD pipelines to automatically verify FTP functionality during deployment. The non-zero exit code on failure makes it suitable for use in automated testing environments.