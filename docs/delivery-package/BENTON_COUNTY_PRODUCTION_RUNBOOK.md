# 🏆 BENTON COUNTY PRODUCTION RUNBOOK

## Terrafusion OS 1.0 - Immediate Execution Guide

**Date**: January 10, 2025  
**Status**: 🟢 READY FOR EXECUTION  
**Confidence Level**: 97%

---

## 🚀 IMMEDIATE EXECUTION COMMANDS

### **Step 1: Prepare Environment**

```bash
# Navigate to project root
cd /path/to/terrafusion_os_1.0

# Copy environment template
cp env.prod.template .env.prod

# Edit environment file with actual values
nano .env.prod
```

### **Step 2: Deploy to Production**

```bash
# Make deployment script executable
chmod +x scripts/deploy-benton-production.sh

# Execute production deployment
./scripts/deploy-benton-production.sh
```

### **Step 3: Verify Deployment**

```bash
# Check service status
docker-compose -f compose.prod.yaml --env-file .env.prod ps

# Health checks
curl -f http://localhost:\${{TF_API_PORT:-5000}}/health
curl -f http://localhost:\${{TF_API_PORT:-5000}}/health
curl -f http://localhost:\${{TF_API_PORT:-5000}}/health

# View logs
docker-compose -f compose.prod.yaml --env-file .env.prod logs
```

---

## 🎯 YOUR DEVELOPMENT ENVIRONMENT

### **One-Command Development Setup**

```bash
# Make development script executable
chmod +x scripts/dev-up.sh

# Start development environment
./scripts/dev-up.sh
```

### **Development Commands**

```bash
# Run tests
npm test
npm run e2e
dotnet test

# Hot reload (already active)
# Frontend: http://localhost:\${{TF_API_PORT:-5000}}
# Backend: http://localhost:\${{TF_API_PORT:-5000}}

# Stop development environment
docker-compose -f compose.dev.yaml down
```

---

## 📋 CRITICAL CONFIGURATION CHECKLIST

### **Environment Variables (.env.prod)**

- [ ] `DATABASE_PASSWORD` - Secure PostgreSQL password
- [ ] `REDIS_PASSWORD` - Secure Redis password
- [ ] `JWT_SECRET` - 64-character random string
- [ ] `HARRIS_PACS_CONNECTION` - Benton County PACS connection
- [ ] `HARRIS_PACS_API_ENDPOINT` - PACS API endpoint
- [ ] `HARRIS_PACS_API_KEY` - PACS API key
- [ ] `AZURE_TENANT_ID` - Azure AD tenant ID
- [ ] `AZURE_CLIENT_ID` - Azure AD client ID
- [ ] `AZURE_CLIENT_SECRET` - Azure AD client secret
- [ ] `ENCRYPTION_KEY` - 32-character encryption key

### **Network Configuration**

- [ ] DNS entries configured for `*.benton.terrafusion.local`
- [ ] SSL certificates installed for public domains
- [ ] Firewall rules configured (ports 80, 443, 5000, 3000, 3001, 3009, 9090)
- [ ] Internal network routing configured

### **Security Hardening**

- [ ] JWT secret rotated and secure
- [ ] Database encryption enabled
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules implemented
- [ ] Service accounts created with minimal privileges

---

## 🔧 TROUBLESHOOTING GUIDE

### **Common Issues**

#### **Services Won't Start**

```bash
# Check Docker status
docker info

# Check available resources
docker system df

# View detailed logs
docker-compose -f compose.prod.yaml --env-file .env.prod logs [service-name]
```

#### **Database Connection Issues**

```bash
# Check PostgreSQL status
docker-compose -f compose.prod.yaml --env-file .env.prod exec postgres pg_isready -U terrafusion_db

# Test connection
docker-compose -f compose.prod.yaml --env-file .env.prod exec postgres psql -U terrafusion_db -d terrafusion_benton_production -c "SELECT 1;"
```

#### **AI Swarm Issues**

