#!/bin/bash

# TerraFusion Development Environment Setup Script
echo "TerraFusion Development Environment Setup"
echo "========================================"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
# Database Configuration
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=terrafusion
PGHOST=localhost
PGPORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/terrafusion

# Application Configuration
FLASK_APP=main.py
FLASK_ENV=development
SESSION_SECRET=development_secret_key
ENV_MODE=development
BYPASS_LDAP=true
EOF
    echo ".env file created with default values. Please update with your specific configuration."
fi

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p instance

# Check if PostgreSQL database exists and is accessible
echo "Checking database connection..."
if command -v psql &> /dev/null; then
    if psql -h localhost -U postgres -p 5432 -lqt | cut -d \| -f 1 | grep -qw terrafusion; then
        echo "Database 'terrafusion' already exists."
    else
        echo "Creating database 'terrafusion'..."
        createdb -h localhost -U postgres -p 5432 terrafusion
        
        # Create PostGIS extension
        echo "Creating PostGIS extension..."
        psql -h localhost -U postgres -p 5432 -d terrafusion -c "CREATE EXTENSION IF NOT EXISTS postgis;"
    fi
else
    echo "PostgreSQL client not found. Will rely on Docker for database setup."
fi

# Initialize Docker environment
echo "Building Docker containers..."
docker-compose -f docker-compose.dev.yml build

echo ""
echo "Setup complete! To start the application, run:"
echo "./start.sh"
echo ""
echo "For monitoring dashboards, visit:"
echo "- Grafana: http://localhost:3000 (admin/admin)"
echo "- Prometheus: http://localhost:9090"
echo ""
echo "TerraFusion will be available at: http://localhost:5000"