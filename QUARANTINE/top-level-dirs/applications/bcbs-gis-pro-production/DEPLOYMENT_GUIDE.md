# Terrafusion Enterprise Deployment Guide

## Executive Summary

Terrafusion Civil Infrastructure provides multiple enterprise-grade deployment options designed for seamless installation across Windows, macOS, and Linux environments. Our deployment system delivers Microsoft/Apple level quality with comprehensive progress tracking, automated dependency management, and professional user experience.

## Deployment Options

### 🚀 One-Click Installation (Recommended)

#### Windows Enterprise Deployment
```bash
# Method 1: Double-click installer
Terrafusion-OneClick-Installer.exe.bat

# Method 2: PowerShell (Recommended for IT departments)
powershell -ExecutionPolicy Bypass -File deployment/install-terrafusion.ps1

# Method 3: Command Prompt
deployment/install-terrafusion.bat
```

#### macOS/Linux Enterprise Deployment
```bash
# Make installer executable and run
chmod +x deployment/install-terrafusion.sh
./deployment/install-terrafusion.sh
```

### 📦 Desktop Application Packaging

#### Electron Desktop App
```bash
# Build desktop application for all platforms
npm run build
npm run electron:dist

# Platform-specific builds
npm run electron:pack  # Development build
npm run electron:dist  # Production build with installer
```

### 🏢 Enterprise Infrastructure Deployment

#### System Requirements
- **Windows**: Windows 10/11 (x64), 4GB RAM, 10GB storage
- **macOS**: macOS 10.15+, 4GB RAM, 10GB storage  
- **Linux**: Ubuntu 20.04+/RHEL 8+, 4GB RAM, 10GB storage
- **Database**: PostgreSQL 12+ (auto-installed)
- **Runtime**: Node.js 18+ (auto-installed)

#### Automated Components
- ✅ System requirements validation
- ✅ Dependency installation (Node.js, PostgreSQL)
- ✅ Database setup and configuration
- ✅ Application build and optimization
- ✅ Service registration (Windows Service/systemd/LaunchAgent)
- ✅ Desktop shortcuts and Start Menu entries
- ✅ Firewall configuration
- ✅ Auto-updater setup
- ✅ Uninstaller registration

## Installation Process

### Phase 1: Pre-Installation Validation
```
[■■■░░░░░] 12% - System Requirements Check
- Windows version validation
- Memory and storage verification
- Network connectivity test
- Administrative privileges confirmation
```

### Phase 2: Infrastructure Setup
```
[■■■■░░░░] 37% - Database Setup
- PostgreSQL installation and configuration
- Service user creation
- Database initialization
- Connection validation
```

### Phase 3: Application Installation
```
[■■■■■■░░] 75% - Application Build
- Node.js runtime installation
- NPM dependency resolution
- Frontend compilation
- Backend optimization
```

### Phase 4: System Integration
```
[■■■■■■■■] 100% - Service Registration
- Windows Service/systemd configuration
- Desktop shortcut creation
- Start Menu integration
- Auto-start configuration
```

## Post-Installation Access

### Web Interface
- **URL**: http://localhost:5000
- **Features**: Full GIS platform access
- **Browser Support**: Chrome, Firefox, Edge, Safari

### Desktop Application
- **Windows**: Start Menu → Terrafusion → Terrafusion Civil Infrastructure
- **macOS**: Applications → Terrafusion.app
- **Linux**: Applications Menu → Terrafusion Civil Infrastructure

### Service Management

#### Windows
```cmd
# Service control
sc start Terrafusion
sc stop Terrafusion
sc query Terrafusion

# View logs
type "C:\ProgramData\Terrafusion\logs\terrafusion.log"
```

#### macOS
```bash
# LaunchAgent control
launchctl load ~/Library/LaunchAgents/com.terrafusion.civil-infrastructure.plist
launchctl unload ~/Library/LaunchAgents/com.terrafusion.civil-infrastructure.plist

# View logs
tail -f ~/Library/Application\ Support/Terrafusion/logs/terrafusion.log
```

