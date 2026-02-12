# Benton County PACS Database Integration

## Overview

TerraMiner is integrated with the Benton County Property Assessment and Collection System (PACS) database to provide authentic property assessment data in compliance with IAAO and USPAP standards. This document outlines the integration architecture and data flow.

## Architecture

The integration consists of several components:

1. **PACS Database Connector** (`regional/benton_pacs_connector.py`)
   - Direct connector to the Benton County PACS database
   - Uses pyodbc with Windows Authentication
   - Implements IAAO and USPAP compliant data retrieval
   
2. **PACS API Server** (`pacs_api_server.py`)
   - FastAPI server that acts as a bridge to the PACS database
   - RESTful endpoints for property data retrieval
   - Error handling for connection issues

3. **Assessment API** (`regional/assessment_api.py`)
   - Coordinates data retrieval from multiple county sources
   - Prioritizes Benton County PACS data for Benton properties
   - Implements clear error handling with no fallback to demo data

4. **Property Record Controller** (`controllers/property_record_controller.py`)
   - Handles web requests for property records
   - Renders templates with real data or error templates

## Data Flow

1. User requests a property record through the TerraMiner web interface
2. Request is handled by the Property Record Controller
3. Controller requests data from the Assessment API
4. For Benton County properties, Assessment API calls the PACS API Server
5. PACS API Server connects to the PACS database using the connector
6. Real property data is retrieved and returned to the user
7. If any connection issues occur, clear error messages are shown

## Configuration

The PACS integration is configured through environment variables:

- `PACS_SERVER` - The PACS database server hostname (default: jcharrispacs)
- `PACS_DATABASE` - The PACS database name (default: pacs_training)
- `PACS_API_URL` - URL of the PACS API Server (default: http://localhost:8000)

## Running the PACS API Server

The PACS API Server can be started separately from the main application:

```bash
./start_pacs_server.sh
```

This allows the API server to run continuously while the main TerraMiner application is restarted or updated.

## Data Standards Compliance

The PACS integration strictly follows:

1. International Association of Assessing Officers (IAAO) standards
2. Uniform Standards of Professional Appraisal Practice (USPAP)

Under no circumstances does the system generate, display, or fall back to demonstration or synthetic data. When real data cannot be retrieved, the system displays clear error messages explaining the issue.