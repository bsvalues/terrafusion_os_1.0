#!/bin/bash

#########################################################################
# TerraFusion Market - Hostinger Deployment Script
# Automated deployment to terrafusionmarket.io
#########################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="terrafusionmarket.io"
LOCAL_DIR="$(pwd)"
REMOTE_DIR="/public_html"
BACKUP_DIR="backups"
BUILD_DIR="dist"

echo -e "${BLUE}🚀 TerraFusion Market - Hostinger Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "📦 Domain: ${DOMAIN}"
echo -e "📁 Local: ${LOCAL_DIR}"
echo -e "🌐 Remote: ${REMOTE_DIR}"
echo ""

# Function to check dependencies
check_dependencies() {
    echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v lftp &> /dev/null; then
        echo -e "${YELLOW}⚠️  lftp not found. Installing...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install lftp
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y lftp
        else
            echo -e "${RED}❌ Please install lftp manually${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Dependencies check complete${NC}"
}

# Function to get FTP credentials
get_credentials() {
    echo -e "${YELLOW}🔐 Enter Hostinger FTP credentials:${NC}"
    
    read -p "FTP Host (e.g. ftp.hostinger.com): " FTP_HOST
    read -p "FTP Username: " FTP_USER
    read -sp "FTP Password: " FTP_PASS
    echo ""
    
    # Validate credentials
    if [[ -z "$FTP_HOST" || -z "$FTP_USER" || -z "$FTP_PASS" ]]; then
        echo -e "${RED}❌ All FTP credentials are required${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Credentials configured${NC}"
}

# Function to build production version
build_production() {
    echo -e "${YELLOW}🏗️  Building production version...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        npm install
    fi
    
    # Create build directory
    rm -rf ${BUILD_DIR}
    mkdir -p ${BUILD_DIR}
    
    # Copy main files
    cp index.html ${BUILD_DIR}/
    cp -r styles/ ${BUILD_DIR}/
    cp -r js/ ${BUILD_DIR}/
    
    # Copy server files (if they exist)
    if [ -d "server" ]; then
        cp -r server/ ${BUILD_DIR}/
    fi
    
    # Copy assets (if they exist)
    if [ -d "assets" ]; then
        cp -r assets/ ${BUILD_DIR}/
    fi
    
    # Copy configuration files
    cp .htaccess ${BUILD_DIR}/
    cp manifest.json ${BUILD_DIR}/ 2>/dev/null || echo "manifest.json not found, skipping"
    cp sw.js ${BUILD_DIR}/ 2>/dev/null || echo "sw.js not found, skipping"
    cp robots.txt ${BUILD_DIR}/ 2>/dev/null || echo "robots.txt not found, skipping"
    cp sitemap.xml ${BUILD_DIR}/ 2>/dev/null || echo "sitemap.xml not found, skipping"
    
    # Create necessary directories
    mkdir -p ${BUILD_DIR}/api
    mkdir -p ${BUILD_DIR}/admin
    mkdir -p ${BUILD_DIR}/portal
    
    echo -e "${GREEN}✅ Production build complete${NC}"
}

# Function to deploy files
deploy_files() {
    echo -e "${YELLOW}🚀 Deploying to Hostinger...${NC}"
    
    # Test FTP connection
    echo -e "${BLUE}🔌 Testing FTP connection...${NC}"
    lftp -u ${FTP_USER},${FTP_PASS} ${FTP_HOST} << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
ls
quit
EOF
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ FTP connection failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ FTP connection successful${NC}"
    
    # Upload files
    echo -e "${BLUE}📤 Uploading files...${NC}"
    lftp -u ${FTP_USER},${FTP_PASS} ${FTP_HOST} << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set ftp:passive-mode on
set mirror:use-pget-n 5
mirror -R ${BUILD_DIR}/ ${REMOTE_DIR}/ --verbose --delete --exclude-glob .git* --exclude-glob node_modules* --exclude-glob *.log
chmod -R 755 ${REMOTE_DIR}
quit
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Files uploaded successfully${NC}"
    else
        echo -e "${RED}❌ Upload failed${NC}"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    # Check if site is accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/ || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Site is accessible (HTTP 200)${NC}"
    else
        echo -e "${YELLOW}⚠️  Site returned HTTP ${HTTP_STATUS}${NC}"
    fi
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "check")
            check_dependencies
            ;;
        "build")
            check_dependencies
            build_production
            ;;
        "deploy")
            check_dependencies
            get_credentials
            build_production
            deploy_files
            verify_deployment
            echo -e "${GREEN}🎉 Deployment completed!${NC}"
            echo -e "${BLUE}🌐 Visit: https://${DOMAIN}${NC}"
            ;;
        *)
            echo -e "${YELLOW}Usage: $0 [check|build|deploy]${NC}"
            ;;
    esac
}

# Run main function
main "$@"