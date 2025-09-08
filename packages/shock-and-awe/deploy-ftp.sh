#!/bin/bash

#########################################################################
# TerraFusion Market - Direct FTP Deployment using curl
# Uses built-in curl for FTP upload
#########################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
FTP_HOST="82.198.236.1"
FTP_USER="u240968583.terrafusionmarket.io"
LOCAL_DIR="dist"
DOMAIN="terrafusionmarket.io"

echo -e "${BLUE}🚀 TERRAFUSION MARKET - DIRECT FTP DEPLOYMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "📦 Host: ${FTP_HOST}"
echo -e "👤 User: ${FTP_USER}"
echo -e "🌐 Domain: https://${DOMAIN}"
echo ""

# Get FTP password
echo -e "${YELLOW}🔐 Enter FTP password for ${FTP_USER}:${NC}"
read -s FTP_PASS
echo ""

if [[ -z "$FTP_PASS" ]]; then
    echo -e "${RED}❌ Password is required${NC}"
    exit 1
fi

# Check build
if [ ! -d "$LOCAL_DIR" ]; then
    echo -e "${RED}❌ Build directory not found: $LOCAL_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Production build found${NC}"
echo -e "${BLUE}📁 Files to deploy: $(find $LOCAL_DIR -type f | wc -l)${NC}"
echo ""

# Test FTP connection
echo -e "${YELLOW}🔌 Testing FTP connection...${NC}"
curl --connect-timeout 10 -u "${FTP_USER}:${FTP_PASS}" "ftp://${FTP_HOST}/" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ FTP connection successful${NC}"
else
    echo -e "${RED}❌ FTP connection failed. Please check credentials.${NC}"
    exit 1
fi

# Upload files
echo -e "${YELLOW}📤 Uploading files to Hostinger...${NC}"
echo ""

upload_file() {
    local file=$1
    local remote_path=$2
    local filename=$(basename "$file")
    
    echo -n "  📄 Uploading $filename... "
    
    curl -T "$file" -u "${FTP_USER}:${FTP_PASS}" "ftp://${FTP_HOST}/public_html/${remote_path}" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC}"
        return 0
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi
}

# Create remote directories first
echo -e "${BLUE}📁 Creating remote directories...${NC}"
for dir in "js" "styles"; do
    curl -u "${FTP_USER}:${FTP_PASS}" "ftp://${FTP_HOST}/public_html/" -Q "MKD ${dir}" > /dev/null 2>&1 || true
done

# Upload main files
echo -e "${BLUE}📤 Uploading main files...${NC}"
for file in $LOCAL_DIR/*.{html,json,txt,xml,js,htaccess}; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Handle .htaccess specially
        if [[ "$filename" == ".htaccess" ]]; then
            upload_file "$file" ".htaccess"
        else
            upload_file "$file" "$filename"
        fi
    fi
done

# Upload CSS files
echo -e "${BLUE}📤 Uploading CSS files...${NC}"
for file in $LOCAL_DIR/styles/*.css; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        upload_file "$file" "styles/$filename"
    fi
done

# Upload JS files
echo -e "${BLUE}📤 Uploading JavaScript files...${NC}"
for file in $LOCAL_DIR/js/*.js; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        upload_file "$file" "js/$filename"
    fi
done

echo ""
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

# Test if site is accessible
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Site is live and responding (HTTP 200)${NC}"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠️ Connection timeout - site may still be propagating${NC}"
else
    echo -e "${YELLOW}⚠️ Site returned HTTP ${HTTP_STATUS}${NC}"
fi

# Test key files
echo -e "${BLUE}🔗 Testing key files:${NC}"
for endpoint in "/" "/manifest.json" "/robots.txt"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}${endpoint}" || echo "000")
    if [ "$status" = "200" ]; then
        echo -e "  ✅ ${endpoint} - OK"
    else
        echo -e "  ⚠️ ${endpoint} - HTTP ${status}"
    fi
done

echo ""
echo -e "${GREEN}"
echo "██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗███████╗██████╗ "
echo "██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝██╔════╝██╔══██╗"
echo "██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ █████╗  ██║  ██║"
echo "██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  ██╔══╝  ██║  ██║"
echo "██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   ███████╗██████╔╝"
echo "╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   ╚══════╝╚═════╝ "
echo -e "${NC}"
echo -e "${PURPLE}🎉 FTP DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "🌐 Live Site: ${GREEN}https://${DOMAIN}${NC}"
echo -e "📱 Mobile PWA: ${GREEN}https://${DOMAIN}${NC}"
echo -e "🔍 Demo: ${GREEN}https://${DOMAIN}/#demo${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🚀 TerraFusion Market is now LIVE!${NC}"