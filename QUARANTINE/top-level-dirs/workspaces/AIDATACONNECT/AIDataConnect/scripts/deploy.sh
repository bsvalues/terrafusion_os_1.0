#!/bin/bash

# RAG Drive FTP Hub Deployment Script
# This script handles the deployment process for the application

set -e  # Exit immediately if a command exits with a non-zero status

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
    echo -e "\n${BLUE}=====================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=====================================================================${NC}\n"
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        if [ -n "$3" ]; then
            echo -e "${RED}  Error: $3${NC}"
        fi
    fi
}

# Check if .env file exists
check_env_file() {
    print_header "Checking Environment Configuration"
    
    if [ -f ".env" ]; then
        print_status 0 "Environment file (.env) exists"
    else
        if [ -f ".env.example" ]; then
            echo -e "${YELLOW}Environment file (.env) not found, but .env.example exists${NC}"
            read -p "Do you want to create .env from .env.example? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp .env.example .env
                print_status 0 "Created .env from .env.example"
                echo -e "${YELLOW}Please edit .env with your production values before proceeding${NC}"
                exit 0
            else
                print_status 1 "Environment file (.env) is required for deployment"
                exit 1
            fi
        else
            print_status 1 "Environment file (.env) and .env.example not found"
            exit 1
        fi
    fi
}

# Create necessary directories
create_directories() {
    print_header "Creating Necessary Directories"
    
    mkdir -p logs uploads nginx/conf nginx/ssl nginx/logs scripts/db-init
    
    print_status 0 "Created required directories"
}

# Check SSL certificates
check_ssl_certificates() {
    print_header "Checking SSL Certificates"
    
    if [ -f "ftp-cert.pem" ] && [ -f "ftp-private.key" ]; then
        print_status 0 "SSL certificates for FTP found"
    else
        echo -e "${YELLOW}SSL certificates for FTP not found${NC}"
        read -p "Do you want to generate self-signed certificates? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ftp-private.key -out ftp-cert.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=ragdrive-ftphub.com"
            print_status $? "Generated self-signed certificates"
        else
            print_status 1 "SSL certificates are required for secure FTP"
            exit 1
        fi
    fi
    
    if [ -d "nginx/ssl" ]; then
        if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/key.pem" ]; then
            print_status 0 "SSL certificates for NGINX found"
        else
            echo -e "${YELLOW}SSL certificates for NGINX not found${NC}"
            read -p "Do you want to generate self-signed certificates? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=ragdrive-ftphub.com"
                print_status $? "Generated self-signed certificates"
            else
                print_status 1 "SSL certificates are required for HTTPS"
                exit 1
            fi
        fi
    else
        mkdir -p nginx/ssl
        echo -e "${YELLOW}Created nginx/ssl directory${NC}"
        read -p "Do you want to generate self-signed certificates? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=ragdrive-ftphub.com"
            print_status $? "Generated self-signed certificates"
        else
            print_status 1 "SSL certificates are required for HTTPS"
            exit 1
        fi
    fi
}

# Configure NGINX
configure_nginx() {
    print_header "Configuring NGINX"
    
    if [ ! -f "nginx/conf/default.conf" ]; then
        cat > nginx/conf/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name _;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'";
    
    # Proxy to Express app
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Increase body size for file uploads
    client_max_body_size 100M;
}
EOF
        print_status $? "Created NGINX configuration"
    else
        print_status 0 "NGINX configuration already exists"
    fi
}

# Run deployment
deploy_with_docker() {
    print_header "Deploying with Docker Compose"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_status 1 "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_status 1 "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Create database backup if the application is already running
    if docker-compose ps | grep -q "rag-drive-db"; then
        echo -e "${YELLOW}Existing database detected. Creating backup...${NC}"
        ./scripts/db-backup.sh || true
    fi
    
    # Build and start the containers
    echo "Building and starting containers..."
    if docker-compose up -d --build; then
        print_status 0 "Deployed successfully"
    else
        print_status 1 "Deployment failed"
        exit 1
    fi
    
    # Verify deployment
    echo "Verifying deployment..."
    sleep 10
    
    if docker-compose ps | grep -q "Up"; then
        print_status 0 "Containers are running"
    else
        print_status 1 "Containers failed to start"
        echo "Logs:"
        docker-compose logs
        exit 1
    fi
}

# Run deployment without Docker
deploy_manually() {
    print_header "Deploying Manually"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_status 1 "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    print_status $? "Installed dependencies"
    
    # Build the application
    echo "Building application..."
    npm run build
    print_status $? "Built application"
    
    # Set up the database
    echo "Setting up database..."
    npm run db:push
    print_status $? "Set up database"
    
    # Start the application
    echo "Starting application..."
    if [ -f "process.json" ]; then
        # Use PM2 if available
        if command -v pm2 &> /dev/null; then
            pm2 start process.json
            print_status $? "Started application with PM2"
        else
            echo -e "${YELLOW}PM2 not found, starting with node${NC}"
            NODE_ENV=production node server/index.js &
            print_status $? "Started application with Node.js"
        fi
    else
        # Start directly with Node.js
        NODE_ENV=production node server/index.js &
        print_status $? "Started application with Node.js"
    fi
}

# Main function
main() {
    print_header "RAG Drive FTP Hub Deployment"
    echo "This script will deploy the RAG Drive FTP Hub application."
    echo -e "${YELLOW}Please ensure you have reviewed the deployment guide before proceeding.${NC}"
    echo
    
    read -p "Do you want to continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment canceled.${NC}"
        exit 1
    fi
    
    # Run pre-deployment checks
    check_env_file
    create_directories
    check_ssl_certificates
    configure_nginx
    
    # Choose deployment method
    echo
    echo "Deployment methods:"
    echo "1) Docker Compose (recommended)"
    echo "2) Manual (Node.js)"
    echo
    read -p "Select deployment method (1/2): " deployment_method
    
    case $deployment_method in
        1)
            deploy_with_docker
            ;;
        2)
            deploy_manually
            ;;
        *)
            echo -e "${RED}Invalid selection. Deployment canceled.${NC}"
            exit 1
            ;;
    esac
    
    print_header "Deployment Complete"
    echo -e "${GREEN}RAG Drive FTP Hub has been deployed successfully!${NC}"
    
    # Display access information
    echo
    echo "Access Information:"
    echo "- Web Interface: https://your-domain.com"
    echo "- API Endpoint: https://your-domain.com/api"
    echo "- FTP Server: ftps://your-domain.com:21"
    echo
    echo -e "${YELLOW}Important: Please complete the post-deployment steps as outlined in the deployment guide.${NC}"
}

# Run the main function
main