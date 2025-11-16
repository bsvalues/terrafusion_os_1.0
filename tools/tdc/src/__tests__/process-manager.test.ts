import { ProcessManager } from '../lib/process-manager';

describe('ProcessManager', () => {
  let processManager: ProcessManager;

  beforeEach(() => {
    processManager = new ProcessManager();
  });

  afterEach(async () => {
    await processManager.stopAllServices();
  });

  it('should start and track a service process', async () => {
    const config = {
      name: 'test-service',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 1000)'],
    };

    const childProcess = await processManager.startService(config);

    expect(childProcess).toBeDefined();
    expect(processManager.isServiceRunning('test-service')).toBe(true);
    expect(processManager.getRunningServices()).toContain('test-service');
  });

  it('should stop a running service', async () => {
    const config = {
      name: 'test-service',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 5000)'],
    };

    await processManager.startService(config);
    expect(processManager.isServiceRunning('test-service')).toBe(true);

    const stopped = await processManager.stopService('test-service');
    expect(stopped).toBe(true);
    expect(processManager.isServiceRunning('test-service')).toBe(false);
  });

  it('should return false when stopping non-existent service', async () => {
    const stopped = await processManager.stopService('non-existent');
    expect(stopped).toBe(false);
  });

  it('should emit events for process lifecycle', done => {
    const config = {
      name: 'test-service',
      command: 'node',
      args: ['-e', 'console.log("hello"); process.exit(0)'],
    };

    let eventCount = 0;

    processManager.on('stdout', (name, data) => {
      expect(name).toBe('test-service');
      expect(data).toContain('hello');
      eventCount++;
    });

    processManager.on('exit', (name, code) => {
      expect(name).toBe('test-service');
      expect(code).toBe(0);
      eventCount++;

      if (eventCount === 2) {
        done();
      }
    });

    processManager.startService(config);
  });
});
