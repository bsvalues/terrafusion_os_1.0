const express = require('express');
const client = require('prom-client');

const router = express.Router();
client.collectDefaultMetrics();

// Custom counters for admin actions
const deployCounter = new client.Counter({
  name: 'plugin_deploy_total',
  help: 'Total plugin deploys',
  labelNames: ['pluginId'],
});
const rollbackCounter = new client.Counter({
  name: 'plugin_rollback_total',
  help: 'Total plugin rollbacks',
  labelNames: ['pluginId'],
});
const launchCounter = new client.Counter({
  name: 'plugin_launch_total',
  help: 'Total plugin launches',
  labelNames: ['pluginId'],
});

// Expose for use in admin endpoints
router.deployCounter = deployCounter;
router.rollbackCounter = rollbackCounter;
router.launchCounter = launchCounter;

router.get('/', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = router;
