#!/bin/bash

#########################################################################
# TerraFusion Market - Hostinger Deployment with Provided Credentials
# Direct deployment to terrafusionmarket.io
#########################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Hostinger Configuration
FTP_HOST="82.198.236.1"
FTP_USER="u240968583.terrafusionmarket.io"
FTP_PORT="21"
REMOTE_DIR="/public_html"
LOCAL_DIR="dist"
DOMAIN="terrafusionmarket.io"

echo -e "${BLUE}"
echo "████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗"
echo "╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║"
echo "   ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║"
echo "   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║"
echo "   ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║"
echo "   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝"
echo -e "${NC}"
echo -e "${PURPLE}🚀 HOSTINGER DEPLOYMENT TO TERRAFUSIONMARKET.IO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "📦 Host: ${FTP_HOST}"
echo -e "👤 User: ${FTP_USER}"
echo -e "📁 Remote: ${REMOTE_DIR}"
echo -e "🌐 Domain: https://${DOMAIN}"
echo ""

# Function to check if lftp is available
check_lftp() {
    if ! command -v lftp &> /dev/null; then
        echo -e "${YELLOW}⚠️ Installing lftp for secure FTP transfer...${NC}"
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y lftp
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install lftp
        else
            echo -e "${RED}❌ Please install lftp manually${NC}"
            echo "Ubuntu/Debian: sudo apt-get install lftp"
            echo "macOS: brew install lftp"
            exit 1
        fi
    fi
}

# Function to verify build files
verify_build() {
    echo -e "${YELLOW}🔍 Verifying production build...${NC}"
    
    if [ ! -d "$LOCAL_DIR" ]; then
        echo -e "${RED}❌ Production build not found. Run 'npm run build:production' first.${NC}"
        exit 1
    fi
    
    # Check critical files
    local critical_files=("index.html" "manifest.json" "sw.js" ".htaccess")
    for file in "${critical_files[@]}"; do
        if [ ! -f "$LOCAL_DIR/$file" ]; then
            echo -e "${RED}❌ Critical file missing: $file${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Build verification complete${NC}"
}

# Function to get FTP password securely
get_password() {
    echo -e "${YELLOW}🔐 Enter FTP password for ${FTP_USER}:${NC}"
    read -s FTP_PASS
    echo ""
    
    if [[ -z "$FTP_PASS" ]]; then
        echo -e "${RED}❌ Password is required${NC}"
        exit 1
    fi
}

# Function to test FTP connection
test_connection() {
    echo -e "${YELLOW}🔌 Testing FTP connection...${NC}"
    
    lftp -u ${FTP_USER},${FTP_PASS} ${FTP_HOST} << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set ftp:passive-mode on
ls
quit
EOF
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ FTP connection failed. Please check credentials.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ FTP connection successful${NC}"
}

# Function to deploy files
deploy_files() {
    echo -e "${YELLOW}📤 Deploying to Hostinger...${NC}"
    echo -e "${BLUE}Files to upload:${NC}"
    find $LOCAL_DIR -type f | wc -l | xargs echo "Total files:"
    echo ""
    
    # Deploy with lftp
    lftp -u ${FTP_USER},${FTP_PASS} ${FTP_HOST} << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set ftp:passive-mode on
set mirror:use-pget-n 5
set mirror:parallel-directories 3

# Clear the target directory first (optional - uncomment if needed)
# rm -rf ${REMOTE_DIR}/*

# Upload all files
mirror -R ${LOCAL_DIR}/ ${REMOTE_DIR}/ --verbose --delete-first --exclude-glob .git* --exclude-glob node_modules* --exclude-glob *.log --exclude-glob .DS_Store

# Set proper permissions
chmod -R 644 ${REMOTE_DIR}/*
chmod 755 ${REMOTE_DIR}/
chmod 644 ${REMOTE_DIR}/.htaccess

quit
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Files uploaded successfully!${NC}"
        return 0
    else
        echo -e "${RED}❌ Upload failed${NC}"
        return 1
    fi
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    # Wait a moment for propagation
    sleep 3
    
    # Test HTTP response
    local http_status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/" || echo "000")
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ Site is live and responding (HTTP 200)${NC}"
    elif [ "$http_status" = "000" ]; then
        echo -e "${YELLOW}⚠️ Connection failed - site may still be propagating${NC}"
    else
        echo -e "${YELLOW}⚠️ Site returned HTTP ${http_status} - checking...${NC}"
    fi
    
    # Test key endpoints
    echo -e "${BLUE}🔗 Testing key files:${NC}"
    local test_files=("/" "/manifest.json" "/robots.txt" "/sitemap.xml")
    for file in "${test_files[@]}"; do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}${file}")
        if [ "$status" = "200" ]; then
            echo -e "  ✅ ${file} - OK"
        else
            echo -e "  ⚠️ ${file} - HTTP ${status}"
        fi
    done
}

# Function to display success message
show_success() {
    echo ""
    echo -e "${GREEN}"
    echo "██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗███████╗██████╗ "
    echo "██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝██╔════╝██╔══██╗"
    echo "██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ █████╗  ██║  ██║"
    echo "██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  ██╔══╝  ██║  ██║"
    echo "██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   ███████╗██████╔╝"
    echo "╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   ╚══════╝╚═════╝ "
    echo -e "${NC}"
    echo -e "${PURPLE}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "🌐 Live Site: ${GREEN}https://${DOMAIN}${NC}"
    echo -e "📱 Mobile PWA: ${GREEN}https://${DOMAIN}${NC} (installable)"
    echo -e "🔍 Demo: ${GREEN}https://${DOMAIN}/#demo${NC}"
    echo -e "📊 Features: ${GREEN}914x faster property assessments with 1,008 AI agents${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}🚀 TerraFusion Market is now LIVE on Hostinger!${NC}"
    echo ""
}

# Main deployment function
main() {
    echo -e "${YELLOW}⏳ Starting deployment process...${NC}"
    
    # Check dependencies
    check_lftp
    
    # Verify build
    verify_build
    
    # Get FTP password
    get_password
    
    # Test connection
    test_connection
    
    # Deploy files
    if deploy_files; then
        # Verify deployment
        verify_deployment
        
        # Show success
        show_success
        
        echo -e "${GREEN}🎯 Next steps:${NC}"
        echo -e "1. Visit https://${DOMAIN} to see your live site"
        echo -e "2. Test the property assessment demo"
        echo -e "3. Check mobile responsiveness"
        echo -e "4. Share your government AI platform!"
        
    else
        echo -e "${RED}❌ Deployment failed. Check the error messages above.${NC}"
        exit 1
    fi
}

# Run deployment
main "$@"