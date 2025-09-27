// Persistent API for plugin usage stats (SQLite)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.resolve(__dirname, 'plugin-usage-stats.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usage (
    pluginId TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    lastLaunched TEXT
  )`);
});

// GET /api/plugin-usage-stats
const { limiter } = require('./middleware');

router.get('/', limiter, (req, res) => {
  db.all('SELECT * FROM usage', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const stats = {};
    for (const row of rows) {
      stats[row.pluginId] = { count: row.count, lastLaunched: row.lastLaunched };
    }
    res.json(stats);
  });
});

// POST /api/plugin-usage-stats { pluginId, timestamp }
router.post('/', limiter, (req, res) => {
  const { pluginId, timestamp } = req.body;
  if (!pluginId || !timestamp)
    return res.status(400).json({ error: 'pluginId and timestamp required' });
  db.run(
    `INSERT INTO usage (pluginId, count, lastLaunched) VALUES (?, 1, ?)
     ON CONFLICT(pluginId) DO UPDATE SET count = count + 1, lastLaunched = excluded.lastLaunched`,
    [pluginId, timestamp],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

module.exports = router;
