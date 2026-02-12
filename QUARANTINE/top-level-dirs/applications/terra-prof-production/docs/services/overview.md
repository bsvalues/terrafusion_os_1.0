# TerraFusionPro Services Overview

This document provides an overview of each microservice in the TerraFusionPro platform.

## User Service

**Purpose**: Manages user accounts, authentication, and authorization.

**Key Responsibilities**:
- User registration and login
- JWT token issuance and verification
- Password management
- Role-based access control
- User profile management

**Endpoints**:
- `/auth/login`: Authenticate user and issue token
- `/auth/register`: Register new user
- `/auth/verify`: Verify token validity
- `/users`: CRUD operations for user accounts
- `/users/:id/change-password`: Change user password

**Database Tables**:
- `users`: Store user information

**Dependencies**:
- PostgreSQL database
- Shared schema and storage modules

## Property Service

**Purpose**: Manages real estate property data.

**Key Responsibilities**:
- Property record creation and management
- Property image storage and retrieval
- Property search and filtering
- Property statistics and reporting

**Endpoints**:
- `/properties`: CRUD operations for properties
- `/properties/:id/images`: Manage property images
- `/statistics`: Get property statistics

**Database Tables**:
- `properties`: Store property information
- `property_images`: Store property image metadata

**Dependencies**:
- PostgreSQL database
- Shared schema and storage modules
- (Optional) Image storage service for property photos

## Form Service

**Purpose**: Manages dynamic forms for property data collection.

**Key Responsibilities**:
- Form template definition and management
- Form data validation
- Form submission processing
- Form version control

**Endpoints**:
- `/forms`: CRUD operations for form templates
- `/submissions`: Create and retrieve form submissions
- `/validate`: Validate form data against schema

**Database Tables**:
- `forms`: Store form definitions and schemas
- `form_submissions`: Store completed form data

**Dependencies**:
- PostgreSQL database
- Shared schema and storage modules
- JSON Schema for validation

## Analysis Service

**Purpose**: Provides property valuation and market analysis.

**Key Responsibilities**:
- Comparable property selection and ranking
- Property value estimation
- Market trend analysis
- Adjustment calculations

**Endpoints**:
- `/comparables`: CRUD operations for comparable properties
- `/market/data`: Get market statistics
- `/market/analyze`: Generate market analysis
- `/valuation/find-comps`: Find comparable properties
- `/valuation/calculate-adjustments`: Calculate value adjustments
- `/valuation/validate-data`: Validate property data
- `/valuation/quality-check`: Perform quality control

**Database Tables**:
- `comparables`: Store comparable property information
- `market_data`: Store market statistics and trends

**Dependencies**:
- PostgreSQL database
- Shared schema and storage modules
- AI Agents for advanced analysis

## Report Service

**Purpose**: Manages appraisal report generation and lifecycle.

**Key Responsibilities**:
- Report creation and management
- Report workflow (draft, review, approval)
- PDF generation
- Quality control reviews

**Endpoints**:
- `/reports`: CRUD operations for appraisal reports
- `/pdf/generate`: Generate PDF report
- `/qc/check`: Run quality control check

**Database Tables**:
- `appraisal_reports`: Store report information and status

**Dependencies**:
- PostgreSQL database
- Shared schema and storage modules
- PDF generation library
- AI Agents for QC checks

## API Gateway

**Purpose**: Provides a unified entry point for all client requests.

**Key Responsibilities**:
- Request routing to appropriate services
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Logging and monitoring

**Endpoints**:
- Proxies all service endpoints under `/api` prefix
- `/api/health`: Health check endpoint

**Dependencies**:
- User Service for authentication
- All other microservices for request routing

## Web Client

**Purpose**: Serves the web application for users.

**Key Responsibilities**:
- Serve static HTML, CSS, JS
- Client-side routing
- User interface for all platform features

**Endpoints**:
- `/`: Main application
- `/login`: User login page
- `/health`: Health check endpoint

**Dependencies**:
- API Gateway for backend requests

## AI Agents

### Data Validator

**Purpose**: Ensures data quality and consistency.

**Key Responsibilities**:
- Validate required fields
- Check data format and constraints
- Suggest improvements
- Calculate completion scores

### Comparable Selector

**Purpose**: Find and rank comparable properties for valuation.

**Key Responsibilities**:
- Calculate similarity scores
- Apply adjustments
- Recommend property value
- Rank comparable properties

### QC Reviewer

**Purpose**: Performs quality control on appraisal reports.

**Key Responsibilities**:
- Check report completeness
- Verify calculations
- Ensure compliance with standards
- Identify issues

### Market Analyzer

**Purpose**: Analyzes real estate market conditions.

**Key Responsibilities**:
- Calculate market metrics
- Identify trends
- Assess overall market conditions
- Generate market summaries

## Service Communication

### Request Flow Examples

#### Creating a New Property:

1. Client sends property data to `/api/properties` (API Gateway)
2. API Gateway validates token and routes to Property Service
3. Property Service validates and stores data
4. Property Service returns new property to API Gateway
5. API Gateway returns response to client

#### Generating a Report:

1. Client requests report at `/api/reports` (API Gateway)
2. API Gateway validates token and routes to Report Service
3. Report Service creates report record and calls Form Service to get required forms
4. Report Service calls Analysis Service to find comparable properties
5. Analysis Service uses Comparable Selector agent to find and rank comps
6. Report Service receives comps and calls QC Reviewer agent to check report
7. Report Service generates PDF and returns URL to API Gateway
8. API Gateway returns response to client

## Service Scalability

Each service can be scaled independently based on load:

- **User Service**: Generally low resource requirements
- **Property Service**: Can be scaled for high image storage/retrieval
- **Form Service**: Moderate scaling for peak submission periods
- **Analysis Service**: CPU-intensive, requires higher scaling for computational tasks
- **Report Service**: Moderate scaling with occasional spikes for PDF generation
- **API Gateway**: Scales with overall system traffic

## Service Resilience

Services implement resilience patterns:

- **Circuit Breaker**: Prevents cascading failures
- **Retry with Backoff**: Handles temporary service unavailability
- **Timeouts**: Limits waiting time for downstream services
- **Fallbacks**: Provides degraded functionality when dependencies fail

## Monitoring and Health Checks

Each service provides:

- `/health` endpoint for basic liveness checking
- Structured logging for error tracking
- Metrics for performance monitoring