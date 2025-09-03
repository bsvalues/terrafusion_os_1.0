#!/bin/bash

# TerraFusion Market - One-Click Deployment Script
# Deploy your website to terrafusionmarket.io instantly

set -e

echo "🚀 TerraFusion Market Deployment Script"
echo "======================================="

# Configuration
DOMAIN="terrafusionmarket.io"
FTP_HOST="ftp.${DOMAIN}"
PUBLIC_HTML="/public_html"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Step 1: Preparing deployment files...${NC}"

# Create deployment directory
mkdir -p deployment-ready

# Copy and rename landing page
cp terrafusionmarket-landing-page.html deployment-ready/index.html

# Copy API demo response
cp api_demo_response.json deployment-ready/

# Copy any additional assets
cp -r deployment/www/* deployment-ready/ 2>/dev/null || true

echo -e "${GREEN}✅ Files prepared for deployment${NC}"

# Option 1: FTP Upload (if credentials are available)
deploy_via_ftp() {
    echo -e "${BLUE}📤 Deploying via FTP...${NC}"
    
    # Check if lftp is installed
    if ! command -v lftp &> /dev/null; then
        echo "Installing lftp..."
        sudo apt-get update && sudo apt-get install -y lftp
    fi
    
    echo "Enter your Hostinger FTP credentials:"
    read -p "FTP Username: " FTP_USER
    read -sp "FTP Password: " FTP_PASS
    echo
    
    # Upload files via FTP
    lftp -c "
        set ssl:verify-certificate no
        open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST
        mirror -R deployment-ready/ $PUBLIC_HTML
        bye
    "
    
    echo -e "${GREEN}✅ Files uploaded successfully!${NC}"
}

# Option 2: Generate deployment package
generate_package() {
    echo -e "${BLUE}📦 Generating deployment package...${NC}"
    
    # Create a timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PACKAGE_NAME="terrafusion_deployment_${TIMESTAMP}.tar.gz"
    
    # Create compressed package
    tar -czf $PACKAGE_NAME -C deployment-ready .
    
    echo -e "${GREEN}✅ Deployment package created: $PACKAGE_NAME${NC}"
    echo
    echo "📋 Manual deployment instructions:"
    echo "1. Log into Hostinger hPanel"
    echo "2. Go to File Manager"
    echo "3. Navigate to public_html"
    echo "4. Upload and extract $PACKAGE_NAME"
    echo "5. Your site will be live at https://${DOMAIN}"
}

# Option 3: Git deployment
deploy_via_git() {
    echo -e "${BLUE}🔄 Setting up Git deployment...${NC}"
    
    cd deployment-ready
    
    # Initialize git repo
    git init
    git add .
    git commit -m "TerraFusion Market - Production Deployment"
    
    # Add remote (you'll need to set this up in Hostinger)
    echo "Enter your Hostinger Git remote URL:"
    read -p "Git Remote: " GIT_REMOTE
    
    git remote add hostinger $GIT_REMOTE
    git push -u hostinger master
    
    echo -e "${GREEN}✅ Deployed via Git!${NC}"
}

# Create a comprehensive deployment HTML with all features
create_enhanced_landing() {
    echo -e "${BLUE}🎨 Creating enhanced landing page...${NC}"
    
    cat > deployment-ready/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Market - AI-Powered Government Solutions</title>
    <meta name="description" content="Revolutionary AI platform transforming government operations with 14 integrated applications">
    
    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='tfGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%231e3a8a;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z' fill='url(%23tfGradient)' /%3E%3Ctext x='50' y='58' font-size='28' font-weight='bold' fill='white' text-anchor='middle'%3ETF%3C/text%3E%3C/svg%3E">
    
    <style>
        :root {
            --tf-primary: #1e3a8a;
            --tf-secondary: #10b981;
            --tf-accent: #3b82f6;
            --tf-dark: #0f172a;
            --tf-gradient: linear-gradient(135deg, var(--tf-primary), var(--tf-accent));
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--tf-dark);
            color: white;
            overflow-x: hidden;
        }
        
        .hero {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            position: relative;
            z-index: 1;
        }
        
        .logo {
            display: inline-flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 40px;
        }
        
        .logo svg {
            filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4));
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        h1 {
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 20px;
            background: var(--tf-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.2;
        }
        
        .subtitle {
            font-size: 1.5rem;
            color: #94a3b8;
            margin-bottom: 40px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 60px 0;
        }
        
        .stat-card {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            background: var(--tf-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .stat-label {
            color: #94a3b8;
            margin-top: 8px;
        }
        
        .cta-group {
            display: flex;
            gap: 20px;
            margin-top: 40px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
            font-size: 1.1rem;
        }
        
        .btn-primary {
            background: var(--tf-gradient);
            color: white;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
        }
        
        .btn-secondary {
            background: transparent;
            color: white;
            border: 2px solid var(--tf-accent);
        }
        
        .btn-secondary:hover {
            background: var(--tf-accent);
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }
        
        .features {
            margin-top: 80px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .feature {
            background: rgba(30, 41, 59, 0.3);
            border: 1px solid rgba(59, 130, 246, 0.1);
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .feature:hover {
            border-color: var(--tf-accent);
            background: rgba(30, 41, 59, 0.5);
            transform: translateY(-2px);
        }
        
        .api-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--tf-secondary);
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            z-index: 1000;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: var(--tf-secondary);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 2.5rem; }
            .subtitle { font-size: 1.2rem; }
            .stats { grid-template-columns: 1fr; }
            .cta-group { flex-direction: column; }
            .btn { width: 100%; justify-content: center; }
        }
    </style>
</head>
<body>
    <div class="api-status">
        <div class="status-dot"></div>
        <span>API Status: Online</span>
    </div>
    
    <div class="hero">
        <div class="container">
            <div class="logo">
                <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="tfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="url(#tfGradient)" />
                    <text x="50" y="58" font-size="28" font-weight="bold" fill="white" text-anchor="middle">TF</text>
                </svg>
            </div>
            
            <h1>TerraFusion Market</h1>
            <p class="subtitle">Revolutionary AI Platform Transforming Government Operations</p>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">14</div>
                    <div class="stat-label">Integrated Applications</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">100%</div>
                    <div class="stat-label">Platform Ready</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">3,000+</div>
                    <div class="stat-label">Counties Addressable</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">$67.5B</div>
                    <div class="stat-label">Market Opportunity</div>
                </div>
            </div>
            
            <div class="cta-group">
                <a href="https://api.terrafusionmarket.io/health" class="btn btn-primary">
                    Test API Endpoint
                </a>
                <a href="#features" class="btn btn-secondary">
                    Explore Features
                </a>
                <a href="mailto:contact@terrafusionmarket.io" class="btn btn-secondary">
                    Contact Sales
                </a>
            </div>
            
            <div class="features" id="features">
                <div class="feature">
                    <h3>🤖 AI-Powered</h3>
                    <p>Advanced hybrid LLM system with local and cloud processing</p>
                </div>
                <div class="feature">
                    <h3>🔒 Government-Grade Security</h3>
                    <p>Enterprise security with complete data sovereignty</p>
                </div>
                <div class="feature">
                    <h3>⚡ High Performance</h3>
                    <p>Native desktop apps with <2 second startup times</p>
                </div>
                <div class="feature">
                    <h3>🌐 Unified Platform</h3>
                    <p>Single ecosystem for all government operations</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Test API connectivity
        fetch('https://api.terrafusionmarket.io/health')
            .then(r => r.json())
            .then(data => console.log('API Status:', data))
            .catch(err => console.log('API Check:', err));
            
        // Add smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ Enhanced landing page created${NC}"
}

# Main menu
echo
echo "Choose deployment method:"
echo "1) FTP Upload (Direct to Hostinger)"
echo "2) Generate Deployment Package (Manual upload)"
echo "3) Git Deployment (Requires setup)"
echo "4) Create Enhanced Landing Page"
echo "5) Full Automated Deployment (All steps)"

read -p "Select option (1-5): " OPTION

case $OPTION in
    1)
        deploy_via_ftp
        ;;
    2)
        generate_package
        ;;
    3)
        deploy_via_git
        ;;
    4)
        create_enhanced_landing
        generate_package
        ;;
    5)
        create_enhanced_landing
        deploy_via_ftp
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo
echo -e "${GREEN}🎉 Deployment process complete!${NC}"
echo
echo "📝 Next Steps:"
echo "1. Configure DNS in Hostinger (if not done)"
echo "2. Enable SSL certificate"
echo "3. Set up monitoring"
echo "4. Deploy API to api.terrafusionmarket.io"
echo
echo "🌐 Your site will be live at: https://${DOMAIN}"
echo
echo "📊 Monitor deployment at:"
echo "   - Main site: https://www.${DOMAIN}"
echo "   - API Health: https://api.${DOMAIN}/health"
echo "   - Documentation: https://docs.${DOMAIN}"