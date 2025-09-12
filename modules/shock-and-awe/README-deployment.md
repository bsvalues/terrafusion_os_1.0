# Terrafusion Market - Complete Hostinger Deployment Guide

## 🚀 Quick Start Deployment

Deploy Terrafusion Market to terrafusionmarket.io in 3 simple steps:

```bash
# 1. Build production version
npm run build:production

# 2. Deploy to Hostinger
./deploy.sh

# 3. Verify deployment
npm run health-check
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0+ 
- **npm**: 9.0+
- **lftp**: For FTP deployment (auto-installed)
- **Hostinger Account**: With FTP access

### Domain Setup
- Domain: `terrafusionmarket.io`
- DNS pointed to Hostinger servers
- SSL certificate enabled (automatic with Hostinger)

## 🏗️ Complete Deployment Process

### Step 1: Environment Setup

1. **Configure Environment Variables**
```bash
# Copy production environment template
cp hostinger-config/.env.production .env

# Edit with your Hostinger credentials
nano .env
```

2. **Required Environment Variables**
```env
# FTP Configuration
FTP_HOST=files.000webhost.com
FTP_USER=your_hostinger_username
FTP_PASS=your_hostinger_password

# Database Configuration  
DB_HOST=localhost
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
```

### Step 2: Database Setup

1. **Access Hostinger MySQL Panel**
   - Login to Hostinger control panel
   - Navigate to "Database" section
   - Create new MySQL database

2. **Import Database Schema**
```sql
-- Execute hostinger-config/database-setup.sql in Hostinger MySQL panel
-- This creates all required tables and initial data
```

3. **Verify Database Connection**
```bash
# Test database connectivity
mysql -h localhost -u your_user -p your_database
```

### Step 3: Build Production Version

```bash
# Install dependencies
npm ci

# Run complete production build
npm run build:production

# Verify build output
ls -la dist/
```

**Build Output Structure:**
```
dist/
├── index.html              # Main application
├── .htaccess               # Apache configuration
├── js/                     # Minified JavaScript
├── styles/                 # Optimized CSS
├── assets/                 # Compressed images
├── api/                    # PHP API endpoints
├── error-pages/            # Custom error pages
└── build-manifest.json     # Build verification
```

### Step 4: Deploy to Hostinger

```bash
# Standard deployment
./deploy.sh

# Deploy with custom domain
./deploy.sh --domain=your-domain.com

# Deploy with backup skip (faster)
./deploy.sh --skip-backup
```

**Deployment Process:**
1. ✅ Environment validation
2. ✅ Pre-deployment checks
3. ✅ Create backup of current site
4. ✅ Build production version
5. ✅ Upload files via FTP
6. ✅ Set proper permissions
7. ✅ Verify deployment
8. ✅ Run post-deployment tasks

### Step 5: SSL/HTTPS Configuration

```bash
# Configure SSL and security headers
./hostinger-config/ssl-setup.sh

# Verify HTTPS is working
curl -I https://terrafusionmarket.io
```

### Step 6: Verification

```bash
# Health check
npm run health-check

# Performance test
npm run test:lighthouse

# Security scan
npm run security
```

## 🔧 Configuration Files

### Apache Configuration (.htaccess)
- ✅ HTTPS redirect enforcement
- ✅ Security headers (HSTS, CSP, XSS protection)
- ✅ Gzip compression
- ✅ Browser caching
- ✅ Clean URLs for SPA
- ✅ Security hardening

### Environment Configuration
```bash
# Production settings
NODE_ENV=production
DOMAIN=terrafusionmarket.io
SITE_URL=https://terrafusionmarket.io

# Security
FORCE_HTTPS=true
ENABLE_HSTS=true
CSP_DEFAULT_SRC='self'

# Performance
ENABLE_COMPRESSION=true
CACHE_TTL=3600
```

## 📁 Directory Structure

```
shock-and-awe/
├── index.html                          # Main application
├── package.json                        # Dependencies & scripts
├── .htaccess                           # Apache configuration
├── deploy.sh                           # Main deployment script
├── build-production.sh                 # Production build script
├── webpack.config.js                   # Build configuration
├── postcss.config.js                   # CSS processing
├── 
├── hostinger-config/                   # Hosting configuration
│   ├── .env.production                # Environment variables
│   ├── maintenance.html               # Maintenance page
│   ├── database-setup.sql             # Database schema
│   ├── database-update.sql            # Database migrations
│   ├── ssl-setup.sh                   # SSL configuration
│   └── backup-restore.sh              # Backup system
├── 
├── js/                                 # JavaScript source
│   ├── main.js                        # Main application logic
│   ├── demo.js                        # Demo functionality
│   ├── animations.js                  # UI animations
│   └── quantum-viz.js                 # Quantum visualization
├── 
├── styles/                            # CSS source
│   ├── main.css                       # Main styles
│   └── components.css                 # Component styles
├── 
└── assets/                            # Static assets
    ├── logo.svg                       # Brand logo
    ├── favicon.ico                    # Site icon
    └── og-image.jpg                   # Social media image
```

## 🛠️ Maintenance Commands

### Backup Management
```bash
# Create full backup
./hostinger-config/backup-restore.sh --full

