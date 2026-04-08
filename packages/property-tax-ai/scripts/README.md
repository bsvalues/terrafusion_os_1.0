# PACS Integration Scripts

This directory contains scripts for setting up and integrating with the Property Appraisal and Collection System (PACS).

## Database Setup

- `create-tables.js` - Sets up the database schema with all required tables
- `create-tables.sql` - SQL schema for manual database setup if needed

## PACS Module Integration

The system provides two methods to import PACS modules from the CSV file:

### API-Based Import (Recommended)

The API-based import uses the MCP API endpoints to securely import modules. This method provides additional validation and ensures all security policies are enforced.

```bash
node scripts/import-pacs-modules.js
```

Requirements:
- The server must be running
- Valid JWT token is required (generated automatically using the admin API key)

### Direct Database Import

The direct database import method bypasses the API and imports modules directly into the database. This method is useful if there are issues with the API or for initial setup.

```bash
node scripts/direct-import-pacs-modules.js
```

Requirements:
- Valid DATABASE_URL environment variable is required
- Direct database access is required

### Combined Script

For convenience, a combined script is provided that can run either import method:

```bash
# API-based import (default)
bash scripts/run-import.sh

# Direct database import
bash scripts/run-import.sh direct
```

## PACS Module Format

The PACS modules are imported from the `attached_assets/PACS_Agent_Module_Map.csv` file, which should have the following format:

```csv
module_name,source,integration
"Property Record Cards","PACS WA","complete"
"Land Value Tables","PACS WA","pending"
...
```

## Data Enhancement

During import, the scripts enhance the data by:

1. Determining a category based on the module name
2. Generating a descriptive summary of each module's functionality
3. Adding version information and timestamps
4. Setting default values for missing fields

## Security Considerations

- The API-based import enforces authentication and authorization
- All inputs are validated and sanitized before processing
- The direct import script should only be used in secure environments
- Both methods use parameterized queries to prevent SQL injection