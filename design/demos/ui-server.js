/**
 * TerraFusion UI Server
 * Serves the TerraFusion Shell UI on port 5005
 * Part of THE TERRAFUSION WAY orchestration
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5005;

// Serve static files from the native shell UI directory
const uiPath = path.join(__dirname, 'native-shell', 'ui');
app.use(express.static(uiPath));

// Serve working.html specifically for the shell
app.get('/working.html', (req, res) => {
  res.sendFile(path.join(uiPath, 'working.html'));
});

// Serve index.html as fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(uiPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 TerraFusion UI Server operational on port ${PORT}`);
  console.log(`📁 Serving UI from: ${uiPath}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`✅ THE TERRAFUSION WAY: Shell + Swarm + UI Server`);
});
