const fs = require('fs-extra');
const path = require('path');

const helperPath = path.join(__dirname, '..', 'log-helpers.js');
const { appendMainLog, rotateLogsIfNeeded, LOG_DIR, MAIN_LOG } = require(path.join(__dirname, '..', 'log-helpers'));

describe('log-helpers rotateLogsIfNeeded', () => {
    const tmpRoot = path.join(__dirname, '..', '..', 'tmp_test_logs');
    const origLogDir = LOG_DIR;

    beforeAll(() => {
        // Ensure a clean temp dir
        fs.removeSync(tmpRoot);
        fs.mkdirpSync(tmpRoot);
    });

    beforeEach(() => {
        jest.resetModules();
        process.env.TF_LOG_DIR = tmpRoot;
        process.env.TF_DISABLE_GZIP = '1';
        // create the directory
        fs.mkdirpSync(tmpRoot);
    });

    afterEach(() => {
        fs.removeSync(tmpRoot);
    });

    afterAll(() => {
        fs.removeSync(tmpRoot);
    });

    test('rotates large log and keeps only KEEP recent files', async () => {
        // Create a large main log > 10MB
        const mainLog = path.join(tmpRoot, 'electron-main.log');
        const largeData = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
        fs.writeFileSync(mainLog, largeData);

        // Create extra rotated files to test pruning
        for (let i = 0; i < 7; i++) {
            const f = path.join(tmpRoot, `electron-main.OLD${i}.log`);
            fs.writeFileSync(f, 'old');
            // modify mtime so ordering is clear
            const d = new Date(Date.now() - (i * 1000));
            fs.utimesSync(f, d, d);
        }

        // Load a fresh instance and call rotate
    jest.resetModules();
    process.env.TF_LOG_DIR = tmpRoot;
    const mod = require(path.join(__dirname, '..', 'log-helpers'));
    // Call rotate
    mod.rotateLogsIfNeeded();

        // After rotate, main log should be moved to a rotated file or gz; check that electron-main.log does not exist
        const existsMain = fs.existsSync(path.join(tmpRoot, 'electron-main.log'));
        expect(existsMain).toBe(false);

        // Count rotated files matching pattern
        const files = fs.readdirSync(tmpRoot).filter(f => f.startsWith('electron-main.') && (f.endsWith('.log') || f.endsWith('.log.gz')));
        // Should keep at most 5 rotated files total
        expect(files.length).toBeLessThanOrEqual(5);
    }, 20000);
});
