// POST /api/plugin-error-trends [ids]
const express = require('express');
const router = express.Router();

const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const ids = req.body;
  const result = {};
  const now = Math.floor(Date.now() / 1000);
  const hour = 3600;
  await Promise.all(
    ids.map(async id => {
      const trend = [];
      for (let i = 9; i >= 0; i--) {
        const start = now - (i + 1) * hour;
        const end = now - i * hour;
        const query = `sum(increase(plugin_errors_total{job=\"${id}\"}[1h]))`;
        const url = `http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=3600`;
        try {
          const resp = await fetch(url);
          const data = await resp.json();
          let count = 0;
          if (data.status === 'success' && data.data.result.length > 0) {
            count = parseInt(data.data.result[0].values[0][1], 10);
          }
          trend.push({ timestamp: new Date(end * 1000).toISOString(), count });
        } catch {
          trend.push({ timestamp: new Date(end * 1000).toISOString(), count: 0 });
        }
      }
      result[id] = trend;
    })
  );
  res.json(result);
});

module.exports = router;
