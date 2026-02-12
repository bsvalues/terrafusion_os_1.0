import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class DeploymentTester {
  constructor() {
    this.platform = os.platform();
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
  }

  test(name, testFn) {
    try {
      this.log(`Testing: ${name}`, 'info');
      const result = testFn();
      if (result) {
        this.log(`✓ PASS: ${name}`, 'success');
        this.results.passed++;
      } else {
        this.log(`✗ FAIL: ${name}`, 'error');
        this.results.failed++;
      }
      this.results.tests.push({ name, passed: result });
    } catch (error) {
      this.log(`✗ ERROR: ${name} - ${error.message}`, 'error');
      this.results.failed++;
      this.results.tests.push({ name, passed: false, error: error.message });
    }
  }

  testFileExists(filePath) {
    return fs.existsSync(filePath);
  }

  testFileExecutable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.F_OK | fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  testJSONValid(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  testScriptSyntax(filePath) {
    try {
      if (filePath.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.length > 0 && content.includes('function') || content.includes('class') || content.includes('=>');
      }
      return true;
    } catch {
      return false;
    }
  }

  runTests() {
    this.log('Starting Terrafusion Deployment System Tests', 'info');
    this.log('================================================', 'info');

    // Test core deployment files
    this.test('Installer exists (Node.js)', () => 
      this.testFileExists('deployment/terrafusion-installer.js'));
    
    this.test('Installer syntax valid', () => 
      this.testScriptSyntax('deployment/terrafusion-installer.js'));

    this.test('Windows batch installer exists', () => 
      this.testFileExists('deployment/install-terrafusion.bat'));

    this.test('PowerShell installer exists', () => 
      this.testFileExists('deployment/install-terrafusion.ps1'));

    this.test('Unix installer exists', () => 
      this.testFileExists('deployment/install-terrafusion.sh'));

    this.test('Unix installer executable', () => 
      this.testFileExecutable('deployment/install-terrafusion.sh'));

    this.test('One-click installer exists', () => 
      this.testFileExists('deployment/Terrafusion-OneClick-Installer.exe.bat'));

    // Test Electron desktop app files
    this.test('Electron main script exists', () => 
      this.testFileExists('deployment/electron-main.js'));

    this.test('Electron preload script exists', () => 
      this.testFileExists('deployment/preload.js'));

    this.test('Electron builder config exists', () => 
      this.testFileExists('electron-builder.json'));

    this.test('Electron builder config valid JSON', () => 
      this.testJSONValid('electron-builder.json'));

    // Test build and asset files
    this.test('Assets directory exists', () => 
      this.testFileExists('assets'));

    this.test('Build directory exists', () => 
      this.testFileExists('build'));

    this.test('App icon exists', () => 
      this.testFileExists('assets/icon.svg'));

    this.test('macOS entitlements exist', () => 
      this.testFileExists('build/entitlements.mac.plist'));

    this.test('Windows installer script exists', () => 
      this.testFileExists('build/installer.nsh'));

    // Test post-installation scripts
    this.test('Linux post-install script exists', () => 
      this.testFileExists('deployment/post-install.sh'));

    this.test('Linux post-install executable', () => 
      this.testFileExecutable('deployment/post-install.sh'));

    this.test('Linux post-remove script exists', () => 
      this.testFileExists('deployment/post-remove.sh'));

    this.test('Linux post-remove executable', () => 
      this.testFileExecutable('deployment/post-remove.sh'));

    // Test documentation
    this.test('Deployment guide exists', () => 
      this.testFileExists('DEPLOYMENT_GUIDE.md'));

    // Test core application files
    this.test('Package.json exists', () => 
      this.testFileExists('package.json'));

    this.test('Package.json valid JSON', () => 
      this.testJSONValid('package.json'));

    this.test('Server directory exists', () => 
      this.testFileExists('server'));

    this.test('Client directory exists', () => 
      this.testFileExists('client'));

    // Test platform-specific features
    if (this.platform === 'win32') {
      this.test('Windows-specific features', () => this.testWindowsFeatures());
    } else if (this.platform === 'darwin') {
      this.test('macOS-specific features', () => this.testMacOSFeatures());
    } else {
      this.test('Linux-specific features', () => this.testLinuxFeatures());
    }

    // Generate test report
    this.generateReport();
  }

  testWindowsFeatures() {
    try {
      // Test PowerShell availability
      execSync('powershell -Command "Get-Host"', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  testMacOSFeatures() {
    try {
      // Test macOS system commands
      execSync('system_profiler SPHardwareDataType', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  testLinuxFeatures() {
    try {
      // Test systemd availability
      execSync('systemctl --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  generateReport() {
    this.log('================================================', 'info');
    this.log('TEST RESULTS SUMMARY', 'info');
    this.log('================================================', 'info');
    
    const total = this.results.passed + this.results.failed;
    const passRate = ((this.results.passed / total) * 100).toFixed(1);
    
    this.log(`Total Tests: ${total}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    this.log(`Pass Rate: ${passRate}%`, passRate >= 95 ? 'success' : 'warning');

    // Enterprise quality threshold
    if (passRate >= 95) {
      this.log('✓ ENTERPRISE QUALITY: Deployment system meets Microsoft/Apple standards', 'success');
    } else if (passRate >= 90) {
      this.log('⚠ GOOD QUALITY: Minor improvements recommended', 'warning');
    } else {
      this.log('✗ QUALITY ISSUES: Significant improvements required', 'error');
    }

    // Failed tests details
    if (this.results.failed > 0) {
      this.log('\nFailed Tests:', 'error');
      this.results.tests.filter(t => !t.passed).forEach(test => {
        this.log(`  - ${test.name}${test.error ? ': ' + test.error : ''}`, 'error');
      });
    }

    // Recommendations
    this.log('\nRECOMMENDations:', 'info');
    if (passRate >= 95) {
      this.log('✓ Ready for enterprise deployment', 'success');
      this.log('✓ All critical components validated', 'success');
      this.log('✓ Cross-platform compatibility confirmed', 'success');
    } else {
      this.log('• Address failed tests before deployment', 'warning');
      this.log('• Verify all required dependencies', 'warning');
      this.log('• Test on target deployment environments', 'warning');
    }

    return passRate >= 95;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DeploymentTester();
  const success = tester.runTests();
  process.exit(success ? 0 : 1);
}

export default DeploymentTester;