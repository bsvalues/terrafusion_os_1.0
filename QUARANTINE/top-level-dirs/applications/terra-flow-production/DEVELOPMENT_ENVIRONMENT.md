# Terrafusion Development Environment Setup

This document provides instructions for setting up a development environment for the Terrafusion platform.

## Prerequisites

- Docker and Docker Compose
- Python 3.11 or higher
- Git
- PostgreSQL client (optional, for direct database access)

## Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/terrafusion.git
cd terrafusion
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=terrafusion
PGHOST=localhost
PGPORT=5432
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/terrafusion

# Application Configuration
FLASK_APP=main.py
FLASK_ENV=development
SESSION_SECRET=development_secret_key
ENV_MODE=development
BYPASS_LDAP=true

# Optional Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. Docker Development Environment

The project includes a development Docker Compose configuration that sets up all necessary services:

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

This will start:
- PostgreSQL with PostGIS extensions
- Redis for caching
- Prometheus for metrics collection
- Grafana for monitoring dashboards
- The Terrafusion application

### 4. Local Setup (Alternative to Docker)

If you prefer to run the application directly on your machine:

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up the PostgreSQL database:
   ```bash
   # Create the database
   createdb terrafusion

   # Install PostGIS extension
   psql -d terrafusion -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

4. Run the application:
   ```bash
   flask run
   ```

### 5. Database Migrations

Apply database migrations:

```bash
# Inside Docker
docker-compose -f docker-compose.dev.yml exec web flask db upgrade

# Local setup
flask db upgrade
```

## Accessing Services

- **Terrafusion Application**: http://localhost:5000
- **Grafana Dashboards**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

## Monitoring Dashboards

The development environment includes pre-configured Grafana dashboards:

1. **System Overview**: General application metrics
2. **Database Metrics**: PostgreSQL performance and queries
3. **Agent System**: AI agent health and performance

## Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_file.py

# Run with coverage
pytest --cov=.
```

## Deployment Package Creation

To create a deployment package:

```bash
./create_deployment_package.sh
```

This will create a `deployment_package` directory with all necessary files for deployment.

## Common Issues and Solutions

### Agent System Errors

If you see errors related to AI agents working outside of application context:

```
Error: Working outside of application context
```

This is normal in development mode when running without the full application context. These errors do not affect the core functionality of the application.

### PostgreSQL Connection Issues

If you cannot connect to PostgreSQL:

1. Verify the database is running: `docker-compose -f docker-compose.dev.yml ps`
2. Check connection details in `.env` file
3. Try connecting manually: `psql -U postgres -h localhost -p 5432 -d terrafusion`

### Redis Connection Issues

If Redis connection fails:

1. Verify Redis is running: `docker-compose -f docker-compose.dev.yml ps`
2. Check Redis logs: `docker-compose -f docker-compose.dev.yml logs redis`

## Documentation Resources

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)