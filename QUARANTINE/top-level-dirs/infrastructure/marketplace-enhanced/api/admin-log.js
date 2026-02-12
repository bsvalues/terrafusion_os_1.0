const fs = require('fs');
const path = require('path');
const LOG_PATH = path.resolve(__dirname, '../logs/admin-actions.log');

function logAdminAction({ pluginId, action, user }) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    pluginId,
    action,
    user: user?.email || 'unknown',
  };
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + '\n');
}

function readAdminLogs(pluginId = null) {
  if (!fs.existsSync(LOG_PATH)) return [];
  return fs.readFileSync(LOG_PATH, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return { raw: line }; }
    })
    .filter(entry => !pluginId || entry.pluginId === pluginId);
}

module.exports = { logAdminAction, readAdminLogs };
