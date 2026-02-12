const path = require('path');

describe('preload.js API surface', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('exposes TerraFusionAPI and enforces allowed channels', async () => {
        const exposed = {};
        // Mock contextBridge
        const contextBridge = {
            exposeInMainWorld: (name, obj) => { exposed[name] = obj; }
        };

        // Mock ipcRenderer that records invocations
        const ipcCalls = [];
        const ipcRenderer = {
            invoke: (channel, ...args) => { ipcCalls.push({ type: 'invoke', channel, args }); return Promise.resolve({ ok: true }); },
            send: (channel, ...args) => { ipcCalls.push({ type: 'send', channel, args }); }
        };

        // Provide electron mock
        jest.mock('electron', () => ({ contextBridge, ipcRenderer }));

        // Require the preload module (it will call exposeInMainWorld)
        require(path.join(__dirname, '..', 'preload.js'));

        // Verify exposure
        expect(exposed.TerraFusionAPI).toBeDefined();
        const api = exposed.TerraFusionAPI;
        expect(typeof api.getSystemStatus).toBe('function');
        expect(typeof api.invoke).toBe('function');
        expect(typeof api.send).toBe('function');

        // invoke a forbidden channel should throw synchronously
        expect(() => api.invoke('not-allowed')).toThrow(/Forbidden ipc invoke channel/);

        // send to a forbidden channel should throw
        expect(() => api.send('not-allowed')).toThrow(/Forbidden ipc send channel/);

        // allowed channels should call through
        await api.invoke('get-system-status');
        expect(ipcCalls.find(c => c.type === 'invoke' && c.channel === 'get-system-status')).toBeTruthy();
    });
});
