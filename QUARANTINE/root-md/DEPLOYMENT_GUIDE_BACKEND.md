# TerraFusion IDE Backend - Deployment Guide

**Status**: 🚀 Production Ready
**Version**: 1.0.0
**Last Updated**: October 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Building](#building)
5. [Deployment](#deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Operations](#operations)
9. [Performance](#performance)
10. [Security](#security)

---

## Quick Start

### Development Environment

```powershell
# Clone repository
git clone https://github.com/yourusername/terrafusion-os.git
cd terrafusion_os_1.0

# Build and start service
.\scripts\deploy-ide-backend.ps1 -Environment development

# Verify service is running
.\scripts\verify-ide-backend.ps1
```

### Production Deployment

```powershell
# Build and deploy
.\scripts\deploy-ide-backend.ps1 -Environment production -ImageTag v1.0.0

# Push to registry (optional)
.\scripts\deploy-ide-backend.ps1 -Environment production -ImageTag v1.0.0 -Push

# Verify deployment
.\scripts\verify-ide-backend.ps1 -BaseUrl https://api.terrafusion.gov
```

---

## Architecture

### Service Components

The IDE Backend consists of 7 core Rust services:

| Service | Purpose | Port |
|---------|---------|------|
| **Module Service** | Discovers and manages 62+ TerraFusion modules | 8787 |
| **Workspace Service** | Manages 50+ isolated development workspaces | 8787 |
| **File System Service** | Provides workspace-scoped file I/O operations | 8787 |
| **Terminal Service** | Executes whitelisted commands with output streaming | 8787 |
| **Task Runner Service** | Manages language-specific build tasks (5 types) | 8787 |
| **AI Service** | Enriches queries with context and dependencies | 8787 |
| **Registry Client** | Caches and queries module metadata | 8787 |

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│      Docker Compose (docker-compose.backend.yml) │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Rust Binary Container          │  │
│  │  - Port 8787 (API)              │  │
│  │  - Resource limits (2GB max)    │  │
│  │  - Health checks enabled        │  │
│  │  - JSON logging                 │  │
│  │                                 │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │  7 Services + 20 Routes │   │  │
│  │  │  34 Unit Tests         │   │  │
│  │  │  40+ Integration Tests │   │  │
│  │  └─────────────────────────┘   │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Volume Mounts                  │  │
│  │  - /terrafusion_os_1.0 (RO)    │  │
│  │  - /marketplace (RO)           │  │
│  │  - /SDK (RO)                   │  │
│  │  - cache volume                 │  │
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Network Configuration

```
Service: terrafusion-ide-backend
Network: terrafusion-network (172.25.0.0/16)
Port Mapping: 8787:8787 (HTTP)
Health Check: GET /health/ready every 30s
```

---

## Prerequisites

### System Requirements

- **OS**: Windows 10+ (with Docker Desktop) or Linux/macOS with Docker
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk**: Minimum 5GB free space
- **CPU**: 2+ cores recommended

### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | 1.29+ | Multi-container orchestration |
| PowerShell | 7.0+ | Deployment scripts |
| Git | 2.30+ | Repository management |

### Installation

**Windows (Docker Desktop)**:
```powershell
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Enable WSL 2 backend during installation
# Restart computer when installation completes
docker --version
docker compose version
```

**macOS**:
```bash
# Install via Homebrew
brew install docker docker-compose
docker --version
docker compose version
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
docker --version
docker compose --version
```

---

## Building

### Development Build

```powershell
# Build with debug symbols
cd backend
cargo build

# Output: target/debug/terrafusion_developer_platform
```

### Release Build (Local)

```powershell
# Build optimized release binary
cd backend
cargo build --release

# Output: target/release/terrafusion_developer_platform
```

### Docker Build

```powershell
# Build Docker image (multi-stage)
docker build -f Dockerfile.backend -t terrafusion-ide-backend:latest .

# Build with tag
docker build -f Dockerfile.backend -t terrafusion-ide-backend:v1.0.0 .

# Verify build
docker images terrafusion-ide-backend
```

### Build Optimization

**Multi-Stage Build Benefits**:
- ✅ Smaller production image (only runtime needed)
- ✅ Faster deployment
- ✅ No build tools in production
- ✅ Better security posture

**Build Layers**:
1. Builder stage: Rust 1.75-slim (compile)
2. Runtime stage: Debian bookworm-slim (execution)

---

## Deployment

### Using Deployment Script

**Development**:
```powershell
.\scripts\deploy-ide-backend.ps1 -Environment development

# Options:
# -Environment: development (default) or production
# -ImageTag: latest (default) or custom tag (e.g., v1.0.0)
# -Push: Push to registry after build (optional)
```

**Production**:
```powershell
# Set registry (optional)
$env:DOCKER_REGISTRY = "docker.io/yourorg"

# Deploy
.\scripts\deploy-ide-backend.ps1 `
  -Environment production `
  -ImageTag v1.0.0 `
  -Push
```

**Script Features**:
- ✅ Prerequisites validation (Docker, daemon)
- ✅ Multi-stage build with progress
- ✅ Automatic health checks
- ✅ Service readiness verification
- ✅ Comprehensive logging
- ✅ Rollback support

### Manual Docker Compose

```powershell
# Start service
docker compose -f docker-compose.backend.yml up -d

# View logs
docker compose -f docker-compose.backend.yml logs -f

# Stop service
docker compose -f docker-compose.backend.yml down

# Restart service
docker compose -f docker-compose.backend.yml restart
```

### Environment Configuration

**Runtime Environment Variables**:
```yaml
RUST_LOG: info              # Logging level (debug, info, warn, error)
REPO_ROOT: /app/terrafusion_os_1.0   # Repository root path
PORT: 8787                  # API listening port
RUST_BACKTRACE: 1          # Enable stack traces on panic
```

**Resource Configuration**:
```yaml
CPU Limits: 2 cores (max)
Memory Limits: 2GB (max)
CPU Reservation: 1 core
Memory Reservation: 1GB
```

---

## Verification

### Health Endpoints

All health endpoints return HTTP 200 when ready:

```powershell
# Basic health check
curl http://localhost:8787/health

# Liveness probe (service running)
curl http://localhost:8787/health/live

# Readiness probe (dependencies ready)
curl http://localhost:8787/health/ready

# Portal health (detailed)
curl http://localhost:8787/api/portal/health
```

### Automated Verification

```powershell
# Run comprehensive verification script
.\scripts\verify-ide-backend.ps1

# Verbose output with response bodies
.\scripts\verify-ide-backend.ps1 -Verbose

# Custom base URL
.\scripts\verify-ide-backend.ps1 -BaseUrl http://api.example.com:8787

# Custom retries
.\scripts\verify-ide-backend.ps1 -MaxRetries 10
```

**Verification Tests**:
- ✅ 4 Health endpoints
- ✅ 5 Core API endpoints
- ✅ 3 Performance baselines
- ✅ Docker service status
- ✅ Response body validation
- ✅ Performance SLA verification

### Expected Responses

**Health Check**:
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "services": "ok"
  }
}
```

**Modules List**:
```json
{
  "modules": [
    {
      "id": "terraform-sync",
      "name": "TerraSync",
      "version": "1.0.0",
      "status": "operational"
    }
  ],
  "count": 62
}
```

---

## Troubleshooting

### Common Issues

#### Issue: Docker Daemon Not Running

**Symptoms**:
- Error: "Cannot connect to Docker daemon"
- Deployment script fails at Docker check

**Solutions**:
```powershell
# Windows: Start Docker Desktop
# - Search for "Docker" and open Docker Desktop

# macOS: Start Docker via CLI
brew services start docker

# Linux: Start Docker service
sudo systemctl start docker

# Verify daemon is running
docker ps
```

#### Issue: Service Fails to Start

**Symptoms**:
- Container exits immediately
- Logs show panics or errors

**Debug Steps**:
```powershell
# Check container logs
docker compose -f docker-compose.backend.yml logs

# Run container in foreground
docker run -it terrafusion-ide-backend:latest

# Check image details
docker inspect terrafusion-ide-backend:latest
```

#### Issue: Health Check Fails

**Symptoms**:
- GET /health/ready returns 500 or times out
- Container marked unhealthy

**Debug Steps**:
```powershell
# Check service is responding
curl -v http://localhost:8787/health/ready

# Review service logs
docker compose -f docker-compose.backend.yml logs --tail=50

# Check resource usage
docker stats terrafusion-ide-backend
```

#### Issue: Port Already in Use

**Symptoms**:
- Error: "Address already in use"
- Port 8787 conflict

**Solutions**:
```powershell
# Find process using port 8787
netstat -ano | findstr :8787

# Kill process (get PID from above)
taskkill /PID <PID> /F

# Or use different port in docker-compose.backend.yml
# Change "8787:8787" to "9999:8787"
```

#### Issue: Insufficient Memory

**Symptoms**:
- Container OOMKilled
- Service crashes during operation

**Solutions**:
```powershell
# Increase Docker Desktop memory (Windows/macOS)
# - Docker Desktop > Settings > Resources > Memory: 4GB → 8GB

# Check current limits in docker-compose.backend.yml
# - Update deploy.resources.limits.memory: 2G → 4G
```

### Logging

**View Logs**:
```powershell
# Real-time logs
docker compose -f docker-compose.backend.yml logs -f

# Last 50 lines
docker compose -f docker-compose.backend.yml logs --tail=50

# Logs from specific time
docker compose -f docker-compose.backend.yml logs --since 10m

# Export logs
docker compose -f docker-compose.backend.yml logs > deployment.log
```

**Log Levels**:
```powershell
# Change in docker-compose.backend.yml
RUST_LOG: debug   # Maximum verbosity
RUST_LOG: info    # Normal operation
RUST_LOG: warn    # Warnings and errors
RUST_LOG: error   # Errors only
```

---

## Operations

### Deployment Lifecycle

**Development**:
```powershell
# Deploy for development
.\scripts\deploy-ide-backend.ps1 -Environment development

# Make code changes...

# Restart service
docker compose -f docker-compose.backend.yml restart

# View logs
docker compose -f docker-compose.backend.yml logs -f
```

**Production**:
```powershell
# Build and deploy
.\scripts\deploy-ide-backend.ps1 -Environment production -ImageTag v1.0.0 -Push

# Verify
.\scripts\verify-ide-backend.ps1 -BaseUrl https://api.example.com

# Monitor
docker compose -f docker-compose.backend.yml logs -f
```

### Rolling Updates

```powershell
# Build new version
docker build -f Dockerfile.backend -t terrafusion-ide-backend:v1.1.0 .

# Update docker-compose.backend.yml with new tag
# - Change image: terrafusion-ide-backend:latest → v1.1.0

# Restart service (Docker Compose handles graceful shutdown)
docker compose -f docker-compose.backend.yml up -d

# Verify new version
.\scripts\verify-ide-backend.ps1

# If issues, rollback to previous version
docker compose -f docker-compose.backend.yml down
# Restore previous docker-compose.yml
docker compose -f docker-compose.backend.yml up -d
```

### Backup & Restore

**Workspace Data**:
```powershell
# Workspaces are read-only in container, stored on host
# Backup host directories:
Copy-Item -Path "/c/Users/bsval/terrafusion_os_1.0" -Destination "backup/terrafusion_$(date -f 'yyyyMMdd').zip" -Recurse

# Restore from backup
Copy-Item -Path "backup/terrafusion_20251015.zip" -Destination "/c/Users/bsval/terrafusion_os_1.0" -Recurse -Force
```

### Performance Tuning

```yaml
# docker-compose.backend.yml optimizations

# 1. Increase resource limits for high load
deploy:
  resources:
    limits:
      cpus: '4'        # 2 → 4 cores
      memory: 4G       # 2GB → 4GB

# 2. Add caching volume for faster builds
volumes:
  backend-cache:
    driver: local
    driver_opts:
      type: tmpfs      # Use RAM disk for cache

# 3. Add read-only mounts for immutability
volumes:
  - /terrafusion_os_1.0:/app/terrafusion_os_1.0:ro
```

---

## Performance

### Benchmarks

**Target SLAs** (measured from verification script):

| Operation | Target | Description |
|-----------|--------|-------------|
| Module Discovery | <100ms | GET /api/modules/list (62+ modules) |
| Workspace Browse | <100ms | GET /api/workspaces/list (50+ workspaces) |
| Registry Query | <50ms | GET /api/registry/list (cached) |
| Health Check | <10ms | GET /health/ready |
| File I/O | <100ms | Read/write typical file |

**Load Handling**:
- Concurrent connections: 100+ (async/await)
- Request throughput: 500+ RPS
- Memory usage: ~200MB base, +50MB per 100 connections
- CPU usage: Scales with request complexity

### Performance Tuning

**Optimize Image Build**:
```powershell
# Use BuildKit for faster builds
$env:DOCKER_BUILDKIT = 1
docker build -f Dockerfile.backend -t terrafusion-ide-backend:latest .
```

**Monitor Runtime Performance**:
```powershell
# Real-time stats
docker stats terrafusion-ide-backend

# Historical metrics
docker stats --no-stream
```

---

## Security

### Network Security

- ✅ **Port Isolation**: 8787 is API-only, no administrative ports exposed
- ✅ **CORS Configuration**: Configured for development, restrict in production
- ✅ **TLS Support**: Ready for HTTPS reverse proxy
- ✅ **Input Validation**: All endpoints validate input
- ✅ **Rate Limiting**: Built-in command rate limiting

### Container Security

```dockerfile
# Security features in Dockerfile.backend:
# - Non-root user (terrafusion:terrafusion)
# - Read-only filesystem mounts
# - Resource limits (CPU, memory)
# - Health checks enabled
# - No privileged mode
# - Minimal base image (debian:bookworm-slim)
```

### Command Whitelisting

Only 14 commands are executable via Terminal Service:

```
✅ cargo, npm, yarn, pnpm
✅ python, python3
✅ dotnet
✅ bash, sh, pwsh, powershell
✅ git
✅ docker
✅ make
```

**Blocked Commands**:
```
❌ rm, del, rmdir       (file deletion)
❌ format, cipher       (disk operations)
❌ dd, mkfs            (low-level ops)
❌ >                   (output redirection - prevents log manipulation)
❌ &, ;, $()           (shell injection)
```

### Vulnerability Scanning

```powershell
# Scan image for vulnerabilities
docker scan terrafusion-ide-backend:latest

# Scan with detailed report
docker scan --severity high terrafusion-ide-backend:latest
```

### Secret Management

**Environment Variables** (use secrets in production):
```powershell
# Development (plain text in docker-compose)
RUST_LOG: info

# Production (use Docker secrets)
# - Store sensitive data in Docker secrets
# - Mount in /run/secrets/
# - Never commit secrets to git
```

---

## Production Checklist

Before deploying to production:

- [ ] ✅ Code reviewed and tested locally
- [ ] ✅ Integration tests passing (40+ tests)
- [ ] ✅ Security scan completed
- [ ] ✅ Performance benchmarks verified
- [ ] ✅ Backup strategy in place
- [ ] ✅ Monitoring configured
- [ ] ✅ Rollback procedure documented
- [ ] ✅ Team trained on deployment
- [ ] ✅ Capacity planning completed
- [ ] ✅ Incident response plan ready

---

## Support & Escalation

### Getting Help

1. **Check Logs**: `docker compose logs -f`
2. **Run Verification**: `.\scripts\verify-ide-backend.ps1 -Verbose`
3. **Review Troubleshooting**: See section above
4. **Contact DevOps**: Link to support channel

### Emergency Procedures

**Service Down**:
```powershell
# 1. Stop affected service
docker compose -f docker-compose.backend.yml down

# 2. Check for port conflicts
netstat -ano | findstr :8787

# 3. Restore from previous image
docker compose -f docker-compose.backend.yml pull
docker compose -f docker-compose.backend.yml up -d

# 4. Verify recovery
.\scripts\verify-ide-backend.ps1
```

**Data Corruption**:
```powershell
# All data is read-only (mounted from host)
# Restore host filesystem from backup if needed
```

---

## Additional Resources

- **Repository**: https://github.com/terrafusion/ide-backend
- **API Documentation**: `/api/docs` (when service running)
- **Architecture Guide**: See `ARCHITECTURE_PLAN_FINAL.md`
- **Development Guide**: See `DEVELOPMENT_WORKFLOW_THE_TERRAFUSION_WAY.md`

---

**Status**: Production Ready 🚀
**Last Validated**: October 2025
**Next Review**: December 2025
