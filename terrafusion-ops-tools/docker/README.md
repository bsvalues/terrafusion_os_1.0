# Terrafusion Docker Configuration

This directory contains Docker Compose configurations for running Terrafusion in
different environments.

## Quick Start

### Development Environment

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Start all services:

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

3. Access the application:
   - Frontend: http://localhost:\${{TF_DESKTOP_PORT:-3003}}
   - Backend API: http://localhost:\${{TF_DESKTOP_PORT:-3003}}/docs
   - AI Engine: http://localhost:\${{TF_DESKTOP_PORT:-3003}}/docs
   - Database Admin: http://localhost:\${{TF_DESKTOP_PORT:-3003}}
   - Mail Testing: http://localhost:\${{TF_DESKTOP_PORT:-3003}}

### Production Environment

1. Configure environment:

   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. Build and start services:

   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. Initialize database:
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

## Services

### Core Services

- **db**: PostgreSQL 16 database
- **redis**: Redis 7 cache and message broker
- **backend**: FastAPI backend service
- **ai-engine**: AI cost calculation engine
- **frontend**: React frontend application

### Supporting Services

- **worker**: Celery worker for async tasks
- **scheduler**: Celery beat for periodic tasks
- **prometheus**: Metrics collection
- **grafana**: Metrics visualization
- **backup**: Automated backup service

### Development Tools

- **adminer**: Database management UI
- **mailhog**: Email testing service

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]

# Scale workers
docker-compose up -d --scale worker=3
```

### Database Operations

```bash
# Access PostgreSQL
docker-compose exec db psql -U terrafusion_user -d terrafusion_production

# Backup database
docker-compose exec backup /scripts/db_backup.sh

# Restore database
docker-compose exec backup /scripts/db_restore.sh /backups/daily/backup.sql.gz
```

### Development

```bash
# Run backend tests
docker-compose exec backend pytest

# Run frontend tests
docker-compose exec frontend npm test

# Access backend shell
docker-compose exec backend python manage.py shell

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `DB_PASSWORD`: PostgreSQL password
- `REDIS_PASSWORD`: Redis password
- `SECRET_KEY`: Application secret key
- `CORS_ORIGINS`: Allowed CORS origins
- `AWS_ACCESS_KEY_ID`: AWS credentials for backups
- `GRAFANA_PASSWORD`: Grafana admin password

## Profiles

Use Docker Compose profiles to control which services start:

```bash
# Start only core services (default)
docker-compose up -d

# Start with monitoring
docker-compose --profile monitoring up -d

# Start everything including workers
docker-compose --profile full up -d
```

## Volumes

Persistent data is stored in Docker volumes:

- `postgres_data`: Database files
- `redis_data`: Redis persistence
- `prometheus_data`: Metrics history
- `grafana_data`: Dashboard configurations

Local directories:

- `./logs`: Application logs
- `./uploads`: User uploaded files
- `./backups`: Database backups
- `./models`: AI model files

## Networking

All services communicate on the `terrafusion-network` bridge network with the
subnet `172.20.0.0/16`.

Services can reference each other by name (e.g., `http://backend:8080`).

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs [service_name]

# Check service status
docker-compose ps

# Rebuild service
docker-compose build --no-cache [service_name]
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose exec db pg_isready

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend python -c "from app.database import engine; print('Connected!')"
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase memory limits in docker-compose.yml
# Adjust worker concurrency
# Scale services horizontally
```

## Security Notes

1. **Change all default passwords** in production
2. Use **Docker secrets** for sensitive data
3. Enable **firewall rules** to restrict ports
4. Use **SSL/TLS** for external access
5. Regularly **update base images**
6. Enable **security scanning** in CI/CD

## Backup and Recovery

Automated backups run daily via the backup service. Manual backup:

```bash
# Backup all data
./scripts/backup-all.sh

# Restore from backup
./scripts/restore-all.sh [backup_date]
```

## Monitoring

Access monitoring dashboards:

- Prometheus: http://localhost:\${{TF_DESKTOP_PORT:-3003}}
- Grafana: http://localhost:\${{TF_DESKTOP_PORT:-3003}} (admin/configured_password)

Pre-configured dashboards:

- System Overview
- Application Metrics
- Database Performance
- Redis Statistics

## Updating

To update services:

1. Pull latest changes
2. Review changelog
3. Backup data
4. Update images:
   ```bash
   docker-compose pull
   docker-compose build
   ```
5. Apply migrations
6. Restart services:
   ```bash
   docker-compose up -d
   ```

## Support

For issues:

1. Check service logs
2. Review documentation
3. Contact DevOps team
4. Create issue ticket
