const express = require('express');
const { requireAuth, limiter } = require('./middleware');
const { logAdminAction } = require('./admin-log');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();

// POST /api/plugin-admin-action { action, id }
router.post('/', requireAuth, limiter, (req, res) => {
  const { action, id } = req.body;
  const user = req.user;
  if (!action || !id) return res.status(400).json({ error: 'Missing action or id' });
  // Action handlers
  if (action === 'disable') {
    const manifestPath = path.resolve(__dirname, '../plugins', id + '.json');
    if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found' });
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.enabled = false;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    logAdminAction({ pluginId: id, action: 'disable', user });
    return res.json({ message: 'Plugin disabled' });
  }
  if (action === 'restart') {
    exec(`docker-compose -f docker-compose.${id}.yml restart`, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      logAdminAction({ pluginId: id, action: 'restart', user });
      return res.json({ message: 'Plugin restarted' });
    });
    return;
  }
  if (action === 'promote') {
    const manifestPath = path.resolve(__dirname, '../plugins', id + '.json');
    if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found' });
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.promoted = true;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    logAdminAction({ pluginId: id, action: 'promote', user });
    return res.json({ message: 'Plugin promoted' });
  }
  return res.status(400).json({ error: 'Unknown action' });
});

module.exports = router;
