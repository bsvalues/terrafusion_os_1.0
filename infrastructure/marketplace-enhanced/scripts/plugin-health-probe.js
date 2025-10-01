// Periodically probes plugin health and pushes to Prometheus gauge
const fetch = require('node-fetch');
const fs = require('fs');
const client = require('prom-client');

const gauge = new client.Gauge({
  name: 'plugin_health_status',
  help: 'Plugin health (1=healthy, 0=unhealthy)',
  labelNames: ['pluginId'],
});
client.collectDefaultMetrics();

const PLUGIN_SIDEBAR = '../plugins/sidebar.json';
const HEALTH_ENDPOINT = 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/plugin-health';

async function probe() {
  const sidebar = JSON.parse(fs.readFileSync(PLUGIN_SIDEBAR, 'utf8'));
  const ids = sidebar.map(p => p.id);
  const res = await fetch(HEALTH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  });
  const health = await res.json();
  for (const id of ids) {
    const healthy = health[id] ? 1 : 0;
    gauge.set({ pluginId: id }, healthy);
    console.log(`[${new Date().toISOString()}] Plugin ${id} health: ${healthy}`);
  }
}

// Run immediately, then every 60s
probe();
setInterval(probe, 60000);

// Expose Prometheus metrics endpoint
const express = require('express');
const app = express();
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
app.listen(9101, () => console.log('Plugin health probe metrics on :9101/metrics'));
