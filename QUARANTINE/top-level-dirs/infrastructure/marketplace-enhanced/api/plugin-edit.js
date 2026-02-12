// POST /api/plugin-edit { id, name, tags, categories }
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { requireAuth, limiter } = require('./middleware');

router.post('/', requireAuth, limiter, (req, res) => {
  const { id, name, tags, categories } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  const manifestPath = path.resolve(__dirname, '../plugins', id + '.json');
  if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found' });
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (name) manifest.name = name;
  if (tags) manifest.tags = tags;
  if (categories) manifest.categories = categories;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json({ ok: true });
});

module.exports = router;
