# Terrafusion Market - Hostinger Deployment Commands

## 🚀 Quick Deployment (3 Commands)

```bash
# 1. Build for production
npm run build:production

# 2. Deploy to Hostinger
./deploy.sh

# 3. Verify deployment
curl -I https://terrafusionmarket.io
```

## 📋 Complete Deployment Commands

### Initial Setup

```bash
# Clone and setup
git clone https://github.com/terrafusion/terrafusion-market
cd shock-and-awe

# Install dependencies
npm ci

# Configure environment
cp hostinger-config/.env.example hostinger-config/.env.production
nano hostinger-config/.env.production
```

### Production Build

```bash
# Full production build
npm run build:production

# Build with analysis
ANALYZE=true npm run build:production

# Build without optimization (faster)
npm run build:development

# Custom build script
./build-production.sh

# Clean build
npm run clean && npm run build:production
```

### Deployment Commands

```bash
# Standard deployment
./deploy.sh

# Deploy to custom domain
./deploy.sh --domain=staging.terrafusionmarket.io

# Deploy with custom FTP host
./deploy.sh --ftp-host=your-ftp-server.com

# Skip backup (faster deployment)
./deploy.sh --skip-backup

# Skip build (use existing dist/)
./deploy.sh --skip-build

# Deploy with verbose logging
DEBUG=true ./deploy.sh
```

### SSL/HTTPS Setup

```bash
# Configure SSL and security
./hostinger-config/ssl-setup.sh

# SSL setup for custom domain
./hostinger-config/ssl-setup.sh --domain=your-domain.com

# Test SSL configuration
curl -I https://terrafusionmarket.io | grep -i security

# Verify SSL certificate
openssl s_client -connect terrafusionmarket.io:443 -servername terrafusionmarket.io
```

### Database Management

```bash
# Setup database (run in Hostinger MySQL panel)
mysql -h localhost -u your_user -p your_database < hostinger-config/database-setup.sql

# Update database schema
mysql -h localhost -u your_user -p your_database < hostinger-config/database-update.sql

# Test database connection
mysql -h localhost -u your_user -p your_database -e "SELECT 1;"

# Show database tables
mysql -h localhost -u your_user -p your_database -e "SHOW TABLES;"

# Check database version
mysql -h localhost -u your_user -p your_database -e "SELECT setting_value FROM tf_settings WHERE setting_key='database_version';"
```

### Backup & Restore

```bash
# Create full backup
./hostinger-config/backup-restore.sh --full

# Create incremental backup
./hostinger-config/backup-restore.sh --incremental

# List available backups
./hostinger-config/backup-restore.sh --list

# Restore from backup
./hostinger-config/backup-restore.sh --restore backups/terrafusion-backup-20250819_120000.tar.gz

# Verify backup integrity
./hostinger-config/backup-restore.sh --verify backups/terrafusion-backup-20250819_120000.tar.gz

# Cleanup old backups
./hostinger-config/backup-restore.sh --cleanup
```

### Maintenance Mode

```bash
# Enable maintenance mode
./hostinger-config/backup-restore.sh --maintenance-on

# Disable maintenance mode
./hostinger-config/backup-restore.sh --maintenance-off

# Check maintenance status
curl -I https://terrafusionmarket.io
```

### Monitoring & Health Checks

```bash
# Application health check
npm run health-check

# Check application status
npm run status

# Monitor SSL certificate
./hostinger-config/ssl-setup.sh --verify

# Monitor disk usage
./hostinger-config/backup-restore.sh --monitor

# Performance test
npm run test:performance

# Security audit
npm run security
```

### Development & Testing

```bash
# Local development server
npm run dev

# Serve production build locally
npm run serve

# Run tests
npm test

# End-to-end tests
npm run test:e2e

# Lighthouse performance test
npm run test:lighthouse

# Bundle analysis
npm run analyze
```

### Code Quality

```bash
# Lint JavaScript
npm run lint

# Lint CSS
npm run lint:css

# Lint HTML
npm run lint:html

# Format code
npm run format

# Run all quality checks
npm run validate
```

### Asset Optimization

```bash
# Optimize images
npm run optimize:images

# Optimize HTML
npm run optimize:html

# Compress assets
npm run optimize:assets

# Generate gzip files
npm run gzip:assets
```

### Configuration Management

