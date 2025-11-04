# Terrafusion AI - Civil Infrastructure Brain

A hybrid AI-powered platform combining Tesla's precision automation, Jobs' elegant simplicity, Musk's autonomous scale, and tactical execution excellence for property assessment and Computer-Assisted Mass Appraisal (CAMA) systems.

## Architecture Overview

### Core Components
- **AI SQL Agent**: Natural language to SQL query translation
- **Property Assessment Engine**: Advanced levy calculations and valuations  
- **Neighborhood Analytics**: Market trend analysis and comparisons
- **Debate Format AI**: Dual-perspective analysis system
- **Real-time Monitoring**: Prometheus metrics and logging

### Technology Stack
- **Backend**: Flask + SQLAlchemy + PostgreSQL
- **AI/ML**: OpenAI GPT-4o + LangChain + RAG
- **Infrastructure**: Docker + Nginx + SSL
- **Monitoring**: Prometheus + Structured Logging

## Quick Start

### Prerequisites
- Docker & Docker Compose
- SSL certificates (cert.pem & key.pem)
- OpenAI API key

### Deployment
1. Place SSL certificates in `nginx/ssl/` as `cert.pem` and `key.pem`
2. Run: `bash scripts/deploy.sh`
3. Access: `https://localhost`

## API Endpoints

### Core Queries
- `POST /api/query` - Natural language property queries
- `GET /dashboard` - System analytics dashboard
- `GET /api/system_status` - Service health check

### Query Types
- `general` - SQL database queries
- `levy` - Tax calculation analysis
- `trends` - Neighborhood market analysis
- `debate` - Dual-perspective format
- `rag` - Document retrieval queries

## Database Schema

### Primary Tables
- `properties` - Parcel data and characteristics
- `assessments` - Valuation and tax information
- `sales` - Transaction history
- `neighborhoods` - Area statistics
- `documents` - RAG knowledge base
- `query_logs` - Analytics and monitoring

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=your_session_secret
```

## Monitoring

### Metrics Endpoint
- Prometheus metrics: `https://localhost/metrics`
- Query counters, response times, error rates

### Logging
- Structured JSON logging
- Request/response tracking
- Error monitoring and alerting

## Security Features

- SSL/TLS encryption
- Environment-based secrets
- Database connection pooling
- Input validation and sanitization
- Session management

## Performance Optimizations

- Database indexing on key fields
- Connection pooling with pre-ping
- Gunicorn multi-worker deployment
- Nginx reverse proxy with caching
- Query response time monitoring

## Maintenance

### Backup Strategy
- PostgreSQL automated backups
- Configuration versioning
- Log rotation and archival

### Scaling Considerations
- Horizontal scaling via Docker Swarm
- Load balancing with Nginx
- Database read replicas
- Redis caching layer

## Support

For technical support or feature requests:
- Review logs: `docker-compose logs -f [service]`
- Check metrics: `https://localhost/metrics`
- Verify environment variables
- Validate SSL certificates