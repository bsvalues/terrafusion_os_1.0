const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const log = require('electron-log');
const archiver = require('archiver');
const extract = require('extract-zip');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

class BackupManager {
  constructor(config) {
    this.config = config;
    this.backupPath = path.join(app.getPath('userData'), 'backups');
    this.ensureBackupDirectory();
    
    // Initialize AWS if configured
    if (this.config.deployment.backup.aws) {
      AWS.config.update({
        accessKeyId: this.config.deployment.backup.aws.accessKeyId,
        secretAccessKey: this.config.deployment.backup.aws.secretAccessKey,
        region: this.config.deployment.backup.aws.region
      });
      this.s3 = new AWS.S3();
    }
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  async createBackup(options = {}) {
    const {
      type = 'full',
      compression = true,
      encryption = true,
      destination = 'local',
      description = ''
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${type}-${timestamp}`;
    const backupPath = path.join(this.backupPath, backupName);

    try {
      // Create backup manifest
      const manifest = {
        timestamp: Date.now(),
        type,
        version: app.getVersion(),
        description,
        files: [],
        checksums: {}
      };

      // Collect files to backup
      const filesToBackup = await this.collectFiles(type);
      manifest.files = filesToBackup;

      // Create backup archive
      const archive = archiver('zip', {
        zlib: { level: compression ? 9 : 0 }
      });

      const output = fs.createWriteStream(`${backupPath}.zip`);
      archive.pipe(output);

      // Add files to archive
      for (const file of filesToBackup) {
        const filePath = path.join(app.getPath('userData'), file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
          manifest.checksums[file] = await this.calculateFileChecksum(filePath);
        }
      }

      // Add manifest to archive
      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

      // Finalize archive
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
      });

      // Encrypt if needed
      if (encryption) {
        await this.encryptBackup(`${backupPath}.zip`);
      }

      // Upload to cloud if configured
      if (destination === 'cloud' && this.s3) {
        await this.uploadToCloud(`${backupPath}.zip`);
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        backupPath: `${backupPath}.zip`,
        manifest
      };
    } catch (error) {
      log.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupPath, options = {}) {
    const {
      verifyChecksums = true,
      restoreTo = app.getPath('userData')
    } = options;

    try {
      // Decrypt if needed
      if (backupPath.endsWith('.enc')) {
        backupPath = await this.decryptBackup(backupPath);
      }

      // Extract backup
      const extractPath = path.join(this.backupPath, 'temp-restore');
      await extract(backupPath, { dir: extractPath });

      // Read manifest
      const manifest = JSON.parse(
        fs.readFileSync(path.join(extractPath, 'manifest.json'), 'utf8')
      );

      // Verify checksums if requested
      if (verifyChecksums) {
        await this.verifyBackupChecksums(extractPath, manifest.checksums);
      }

      // Restore files
      for (const file of manifest.files) {
        const sourcePath = path.join(extractPath, file);
        const targetPath = path.join(restoreTo, file);

        // Ensure target directory exists
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        // Copy file
        fs.copyFileSync(sourcePath, targetPath);
      }

      // Clean up
      fs.rmSync(extractPath, { recursive: true, force: true });

      return {
        success: true,
        manifest
      };
    } catch (error) {
      log.error('Backup restoration failed:', error);
      throw error;
    }
  }

  async collectFiles(type) {
    const files = [];
    const userDataPath = app.getPath('userData');

    // Add configuration files
    files.push('enterprise-config.json');
    files.push('preferences.json');

    // Add database files if they exist
    const dbPath = path.join(userDataPath, 'database.sqlite');
    if (fs.existsSync(dbPath)) {
      files.push('database.sqlite');
    }

    // Add logs
    files.push('logs/main.log');

    // Add custom files based on backup type
    if (type === 'full') {
      // Add all files in userData
      const allFiles = await this.getAllFiles(userDataPath);
      files.push(...allFiles);
    }

    return files;
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(path.relative(app.getPath('userData'), fullPath));
      }
    }

    return files;
  }

  async calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  async verifyBackupChecksums(backupPath, checksums) {
    for (const [file, expectedChecksum] of Object.entries(checksums)) {
      const filePath = path.join(backupPath, file);
      if (fs.existsSync(filePath)) {
        const actualChecksum = await this.calculateFileChecksum(filePath);
        if (actualChecksum !== expectedChecksum) {
          throw new Error(`Checksum mismatch for ${file}`);
        }
      }
    }
  }

  async encryptBackup(filePath) {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(`${filePath}.enc`);

    input.pipe(cipher).pipe(output);

    await new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });

    // Clean up original file
    fs.unlinkSync(filePath);
  }

  async decryptBackup(filePath) {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(filePath.replace('.enc', ''));

    input.pipe(decipher).pipe(output);

    await new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });

    // Clean up encrypted file
    fs.unlinkSync(filePath);

    return filePath.replace('.enc', '');
  }

  getEncryptionKey() {
    // In production, this should be securely stored
    return crypto.scryptSync('your-secure-password', 'salt', 32);
  }

  async uploadToCloud(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    const params = {
      Bucket: this.config.deployment.backup.aws.bucket,
      Key: `backups/${fileName}`,
      Body: fileStream
    };

    await this.s3.upload(params).promise();
  }

  async cleanupOldBackups() {
    const retentionDays = this.config.deployment.backup.retention;
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    const files = fs.readdirSync(this.backupPath);
    for (const file of files) {
      const filePath = path.join(this.backupPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async scheduleBackups() {
    if (this.config.deployment.backup.schedule === 'daily') {
      // Schedule daily backup
      const cron = require('node-cron');
      cron.schedule('0 0 * * *', async () => {
        try {
          await this.createBackup({
            type: 'full',
            destination: 'cloud'
          });
        } catch (error) {
          log.error('Scheduled backup failed:', error);
        }
      });
    }
  }

  async verifyBackupIntegrity(backupPath) {
    try {
      const manifest = await this.extractManifest(backupPath);
      const extractPath = path.join(this.backupPath, 'temp-verify');
      
      await extract(backupPath, { dir: extractPath });
      await this.verifyBackupChecksums(extractPath, manifest.checksums);
      
      fs.rmSync(extractPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      log.error('Backup verification failed:', error);
      return false;
    }
  }

  async extractManifest(backupPath) {
    const extractPath = path.join(this.backupPath, 'temp-manifest');
    await extract(backupPath, { dir: extractPath });
    
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extractPath, 'manifest.json'), 'utf8')
    );
    
    fs.rmSync(extractPath, { recursive: true, force: true });
    return manifest;
  }
}

module.exports = BackupManager; 