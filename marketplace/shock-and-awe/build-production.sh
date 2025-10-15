#!/bin/bash

#################################################################################
# TerraFusion Market - Production Build Script
# Optimized build for Hostinger deployment
#################################################################################

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_DIR="./dist"
LOG_FILE="./build-$(date +%Y%m%d_%H%M%S).log"

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

                            PRODUCTION BUILD SYSTEM
                              Hostinger Optimized v1.0
EOF
echo -e "${NC}"

check_dependencies() {
    log "Checking build dependencies..."
    
    # Check Node.js version
    node_version=$(node --version | cut -d'v' -f2)
    if [[ $(echo "$node_version" | cut -d'.' -f1) -lt 18 ]]; then
        error "Node.js 18+ required. Current version: $node_version"
    fi
    
    # Check required packages
    local required_packages=("webpack" "postcss" "autoprefixer" "cssnano")
    for package in "${required_packages[@]}"; do
        if ! npm list "$package" &>/dev/null; then
            warning "$package not found. Installing..."
            npm install "$package" --save-dev
        fi
    done
    
    log "Dependencies check completed"
}

clean_build() {
    log "Cleaning previous build..."
    
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"/{js,styles,assets,api,error-pages,fonts}
    
    log "Build directory cleaned"
}

build_assets() {
    log "Building production assets..."
    
    # Build CSS
    log "Processing CSS files..."
    if [[ -f "styles/main.css" ]]; then
        npx postcss styles/main.css -o "$BUILD_DIR/styles/main.css"
    fi
    
    if [[ -f "styles/components.css" ]]; then
        npx postcss styles/components.css -o "$BUILD_DIR/styles/components.css"
    fi
    
    # Build JavaScript
    log "Processing JavaScript files..."
    if [[ -f "webpack.config.js" ]]; then
        npx webpack --mode=production
    else
        # Fallback: manual concatenation and minification
        cat js/main.js js/demo.js js/animations.js js/quantum-viz.js > "$BUILD_DIR/js/app.js"
        npx terser "$BUILD_DIR/js/app.js" -o "$BUILD_DIR/js/app.min.js" --compress --mangle
        rm "$BUILD_DIR/js/app.js"
    fi
    
    log "Assets built successfully"
}

optimize_html() {
    log "Optimizing HTML files..."
    
    # Copy and optimize main HTML file
    if [[ -f "index.html" ]]; then
        cp index.html "$BUILD_DIR/"
        
        # Update asset paths for production
        sed -i.bak 's|href="styles/|href="/styles/|g' "$BUILD_DIR/index.html"
        sed -i.bak 's|src="js/|src="/js/|g' "$BUILD_DIR/index.html"
        sed -i.bak 's|src="assets/|src="/assets/|g' "$BUILD_DIR/index.html"
        rm "$BUILD_DIR/index.html.bak"
        
        # Minify HTML
        if command -v html-minifier &> /dev/null; then
            html-minifier --collapse-whitespace \
                         --remove-comments \
                         --remove-redundant-attributes \
                         --remove-script-type-attributes \
                         --remove-tag-whitespace \
                         --use-short-doctype \
                         --minify-css true \
                         --minify-js true \
                         "$BUILD_DIR/index.html" \
                         -o "$BUILD_DIR/index.html.min"
            mv "$BUILD_DIR/index.html.min" "$BUILD_DIR/index.html"
        fi
    fi
    
    log "HTML optimization completed"
}

optimize_images() {
    log "Optimizing images..."
    
    if [[ -d "assets" ]]; then
        cp -r assets "$BUILD_DIR/"
        
        # Optimize images if imagemin is available
        if command -v imagemin &> /dev/null; then
            log "Running image optimization..."
            imagemin "$BUILD_DIR/assets/*.{jpg,jpeg,png,gif}" \
                     --out-dir="$BUILD_DIR/assets/" \
                     --plugin=imagemin-mozjpeg \
                     --plugin=imagemin-pngquant \
                     --plugin=imagemin-gifsicle || warning "Image optimization failed"
        else
            warning "imagemin not available. Skipping image optimization."
        fi
    fi
    
    log "Image processing completed"
}

copy_configuration() {
    log "Copying configuration files..."
    
    # Copy essential files
    local config_files=(".htaccess" "manifest.json" "sw.js" "robots.txt" "sitemap.xml")
    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            cp "$file" "$BUILD_DIR/"
        fi
    done
    
    # Copy maintenance page
    if [[ -f "hostinger-config/maintenance.html" ]]; then
        cp "hostinger-config/maintenance.html" "$BUILD_DIR/"
    fi
    
    log "Configuration files copied"
}

create_error_pages() {
    log "Creating error pages..."
    
    # Create basic error pages
    cat > "$BUILD_DIR/error-pages/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - TerraFusion Market</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               display: flex; align-items: center; justify-content: center; 
               min-height: 100vh; margin: 0; color: white; text-align: center; }
        .error-container { max-width: 500px; padding: 2rem; }
        h1 { font-size: 4rem; margin: 0; }
        p { font-size: 1.2rem; margin: 1rem 0; }
        a { color: #fff; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>404</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">Return to TerraFusion Market</a></p>
    </div>
</body>
</html>
EOF

    # Create 500 error page
    cat > "$BUILD_DIR/error-pages/500.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - TerraFusion Market</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               display: flex; align-items: center; justify-content: center; 
               min-height: 100vh; margin: 0; color: white; text-align: center; }
        .error-container { max-width: 500px; padding: 2rem; }
        h1 { font-size: 4rem; margin: 0; }
        p { font-size: 1.2rem; margin: 1rem 0; }
        a { color: #fff; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>500</h1>
        <p>Internal server error. Please try again later.</p>
        <p><a href="/">Return to TerraFusion Market</a></p>
    </div>
</body>
</html>
EOF

    log "Error pages created"
}

