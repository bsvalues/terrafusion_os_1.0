// POST /api/plugin-remove { id }
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { requireAuth, limiter } = require('./middleware');

router.post('/', requireAuth, limiter, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  const manifestPath = path.resolve(__dirname, '../plugins', id + '.json');
  if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found' });
  fs.unlinkSync(manifestPath);
  res.json({ ok: true });
});

module.exports = router;
