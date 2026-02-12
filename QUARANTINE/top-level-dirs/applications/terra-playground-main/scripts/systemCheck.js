const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MIN_REQUIREMENTS = {
  windows: {
    os: 'Windows 10 or later',
    ram: 8, // GB
    disk: 10, // GB
    cpu: 2, // cores
    gpu: 'DirectX 11 compatible',
    screen: '1920x1080',
    dotnet: '4.7.2',
    vcredist: '2015-2022'
  },
  mac: {
    os: 'macOS 10.15 or later',
    ram: 8,
    disk: 10,
    cpu: 2,
    gpu: 'Metal compatible',
    screen: '1920x1080'
  },
  linux: {
    os: 'Ubuntu 20.04 or later',
    ram: 8,
    disk: 10,
    cpu: 2,
    gpu: 'OpenGL 3.3 compatible',
    screen: '1920x1080',
    dependencies: ['libgtk-3-0', 'libnotify4', 'libnss3', 'libxss1', 'libxtst6', 'xdg-utils']
  }
};

class SystemChecker {
  constructor() {
    this.platform = process.platform;
    this.requirements = MIN_REQUIREMENTS[this.platform] || MIN_REQUIREMENTS.windows;
    this.results = {
      passed: true,
      checks: []
    };
  }

  async checkAll() {
    await this.checkOS();
    await this.checkRAM();
    await this.checkDisk();
    await this.checkCPU();
    await this.checkGPU();
    await this.checkScreen();
    await this.checkDependencies();
    await this.checkSecurity();
    await this.checkNetwork();
    await this.checkAntivirus();
    return this.results;
  }

  async checkOS() {
    const osVersion = os.release();
    const check = {
      name: 'Operating System',
      required: this.requirements.os,
      current: osVersion,
      passed: true
    };

    if (this.platform === 'win32') {
      const version = parseFloat(osVersion);
      check.passed = version >= 10;
    } else if (this.platform === 'darwin') {
      const version = parseFloat(osVersion);
      check.passed = version >= 19;
    }

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkRAM() {
    const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // Convert to GB
    const check = {
      name: 'RAM',
      required: `${this.requirements.ram}GB`,
      current: `${totalRAM.toFixed(1)}GB`,
      passed: totalRAM >= this.requirements.ram
    };

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkDisk() {
    const drive = process.cwd().split(path.sep)[0];
    const freeSpace = fs.statfsSync(drive).bfree * fs.statfsSync(drive).bsize / (1024 * 1024 * 1024);
    const check = {
      name: 'Disk Space',
      required: `${this.requirements.disk}GB`,
      current: `${freeSpace.toFixed(1)}GB`,
      passed: freeSpace >= this.requirements.disk
    };

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkCPU() {
    const cpuCount = os.cpus().length;
    const check = {
      name: 'CPU Cores',
      required: `${this.requirements.cpu} cores`,
      current: `${cpuCount} cores`,
      passed: cpuCount >= this.requirements.cpu
    };

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkGPU() {
    let gpuInfo = 'Unknown';
    try {
      if (this.platform === 'win32') {
        gpuInfo = execSync('wmic path win32_VideoController get name').toString();
      } else if (this.platform === 'darwin') {
        gpuInfo = execSync('system_profiler SPDisplaysDataType').toString();
      } else {
        gpuInfo = execSync('lspci | grep -i vga').toString();
      }
    } catch (error) {
      gpuInfo = 'Error checking GPU';
    }

    const check = {
      name: 'Graphics',
      required: this.requirements.gpu,
      current: gpuInfo,
      passed: true // We'll assume it's compatible if we can detect it
    };

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkScreen() {
    const check = {
      name: 'Screen Resolution',
      required: this.requirements.screen,
      current: 'Unknown',
      passed: true
    };

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkDependencies() {
    if (this.platform === 'linux') {
      const missingDeps = [];
      for (const dep of this.requirements.dependencies) {
        try {
          execSync(`dpkg -l | grep ${dep}`);
        } catch {
          missingDeps.push(dep);
        }
      }

      const check = {
        name: 'System Dependencies',
        required: this.requirements.dependencies.join(', '),
        current: missingDeps.length ? `Missing: ${missingDeps.join(', ')}` : 'All installed',
        passed: missingDeps.length === 0
      };

      this.results.checks.push(check);
      this.results.passed = this.results.passed && check.passed;
    }
  }

  async checkSecurity() {
    const check = {
      name: 'Security Status',
      required: 'Secure',
      current: 'Checking...',
      passed: true
    };

    // Check for Windows Defender or other security software
    if (this.platform === 'win32') {
      try {
        const defenderStatus = execSync('powershell Get-MpComputerStatus').toString();
        check.current = defenderStatus.includes('True') ? 'Protected' : 'Unprotected';
        check.passed = defenderStatus.includes('True');
      } catch {
        check.current = 'Unknown';
        check.passed = false;
      }
    }

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkNetwork() {
    const check = {
      name: 'Network Connectivity',
      required: 'Connected',
      current: 'Checking...',
      passed: true
    };

    try {
      execSync('ping -n 1 8.8.8.8');
      check.current = 'Connected';
    } catch {
      check.current = 'No Connection';
      check.passed = false;
    }

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }

  async checkAntivirus() {
    const check = {
      name: 'Antivirus Status',
      required: 'Active',
      current: 'Checking...',
      passed: true
    };

    if (this.platform === 'win32') {
      try {
        const avStatus = execSync('powershell Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct').toString();
        check.current = avStatus.includes('displayName') ? 'Active' : 'Not Found';
        check.passed = avStatus.includes('displayName');
      } catch {
        check.current = 'Unknown';
        check.passed = false;
      }
    }

    this.results.checks.push(check);
    this.results.passed = this.results.passed && check.passed;
  }
}

module.exports = SystemChecker; 