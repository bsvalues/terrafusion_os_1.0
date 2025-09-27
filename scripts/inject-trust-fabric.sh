#!/bin/bash
# Mass Trust Fabric Injection Script
# Refactors ALL TerraFusion microservice frontends to use trust fabric

set -e

echo "🚀 TerraFusion OS - Mass Trust Fabric Integration"
echo "================================================"

# Configuration
TRUST_FABRIC_ADAPTER_PATH="../shared-libraries/trust-fabric-adapter"
BACKUP_DIR="./trust-fabric-backup-$(date +%Y%m%d_%H%M%S)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Find all frontend directories
FRONTEND_DIRS=(
  # Frontend applications
  "frontend/src"
  "frontend-v2/src"
  "terrafusion-frontend/src"
  
  # Module frontends
  "modules/*/frontend/src"
  "modules/*/PWA"
  "modules/*/web"
  
  # Service frontends
  "services/*/frontend"
  "services/*/web"
  
  # Other potential frontend locations
  "apps/*/src"
  "microservices/*/frontend"
)

# Frontend entry files to inject into
ENTRY_FILES=(
  "index.js"
  "main.js"
  "app.js"
  "index.ts"
  "main.ts"
  "app.ts"
  "index.jsx"
  "main.jsx"
  "app.jsx"
  "index.tsx"
  "main.tsx"
  "app.tsx"
)

# HTML files to inject script tag
HTML_FILES=(
  "index.html"
  "main.html"
  "app.html"
)

inject_into_js_file() {
  local file=$1
  local backup_file="$BACKUP_DIR/$(basename $file)_$(date +%s)"
  
  echo "  📝 Injecting into: $file"
  
  # Create backup
  cp "$file" "$backup_file"
  
  # Check if already injected
  if grep -q "trust-fabric-adapter" "$file"; then
    echo "    ⚠️  Already injected, skipping"
    return
  fi
  
  # Create temporary file with injection
  cat > /tmp/trust_fabric_injection.js << 'EOF'
// TerraFusion Trust Fabric Integration - AUTO-INJECTED
try {
  // Import and initialize trust fabric adapter
  if (typeof require !== 'undefined') {
    // Node.js environment
    const TrustFabricAdapter = require('@terrafusion/trust-fabric-adapter');
    new TrustFabricAdapter().initialize();
  } else if (typeof window !== 'undefined') {
    // Browser environment - load dynamically
    const script = document.createElement('script');
    script.src = '/shared/trust-fabric-adapter.js';
    script.onload = () => {
      if (window.TrustFabricAdapter) {
        new window.TrustFabricAdapter().initialize();
      }
    };
    document.head.appendChild(script);
  }
} catch (error) {
  console.warn('Trust Fabric Adapter failed to load:', error);
}
// END TerraFusion Trust Fabric Integration

EOF
  
  # Inject at the beginning of the file
  cat /tmp/trust_fabric_injection.js "$file" > /tmp/combined_file.js
  mv /tmp/combined_file.js "$file"
  
  echo "    ✅ Injected successfully"
}

inject_into_html_file() {
  local file=$1
  local backup_file="$BACKUP_DIR/$(basename $file)_$(date +%s)"
  
  echo "  📝 Injecting into HTML: $file"
  
  # Create backup
  cp "$file" "$backup_file"
  
  # Check if already injected
  if grep -q "trust-fabric-adapter" "$file"; then
    echo "    ⚠️  Already injected, skipping"
    return
  fi
  
  # Inject script tag before closing head tag
  sed -i 's|</head>|  <script src="/shared/trust-fabric-adapter.js"></script>\n  <script>\n    try {\n      new TrustFabricAdapter().initialize();\n    } catch(e) {\n      console.warn("Trust Fabric initialization failed:", e);\n    }\n  </script>\n</head>|' "$file"
  
  echo "    ✅ HTML injection successful"
}

setup_npm_link() {
  echo "🔗 Setting up npm link for trust fabric adapter"
  
  cd "$TRUST_FABRIC_ADAPTER_PATH"
  npm link
  cd - > /dev/null
  
  echo "✅ Trust fabric adapter linked globally"
}

inject_into_package_json() {
  local dir=$1
  local package_json="$dir/package.json"
  
  if [[ -f "$package_json" ]]; then
    echo "  📦 Adding dependency to: $package_json"
    
    # Backup
    cp "$package_json" "$BACKUP_DIR/package.json_$(basename $dir)_$(date +%s)"
    
    # Add dependency if not exists
    if ! grep -q "@terrafusion/trust-fabric-adapter" "$package_json"; then
      # Use node to safely modify JSON
      node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$package_json', 'utf8'));
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies['@terrafusion/trust-fabric-adapter'] = 'file:../../shared-libraries/trust-fabric-adapter';
        fs.writeFileSync('$package_json', JSON.stringify(pkg, null, 2));
      " 2>/dev/null || echo "    ⚠️  Could not modify package.json automatically"
    fi
    
    # Link the package
    cd "$dir"
    npm link @terrafusion/trust-fabric-adapter 2>/dev/null || echo "    ⚠️  npm link failed"
    cd - > /dev/null
  fi
}

# Main execution
echo "🔍 Searching for frontend directories..."

# Setup npm link first
setup_npm_link

found_count=0

# Search for all frontend directories and files
for pattern in "${FRONTEND_DIRS[@]}"; do
  for dir in $pattern; do
    if [[ -d "$dir" ]]; then
      echo "📁 Found frontend directory: $dir"
      found_count=$((found_count + 1))
      
      # Add npm dependency
      inject_into_package_json "$(dirname $dir)"
      
      # Look for entry files
      for entry_file in "${ENTRY_FILES[@]}"; do
        if [[ -f "$dir/$entry_file" ]]; then
          inject_into_js_file "$dir/$entry_file"
        fi
      done
      
      # Look for HTML files
      for html_file in "${HTML_FILES[@]}"; do
        if [[ -f "$dir/$html_file" ]]; then
          inject_into_html_file "$dir/$html_file"
        fi
      done
    fi
  done
done

# Also check root frontend directories
for entry_file in "${ENTRY_FILES[@]}"; do
  if [[ -f "frontend/$entry_file" ]]; then
    inject_into_js_file "frontend/$entry_file"
  fi
done

for html_file in "${HTML_FILES[@]}"; do
  if [[ -f "frontend/$html_file" ]]; then
    inject_into_html_file "frontend/$html_file"
  fi
done

echo ""
echo "🎯 INJECTION COMPLETE"
echo "====================="
echo "📊 Processed directories: $found_count"
echo "💾 Backups stored in: $BACKUP_DIR"
echo ""
echo "🔧 Next steps:"
echo "  1. Set rollout percentage: export TRUST_FABRIC_ROLLOUT=10"
echo "  2. Test one service: cd services/[service-name] && npm start"
echo "  3. Monitor logs for trust fabric activity"
echo "  4. Increase rollout: export TRUST_FABRIC_ROLLOUT=50"
echo "  5. Full rollout: export TRUST_FABRIC_ROLLOUT=100"
echo ""
echo "🛑 Emergency rollback:"
echo "  export TRUST_FABRIC_FORCE=false"
echo ""
echo "✅ All frontends now configured for trust fabric integration!"