```bash
# Setup Hostinger environment
npm run setup:hostinger

# Copy environment template
npm run setup:env

# Database setup reminder
npm run setup:db

# Validate configuration
./deploy.sh --help
```

### Logging & Debugging

```bash
# View deployment logs
tail -f logs/deployment-*.log

# View application logs
npm run logs

# View all logs
tail -f logs/*.log

# Clear logs
rm -f logs/*.log

# Enable debug mode
DEBUG=true npm run build:production
```

### File Management

```bash
# Copy configuration files
npm run copy:config

# Copy assets
npm run copy:assets

# Copy HTML files
npm run copy:html

# Clean build directory
npm run clean

# Create backup
npm run backup

# Restore from backup (manual)
npm run restore
```

### FTP Operations

```bash
# Test FTP connection
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "ls; quit"

# Upload single file
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "put local-file.html /public_html/; quit"

# Download file from server
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "get /public_html/file.html; quit"

# Sync directories
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "mirror --reverse dist/ /public_html/; quit"

# Set file permissions
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "chmod 644 /public_html/*.html; quit"
```

### Security Operations

```bash
# Update dependencies
npm update

# Security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update all packages
npm run update
```

### Performance Optimization

```bash
# Analyze bundle size
npm run analyze

# Test page speed
npm run test:pagespeed

# Optimize images
npm run optimize:images

# Minify assets
npm run build:production

# Test compression
curl -H "Accept-Encoding: gzip" -I https://terrafusionmarket.io
```

## 🔧 Environment-Specific Commands

### Staging Environment

```bash
# Deploy to staging
npm run deploy:staging

# Build for staging
NODE_ENV=staging npm run build:production

# Test staging
curl -I https://staging.terrafusionmarket.io
```

### Production Environment

```bash
# Deploy to production
npm run deploy:production

# Production health check
curl -f https://terrafusionmarket.io/api/health

# Production status
curl -s https://terrafusionmarket.io/api/status | json_pp
```

## 🚨 Emergency Commands

### Quick Rollback

```bash
# Restore from latest backup
./hostinger-config/backup-restore.sh --restore $(ls -t backups/*.tar.gz | head -1)

# Enable maintenance mode immediately
./hostinger-config/backup-restore.sh --maintenance-on

# Disable site (emergency)
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "mv /public_html/index.html /public_html/index.html.disabled; quit"
```

### Diagnostics

```bash
# Full system check
npm run validate && npm run health-check && npm run test:performance

# Check all services
curl -I https://terrafusionmarket.io && \
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT 1;" && \
./hostinger-config/ssl-setup.sh --verify

# Network diagnostics
ping terrafusionmarket.io
nslookup terrafusionmarket.io
curl -I https://terrafusionmarket.io
```

## 📱 Mobile Commands

### Quick Mobile Test

```bash
# Mobile-first Lighthouse test
lighthouse https://terrafusionmarket.io --preset=mobile --output=html --output-path=mobile-report.html

# Mobile performance test
psi https://terrafusionmarket.io --strategy=mobile

# Responsive test
curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" https://terrafusionmarket.io
```

## 🔄 Automation Commands

### Automated Deployment Pipeline

```bash
# Full automated deployment
npm run validate && npm run build:production && ./deploy.sh && npm run health-check

# Automated backup before deploy
./hostinger-config/backup-restore.sh --full && ./deploy.sh

# Scheduled backup (add to crontab)
0 2 * * * cd /path/to/terrafusion && ./hostinger-config/backup-restore.sh --incremental
```

### CI/CD Integration

```bash
# GitHub Actions deployment
git tag v1.0.0 && git push origin v1.0.0

# Manual trigger
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/terrafusion/terrafusion-market/dispatches" \
  -d '{"event_type":"deploy"}'
```

---

## 📚 Command Reference Summary

| Command                                       | Purpose                            |
| --------------------------------------------- | ---------------------------------- |
| `npm run build:production`                    | Build optimized production version |
| `./deploy.sh`                                 | Deploy to Hostinger                |
| `npm run health-check`                        | Verify deployment                  |
| `./hostinger-config/ssl-setup.sh`             | Configure SSL/HTTPS                |
| `./hostinger-config/backup-restore.sh --full` | Create backup                      |
| `npm run monitor`                             | Performance monitoring             |
| `npm run security`                            | Security audit                     |
| `npm run validate`                            | Code quality check                 |

**All commands are production-ready and optimized for Hostinger shared hosting
environment.**
