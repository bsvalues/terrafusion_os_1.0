#!/bin/bash

# TerraFusion OS SSL Certificate Generation Script
# Government-grade SSL/TLS certificate management

set -e

# Configuration
CERT_DIR="/etc/ssl/certs/terrafusion"
KEY_DIR="/etc/ssl/private/terrafusion"
DOMAIN="${DOMAIN:-terrafusion.gov}"
COUNTRY="${COUNTRY:-US}"
STATE="${STATE:-Washington}"
CITY="${CITY:-Prosser}"
ORG="${ORG:-Benton County}"
OU="${OU:-Information Technology}"
EMAIL="${EMAIL:-admin@bentoncountygov.org}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SSL_CERT: $1"
}

# Create directories
create_directories() {
    log "Creating SSL certificate directories..."
    mkdir -p "$CERT_DIR" "$KEY_DIR"
    chmod 755 "$CERT_DIR"
    chmod 700 "$KEY_DIR"
}

# Generate private key
generate_private_key() {
    log "Generating RSA private key (4096 bits)..."
    openssl genrsa -out "$KEY_DIR/terrafusion.key" 4096
    chmod 600 "$KEY_DIR/terrafusion.key"
}

# Generate certificate signing request
generate_csr() {
    log "Generating Certificate Signing Request (CSR)..."
    
    # Create OpenSSL config for CSR
    cat > "$CERT_DIR/terrafusion.conf" <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
OU=$OU
emailAddress=$EMAIL
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = api.$DOMAIN
DNS.4 = *.api.$DOMAIN
DNS.5 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    openssl req -new -key "$KEY_DIR/terrafusion.key" -out "$CERT_DIR/terrafusion.csr" -config "$CERT_DIR/terrafusion.conf"
}

# Generate self-signed certificate for development/testing
generate_self_signed_cert() {
    log "Generating self-signed certificate for development..."
    
    openssl x509 -req -in "$CERT_DIR/terrafusion.csr" \
        -signkey "$KEY_DIR/terrafusion.key" \
        -out "$CERT_DIR/terrafusion.crt" \
        -days 365 \
        -extensions v3_req \
        -extfile "$CERT_DIR/terrafusion.conf"
}

# Create certificate bundle for HAProxy
create_certificate_bundle() {
    log "Creating certificate bundle for HAProxy..."
    
    # HAProxy requires cert + key in single file
    cat "$CERT_DIR/terrafusion.crt" "$KEY_DIR/terrafusion.key" > "$CERT_DIR/terrafusion.pem"
    chmod 600 "$CERT_DIR/terrafusion.pem"
}

# Generate Diffie-Hellman parameters for enhanced security
generate_dhparam() {
    log "Generating Diffie-Hellman parameters (2048 bits)..."
    openssl dhparam -out "$CERT_DIR/dhparam.pem" 2048
    chmod 644 "$CERT_DIR/dhparam.pem"
}

# Validate certificate
validate_certificate() {
    log "Validating generated certificate..."
    
    # Check certificate details
    log "Certificate details:"
    openssl x509 -in "$CERT_DIR/terrafusion.crt" -text -noout | grep -E "(Subject:|DNS:|Not Before|Not After)"
    
    # Verify certificate against private key
    cert_modulus=$(openssl x509 -noout -modulus -in "$CERT_DIR/terrafusion.crt" | openssl md5)
    key_modulus=$(openssl rsa -noout -modulus -in "$KEY_DIR/terrafusion.key" | openssl md5)
    
    if [ "$cert_modulus" = "$key_modulus" ]; then
        log "✓ Certificate and private key match"
    else
        log "✗ ERROR: Certificate and private key do not match"
        exit 1
    fi
}

# Create Let's Encrypt preparation script
create_letsencrypt_script() {
    log "Creating Let's Encrypt automation script..."
    
    cat > "$CERT_DIR/letsencrypt-setup.sh" <<'EOF'
#!/bin/bash

# TerraFusion OS Let's Encrypt Certificate Setup
# Use this script to replace self-signed certificates with Let's Encrypt certificates

set -e

DOMAIN="${1:-terrafusion.gov}"
EMAIL="${2:-admin@bentoncountygov.org}"

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update && apt-get install -y certbot
fi

# Stop HAProxy temporarily
docker-compose stop haproxy

# Generate Let's Encrypt certificate
certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "api.$DOMAIN"

# Create HAProxy bundle
cat "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
    "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
    > "/etc/ssl/certs/terrafusion/terrafusion.pem"

# Set permissions
chmod 600 "/etc/ssl/certs/terrafusion/terrafusion.pem"

# Restart HAProxy
docker-compose start haproxy

echo "Let's Encrypt certificate installed successfully!"
echo "Remember to set up auto-renewal with: certbot renew --dry-run"
EOF

    chmod +x "$CERT_DIR/letsencrypt-setup.sh"
}

# Create certificate monitoring script
create_monitoring_script() {
    log "Creating certificate monitoring script..."
    
    cat > "$CERT_DIR/monitor-certificates.sh" <<'EOF'
#!/bin/bash

# TerraFusion OS Certificate Monitoring Script
# Monitors SSL certificate expiration and sends alerts

CERT_FILE="/etc/ssl/certs/terrafusion/terrafusion.crt"
DAYS_WARNING=30
DAYS_CRITICAL=7

# Check certificate expiration
check_expiration() {
    if [ ! -f "$CERT_FILE" ]; then
        echo "ERROR: Certificate file not found: $CERT_FILE"
        return 1
    fi
    
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f 2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    echo "Certificate expires in $DAYS_UNTIL_EXPIRY days ($EXPIRY_DATE)"
    
    if [ $DAYS_UNTIL_EXPIRY -le $DAYS_CRITICAL ]; then
        echo "CRITICAL: Certificate expires in $DAYS_UNTIL_EXPIRY days!"
        # Send alert (customize as needed)
        # curl -X POST "https://hooks.slack.com/..." -d "Certificate expiring soon!"
        return 2
    elif [ $DAYS_UNTIL_EXPIRY -le $DAYS_WARNING ]; then
        echo "WARNING: Certificate expires in $DAYS_UNTIL_EXPIRY days"
        return 1
    else
        echo "Certificate is valid"
        return 0
    fi
}

check_expiration
EOF

    chmod +x "$CERT_DIR/monitor-certificates.sh"
}

# Main execution function
main() {
    log "Starting TerraFusion OS SSL certificate generation..."
    
    create_directories
    generate_private_key
    generate_csr
    generate_self_signed_cert
    create_certificate_bundle
    generate_dhparam
    validate_certificate
    create_letsencrypt_script
    create_monitoring_script
    
    log "SSL certificate generation completed successfully!"
    log "Files created:"
    log "  - Certificate: $CERT_DIR/terrafusion.crt"
    log "  - Private Key: $KEY_DIR/terrafusion.key"
    log "  - HAProxy Bundle: $CERT_DIR/terrafusion.pem"
    log "  - DH Parameters: $CERT_DIR/dhparam.pem"
    log "  - Let's Encrypt Setup: $CERT_DIR/letsencrypt-setup.sh"
    log "  - Certificate Monitor: $CERT_DIR/monitor-certificates.sh"
    log ""
    log "IMPORTANT NOTES:"
    log "1. Replace self-signed certificate with CA-issued certificate for production"
    log "2. Use $CERT_DIR/letsencrypt-setup.sh for Let's Encrypt certificates"
    log "3. Set up cron job for certificate monitoring: $CERT_DIR/monitor-certificates.sh"
    log "4. Ensure proper file permissions are maintained"
}

# Execute main function
main "$@"