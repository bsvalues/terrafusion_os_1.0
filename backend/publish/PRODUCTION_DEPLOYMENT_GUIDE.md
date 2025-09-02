# 🚀 TERRAFUSION OS 1.0 - PRODUCTION DEPLOYMENT GUIDE

## 📋 **DEPLOYMENT OVERVIEW**

This guide provides step-by-step instructions for deploying Terrafusion OS 1.0 into production using the standalone version.

## 🎯 **SYSTEM REQUIREMENTS**

### **Minimum Requirements**
- **OS**: Windows 10/11 or Windows Server 2019+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB available space
- **.NET**: .NET 8.0 Runtime (included in package)
- **Ports**: 5000 (API), 5001-5008 (optional modules)

### **Recommended Requirements**
- **OS**: Windows Server 2022
- **RAM**: 32GB
- **Storage**: 50GB SSD
- **CPU**: 8+ cores
- **Network**: Gigabit Ethernet

## 🚀 **QUICK START DEPLOYMENT**

### **Step 1: Extract Package**
```bash
# Extract the production package to your target directory
# Example: C:\Terrafusion\Production\
```

### **Step 2: Start Production API**
```bash
# Navigate to the production directory
cd C:\Terrafusion\Production\

# Run the production startup script
START_TERRAFUSION_PRODUCTION.bat
```

### **Step 3: Verify Deployment**
- **API Status**: http://localhost:5000/health
- **Main Endpoint**: http://localhost:5000/
- **Test Endpoint**: http://localhost:5000/api/test

## 🔧 **CONFIGURATION OPTIONS**

### **Environment Variables**
```bash
# Set these before starting the API
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_PORT=5000
set ASPNETCORE_URLS=http://localhost:5000
```

### **Database Configuration**
- **Default**: SQLite (terrafusion_production.db)
- **Production**: PostgreSQL (update appsettings.Production.json)
- **Connection String**: Update in appsettings.Production.json

### **Port Configuration**
- **API Port**: 5000 (configurable)
- **Module Ports**: 5001-5008 (optional)
- **Firewall**: Ensure port 5000 is open

## 📊 **MONITORING & HEALTH CHECKS**

### **Health Endpoints**
- **System Health**: `GET /health`
- **Database Status**: `GET /api/database/status`
- **Module Status**: `GET /api/modules`
- **AI Swarm Status**: `GET /api/swarm/status`

### **Performance Metrics**
- **Response Time**: < 100ms target
- **Throughput**: 1000+ concurrent connections
- **Memory Usage**: Monitor via Task Manager
- **CPU Usage**: Monitor via Task Manager

## 🛡️ **SECURITY CONFIGURATION**

### **Production Security Settings**
- **HTTPS**: Configure SSL certificate for production
- **Authentication**: JWT-based auth system
- **Authorization**: Role-based access control
- **Audit Logging**: Comprehensive audit trails
- **Input Validation**: All endpoints validated

### **Firewall Configuration**
```bash
# Windows Firewall - Allow Terrafusion API
netsh advfirewall firewall add rule name="Terrafusion API" dir=in action=allow protocol=TCP localport=5000
```

## 🔄 **UPDATES & MAINTENANCE**

### **Updating the System**
1. **Stop the API**: Ctrl+C in the running console
2. **Backup Database**: Copy terrafusion_production.db
3. **Replace Files**: Update with new version
4. **Restart API**: Run START_TERRAFUSION_PRODUCTION.bat

### **Database Maintenance**
- **Backup Schedule**: Daily automated backups
- **Migration**: Automatic EF Core migrations
- **Performance**: Monitor query performance
- **Cleanup**: Archive old audit logs

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **API Won't Start**
- Check if port 5000 is available
- Verify .NET 8.0 Runtime is installed
- Check Windows Event Logs for errors

#### **Database Connection Issues**
- Verify database file permissions
- Check connection string in appsettings.Production.json
- Ensure sufficient disk space

#### **Performance Issues**
- Monitor memory usage
- Check CPU utilization
- Review database query performance
- Verify network connectivity

### **Log Files**
- **Application Logs**: Console output
- **Windows Event Logs**: Application and System logs
- **Database Logs**: SQLite logs (if enabled)

## 📞 **SUPPORT & CONTACT**

### **Technical Support**
- **Documentation**: See CLAUDE.md for detailed technical information
- **Issues**: Check Windows Event Logs first
- **Performance**: Use built-in health check endpoints

### **Emergency Procedures**
1. **System Down**: Restart START_TERRAFUSION_PRODUCTION.bat
2. **Database Issues**: Restore from backup
3. **Performance Issues**: Check health endpoints
4. **Security Issues**: Review audit logs

## 🎉 **DEPLOYMENT COMPLETE**

Once the API is running and responding to health checks, your Terrafusion OS 1.0 is successfully deployed in production!

**Next Steps**:
1. **Test all endpoints** to ensure functionality
2. **Configure monitoring** for production use
3. **Set up automated backups**
4. **Train users** on the new system
5. **Begin county onboarding** using the new automation features

---

**Terrafusion OS 1.0 - Ready for Production Deployment! 🚀**
