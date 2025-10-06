// Minimal brand server runner for CI and smoke tests
const express = require('express');
const path = require('path');

const port = process.env.TF_BRAND_PORT || 49153;
const assetsPath = path.join(__dirname, '..', '..', 'Brand_Assets');

const app = express();
app.use(express.static(assetsPath, { index: false }));
app.get('/__health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.sendFile(path.join(assetsPath, 'tf-pwa-index.html')));

// bind to all interfaces so both IPv4 and IPv6 'localhost' resolve correctly
const server = app.listen(port, () => {
  console.log(`Brand server running at http://localhost:${port} serving ${assetsPath}`);
});

// graceful shutdown
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));