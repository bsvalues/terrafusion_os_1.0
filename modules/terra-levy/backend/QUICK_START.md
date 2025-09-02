# TerraLevy Backend - Quick Start Guide

## Phase 1 Deployment Ready ✅

This guide will help you quickly deploy the BCBSLevyMaster Flask backend integrated into the TerraLevy module.

## Prerequisites

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (or use Docker setup)
- Anthropic API key

## Option 1: Docker Deployment (Recommended)

### 1. Environment Setup
```bash
# Navigate to backend directory
cd backend/

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

### 2. Required Environment Variables
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5433/levy_db
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SESSION_SECRET=your_secure_session_secret_here
```

### 3. Start Services
```bash
# Start all services (Flask + PostgreSQL + Redis)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f levy-backend
```

### 4. Verify Deployment
```bash
# Health check
curl http://localhost:5001/health

# Test API
curl http://localhost:5001/api/dashboard
```

## Option 2: Local Development

### 1. Install Dependencies
```bash
cd backend/
pip install -r requirements.txt
```

### 2. Database Setup
```bash
# Start PostgreSQL (if not using Docker)
# Create database 'levy_db'

# Run migrations
python migrate.py upgrade
```

### 3. Start Application
```bash
# Development mode
python main.py

# Production mode
gunicorn --bind 0.0.0.0:5001 main:app
```

## Integration with Tauri Frontend

### 1. Start Integration Service
```bash
# In backend directory
python integration_service.py
```

### 2. Test Integration
```bash
# Start backend via integration service
curl -X POST http://localhost:5002/start-backend

# Health check
curl http://localhost:5002/health

# Proxy API call
curl http://localhost:5002/api/dashboard
```

## Service Endpoints

### Backend Service (Port 5001)
- **Health**: `GET /health`
- **Dashboard**: `GET /api/dashboard`
- **Calculator**: `GET /api/levy-calculator`
- **Forecasting**: `GET /api/forecasting`
- **Public Portal**: `GET /api/public`

### Integration Service (Port 5002)
- **Health**: `GET /health`
- **Start Backend**: `POST /start-backend`
- **Stop Backend**: `POST /stop-backend`
- **Proxy API**: `GET/POST /api/*`

### Database (Port 5433)
- **PostgreSQL**: `postgresql://postgres:password@localhost:5433/levy_db`

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's running on ports
   netstat -tulpn | grep :5001
   ```

2. **Database Connection**
   ```bash
   # Test database connection
   psql -h localhost -p 5433 -U postgres -d levy_db
   ```

3. **Docker Issues**
   ```bash
   # Rebuild containers
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Logs and Debugging

```bash
# Backend logs
docker-compose logs levy-backend

# Database logs
docker-compose logs postgres

# All services
docker-compose logs
```

## Development Workflow

### 1. Code Changes
```bash
# Restart backend service after changes
docker-compose restart levy-backend
```

### 2. Database Changes
```bash
# Create migration
python migrate.py migrate -m "Description of changes"

# Apply migration
python migrate.py upgrade
```

### 3. Testing
```bash
# Run tests (when implemented)
python -m pytest tests/

# Manual API testing
curl -X POST http://localhost:5001/api/test-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Next Steps

1. **Frontend Integration**: Connect Tauri frontend to Flask backend
2. **Template Conversion**: Convert Jinja2 templates to React components
3. **Testing**: Implement automated testing suite
4. **Production**: Deploy to production environment

## Support

- Check logs for errors
- Verify environment variables
- Ensure all services are running
- Test API endpoints individually

---

**Status**: Phase 1 Complete - Backend Ready for Integration  
**Version**: 1.0.0  
**Last Updated**: August 28, 2025