const { autoUpdater } = require('electron-updater');
const { app, dialog } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

class Updater {
  constructor() {
    this.setupAutoUpdater();
    this.setupLogging();
  }

  setupLogging() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;
  }

  setupAutoUpdater() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available. Would you like to download it now?`,
        buttons: ['Yes', 'No']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      dialog.showErrorBox('Update Error', 'An error occurred while checking for updates.');
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart the application to apply the updates.',
        buttons: ['Restart', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }

  checkForUpdates() {
    // Check for updates every 30 minutes
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 30 * 60 * 1000);

    // Initial check
    autoUpdater.checkForUpdates();
  }

  async verifyUpdate(updatePath) {
    try {
      const updateInfo = JSON.parse(fs.readFileSync(path.join(updatePath, 'update-info.json'), 'utf8'));
      const currentVersion = app.getVersion();

      if (updateInfo.version <= currentVersion) {
        return false;
      }

      // Verify update integrity
      const checksum = await this.calculateChecksum(updatePath);
      if (checksum !== updateInfo.checksum) {
        throw new Error('Update integrity check failed');
      }

      return true;
    } catch (error) {
      log.error('Update verification failed:', error);
      return false;
    }
  }

  async calculateChecksum(updatePath) {
    // Implement checksum calculation
    return 'checksum';
  }

  async performUpdate(updatePath) {
    try {
      // Backup current version
      await this.backupCurrentVersion();

      // Apply update
      await this.applyUpdate(updatePath);

      // Verify installation
      if (await this.verifyInstallation()) {
        log.info('Update completed successfully');
        return true;
      } else {
        await this.rollbackUpdate();
        return false;
      }
    } catch (error) {
      log.error('Update failed:', error);
      await this.rollbackUpdate();
      return false;
    }
  }

  async backupCurrentVersion() {
    const backupPath = path.join(app.getPath('userData'), 'backup');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupPath, `backup-${timestamp}`);

    fs.mkdirSync(backupDir);
    // Copy current version files to backup
  }

  async applyUpdate(updatePath) {
    // Implement update application logic
  }

  async verifyInstallation() {
    // Implement installation verification
    return true;
  }

  async rollbackUpdate() {
    // Implement rollback logic
  }
}

module.exports = Updater; 