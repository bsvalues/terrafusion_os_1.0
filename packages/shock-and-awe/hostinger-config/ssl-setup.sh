#!/bin/bash

#################################################################################
# TerraFusion Market - SSL/HTTPS Configuration for Hostinger
# Automated SSL certificate setup and HTTPS redirect configuration
#################################################################################

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="terrafusionmarket.io"
LOG_FILE="./ssl-setup-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

echo -e "${BLUE}"
cat << 'EOF'
████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
   ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝

                              SSL/HTTPS CONFIGURATION
                                Production Security Setup
EOF
echo -e "${NC}"

check_ssl_status() {
    log "Checking SSL certificate status for $DOMAIN..."
    
    # Check if SSL is accessible
    if curl -s --head "https://$DOMAIN" | grep -q "HTTP/"; then
        log "✓ SSL certificate is active and working"
        
        # Get certificate details
        log "Retrieving certificate information..."
        openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | \
        openssl x509 -noout -dates 2>/dev/null || warning "Could not retrieve certificate details"
        
        return 0
    else
        warning "SSL certificate not found or not working properly"
        return 1
    fi
}

generate_htaccess_ssl() {
    log "Generating SSL-optimized .htaccess configuration..."
    
    cat > .htaccess.ssl << 'EOF'
# ============================================================================
# TerraFusion Market - SSL/HTTPS Configuration
# Enhanced security for production deployment
# ============================================================================

# Force HTTPS redirect (updated for better compatibility)
RewriteEngine On

# Handle SSL termination at load balancer (for some hosting providers)
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://terrafusionmarket.io/$1 [R=301,L]

# Redirect www to non-www with HTTPS
RewriteCond %{HTTP_HOST} ^www\.terrafusionmarket\.io$ [NC]
RewriteRule ^(.*)$ https://terrafusionmarket.io/$1 [R=301,L]

# Enhanced Security Headers
<IfModule mod_headers.c>
    # HTTP Strict Transport Security (HSTS) - 1 year
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
    
    # Prevent clickjacking
    Header always set X-Frame-Options "DENY" env=HTTPS
    
    # Prevent MIME type sniffing
    Header always set X-Content-Type-Options "nosniff" env=HTTPS
    
    # XSS Protection
    Header always set X-XSS-Protection "1; mode=block" env=HTTPS
    
    # Referrer Policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin" env=HTTPS
    
    # Permissions Policy (updated Feature Policy)
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" env=HTTPS
    
    # Content Security Policy for HTTPS
    Header always set Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https:; upgrade-insecure-requests" env=HTTPS
</IfModule>

# Security for mixed content
<IfModule mod_headers.c>
    # Upgrade insecure requests
    Header always set Content-Security-Policy "upgrade-insecure-requests" env=HTTPS
</IfModule>

# Block HTTP methods that aren't needed
<LimitExcept GET POST HEAD OPTIONS>
    Deny from all
</LimitExcept>

# Additional security for HTTPS
<IfModule mod_rewrite.c>
    # Block access to sensitive files over any protocol
    RewriteRule ^\.env - [F,L]
    RewriteRule ^\.htaccess - [F,L]
    RewriteRule ^\.htpasswd - [F,L]
    RewriteRule ^config\.php - [F,L]
</IfModule>

EOF

    log ".htaccess SSL configuration generated"
}

create_security_headers() {
    log "Creating security headers configuration..."
    
    cat > security-headers.conf << 'EOF'
# Security Headers for Nginx (if applicable)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'" always;
EOF

    log "Security headers configuration created"
}

test_ssl_configuration() {
    log "Testing SSL configuration..."
    
    # Test HTTPS redirect
    log "Testing HTTP to HTTPS redirect..."
    http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" --max-time 10 || echo "000")
    
    if [[ "$http_response" == "301" ]] || [[ "$http_response" == "302" ]]; then
        log "✓ HTTP to HTTPS redirect working (Status: $http_response)"
    else
        warning "HTTP to HTTPS redirect may not be working properly (Status: $http_response)"
    fi
    
    # Test HTTPS response
    log "Testing HTTPS response..."
    https_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" --max-time 10 || echo "000")
    
    if [[ "$https_response" == "200" ]]; then
        log "✓ HTTPS response working (Status: $https_response)"
    else
        warning "HTTPS response issue (Status: $https_response)"
    fi
    
    # Test security headers
    log "Testing security headers..."
    headers_response=$(curl -s -I "https://$DOMAIN" --max-time 10 || echo "")
    
    if echo "$headers_response" | grep -q "Strict-Transport-Security"; then
        log "✓ HSTS header present"
    else
        warning "HSTS header missing"
    fi
    
    if echo "$headers_response" | grep -q "X-Frame-Options"; then
        log "✓ X-Frame-Options header present"
    else
        warning "X-Frame-Options header missing"
    fi
}

