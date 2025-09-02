const express = require('express');
const { requireAuth, limiter } = require('./middleware');
const { readAdminLogs } = require('./admin-log');

const router = express.Router();

// GET /api/plugin-audit-log/:id
router.get('/:id', requireAuth, limiter, (req, res) => {
  const pluginId = req.params.id;
  if (!pluginId) return res.status(400).json({ error: 'Missing pluginId' });
  const logs = readAdminLogs(pluginId);
  res.json(logs);
});

module.exports = router;
