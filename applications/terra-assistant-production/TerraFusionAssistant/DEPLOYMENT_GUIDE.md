# TerraFusionPlatform ICSF Deployment Guide

## Quick Start Commands

### Development Environment
```bash
# Start the main application
streamlit run terraflow_enhanced_refactored.py --server.port 5000

# Start the API server (in another terminal)
node server/src/index.js
```

### Production Deployment
```bash
# 1. Place SSL certificates
mkdir -p nginx/ssl
cp your_cert.pem nginx/ssl/cert.pem
cp your_key.pem nginx/ssl/key.pem

# 2. Set environment variables
cp .env.example .env
# Edit .env with your actual values

# 3. Deploy
bash scripts/deploy.sh
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
DATABASE_URL=postgresql://user:pass@host:5432/db
DEBUG=false
```

## Health Checks

After deployment, verify services:

- Main App: http://localhost:5000
- API Server: http://localhost:5001
- Nginx Proxy: http://localhost (HTTP) / https://localhost (HTTPS)

## Troubleshooting

### Port Conflicts
```bash
# Kill processes using ports
sudo lsof -ti:5000 | xargs kill -9
sudo lsof -ti:5001 | xargs kill -9
```

### Docker Issues
```bash
# View logs
docker-compose logs -f terraflow-app
docker-compose logs -f api-server

# Restart services
docker-compose restart
```

### SSL Certificate Issues
- Ensure cert.pem and key.pem are in nginx/ssl/
- Check certificate validity: `openssl x509 -in nginx/ssl/cert.pem -text -noout`

## Performance Optimization

### Database Optimization
- Index foreign keys
- Use query timeouts
- Batch updates for large operations
- Monitor query performance

### Application Optimization
- Enable connection pooling
- Configure proper cache headers
- Use statement timeouts
- Monitor memory usage

## Security Checklist

- [ ] SSL certificates properly configured
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys restricted to necessary scopes
- [ ] Firewall rules configured
- [ ] Regular security updates applied

## Monitoring

Essential monitoring endpoints:
- `/health` - Application health status
- `/metrics` - Performance metrics
- `/api/status` - API service status

## Backup Strategy

Critical data to backup:
- Database dumps
- Configuration files
- SSL certificates
- Application logs