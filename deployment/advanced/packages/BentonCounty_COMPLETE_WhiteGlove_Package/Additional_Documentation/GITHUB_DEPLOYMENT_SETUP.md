# 🚀 GitHub Deployment Setup for TerraFusionMarket.io

## Step 1: Create New GitHub Repository

### Option A: Via GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `terrafusion-market`
3. Description: "Official Terrafusion Market - AI-Powered Government Solutions
   Platform"
4. Public repository (for GitHub Pages)
5. Initialize with README: No (we'll push our own)
6. Create repository

### Option B: Via GitHub CLI

```bash
gh repo create terrafusion-market --public --description "Official Terrafusion Market - AI-Powered Government Solutions Platform"
```

## Step 2: Initialize Local Repository

```bash
cd /mnt/e/TerraFusion_Tauri_Master_Workspace

# Create a new directory for the website
mkdir terrafusion-market-website
cd terrafusion-market-website

# Initialize git
git init

# Copy deployment files
cp ../terrafusionmarket-landing-page.html index.html
cp ../api_demo_response.json .
cp -r ../deployment/www/* . 2>/dev/null || true

# Create GitHub Pages configuration
echo "terrafusionmarket.io" > CNAME

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*.log
.env
.env.local

# Build outputs
dist/
build/
.cache/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
EOF

# Initial commit
git add .
git commit -m "🚀 Initial commit - Terrafusion Market launch"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/terrafusion-market.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

### Via GitHub Web Interface:

1. Go to your repository: https://github.com/YOUR_USERNAME/terrafusion-market
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: main
5. Folder: / (root)
6. Click Save

### Via GitHub CLI:

```bash
gh api repos/YOUR_USERNAME/terrafusion-market/pages \
  --method POST \
  --field source='{"branch":"main","path":"/"}'
```

## Step 4: Configure Custom Domain in Hostinger

### DNS Settings in Hostinger:

```dns
# Add these DNS records in Hostinger hPanel

Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
TTL: 14400

Type: A
Name: @
Value: 185.199.108.153
TTL: 14400

Type: A
Name: @
Value: 185.199.109.153
TTL: 14400

Type: A
Name: @
Value: 185.199.110.153
TTL: 14400

Type: A
Name: @
Value: 185.199.111.153
TTL: 14400
```

## Step 5: Setup GitHub Actions for CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm init -y
          npm install --save-dev prettier htmlhint

      - name: Validate HTML
        run: npx htmlhint index.html

      - name: Format check
        run: npx prettier --check index.html

      - name: Build site
        run: |
          echo "Building Terrafusion Market..."
          # Add any build steps here if needed

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Step 6: Advanced Features Setup

### A. API Status Monitor

Create `api-status.js`:

```javascript
// Real-time API status monitoring
const API_ENDPOINT = 'https://api.terrafusionmarket.io/health';
const STATUS_CHECK_INTERVAL = 30000; // 30 seconds

async function checkAPIStatus() {
  const statusElement = document.querySelector('.api-status');
  const statusDot = document.querySelector('.status-dot');
  const statusText = statusElement.querySelector('span');

  try {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();

    statusDot.style.background = '#10b981';
    statusText.textContent = 'API Status: Online';
    console.log('API Health:', data);
  } catch (error) {
    statusDot.style.background = '#ef4444';
    statusText.textContent = 'API Status: Offline';
    console.error('API Error:', error);
  }
}

// Check on load and every 30 seconds
checkAPIStatus();
setInterval(checkAPIStatus, STATUS_CHECK_INTERVAL);
```

### B. Analytics Integration

Create `analytics.html`:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'YOUR_CLARITY_ID');
</script>
```

## Step 7: Automatic Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Terrafusion Market - GitHub Deployment Script

set -e

echo "🚀 Deploying Terrafusion Market to GitHub Pages"

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git remote add origin https://github.com/YOUR_USERNAME/terrafusion-market.git
fi

# Ensure CNAME file exists
echo "terrafusionmarket.io" > CNAME

# Stage all changes
git add .

# Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "🚀 Deploy update: $TIMESTAMP" || echo "No changes to commit"

# Push to GitHub
git push -u origin main

echo "✅ Deployment complete!"
echo "🌐 Your site will be live at: https://terrafusionmarket.io"
echo "📊 GitHub Pages: https://YOUR_USERNAME.github.io/terrafusion-market"
echo ""
echo "⏱️ Note: DNS propagation may take up to 24 hours"
```

## Step 8: Repository Structure

```
terrafusion-market/
├── index.html                 # Main landing page
├── CNAME                      # Custom domain configuration
├── api-status.js              # API monitoring script
├── api_demo_response.json     # API demo data
├── robots.txt                 # SEO configuration
├── sitemap.xml               # Search engine sitemap
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
├── assets/
│   ├── css/
│   │   └── style.css        # Styles (if separated)
│   ├── js/
│   │   └── main.js          # JavaScript (if separated)
│   └── images/
│       └── logo.svg          # Terrafusion logo
├── docs/
│   └── README.md            # Documentation
├── .gitignore               # Git ignore file
├── LICENSE                  # License file
├── README.md               # Repository readme
└── deploy.sh               # Deployment script
```

## Step 9: First Deployment

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Step 10: Verify Deployment

1. **Check GitHub Pages status:**
   - https://github.com/YOUR_USERNAME/terrafusion-market/settings/pages
   - Should show "Your site is live at https://terrafusionmarket.io"

2. **Test URLs:**
   - https://YOUR_USERNAME.github.io/terrafusion-market (GitHub URL)
   - https://terrafusionmarket.io (Custom domain)
   - https://www.terrafusionmarket.io (WWW subdomain)

3. **Monitor deployment:**
   - GitHub Actions: https://github.com/YOUR_USERNAME/terrafusion-market/actions
   - Pages deployment:
     https://github.com/YOUR_USERNAME/terrafusion-market/deployments

## Continuous Deployment Workflow

After initial setup, updating is simple:

```bash
# Make changes to your files
edit index.html

# Deploy with one command
./deploy.sh

# Or manually:
git add .
git commit -m "Update: description of changes"
git push
```

GitHub Actions will automatically:

1. Validate HTML
2. Run tests
3. Build the site
4. Deploy to GitHub Pages
5. Update the live site

## Benefits of This Setup

✅ **Version Control**: Complete history of all changes ✅ **Automatic
Deployment**: Push to deploy ✅ **Free Hosting**: GitHub Pages is free for
public repos ✅ **HTTPS Included**: Automatic SSL certificates ✅ **Global
CDN**: GitHub's CDN for fast loading ✅ **CI/CD Pipeline**: Automated testing
and deployment ✅ **Rollback Capability**: Easy to revert changes ✅
**Collaboration**: Multiple developers can contribute ✅ **Issue Tracking**:
Built-in issue management ✅ **Documentation**: Wiki and README support

## Troubleshooting

### DNS not working?

- Wait up to 24 hours for propagation
- Verify CNAME file exists in repository
- Check DNS settings in Hostinger

### Page not updating?

- Check GitHub Actions for errors
- Clear browser cache
- Wait 10 minutes for GitHub Pages cache

### Custom domain SSL issues?

- GitHub automatically provisions SSL
- May take up to 24 hours
- Check https://github.com/YOUR_USERNAME/terrafusion-market/settings/pages

---

_Your Terrafusion Market website is now ready for continuous deployment!_
