# GeoAssessmentPro

A comprehensive Geographic Information System (GIS) and property assessment platform for the Benton County Assessor's Office, featuring advanced data quality management, validation capabilities, and integration with Supabase.

## Overview

GeoAssessmentPro provides a sophisticated platform for managing Geographic Information System (GIS) data with enhanced data quality monitoring, valuation capabilities, and Supabase integration. The application supports multiple environments (development, training, production) and serves as a central hub that coordinates with specialized modules for property assessment tasks.

## Features

- Python-based backend with Flask
- PostgreSQL GIS database integration
- Advanced data quality monitoring
- Machine learning property assessment
- Interactive data visualization
- Comprehensive regional property knowledge base
- Secure authentication (LDAP and Supabase)
- API for third-party applications and microservices

## Setting Up Supabase Integration

### Prerequisites

1. Create a Supabase account at [https://supabase.io](https://supabase.io)
2. Create a new Supabase project
3. Get your Supabase URL and API key from the project settings

### Configuration

Set the following environment variables:

```bash
# Supabase configuration
export SUPABASE_URL=https://your-project-id.supabase.co
export SUPABASE_KEY=your-supabase-api-key

# Enable Supabase integration
export USE_SUPABASE=true
```

### Database Setup

The system will automatically create tables in Supabase based on the SQLAlchemy models. Additionally, ensure your Supabase project has the PostgreSQL extensions enabled for spatial data:

1. Go to your Supabase project dashboard
2. Select "Database" from the sidebar
3. Click on "Extensions"
4. Enable the following extensions:
   - `postgis`
   - `uuid-ossp`
   - `pg_stat_statements`

### Authentication Setup

To use Supabase for authentication:

1. Go to your Supabase project dashboard
2. Select "Authentication" from the sidebar
3. Configure the desired sign-in methods (email, OAuth providers, etc.)
4. Set the proper redirect URLs in the Authentication settings

For local development, set the redirect URL to `http://localhost:5000/auth/callback`.

## API Integration

The system provides a comprehensive API for third-party applications and microservices to interact with the Benton County GIS system. See the [API Documentation](api/README.md) for details.

## Connection Management

For microservices and third-party applications that need database access, the system provides a connection management facility to ensure proper connection pooling, load balancing, and security. See the [API Documentation](api/README.md) for details on integrating with this system.

## Storage Integration

The system supports both local file storage and Supabase Storage. When Supabase integration is enabled, all files will be stored in Supabase Storage buckets, providing:

- Automatic backup
- Enhanced security
- CDN delivery
- Easy access control

## Multi-Environment Support

GeoAssessmentPro supports multiple environments for development, training, and production deployments. Each environment can have its own database, Supabase project, and configuration settings.

### Environment Setup

To set up a new environment:

```bash
# Initialize a development environment (default)
python initialize_environment.py development

# Initialize a training environment
python initialize_environment.py training --database-url postgresql://user:pass@host:port/training_db

# Initialize a production environment
python initialize_environment.py production --database-url postgresql://user:pass@host:port/production_db
```

You can also provide Supabase configuration for each environment:

```bash
python initialize_environment.py training \
  --database-url postgresql://user:pass@host:port/training_db \
  --supabase-url https://your-training-project.supabase.co \
  --supabase-key your_supabase_key \
  --supabase-service-key your_supabase_service_key
```

### Switching Environments

To switch between environments:

```bash
# Switch to development environment
python switch_environment.py development

# Switch to training environment
python switch_environment.py training

# Switch to production environment
python switch_environment.py production
```

### Deployment Process

For deploying to different environments:

```bash
# Deploy to development (runs migrations and restarts the application)
python deploy.py development

# Deploy to training
python deploy.py training

# Deploy to production
python deploy.py production --skip-migrations
```

You can customize the deployment process with flags:

```bash
# Skip database migrations
python deploy.py production --skip-migrations

# Skip restarting the application
python deploy.py training --skip-restart

# Skip deployment verification
python deploy.py training --skip-verify
```

## Development

### Prerequisites

- Python 3.9+
- Flask
- PostgreSQL with PostGIS extensions
- SQLAlchemy
- Supabase Python client (for Supabase integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/benton-county/geoassessmentpro.git
cd geoassessmentpro

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.template .env
# Edit .env with your configuration

# Initialize development environment
python initialize_environment.py development

# Start the application
gunicorn --bind 0.0.0.0:5000 --reload main:app
```

### Running Tests

```bash
# Run the test suite
pytest

# Run tests with coverage report
pytest --cov=app tests/
```

## Deployment

For production deployment, we recommend using Gunicorn:

```bash
# Initialize production environment
python initialize_environment.py production

# Deploy to production
python deploy.py production

# Start the server manually if needed
gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 main:app
```

## License

Copyright © 2025 Benton County. All rights reserved.