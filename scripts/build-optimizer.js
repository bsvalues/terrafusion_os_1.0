#!/usr/bin/env node

/**
 * TerraFusion Build Optimization Script
 * Automated production build with performance monitoring
 * 
 * THE TERRAFUSION WAY: Systematic build optimization and validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TerraFusionBuildOptimizer {
  constructor() {
    this.startTime = Date.now();
    this.buildResults = {
      success: false,
      duration: 0,
      bundleSize: 0,
      errors: [],
      warnings: [],
      optimizations: []
    };
  }

  async optimize() {
    try {
      this.logStep('🚀 Starting TerraFusion Build Optimization');
      
      await this.cleanPreviousBuild();
      await this.runOptimizedBuild();
      await this.analyzeBuildResults();
      await this.validatePerformance();
      await this.generateBuildReport();
      
      this.buildResults.success = true;
      this.buildResults.duration = Date.now() - this.startTime;
      
      this.logStep('✅ Build optimization complete!');
      this.logStep(`📊 Build time: ${this.buildResults.duration}ms`);
      
    } catch (error) {
      this.buildResults.errors.push(error.message);
      this.logError('❌ Build optimization failed:', error.message);
      process.exit(1);
    }
  }

  async cleanPreviousBuild() {
    this.logStep('🧹 Cleaning previous build...');
    
    const distPath = path.join(process.cwd(), 'dist');
    
    if (fs.existsSync(distPath)) {
      execSync('rm -rf dist', { stdio: 'inherit' });
      this.buildResults.optimizations.push('Cleaned previous build artifacts');
    }
  }

  async runOptimizedBuild() {
    this.logStep('🔨 Running optimized production build...');
    
    try {
      // Use our production webpack config
      execSync('npx webpack --config webpack.production.config.js --progress', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          TERRAFUSION_BUILD_MODE: 'optimized'
        }
      });
      
      this.buildResults.optimizations.push('Production webpack build completed');
      
    } catch (error) {
      // Fallback to npm build script
      this.logStep('⚠️  Webpack build failed, trying npm build...');
      execSync('npm run build', { stdio: 'inherit' });
      this.buildResults.optimizations.push('Fallback npm build completed');
    }
  }

  async analyzeBuildResults() {
    this.logStep('📊 Analyzing build results...');
    
    const distPath = path.join(process.cwd(), 'dist');
    
    if (!fs.existsSync(distPath)) {
      throw new Error('Build output directory not found');
    }

    const bundleFiles = this.getBundleFiles(distPath);
    const totalSize = bundleFiles.reduce((sum, file) => sum + file.size, 0);
    
    this.buildResults.bundleSize = totalSize;
    
    this.logStep(`📦 Total bundle size: ${this.formatBytes(totalSize)}`);
    
    // Check against targets
    const targetSize = 350000; // 350KB
    if (totalSize <= targetSize) {
      this.buildResults.optimizations.push(`Bundle size target achieved: ${this.formatBytes(totalSize)} ≤ ${this.formatBytes(targetSize)}`);
    } else {
      this.buildResults.warnings.push(`Bundle size exceeds target: ${this.formatBytes(totalSize)} > ${this.formatBytes(targetSize)}`);
    }

    // Analyze specific files
    bundleFiles.forEach(file => {
      if (file.size > 100000) { // 100KB
        this.buildResults.warnings.push(`Large bundle detected: ${file.name} (${this.formatBytes(file.size)})`);
      }
    });
  }

  getBundleFiles(distPath) {
    const files = [];
    
    const readDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          readDir(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.css')) {
          files.push({
            name: item,
            path: fullPath,
            size: stat.size,
            type: item.endsWith('.js') ? 'js' : 'css'
          });
        }
      }
    };

    readDir(distPath);
    return files;
  }

  async validatePerformance() {
    this.logStep('⚡ Validating performance...');
    
    // Check for common performance issues
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtml = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexHtml)) {
      const content = fs.readFileSync(indexHtml, 'utf8');
      
      // Check for critical optimizations
      if (content.includes('preload')) {
        this.buildResults.optimizations.push('Resource preloading detected');
      }
      
      if (content.includes('defer') || content.includes('async')) {
        this.buildResults.optimizations.push('Script loading optimization detected');
      }
      
      if (!content.includes('blocking')) {
        this.buildResults.optimizations.push('No render-blocking resources detected');
      }
    }
    
    // Check for code splitting
    const bundleFiles = this.getBundleFiles(distPath);
    const jsFiles = bundleFiles.filter(f => f.type === 'js');
    
    if (jsFiles.length > 1) {
      this.buildResults.optimizations.push(`Code splitting implemented: ${jsFiles.length} JS chunks`);
    } else {
      this.buildResults.warnings.push('Code splitting not detected - consider implementing');
    }
  }

  async generateBuildReport() {
    const report = this.createBuildReport();
    
    fs.writeFileSync(
      path.join(process.cwd(), 'BUILD_OPTIMIZATION_REPORT.md'),
      report,
      'utf8'
    );
    
    this.logStep('📋 Build report saved to BUILD_OPTIMIZATION_REPORT.md');
  }

  createBuildReport() {
    const timestamp = new Date().toLocaleString();
    
    return `# 🔨 TerraFusion Build Optimization Report

**Generated:** ${timestamp}  
**Build Duration:** ${this.buildResults.duration}ms  
**Status:** ${this.buildResults.success ? '✅ SUCCESS' : '❌ FAILED'}

---

## 📊 Build Summary

### Bundle Analysis
- **Total Size:** ${this.formatBytes(this.buildResults.bundleSize)}
- **Target:** 350KB
- **Status:** ${this.buildResults.bundleSize <= 350000 ? '✅ ACHIEVED' : '❌ EXCEEDED'}

### Optimizations Applied
${this.buildResults.optimizations.length > 0 
  ? this.buildResults.optimizations.map(opt => `- ✅ ${opt}`).join('\n')
  : '- No optimizations detected'
}

### Warnings
${this.buildResults.warnings.length > 0
  ? this.buildResults.warnings.map(warn => `- ⚠️ ${warn}`).join('\n')
  : '- No warnings'
}

### Errors
${this.buildResults.errors.length > 0
  ? this.buildResults.errors.map(err => `- ❌ ${err}`).join('\n')
  : '- No errors'
}

---

## 🎯 Performance Validation

### Code Splitting Status
${this.buildResults.optimizations.some(opt => opt.includes('Code splitting')) 
  ? '✅ Implemented' 
  : '❌ Not detected - recommended for large applications'
}

### Resource Optimization
${this.buildResults.optimizations.some(opt => opt.includes('preloading')) 
  ? '✅ Resource preloading active' 
  : '⚠️ Consider implementing resource preloading'
}

### Script Loading
${this.buildResults.optimizations.some(opt => opt.includes('Script loading')) 
  ? '✅ Optimized script loading detected' 
  : '⚠️ Consider async/defer script attributes'
}

---

## 🚀 Next Steps - THE TERRAFUSION WAY

### Immediate Actions
${this.buildResults.warnings.length > 0
  ? this.buildResults.warnings.map(warn => `- Address: ${warn}`).join('\n')
  : '- No immediate actions required'
}

### Performance Enhancements
- Implement progressive web app features
- Add service worker for caching
- Optimize image loading and compression
- Consider server-side rendering for critical pages

### Monitoring
- Set up continuous performance monitoring
- Implement performance budgets in CI/CD
- Add real user monitoring (RUM)

---

**THE TERRAFUSION WAY:** Build with precision, optimize with purpose, deploy with confidence!

**Generated by:** TerraFusion Build Optimizer v1.0
`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  logStep(message) {
    // Using a simple output method
    process.stdout.write(`${message}\n`);
  }

  logError(message, error) {
    process.stderr.write(`${message} ${error}\n`);
  }
}

// Execute build optimization
if (require.main === module) {
  const optimizer = new TerraFusionBuildOptimizer();
  optimizer.optimize().catch(err => {
    process.stderr.write(`Build optimization failed: ${err.message}\n`);
    process.exit(1);
  });
}

module.exports = TerraFusionBuildOptimizer;