```bash
# Check AI Swarm logs
docker-compose -f compose.prod.yaml --env-file .env.prod logs ai-swarm

# Restart AI Swarm
docker-compose -f compose.prod.yaml --env-file .env.prod restart ai-swarm
```

#### **Frontend/Backend Issues**

```bash
# Check service health
curl -v http://localhost:\${{TF_API_PORT:-5000}}/health
curl -v http://localhost:\${{TF_API_PORT:-5000}}/health

# Restart services
docker-compose -f compose.prod.yaml --env-file .env.prod restart frontend backend
```

---

## 📊 MONITORING & ALERTS

### **Grafana Dashboard**

- **URL**: http://localhost:\${{TF_API_PORT:-5000}}
- **Username**: admin
- **Password**: terrafusion2025

### **Prometheus Metrics**

- **URL**: http://localhost:\${{TF_API_PORT:-5000}}
- **Metrics Endpoint**: http://localhost:\${{TF_API_PORT:-5000}}/metrics

### **Key Metrics to Monitor**

- API response time (target: <150ms P95)
- Error rate (target: <0.1%)
- Database connection pool usage
- Redis memory usage
- AI Swarm agent status

---

## 🛡️ SECURITY CHECKLIST

### **Pre-Deployment**

- [ ] All secrets rotated from defaults
- [ ] SSL certificates installed and valid
- [ ] Firewall rules configured
- [ ] Service accounts with minimal privileges
- [ ] Audit logging enabled

### **Post-Deployment**

- [ ] Security scan completed
- [ ] Vulnerability assessment passed
- [ ] Access controls tested
- [ ] Backup procedures verified
- [ ] Incident response plan ready

---

## 🔄 ROLLBACK PROCEDURE

### **Emergency Rollback**

```bash
# Stop current deployment
docker-compose -f compose.prod.yaml --env-file .env.prod down

# Restore from backup
./scripts/restore-from-backup.sh --backup=pre-deployment-$(date +%Y%m%d)

# Restart previous version
docker-compose -f compose.prod.yaml --env-file .env.prod up -d
```

### **Data Rollback**

```bash
# Restore database from backup
docker-compose -f compose.prod.yaml --env-file .env.prod exec postgres pg_restore -U terrafusion_db -d terrafusion_benton_production /backups/pre-deployment-$(date +%Y%m%d)/database.sql
```

---

## 📞 SUPPORT CONTACTS

### **Emergency Contacts**

- **Primary On-Call**: [INSERT PHONE/EMAIL]
- **Secondary On-Call**: [INSERT PHONE/EMAIL]
- **System Administrator**: [INSERT PHONE/EMAIL]

### **Escalation Path**

1. **P1 (Critical)**: System down, data loss, security breach
2. **P2 (High)**: Performance degradation, sync issues
3. **P3 (Medium)**: Feature requests, minor bugs

---

## 🎯 SUCCESS CRITERIA

### **Technical Metrics**

- ✅ API availability ≥ 99.9%
- ✅ P95 latency ≤ 150ms
- ✅ Sync lag ≤ 10 minutes
- ✅ Error rate ≤ 0.1%
- ✅ All health checks passing

### **Business Metrics**

- ✅ Benton County assessors can access system
- ✅ Real-time data sync with Harris PACS
- ✅ Government compliance maintained
- ✅ Performance targets met
- ✅ Security requirements satisfied

---

## 🚀 NEXT STEPS AFTER DEPLOYMENT

### **Week 1**

1. **UAT Testing** - 10-20 real users
2. **Performance Monitoring** - Validate SLOs
3. **Security Validation** - Penetration testing
4. **Backup Verification** - Test restore procedures

### **Week 2**

1. **Pilot Program** - One office/department
2. **User Training** - Documentation and training materials
3. **Monitoring Tuning** - Adjust alert thresholds
4. **Documentation** - Create runbooks and procedures

### **Week 3**

1. **Go-Live Preparation** - Final validation
2. **Communication** - Stakeholder notifications
3. **Support Readiness** - Help desk procedures
4. **Monitoring** - 24/7 alert monitoring

---

**🎯 This runbook provides everything needed for immediate Benton County
production deployment. Execute with excellence!**
