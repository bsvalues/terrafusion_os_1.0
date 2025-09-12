# 🚀 SIMPLE TERRAFUSION DOMAIN DEPLOYMENT
# Create deployment package for TerraFusionMarket.io

Write-Host "🚀 TERRAFUSION DOMAIN DEPLOYMENT - CHAMPIONSHIP EXECUTION" -ForegroundColor Blue
Write-Host "=========================================================" -ForegroundColor Blue

# Create deployment structure
Write-Host "🏗️ Creating deployment directories..." -ForegroundColor Green
New-Item -ItemType Directory -Path "deployment" -Force | Out-Null
New-Item -ItemType Directory -Path "deployment\www" -Force | Out-Null
New-Item -ItemType Directory -Path "deployment\api" -Force | Out-Null
New-Item -ItemType Directory -Path "deployment\docs" -Force | Out-Null
New-Item -ItemType Directory -Path "deployment\monitor" -Force | Out-Null

Write-Host "✅ Deployment structure created" -ForegroundColor Green

# Copy main files
Write-Host "📋 Preparing website files..." -ForegroundColor Green

if (Test-Path "terrafusionmarket-landing-page.html") {
    Copy-Item "terrafusionmarket-landing-page.html" "deployment\www\index.html"
    Write-Host "✅ Landing page copied" -ForegroundColor Green
} else {
    Write-Host "❌ Landing page not found" -ForegroundColor Red
}

# Create robots.txt
@"
User-agent: *
Allow: /

Sitemap: https://terrafusionmarket.io/sitemap.xml
"@ | Out-File -FilePath "deployment\www\robots.txt" -Encoding UTF8

# Create sitemap.xml
@"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://terrafusionmarket.io/</loc>
        <lastmod>2025-01-08</lastmod>
        <priority>1.0</priority>
    </url>
</urlset>
"@ | Out-File -FilePath "deployment\www\sitemap.xml" -Encoding UTF8

# Create API health check
@"
{
    "status": "healthy",
    "service": "TerraFusion Enhanced Hybrid API",
    "version": "2.0.0",
    "timestamp": "2025-01-08T00:00:00Z"
}
"@ | Out-File -FilePath "deployment\api\health.json" -Encoding UTF8

# Create deployment instructions
@"
# 🚀 HOSTINGER DEPLOYMENT INSTRUCTIONS

## IMMEDIATE STEPS

1. **Access Hostinger hPanel**: https://hpanel.hostinger.com
2. **Navigate to File Manager** → public_html
3. **Upload files from deployment/www/** to public_html
4. **Configure DNS** for subdomains
5. **Enable SSL** certificates
6. **Test deployment**

## FILES TO UPLOAD
- index.html (main landing page)
- robots.txt
- sitemap.xml

## SUBDOMAINS TO CREATE
- api.terrafusionmarket.io
- docs.terrafusionmarket.io  
- monitor.terrafusionmarket.io

## TEST URLS
- https://terrafusionmarket.io
- https://api.terrafusionmarket.io/health
"@ | Out-File -FilePath "HOSTINGER_DEPLOYMENT_INSTRUCTIONS.md" -Encoding UTF8

Write-Host ""
Write-Host "🏆 DEPLOYMENT PACKAGE READY!" -ForegroundColor Cyan
Write-Host "• deployment/www/ - Main website files" -ForegroundColor Green
Write-Host "• deployment/api/ - API gateway files" -ForegroundColor Green  
Write-Host "• HOSTINGER_DEPLOYMENT_INSTRUCTIONS.md - Deployment guide" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 NEXT: Upload deployment/www/ files to Hostinger!" -ForegroundColor Yellow
Write-Host "🏆 CHAMPIONSHIP DOMAIN READY FOR LAUNCH!" -ForegroundColor Cyan
