# TerraFusion Platform - AI Coding Agent Instructions

## Project Overview
TerraFusion is an enterprise-grade geospatial data synchronization platform for county government property assessment and collection systems (PACS). The platform handles legacy database conversion, GIS exports, district boundary lookup, and AI-powered property exemption analysis.

## Architecture Patterns

### Multi-Service Application Structure
- **Primary App** (`app.py`): Flask web server on port 5000 - main user interface and API gateway
- **Sync Service** (`run_syncservice_workflow_8080.py`): FastAPI async service on port 8080 - data synchronization
- **Core Engine** (`src/core/terrafusion_engine.py`): Job orchestration and system health monitoring
- **Enterprise API** (`src/api/enterprise_api.py`): RESTful API with JWT authentication

### Database Design Philosophy
SQLAlchemy models in `models.py` use performance-optimized patterns:
- Compound indexes for common query patterns (county_id + status + timestamp)
- Foreign key relationships with backref for bidirectional navigation
- JSON text fields for flexible schema (exemptions, coordinates, audit details)
- Timestamp tracking on all major entities with automatic updates

### Service Layer Pattern
Services follow dependency injection with fallback mechanisms:
```python
# Example: GIS service with graceful degradation
try:
    from shapely.geometry import Point
    GEOSPATIAL_AVAILABLE = True
except ImportError:
    GEOSPATIAL_AVAILABLE = False
    # Provide mock implementations
```

## Development Workflows

### Running the Application
```bash
# Primary development workflow
python app.py                    # Main Flask app on :5000
python run_syncservice_workflow_8080.py  # Sync service on :8080
```

### Database Operations
```python
# Models auto-create on app startup
with app.app_context():
    db.create_all()  # Safe idempotent operation
```

### Job Processing Pattern
All long-running operations use the TerraFusion job system:
```python
job_id = terrafusion_engine.create_processing_job(
    job_type='data_export_geojson',
    priority=6,  # 1-10 scale
    metadata={'county_id': 'benton-wa', 'format': 'geojson'}
)
```

## Critical Code Patterns

### County-Based Multi-Tenancy
All data operations are scoped by `county_id` string identifiers:
- URL patterns: `/api/counties/<county_id>/properties`
- Database queries always filter by county for data isolation
- Export jobs and sync operations namespace by county

### PACS Conversion System
The `bulletproof_pacs_converter.py` handles legacy system integration:
- Template-driven conversion for Oracle, SQL Server, Access, AS/400
- Field mapping dictionaries for standardization
- Comprehensive validation with configurable quality thresholds
- Support for different naming conventions across legacy systems

### Authentication & Authorization
JWT-based with role separation:
```python
@require_auth          # JWT token validation
@require_admin        # Role-based access control
```
Default test credentials: admin/admin123

### Error Handling Strategy
- Graceful degradation when optional services unavailable (GIS libraries, AI models)
- JSON error responses with structured error codes
- Comprehensive logging with correlation IDs
- Health check endpoints for service monitoring

## AI Integration Patterns

### Ollama Integration
Local AI processing for data security compliance:
```python
# narrator_ai_plugin.py pattern
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
# Fallback to mock responses when Ollama unavailable
```

### ExemptionSeer AI
Property exemption fraud detection with confidence scoring and audit trails.

## Frontend Architecture

### Template Inheritance
All templates extend `templates/base_clean.html` for consistent Bootstrap 5 styling.

### Dashboard Pattern
Each major function has a dedicated dashboard:
- `gis_dashboard.html` - GIS export operations
- `district_lookup_dashboard.html` - Address/coordinate lookup
- `ai_analysis_dashboard.html` - AI insights and exemption analysis
- `pacs_sync_dashboard.html` - Legacy system synchronization

### API Integration
Frontend uses fetch() with error handling for real-time updates:
```javascript
// Pattern for status polling
setInterval(() => fetchJobStatus(jobId), 2000);
```

## Configuration Management

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OLLAMA_URL`: AI service endpoint
- `JWT_SECRET_KEY`: Token signing key
- `SESSION_SECRET`: Flask session encryption

### Feature Flags
System uses feature flags in SAGA dashboard for controlled rollouts.

## Testing & Quality Assurance

### Database Testing
All models include validation for required fields and data types.

### API Testing
Enterprise API includes comprehensive error handling with structured JSON responses.

### Performance Monitoring
Built-in system health monitoring with metrics collection in `terrafusion_engine.py`.

## Common Operations

### Adding New Counties
1. Insert county record in `counties` table
2. Configure county-specific district boundaries
3. Set up PACS connection parameters
4. Initialize empty property dataset

### GIS Export Development
Export services in `src/services/county_data_service.py` follow the pattern:
- Async job creation with progress tracking
- Multiple format support (Shapefile, GeoJSON, KML, CSV)
- Configurable data filtering and transformation

### Legacy System Integration
New PACS adapters follow the template pattern in `bulletproof_pacs_converter.py`:
- Field mapping dictionaries
- Validation rule sets
- Data transformation pipelines
- Quality score calculation

## Security Considerations

### Data Protection
- County data isolation through query filtering
- JWT token expiration and refresh
- SQL injection protection through SQLAlchemy ORM
- CORS configuration for cross-origin requests

### Audit Logging
All data operations logged to `audit_logs` table with user attribution and timestamp tracking.

## Performance Optimization

### Database Optimization
- Connection pooling with pre-ping validation
- Compound indexes on frequently queried combinations
- Batch processing for large dataset operations
- Query timeout protection

### Caching Strategy
- Static asset optimization
- Database query result caching where appropriate
- File-based export storage with retention policies

Remember: This is a government-grade platform requiring high reliability, comprehensive audit trails, and graceful degradation when services are unavailable.