generate_ssl_monitoring() {
    log "Creating SSL monitoring script..."
    
    cat > ssl-monitor.sh << 'EOF'
#!/bin/bash

# SSL Certificate Monitoring for TerraFusion Market
DOMAIN="terrafusionmarket.io"
ALERT_DAYS=30

# Check certificate expiration
cert_date=$(openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | \
            openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ ! -z "$cert_date" ]; then
    cert_epoch=$(date -d "$cert_date" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (cert_epoch - current_epoch) / 86400 ))
    
    echo "SSL Certificate for $DOMAIN expires in $days_until_expiry days"
    
    if [ $days_until_expiry -lt $ALERT_DAYS ]; then
        echo "WARNING: SSL certificate expires soon!"
        # Add notification logic here (email, webhook, etc.)
    fi
else
    echo "ERROR: Could not retrieve SSL certificate information"
fi

# Test HTTPS accessibility
if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo "✓ HTTPS site is accessible"
else
    echo "✗ HTTPS site is not accessible"
fi
EOF

    chmod +x ssl-monitor.sh
    log "SSL monitoring script created"
}

create_ssl_troubleshooting() {
    log "Creating SSL troubleshooting guide..."
    
    cat > SSL-TROUBLESHOOTING.md << 'EOF'
# SSL/HTTPS Troubleshooting Guide

## Common Issues and Solutions

### 1. Certificate Not Working
- **Issue**: HTTPS not accessible
- **Solution**: Check Hostinger control panel for SSL certificate status
- **Command**: `curl -I https://terrafusionmarket.io`

### 2. Mixed Content Warnings
- **Issue**: HTTP resources loaded on HTTPS pages
- **Solution**: Update all asset URLs to use HTTPS or relative URLs
- **Check**: Browser developer tools console

### 3. Redirect Loop
- **Issue**: Infinite redirects between HTTP and HTTPS
- **Solution**: Check .htaccess rules and hosting configuration
- **Test**: `curl -v http://terrafusionmarket.io`

### 4. Security Headers Missing
- **Issue**: Security scan fails
- **Solution**: Ensure .htaccess headers are properly configured
- **Test**: `curl -I https://terrafusionmarket.io | grep -i security`

### 5. Certificate Expiration
- **Issue**: Certificate expires
- **Solution**: Renew through Hostinger panel or use automated renewal
- **Monitor**: Run `./ssl-monitor.sh` regularly

## Manual SSL Testing Commands

```bash
# Test SSL certificate
openssl s_client -connect terrafusionmarket.io:443 -servername terrafusionmarket.io

# Check certificate expiration
openssl s_client -connect terrafusionmarket.io:443 -servername terrafusionmarket.io 2>/dev/null | openssl x509 -noout -dates

# Test HTTP to HTTPS redirect
curl -I http://terrafusionmarket.io

# Test security headers
curl -I https://terrafusionmarket.io

# Test from different locations
curl -I https://terrafusionmarket.io --resolve terrafusionmarket.io:443:IP_ADDRESS
```

## Hostinger-Specific Notes

1. SSL certificates are automatically provided by Hostinger
2. Certificate renewal is typically automatic
3. Custom SSL certificates can be uploaded if needed
4. CloudFlare integration may affect SSL behavior
5. Contact Hostinger support for certificate issues

## Security Checklist

- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] No mixed content warnings
- [ ] Certificate valid and not expiring soon
- [ ] HSTS enabled
- [ ] CSP policy configured
- [ ] SSL Labs rating A or higher

## Monitoring Setup

Add to crontab for daily SSL monitoring:
```bash
0 9 * * * /path/to/ssl-monitor.sh
```
EOF

    log "SSL troubleshooting guide created"
}

main() {
    log "Starting SSL/HTTPS configuration for TerraFusion Market"
    
    # Check current SSL status
    if check_ssl_status; then
        log "SSL certificate is already working"
    else
        warning "SSL certificate needs attention"
    fi
    
    # Generate configurations
    generate_htaccess_ssl
    create_security_headers
    generate_ssl_monitoring
    create_ssl_troubleshooting
    
    # Test configuration
    test_ssl_configuration
    
    echo -e "${GREEN}"
    echo "=========================================="
    echo "  SSL/HTTPS CONFIGURATION COMPLETE"
    echo "=========================================="
    echo "Domain: https://$DOMAIN"
    echo "Configuration files created:"
    echo "  - .htaccess.ssl (SSL-optimized Apache config)"
    echo "  - security-headers.conf (Nginx headers)"
    echo "  - ssl-monitor.sh (monitoring script)"
    echo "  - SSL-TROUBLESHOOTING.md (guide)"
    echo "Log: $LOG_FILE"
    echo -e "${NC}"
    
    log "Next steps:"
    log "1. Upload .htaccess.ssl as .htaccess to your web root"
    log "2. Test HTTPS functionality"
    log "3. Set up SSL monitoring"
    log "4. Run security scan to verify headers"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --domain DOMAIN     Target domain (default: terrafusionmarket.io)"
            echo "  --help              Show this help"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

main