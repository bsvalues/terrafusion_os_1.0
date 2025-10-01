const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class BackupSystem {
  constructor() {
    this.backupDir = './backups';
    this.logDir = './logs/backup';
    this.dataDir = './data';
    this.maxBackups = 30; // Keep 30 days of backups

    this.ensureDirectories();
    this.scheduleBackups();
  }

  ensureDirectories() {
    [this.backupDir, this.logDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[BACKUP] Created directory: ${dir}`);
      }
    });
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `benton-county-backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      console.log(`[BACKUP] Starting backup: ${backupName}`);

      // Create backup directory
      fs.mkdirSync(backupPath);

      // Backup data files
      await this.backupDataFiles(backupPath);

      // Backup configuration
      await this.backupConfiguration(backupPath);

      // Backup logs (last 7 days)
      await this.backupRecentLogs(backupPath);

      // Create backup manifest
      await this.createBackupManifest(backupPath, backupName);

      // Compress backup
      await this.compressBackup(backupPath, backupName);

      // Clean old backups
      await this.cleanOldBackups();

      // Log success
      this.logBackupResult(backupName, 'SUCCESS', null);

      console.log(`[BACKUP] Completed successfully: ${backupName}.tar.gz`);
      return { success: true, backup: `${backupName}.tar.gz` };
    } catch (error) {
      console.error(`[BACKUP] Failed: ${error.message}`);
      this.logBackupResult(backupName, 'FAILED', error.message);
      return { success: false, error: error.message };
    }
  }

  async backupDataFiles(backupPath) {
    const dataBackupPath = path.join(backupPath, 'data');
    fs.mkdirSync(dataBackupPath);

    const dataFiles = fs.readdirSync(this.dataDir);
    for (const file of dataFiles) {
      const sourcePath = path.join(this.dataDir, file);
      const destPath = path.join(dataBackupPath, file);
      fs.copyFileSync(sourcePath, destPath);
    }

    console.log(`[BACKUP] Data files backed up: ${dataFiles.length} files`);
  }

  async backupConfiguration(backupPath) {
    const configBackupPath = path.join(backupPath, 'config');
    fs.mkdirSync(configBackupPath);

    const configFiles = [
      'package.json',
      'demo-server.js',
      'performance-monitor.js',
      'PRODUCTION_READY_STATUS.md',
      'EXECUTIVE_PRESENTATION.md',
    ];

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        const destPath = path.join(configBackupPath, file);
        fs.copyFileSync(file, destPath);
      }
    }

    console.log(`[BACKUP] Configuration backed up: ${configFiles.length} files`);
  }

  async backupRecentLogs(backupPath) {
    const logsBackupPath = path.join(backupPath, 'logs');
    fs.mkdirSync(logsBackupPath);

    if (fs.existsSync('./logs')) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const logFiles = fs.readdirSync('./logs').filter(file => {
        const filePath = path.join('./logs', file);
        const stats = fs.statSync(filePath);
        return stats.mtime >= sevenDaysAgo;
      });

      for (const file of logFiles) {
        const sourcePath = path.join('./logs', file);
        const destPath = path.join(logsBackupPath, file);
        fs.copyFileSync(sourcePath, destPath);
      }

      console.log(`[BACKUP] Recent logs backed up: ${logFiles.length} files`);
    }
  }

  async createBackupManifest(backupPath, backupName) {
    const manifest = {
      backup_name: backupName,
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      system: {
        node_version: process.version,
        platform: process.platform,
        hostname: require('os').hostname(),
      },
      contents: {
        data_files: fs.readdirSync(path.join(backupPath, 'data')).length,
        config_files: fs.readdirSync(path.join(backupPath, 'config')).length,
        log_files: fs.existsSync(path.join(backupPath, 'logs'))
          ? fs.readdirSync(path.join(backupPath, 'logs')).length
          : 0,
      },
      integrity: {
        total_files: this.countFiles(backupPath),
        backup_size_mb: this.getDirectorySize(backupPath),
      },
    };

    const manifestPath = path.join(backupPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(
      `[BACKUP] Manifest created: ${manifest.integrity.total_files} files, ${manifest.integrity.backup_size_mb}MB`
    );
  }

  async compressBackup(backupPath, backupName) {
    const tarCommand = `tar -czf ${this.backupDir}/${backupName}.tar.gz -C ${this.backupDir} ${backupName}`;
    await execAsync(tarCommand);

    // Remove uncompressed directory
    await execAsync(`rm -rf ${backupPath}`);

    console.log(`[BACKUP] Compressed: ${backupName}.tar.gz`);
  }

  async cleanOldBackups() {
    const backupFiles = fs
      .readdirSync(this.backupDir)
      .filter(file => file.endsWith('.tar.gz'))
      .map(file => ({
        name: file,
        path: path.join(this.backupDir, file),
        stats: fs.statSync(path.join(this.backupDir, file)),
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    if (backupFiles.length > this.maxBackups) {
      const filesToDelete = backupFiles.slice(this.maxBackups);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`[BACKUP] Cleaned old backup: ${file.name}`);
      }
    }
  }

  countFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        count += this.countFiles(filePath);
      } else {
        count++;
      }
    }
    return count;
  }

  getDirectorySize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    return Math.round(size / 1024 / 1024); // MB
  }

  logBackupResult(backupName, status, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      backup_name: backupName,
      status: status,
      error: error,
    };

    const logFile = path.join(this.logDir, `backup-${new Date().toISOString().split('T')[0]}.json`);
    let logs = [];

    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }

  scheduleBackups() {
    // Daily backup at 2 AM
    const dailyBackup = () => {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(2, 0, 0, 0);

      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilBackup = targetTime.getTime() - now.getTime();

      setTimeout(() => {
        this.createBackup();
        // Schedule next backup
        setInterval(
          () => {
            this.createBackup();
          },
          24 * 60 * 60 * 1000
        ); // Every 24 hours
      }, timeUntilBackup);

      console.log(`[BACKUP] Daily backup scheduled for ${targetTime.toLocaleString()}`);
    };

    dailyBackup();

    // Emergency backup on demand
    console.log('[BACKUP] System initialized - Daily backups scheduled');
  }

  async restoreBackup(backupName) {
    const backupPath = path.join(this.backupDir, `${backupName}.tar.gz`);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupName}.tar.gz`);
    }

    try {
      console.log(`[RESTORE] Starting restore: ${backupName}`);

      // Extract backup
      const extractDir = path.join(this.backupDir, 'restore-temp');
      await execAsync(`mkdir -p ${extractDir}`);
      await execAsync(`tar -xzf ${backupPath} -C ${extractDir}`);

      const restorePath = path.join(extractDir, backupName);

      // Verify manifest
      const manifestPath = path.join(restorePath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Invalid backup: manifest.json not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`[RESTORE] Backup info: ${manifest.backup_name}, ${manifest.timestamp}`);

      // Restore data files
      if (fs.existsSync(path.join(restorePath, 'data'))) {
        await execAsync(`cp -r ${path.join(restorePath, 'data')}/* ${this.dataDir}/`);
        console.log('[RESTORE] Data files restored');
      }

      // Clean up
      await execAsync(`rm -rf ${extractDir}`);

      console.log(`[RESTORE] Completed successfully: ${backupName}`);
      return { success: true, manifest };
    } catch (error) {
      console.error(`[RESTORE] Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  getBackupList() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    return fs
      .readdirSync(this.backupDir)
      .filter(file => file.endsWith('.tar.gz'))
      .map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file.replace('.tar.gz', ''),
          size_mb: Math.round(stats.size / 1024 / 1024),
          created: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
  }
}

module.exports = BackupSystem;
