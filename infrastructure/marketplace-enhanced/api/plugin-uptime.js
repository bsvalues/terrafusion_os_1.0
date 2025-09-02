// POST /api/plugin-uptime [ids]
const express = require('express');
const router = express.Router();

const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const ids = req.body;
  const result = {};
  await Promise.all(ids.map(async id => {
    try {
      // Prometheus query: avg_over_time(up{job="<plugin.id>"}[24h])
      const query = `avg_over_time(up{job=\"${id}\"}[24h])`;
      const url = `http://localhost:9090/api/v1/query?query=${encodeURIComponent(query)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === 'success' && data.data.result.length > 0) {
        result[id] = parseFloat(data.data.result[0].value[1]);
      } else {
        result[id] = null;
      }
    } catch (e) {
      result[id] = null;
    }
  }));
  res.json(result);
});

module.exports = router;
