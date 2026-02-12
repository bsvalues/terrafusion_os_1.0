const express = require('express');
const { requireAuth, limiter } = require('./middleware');
const { logAdminAction, readAdminLogs } = require('./admin-log');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();

// Rollback endpoint
router.post('/rollback', requireAuth, limiter, (req, res) => {
  const { pluginId, version } = req.body;
  const user = req.user;
  const pluginDir = path.resolve(__dirname, '../plugins', pluginId);
  const versionPath = path.resolve(pluginDir, 'versions', version);
  const currentSymlink = path.join(pluginDir, 'current');
  if (!fs.existsSync(versionPath)) return res.status(404).json({ error: 'Version not found' });
  try {
    fs.rmSync(currentSymlink, { force: true });
    fs.symlinkSync(versionPath, currentSymlink, 'dir');
    exec(`docker-compose -f docker-compose.${pluginId}.yml restart`, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      logAdminAction({ pluginId, action: 'rollback', user });
      if (metrics.rollbackCounter) metrics.rollbackCounter.inc({ pluginId });
      res.json({ message: 'Rolled back successfully' });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Disable endpoint
router.post('/disable', requireAuth, limiter, (req, res) => {
  const { pluginId } = req.body;
  const user = req.user;
  // Example: mark plugin as disabled in manifest
  const manifestPath = path.resolve(__dirname, '../plugins', pluginId + '.json');
  if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found' });
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.enabled = false;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  logAdminAction({ pluginId, action: 'disable', user });
  res.json({ message: 'Plugin disabled' });
});

// Restart endpoint
router.post('/restart', requireAuth, limiter, (req, res) => {
  const { pluginId } = req.body;
  const user = req.user;
  exec(`docker-compose -f docker-compose.${pluginId}.yml restart`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    logAdminAction({ pluginId, action: 'restart', user });
    if (metrics.launchCounter) metrics.launchCounter.inc({ pluginId });
    res.json({ message: 'Plugin restarted' });
  });
});

// Promote endpoint
router.post('/promote', requireAuth, limiter, (req, res) => {
  const { pluginId } = req.body;
  const user = req.user;
  // Example: mark plugin as promoted in manifest
  const manifestPath = path.resolve(__dirname, '../plugins', pluginId + '.json');
  if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found' });
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.promoted = true;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  logAdminAction({ pluginId, action: 'promote', user });
  res.json({ message: 'Plugin promoted' });
});

// Deploy endpoint (file upload expected via multer or similar)
router.post('/deploy', requireAuth, limiter, (req, res) => {
  // Placeholder: handle file upload, extract, and deploy logic
  // logAdminAction({ pluginId, action: 'deploy', user: req.user });
  if (metrics.deployCounter && req.body && req.body.pluginId) metrics.deployCounter.inc({ pluginId: req.body.pluginId });
  res.json({ message: 'Deploy endpoint not yet implemented' });
});

// Audit log endpoint (optionally filter by pluginId)
router.get('/logs', requireAuth, limiter, (req, res) => {
  const pluginId = req.query.pluginId;
  const logs = readAdminLogs(pluginId);
  res.json(logs);
});

module.exports = router;