#### Linux
```bash
# systemd service control
sudo systemctl start terrafusion
sudo systemctl stop terrafusion
sudo systemctl status terrafusion

# View logs
sudo journalctl -u terrafusion -f
```

## Enterprise Configuration

### Database Connection
```env
# Production database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/terrafusion
PGHOST=localhost
PGPORT=5432
PGDATABASE=terrafusion
PGUSER=terrafusion
```

### Security Settings
```env
# Security configuration
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret
JWT_SECRET=your-jwt-secret
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

### Performance Optimization
```env
# Performance tuning
MAX_WORKERS=4
CACHE_TTL=3600
DB_POOL_SIZE=20
MEMORY_LIMIT=4096
```

## Maintenance and Updates

### Automatic Updates
The system includes built-in update mechanisms:
- **Background checks**: Daily update verification
- **Staged rollouts**: Gradual deployment of updates
- **Rollback capability**: Instant reversion if issues occur

### Manual Updates
```bash
# Check for updates
npm run check-updates

# Apply updates
npm run update-system

# Rollback if needed
npm run rollback-version
```

### Backup Procedures
```bash
# Database backup
npm run backup-database

# Full system backup
npm run backup-system

# Restore from backup
npm run restore-backup --file=backup-2025-01-08.sql
```

## Monitoring and Diagnostics

### System Health Checks
- **Service Status**: Real-time monitoring
- **Database Connectivity**: Connection pool status
- **Memory Usage**: Performance metrics
- **Error Rates**: Application stability

### Log Management
```bash
# Application logs
tail -f /var/log/terrafusion/application.log

# Database logs
tail -f /var/log/terrafusion/database.log

# System logs
tail -f /var/log/terrafusion/system.log
```

## Troubleshooting

### Common Issues

#### Installation Fails
1. **Admin Rights**: Ensure running as Administrator
2. **Antivirus**: Temporarily disable during installation
3. **Network**: Check internet connectivity
4. **Space**: Verify minimum 10GB free space

#### Service Won't Start
1. **Dependencies**: Verify PostgreSQL is running
2. **Ports**: Check port 5000 availability
3. **Permissions**: Validate service user permissions
4. **Logs**: Review error logs for specifics

#### Performance Issues
1. **Memory**: Increase available RAM
2. **Database**: Optimize PostgreSQL configuration
3. **Network**: Check bandwidth availability
4. **Cache**: Clear application cache

### Support Channels
- **Documentation**: https://docs.terrafusion.com
- **Support Portal**: https://support.terrafusion.com
- **Emergency**: support@terrafusion.com
- **Community**: https://community.terrafusion.com

## Uninstallation

### Windows
```cmd
# Via Control Panel
appwiz.cpl → Terrafusion Civil Infrastructure → Uninstall

# Via command line
"C:\Program Files\Terrafusion\uninstall.bat"
```

### macOS
```bash
# Run uninstaller
/Applications/Terrafusion.app/Contents/Resources/uninstall.sh
```

### Linux
```bash
# Package manager
sudo apt remove terrafusion
# or
sudo yum remove terrafusion

# Manual removal
sudo /opt/terrafusion/uninstall.sh
```

## Compliance and Security

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete activity tracking
- **Backup Security**: Encrypted backup storage

### Compliance Standards
- **HIPAA**: Healthcare data protection
- **FERPA**: Educational records security
- **SOC 2**: Security operations compliance
- **ISO 27001**: Information security management

## Professional Services

### Implementation Support
- **Enterprise Setup**: White-glove installation service
- **Data Migration**: Professional data transfer service
- **Training Programs**: Comprehensive user education
- **Custom Integration**: Tailored system connections

### Maintenance Contracts
- **24/7 Support**: Round-the-clock assistance
- **Proactive Monitoring**: System health oversight
- **Performance Optimization**: Continuous improvement
- **Version Management**: Controlled update deployment