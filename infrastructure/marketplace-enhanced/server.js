const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mount all API routes
app.use('/api/plugin-health', require('./api/plugin-health'));
app.use('/api/plugin-usage-stats', require('./api/plugin-usage-stats'));
app.use('/api/plugin-errors', require('./api/plugin-errors'));
app.use('/api/plugin-uptime', require('./api/plugin-uptime'));
app.use('/api/plugin-error-trends', require('./api/plugin-error-trends'));
app.use('/api/plugin-onboarding', require('./api/plugin-onboarding'));
app.use('/api/plugin-edit', require('./api/plugin-edit'));
app.use('/api/plugin-remove', require('./api/plugin-remove'));
app.use('/api/launch-trends', require('./api/launch-trends'));
app.use('/api/plugin-admin-action', require('./api/plugin-admin-action'));
app.use('/api/plugin-audit-log', require('./api/plugin-audit-log'));
app.use('/api/metrics', require('./api/metrics'));
app.use('/api/admin', require('./api/admin'));

// Static files (dashboard UI)
app.use(express.static(path.join(__dirname, 'ui', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'dist', 'index.html'));
});

const PORT = process.env.TF_FRONTEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Terrafusion Marketplace API listening on port ${PORT}`);
});