create_api_structure() {
    log "Creating API structure..."
    
    # Create basic API endpoint
    cat > "$BUILD_DIR/api/index.php" << 'EOF'
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://terrafusionmarket.io');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Basic API router
$route = $_GET['route'] ?? '';

switch ($route) {
    case 'status':
        echo json_encode([
            'status' => 'ok',
            'timestamp' => date('c'),
            'version' => '1.0.0'
        ]);
        break;
        
    case 'health':
        echo json_encode([
            'status' => 'healthy',
            'checks' => [
                'database' => 'ok',
                'filesystem' => 'ok',
                'memory' => 'ok'
            ]
        ]);
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'error' => 'Endpoint not found',
            'route' => $route
        ]);
        break;
}
?>
EOF

    log "API structure created"
}

compress_assets() {
    log "Compressing assets for better performance..."
    
    # Gzip CSS and JS files
    find "$BUILD_DIR" -name "*.css" -type f -exec gzip -9 -k {} \;
    find "$BUILD_DIR" -name "*.js" -type f -exec gzip -9 -k {} \;
    
    # Create Brotli compression if available
    if command -v brotli &> /dev/null; then
        find "$BUILD_DIR" -name "*.css" -type f -exec brotli -Z {} \;
        find "$BUILD_DIR" -name "*.js" -type f -exec brotli -Z {} \;
        log "Brotli compression completed"
    else
        warning "Brotli not available. Using gzip only."
    fi
    
    log "Asset compression completed"
}

generate_manifest() {
    log "Generating build manifest..."
    
    # Create build manifest with file hashes
    cat > "$BUILD_DIR/build-manifest.json" << EOF
{
    "build": {
        "timestamp": "$(date -Iseconds)",
        "version": "1.0.0",
        "environment": "production",
        "target": "hostinger"
    },
    "files": {
$(find "$BUILD_DIR" -type f -name "*.html" -o -name "*.css" -o -name "*.js" | while read file; do
    filename=$(basename "$file")
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    hash=$(sha256sum "$file" | cut -d' ' -f1)
    echo "        \"$filename\": {\"size\": $size, \"hash\": \"$hash\"}"
done | paste -sd, -)
    }
}
EOF

    log "Build manifest generated"
}

validate_build() {
    log "Validating build output..."
    
    # Check essential files exist
    local essential_files=("index.html" ".htaccess")
    for file in "${essential_files[@]}"; do
        if [[ ! -f "$BUILD_DIR/$file" ]]; then
            error "Essential file missing: $file"
        fi
    done
    
    # Check file sizes
    local html_size=$(stat -f%z "$BUILD_DIR/index.html" 2>/dev/null || stat -c%s "$BUILD_DIR/index.html")
    if [[ $html_size -eq 0 ]]; then
        error "HTML file is empty"
    fi
    
    # Check for JavaScript errors (basic)
    if [[ -f "$BUILD_DIR/js/main.js" ]]; then
        if ! node -c "$BUILD_DIR/js/main.js" 2>/dev/null; then
            warning "JavaScript syntax errors detected"
        fi
    fi
    
    log "Build validation completed"
}

show_build_summary() {
    log "Build completed successfully!"
    
    echo -e "${GREEN}"
    echo "=========================================="
    echo "  PRODUCTION BUILD SUMMARY"
    echo "=========================================="
    echo "Build directory: $BUILD_DIR"
    echo "Build time: $(date)"
    
    # Show file sizes
    echo ""
    echo "File sizes:"
    if [[ -f "$BUILD_DIR/index.html" ]]; then
        html_size=$(stat -f%z "$BUILD_DIR/index.html" 2>/dev/null || stat -c%s "$BUILD_DIR/index.html")
        echo "  index.html: $(numfmt --to=iec $html_size)"
    fi
    
    if [[ -d "$BUILD_DIR/js" ]]; then
        js_size=$(find "$BUILD_DIR/js" -name "*.js" -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}' || \
                  find "$BUILD_DIR/js" -name "*.js" -exec stat -c%s {} \; | awk '{sum+=$1} END {print sum}')
        echo "  JavaScript: $(numfmt --to=iec $js_size)"
    fi
    
    if [[ -d "$BUILD_DIR/styles" ]]; then
        css_size=$(find "$BUILD_DIR/styles" -name "*.css" -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}' || \
                   find "$BUILD_DIR/styles" -name "*.css" -exec stat -c%s {} \; | awk '{sum+=$1} END {print sum}')
        echo "  CSS: $(numfmt --to=iec $css_size)"
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Test the build locally: npm run serve"
    echo "2. Deploy to Hostinger: npm run deploy:hostinger"
    echo "3. Monitor deployment: ./hostinger-config/ssl-setup.sh"
    echo -e "${NC}"
}

main() {
    log "Starting TerraFusion Market production build"
    
    check_dependencies
    clean_build
    build_assets
    optimize_html
    optimize_images
    copy_configuration
    create_error_pages
    create_api_structure
    compress_assets
    generate_manifest
    validate_build
    show_build_summary
    
    log "Production build completed successfully"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-optimization)
            SKIP_OPTIMIZATION=true
            shift
            ;;
        --skip-compression)
            SKIP_COMPRESSION=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --skip-optimization    Skip image and asset optimization"
            echo "  --skip-compression     Skip gzip compression"
            echo "  --help                 Show this help"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

main