# Create incremental backup
./hostinger-config/backup-restore.sh --incremental

# List available backups
./hostinger-config/backup-restore.sh --list

# Restore from backup
./hostinger-config/backup-restore.sh --restore backups/backup-file.tar.gz

# Verify backup integrity
./hostinger-config/backup-restore.sh --verify backups/backup-file.tar.gz

# Cleanup old backups
./hostinger-config/backup-restore.sh --cleanup
```

### Maintenance Mode
```bash
# Enable maintenance mode
./hostinger-config/backup-restore.sh --maintenance-on

# Disable maintenance mode
./hostinger-config/backup-restore.sh --maintenance-off
```

### Monitoring
```bash
# SSL certificate monitoring
./hostinger-config/ssl-setup.sh

# Disk usage monitoring
./hostinger-config/backup-restore.sh --monitor

# Performance monitoring
npm run monitor

# Application status
npm run status
```

## 🔍 Troubleshooting

### Common Issues

#### 1. FTP Connection Failed
```bash
# Check FTP credentials
echo $FTP_USER $FTP_HOST

# Test FTP connection manually
lftp -u $FTP_USER,$FTP_PASS $FTP_HOST
```

#### 2. Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build:production
```

#### 3. SSL Issues
```bash
# Check SSL status
curl -I https://terrafusionmarket.io

# Verify security headers
curl -I https://terrafusionmarket.io | grep -i security

# Run SSL troubleshooting
./hostinger-config/ssl-setup.sh
```

#### 4. Database Connection Issues
```bash
# Test database connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME

# Check database tables
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES;"
```

#### 5. Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Run performance audit
npm run test:performance

# Check server response times
curl -w "@curl-format.txt" -o /dev/null -s "https://terrafusionmarket.io"
```

### Debug Mode
```bash
# Enable detailed logging
DEBUG=true ./deploy.sh

# Check deployment logs
tail -f logs/deployment-*.log

# Monitor server logs
npm run logs
```

## 🔄 Update Procedures

### Application Updates
```bash
# 1. Create backup
./hostinger-config/backup-restore.sh --full

# 2. Update code
git pull origin main

# 3. Install new dependencies
npm install

# 4. Build and deploy
npm run build:production
./deploy.sh

# 5. Verify deployment
npm run health-check
```

### Database Updates
```bash
# Run database migrations
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < hostinger-config/database-update.sql

# Verify database version
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT setting_value FROM tf_settings WHERE setting_key='database_version';"
```

## 📊 Performance Optimization

### Hostinger-Specific Optimizations
- ✅ Gzip compression enabled
- ✅ Browser caching configured
- ✅ Image optimization
- ✅ CSS/JS minification
- ✅ HTTP/2 push hints
- ✅ Resource preloading

### Monitoring Metrics
- Page load time: < 3 seconds
- First contentful paint: < 1.5 seconds
- Lighthouse score: > 90
- SSL Labs rating: A+
- Uptime: > 99.9%

## 🔐 Security Features

### Implemented Security
- ✅ HTTPS enforcement
- ✅ Security headers (HSTS, CSP, XSS)
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ File upload restrictions
- ✅ Directory traversal protection
- ✅ Hotlinking prevention

### Security Monitoring
```bash
# Security audit
npm run security

# Vulnerability scan
npm audit --audit-level=moderate

# SSL monitoring
./hostinger-config/ssl-setup.sh --verify
```

## 📞 Support & Resources

### Hostinger Resources
- **Control Panel**: https://hpanel.hostinger.com
- **Documentation**: https://support.hostinger.com
- **Support**: Live chat in control panel

### Application Support
- **Domain**: https://terrafusionmarket.io
- **Status Page**: https://status.terrafusionmarket.io
- **Documentation**: This README
- **Logs**: `./logs/` directory

### Emergency Procedures
1. **Site Down**: Check Hostinger status, verify DNS
2. **SSL Issues**: Contact Hostinger support
3. **Database Issues**: Check connection, run diagnostics
4. **Performance Issues**: Check server resources, run optimization

## 🎯 Success Checklist

After deployment, verify:

- [ ] Website loads at https://terrafusionmarket.io
- [ ] HTTPS redirect working (http → https)
- [ ] All pages render correctly
- [ ] Demo functionality works
- [ ] Contact form submits successfully
- [ ] SSL certificate valid (A+ rating)
- [ ] Security headers present
- [ ] Page speed score > 90
- [ ] Mobile responsive design
- [ ] Error pages display correctly
- [ ] Database connectivity confirmed
- [ ] Backup system configured
- [ ] Monitoring alerts set up

## 🚀 Next Steps

1. **Configure Monitoring**: Set up uptime monitoring
2. **SEO Optimization**: Submit sitemap to search engines  
3. **Analytics**: Configure Google Analytics
4. **CDN**: Consider CloudFlare integration
5. **Backup Schedule**: Set up automated backups
6. **Performance Monitoring**: Set up alerts
7. **Content Updates**: Add real property data
8. **User Training**: Train government users

---

**Terrafusion Market is now ready for production use on Hostinger!**

For additional support or questions, contact the Terrafusion team.