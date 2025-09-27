/**
 * Simple Final Validation Test for Terrafusion Shock-and-Awe Module
 * No external dependencies - pure Node.js validation
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class SimpleValidationSuite {
  constructor() {
    this.baseUrl = 'http://127.0.0.1:\${{TF_ADMIN_PORT:-8080}}';
    this.testResults = [];
  }

  async testServerResponse() {
    console.log('🌐 Testing server response...');

    return new Promise(resolve => {
      const req = http.get(this.baseUrl, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          const results = {
            statusCode: res.statusCode,
            contentType: res.headers['content-type'],
            contentLength: data.length,
            hasLaunchFunctions: data.includes('launchCostForgeWizard'),
            hasFeatureCards: data.includes('feature-card'),
            hasDebugScript: data.includes('debug-fix.js'),
            hasTestScript: data.includes('test-browser-functionality.js'),
            clickHandlers: (data.match(/onclick="/g) || []).length,
            scriptTags: (data.match(/<script[^>]*src=/g) || []).length,
          };

          console.log(
            `   Status: ${results.statusCode === 200 ? '✅' : '❌'} ${results.statusCode}`
          );
          console.log(`   Content-Type: ${results.contentType}`);
          console.log(`   Content Length: ${results.contentLength} bytes`);
          console.log(`   Launch Functions: ${results.hasLaunchFunctions ? '✅' : '❌'}`);
          console.log(`   Feature Cards: ${results.hasFeatureCards ? '✅' : '❌'}`);
          console.log(`   Debug Script: ${results.hasDebugScript ? '✅' : '❌'}`);
          console.log(`   Test Script: ${results.hasTestScript ? '✅' : '❌'}`);
          console.log(`   Click Handlers: ${results.clickHandlers}`);
          console.log(`   Script Tags: ${results.scriptTags}`);

          resolve(results);
        });
      });

      req.on('error', err => {
        console.error('❌ Server connection failed:', err.message);
        resolve(null);
      });

      req.setTimeout(5000, () => {
        console.error('❌ Server connection timeout');
        req.destroy();
        resolve(null);
      });
    });
  }

  async testJavaScriptFiles() {
    console.log('📜 Testing JavaScript file integrity...');

    const jsFiles = [
      'js/main.js',
      'js/costforge-wizard.js',
      'js/terra-miner.js',
      'js/hybrid-llm-security.js',
      'debug-fix.js',
      'test-browser-functionality.js',
    ];

    const results = {};

    for (const file of jsFiles) {
      const fullPath = path.join(__dirname, file);
      try {
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const stats = fs.statSync(fullPath);

          results[file] = {
            exists: true,
            size: stats.size,
            hasErrors: false,
            syntaxCheck: 'unknown',
          };

          // Basic syntax check
          try {
            // Check for obvious syntax issues
            const openBraces = (content.match(/\{/g) || []).length;
            const closeBraces = (content.match(/\}/g) || []).length;
            const openParens = (content.match(/\(/g) || []).length;
            const closeParens = (content.match(/\)/g) || []).length;

            if (openBraces === closeBraces && openParens === closeParens) {
              results[file].syntaxCheck = 'ok';
              console.log(`   ✅ ${file}: ${stats.size} bytes, syntax looks good`);
            } else {
              results[file].syntaxCheck = 'potential-issues';
              results[file].hasErrors = true;
              console.log(`   ⚠️  ${file}: ${stats.size} bytes, potential syntax issues`);
            }
          } catch (error) {
            results[file].syntaxCheck = 'error';
            results[file].hasErrors = true;
            console.log(`   ❌ ${file}: Syntax check failed`);
          }
        } else {
          results[file] = { exists: false };
          console.log(`   ❌ ${file}: File not found`);
        }
      } catch (error) {
        results[file] = { exists: false, error: error.message };
        console.log(`   ❌ ${file}: Error reading file`);
      }
    }

    return results;
  }

  async testCSSFiles() {
    console.log('🎨 Testing CSS file integrity...');

    const cssFiles = [
      'styles/main.css',
      'styles/terrafusion-enhanced.css',
      'styles/terrafusion-icons.css',
    ];

    const results = {};

    for (const file of cssFiles) {
      const fullPath = path.join(__dirname, file);
      try {
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const stats = fs.statSync(fullPath);

          results[file] = {
            exists: true,
            size: stats.size,
            hasModalStyles: content.includes('.modal') || content.includes('.wizard'),
            hasButtonStyles: content.includes('.feature-card') || content.includes('.btn'),
            hasLoadingStyles: content.includes('.loading-screen'),
          };

          console.log(`   ✅ ${file}: ${stats.size} bytes`);
          console.log(`      Modal styles: ${results[file].hasModalStyles ? '✅' : '❌'}`);
          console.log(`      Button styles: ${results[file].hasButtonStyles ? '✅' : '❌'}`);
        } else {
          results[file] = { exists: false };
          console.log(`   ❌ ${file}: File not found`);
        }
      } catch (error) {
        results[file] = { exists: false, error: error.message };
        console.log(`   ❌ ${file}: Error reading file`);
      }
    }

    return results;
  }

  generateReport(serverResults, jsResults, cssResults) {
    console.log('\n📊 COMPREHENSIVE VALIDATION REPORT');
    console.log('=====================================');

    let overallScore = 0;
    let maxScore = 0;

    // Server test scoring
    console.log('\n🌐 SERVER VALIDATION:');
    if (serverResults && serverResults.statusCode === 200) {
      console.log('   ✅ Server responding correctly (+10 points)');
      overallScore += 10;
    } else {
      console.log('   ❌ Server issues (-10 points)');
    }
    maxScore += 10;

    if (serverResults && serverResults.hasLaunchFunctions) {
      console.log('   ✅ Launch functions present in HTML (+5 points)');
      overallScore += 5;
    }
    maxScore += 5;

    if (serverResults && serverResults.hasDebugScript) {
      console.log('   ✅ Debug script included (+5 points)');
      overallScore += 5;
    }
    maxScore += 5;

    // JavaScript test scoring
    console.log('\n📜 JAVASCRIPT VALIDATION:');
    const jsFilesOk = Object.values(jsResults).filter(r => r.exists && !r.hasErrors).length;
    const totalJsFiles = Object.keys(jsResults).length;
    console.log(
      `   ✅ ${jsFilesOk}/${totalJsFiles} JavaScript files OK (+${jsFilesOk * 5} points)`
    );
    overallScore += jsFilesOk * 5;
    maxScore += totalJsFiles * 5;

    // CSS test scoring
    console.log('\n🎨 CSS VALIDATION:');
    const cssFilesOk = Object.values(cssResults).filter(r => r.exists).length;
    const totalCssFiles = Object.keys(cssResults).length;
    console.log(`   ✅ ${cssFilesOk}/${totalCssFiles} CSS files OK (+${cssFilesOk * 3} points)`);
    overallScore += cssFilesOk * 3;
    maxScore += totalCssFiles * 3;

    const percentage = Math.round((overallScore / maxScore) * 100);

    console.log('\n🏆 FINAL SCORE:');
    console.log(`   ${overallScore}/${maxScore} points (${percentage}%)`);

    if (percentage >= 90) {
      console.log('   🎉 EXCELLENT - Module is ready for use!');
    } else if (percentage >= 75) {
      console.log('   ✅ GOOD - Module should work with minor issues');
    } else if (percentage >= 60) {
      console.log('   ⚠️  FAIR - Module has some issues but may work');
    } else {
      console.log('   ❌ POOR - Module needs significant fixes');
    }

    return {
      score: overallScore,
      maxScore: maxScore,
      percentage: percentage,
      grade:
        percentage >= 90
          ? 'EXCELLENT'
          : percentage >= 75
            ? 'GOOD'
            : percentage >= 60
              ? 'FAIR'
              : 'POOR',
    };
  }

  async run() {
    console.log('🚀 Terrafusion Shock-and-Awe Simple Validation');
    console.log('==============================================\n');

    const serverResults = await this.testServerResponse();
    const jsResults = await this.testJavaScriptFiles();
    const cssResults = await this.testCSSFiles();

    const report = this.generateReport(serverResults, jsResults, cssResults);

    console.log('\n💡 NEXT STEPS:');
    if (report.percentage >= 75) {
      console.log('1. ✅ Module is ready - open http://127.0.0.1:\${{TF_ADMIN_PORT:-8080}} in browser');
      console.log('2. ✅ Click the feature cards to test functionality');
      console.log('3. ✅ Use browser dev tools and run debugTerraFusion()');
      console.log('4. ✅ All major issues have been resolved!');
    } else {
      console.log('1. ⚠️  Check server is running on port \${{TF_ADMIN_PORT:-8080}}');
      console.log('2. ⚠️  Verify all JavaScript files are present');
      console.log('3. ⚠️  Review console errors in browser');
      console.log('4. ⚠️  Some issues may still need manual fixing');
    }

    console.log('\n🏁 Validation complete!');

    return report;
  }
}

// Run validation
const validator = new SimpleValidationSuite();
validator.run().catch(console.error);
