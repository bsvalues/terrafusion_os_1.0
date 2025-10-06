const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.TF_LOG_DIR || path.join(__dirname, '..', 'logs');
const MAIN_LOG = path.join(LOG_DIR, 'electron-main.log');

function ensureLogDir() {
    try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) { }
}

function appendMainLog(...parts) {
    try {
        rotateLogsIfNeeded();
        ensureLogDir();
        const line = `[${new Date().toISOString()}] ${parts.map(p => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')}\n`;
        fs.appendFileSync(MAIN_LOG, line);
    } catch (e) {
        // best-effort only
    }
}

function rotateLogsIfNeeded() {
    try {
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB
        const KEEP = 5;
        if (!fs.existsSync(MAIN_LOG)) return;
        const stat = fs.statSync(MAIN_LOG);
        if (stat.size <= MAX_BYTES) return;

        const ts = new Date().toISOString().replace(/[:\.]/g, '').slice(0,14);
        const rotated = path.join(LOG_DIR, `electron-main.${ts}.log`);
        try { fs.renameSync(MAIN_LOG, rotated); } catch (e) { return; }

        // gzip in background (best-effort). Can be disabled via TF_DISABLE_GZIP=1 for tests.
        try {
            if (process.env.TF_DISABLE_GZIP !== '1') {
                const zlib = require('zlib');
                const inp = fs.createReadStream(rotated);
                const out = fs.createWriteStream(rotated + '.gz');
                const gz = zlib.createGzip();
                inp.pipe(gz).pipe(out).on('finish', () => { try { fs.unlinkSync(rotated); } catch (e) { } });
            }
        } catch (e) { }

        // prune older
        try {
            const files = fs.readdirSync(LOG_DIR)
                .filter(f => f.startsWith('electron-main.') && (f.endsWith('.log') || f.endsWith('.log.gz')))
                .map(f => ({ f, t: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime() }))
                .sort((a,b) => b.t - a.t)
                .map(x => x.f);
            for (let i = KEEP; i < files.length; i++) {
                try { fs.unlinkSync(path.join(LOG_DIR, files[i])); } catch (e) { }
            }
        } catch (e) { }
    } catch (e) { }
}

module.exports = { appendMainLog, rotateLogsIfNeeded, LOG_DIR, MAIN_LOG };
