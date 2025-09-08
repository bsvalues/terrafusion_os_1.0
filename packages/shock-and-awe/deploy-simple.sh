#!/bin/bash

#########################################################################
# TerraFusion Market - Simple Hostinger Deployment 
# No dependencies required - uses built-in tools
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

echo -e "${BLUE}🚀 TERRAFUSION MARKET - SIMPLE DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "📦 Host: ${FTP_HOST}"
echo -e "👤 User: ${FTP_USER}"
echo -e "🌐 Domain: https://${DOMAIN}"
echo ""

# Check if build exists
if [ ! -d "$LOCAL_DIR" ]; then
    echo -e "${RED}❌ Build directory not found: $LOCAL_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Production build found${NC}"
echo -e "${BLUE}📁 Files to deploy:${NC}"
find $LOCAL_DIR -type f | head -10
echo -e "   ... and $(find $LOCAL_DIR -type f | wc -l) total files"
echo ""

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf terrafusion-deployment.tar.gz -C $LOCAL_DIR .

if [ -f "terrafusion-deployment.tar.gz" ]; then
    echo -e "${GREEN}✅ Deployment package created: $(ls -lh terrafusion-deployment.tar.gz | awk '{print $5}')${NC}"
else
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

echo ""
echo -e "${PURPLE}🎯 READY FOR MANUAL UPLOAD${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 HOSTINGER DEPLOYMENT INSTRUCTIONS:${NC}"
echo ""
echo -e "${GREEN}1. Upload via Hostinger File Manager:${NC}"
echo -e "   • Login to Hostinger control panel"
echo -e "   • Go to 'File Manager'"
echo -e "   • Navigate to 'public_html' folder"
echo -e "   • Upload: terrafusion-deployment.tar.gz"
echo -e "   • Extract the archive in public_html"
echo ""
echo -e "${GREEN}2. Or upload via FTP client:${NC}"
echo -e "   • Host: ${FTP_HOST}"
echo -e "   • User: ${FTP_USER}"
echo -e "   • Port: 21"
echo -e "   • Upload to: /public_html/"
echo ""
echo -e "${GREEN}3. Files to verify after upload:${NC}"
echo -e "   ✅ index.html"
echo -e "   ✅ styles/ (CSS files)"
echo -e "   ✅ js/ (JavaScript files)"
echo -e "   ✅ manifest.json"
echo -e "   ✅ .htaccess"
echo ""
echo -e "${PURPLE}🌐 After upload, visit: https://${DOMAIN}${NC}"
echo ""

# Create individual file list for manual upload
echo -e "${YELLOW}📄 Creating file list for reference...${NC}"
find $LOCAL_DIR -type f > deployment-files.txt
echo -e "${GREEN}✅ File list saved to: deployment-files.txt${NC}"

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT PACKAGE READY!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "📦 Package: terrafusion-deployment.tar.gz"
echo -e "📋 File list: deployment-files.txt"
echo -e "🌐 Target: https://${DOMAIN}"
echo ""
echo -e "${YELLOW}Upload the package and extract it in public_html to deploy!${NC}"