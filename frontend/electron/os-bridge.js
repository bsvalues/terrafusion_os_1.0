// Terrafusion OS Bridge (Electron Main Process)
// Uses SignalR for reliable WebSocket communication to OS core

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { HubConnectionBuilder, LogLevel, HttpTransportType } = require('@microsoft/signalr');

const { MessageQueue } = require('./message-queue');
const { SecureVault } = require('./security/secure-vault');

class TerraFusionOSBridge {
  constructor() {
    // Load central config
    // Resolve from repo root relative to this file
    const configPath = path.resolve(__dirname, '..', '..', 'terrafusion.config.json');
    this.config = require(configPath);

    this.state = {
      status: 'disconnected', // disconnected | connecting | authenticated | error
      connection: null,
      authenticated: false,
      sessionId: null,
      reconnectAttempts: 0,
      lastError: null,
      loadedModules: [],
      moduleStatuses: {}, // name -> 'loading' | 'loaded' | 'denied' | 'error'
    };

    this._heartbeatTimer = null;
    this._listeners = new Set();
    this._queue = new MessageQueue(1000);
    this._vault = new SecureVault();
  }

  async loadModule(moduleName, source = 'electron') {
    return this.send('LoadModule', { ModuleName: moduleName, Source: source });
  }

  async loadAllEnabledModules() {
    try {
      const cfgPath = path.resolve(__dirname, '..', 'config', 'counties', 'benton.json');
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const json = JSON.parse(raw);

      // Safeguard: ensure county and legacy match
      if (json.countyId?.toLowerCase() !== 'benton' || json.legacySystem !== 'PACS_9.0') {
        this.state.lastError = 'County/legacy mismatch; skipping module autoload';
        this._emitState();
        return;
      }

      const modules = Array.isArray(json.requiredModules) ? json.requiredModules : [];
      for (const name of modules) {
        // mark loading
        this.state.moduleStatuses = { ...this.state.moduleStatuses, [name]: 'loading' };
        this._emitState();
        try {
          // eslint-disable-next-line no-await-in-loop
          await this.loadModule(name, 'autoloader');
          // Success is confirmed by ModuleLoaded event; leave status as loading until event
        } catch (err) {
          const reason = String(err);
          const status = reason.toLowerCase().includes('not authorized') ? 'denied' : 'error';
          this.state.moduleStatuses = { ...this.state.moduleStatuses, [name]: status };
          this.state.lastError = `Module autoload failed [${name}]: ${reason}`;
          this._emitState();
        }
      }
    } catch (err) {
      this.state.lastError = `Failed to load modules: ${err}`;
      this._emitState();
    }
  }

  async invokePlugin(moduleName, method, payload) {
    if (!this.state.authenticated) {
      throw new Error('Not authenticated');
    }

    // Set up promise resolver for async response
    const key = `${moduleName}:${method}`;
    this._pendingInvokes = this._pendingInvokes || new Map();

    return new Promise((resolve, reject) => {
      this._pendingInvokes.set(key, { resolve, reject });

      // Send request through SignalR hub
      this.send('PluginInvoke', { ModuleName: moduleName, Method: method, Payload: payload }).catch(
        (err) => {
          this._pendingInvokes.delete(key);
          reject(err);
        }
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this._pendingInvokes.has(key)) {
          this._pendingInvokes.delete(key);
          reject(new Error('Plugin invoke timeout'));
        }
      }, 10000);
    });
  }

  emitPlugin(moduleName, event, data) {
    if (!this.state.authenticated) {
      console.warn('Cannot emit plugin event: not authenticated');
      return;
    }
    // Route plugin events through SignalR hub
    this.send('PluginEmit', { ModuleName: moduleName, Event: event, Data: data }).catch((err) => {
      console.warn('Plugin emit failed:', err);
    });
  }

  isConnected() {
    return this.state.status === 'authenticated';
  }

  getLastError() {
    return this.state.lastError;
  }

  onStateChanged(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emitState() {
    for (const l of this._listeners) {
      try {
        l(this.getState());
      } catch (_) {
        // Ignore listener errors
      }
    }
  }

  getState() {
    return { ...this.state };
  }

  // Public helper to create an HMAC-signed auth envelope matching backend expectations
  async createAuthEnvelope(countyId, legacySystem) {
    const secret =
      process.env.TF_OS_SHARED_SECRET || process.env.TF_VAULT_KEY || 'dev-shared-secret';
    const payload = {
      CountyId: countyId,
      LegacySystem: legacySystem,
      Nonce: crypto.randomBytes(12).toString('hex'),
      Ts: Date.now(),
    };
    const canonical = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'utf8'));
    hmac.update(Buffer.from(canonical, 'utf8'));
    const signature = hmac
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return { Payload: payload, Signature: signature, Alg: 'HS256' };
  }

  async initialize() {
    await this._establishCoreChannel();
    await this._performAuthHandshake();
    this._startHeartbeat();
  }

  async _establishCoreChannel() {
    const endpoint = this.config.endpoints.core;
    this.state.status = 'connecting';
    this._emitState();

    // Build SignalR Hub connection (works in Node/Electron)
    this.state.connection = new HubConnectionBuilder()
      .withUrl(endpoint, {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          const attempt = ctx.previousRetryCount + 1;
          const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
          return delay;
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    this._bindConnectionEvents();

    try {
      await this.state.connection.start();
    } catch (err) {
      this.state.lastError = String(err);
      this.state.status = 'error';
      this._emitState();
      throw err;
    }
  }

  _bindConnectionEvents() {
    const conn = this.state.connection;
    if (!conn) return;

    conn.onreconnecting((err) => {
      this.state.status = 'connecting';
      this.state.lastError = err ? String(err) : null;
      this._emitState();
    });

    conn.onreconnected(() => {
      if (this.state.authenticated) {
        // Session may persist server-side; refresh heartbeat
        this._startHeartbeat();
        this.state.status = 'authenticated';
      } else {
        this.state.status = 'connecting';
      }
      this._emitState();
    });

    conn.onclose((err) => {
      this.state.status = 'disconnected';
      this.state.authenticated = false;
      this.state.lastError = err ? String(err) : null;
      this._emitState();
    });

    // Example server-to-client handlers (to be implemented server-side)
    conn.on('AuthenticationSuccess', (payload) => {
      this.state.authenticated = true;
      this.state.sessionId = payload?.sessionId ?? null;
      this.state.status = 'authenticated';
      this.state.loadedModules = [];
      this.state.moduleStatuses = {};
      this._emitState();
      // Start/refresh heartbeat and flush any buffered messages
      this._startHeartbeat();
      this._flushQueue();
      // Auto-load enabled modules per Benton config (falls back to requiredModules)
      this.loadAllEnabledModules().catch(() => {
        /* handled by state.lastError */
      });
    });

    conn.on('AuthenticationFailed', (reason) => {
      this.state.authenticated = false;
      this.state.status = 'error';
      this.state.lastError = `Auth failed: ${reason}`;
      this._emitState();
    });

    conn.on('AuditLog', (entry) => {
      // Placeholder: route to app-level logger or file sink
      // console.log('[OS Audit]', entry);
    });

    // Module orchestration events
    conn.on('ModuleLoaded', (payload) => {
      // Optionally bubble to UI or logs
      this.state.lastError = null;
      const name = payload?.module;
      if (name && !this.state.loadedModules.includes(name)) {
        this.state.loadedModules = [...this.state.loadedModules, name];
      }
      if (name) {
        this.state.moduleStatuses = { ...this.state.moduleStatuses, [name]: 'loaded' };
      }
      this._emitState();
    });
    conn.on('ModuleLoadFailed', (payload) => {
      const name = payload?.module;
      const reason = payload?.reason ?? 'unknown';
      this.state.lastError = `Module load failed${name ? ` [${name}]` : ''}: ${reason}`;
      if (name) {
        const status = String(reason).toLowerCase().includes('not authorized') ? 'denied' : 'error';
        this.state.moduleStatuses = { ...this.state.moduleStatuses, [name]: status };
      }
      this._emitState();
    });

    // Plugin invoke result handling
    conn.on('PluginInvokeResult', (payload) => {
      // Store result for retrieval by pending invoke promises
      const key = `${payload.module}:${payload.method}`;
      this._pendingInvokes = this._pendingInvokes || new Map();
      const resolver = this._pendingInvokes.get(key);
      if (resolver) {
        resolver.resolve(payload.result);
        this._pendingInvokes.delete(key);
      }
    });

    conn.on('PluginInvokeFailed', (payload) => {
      const key = `${payload.module}:unknown`;
      this._pendingInvokes = this._pendingInvokes || new Map();
      const resolver = this._pendingInvokes.get(key);
      if (resolver) {
        resolver.reject(new Error(payload.reason || 'Plugin invoke failed'));
        this._pendingInvokes.delete(key);
      }
    });
  }

  async _performAuthHandshake() {
    const countyId = 'benton';
    const legacySystem = 'PACS_9.0';

    // Generate HMAC-signed auth envelope in main process
    const secret =
      process.env.TF_OS_SHARED_SECRET || process.env.TF_VAULT_KEY || 'dev-shared-secret';
    const payload = {
      CountyId: countyId,
      LegacySystem: legacySystem,
      Nonce: crypto.randomBytes(12).toString('hex'),
      Ts: Date.now(),
    };
    const canonical = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'utf8'));
    hmac.update(Buffer.from(canonical, 'utf8'));
    const signature = hmac
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const envelope = { Payload: payload, Signature: signature, Alg: 'HS256' };

    try {
      await this.state.connection.invoke('AuthenticateOS', {
        CountyId: countyId,
        LegacySystem: legacySystem,
        Credentials: envelope,
      });
    } catch (err) {
      this.state.lastError = String(err);
      this.state.status = 'error';
      this._emitState();
      throw err;
    }
  }

  _startHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
    }
    if (!this.state.connection || !this.state.authenticated) return;

    this._heartbeatTimer = setInterval(async () => {
      try {
        await this.state.connection.invoke('Heartbeat', {
          sessionId: this.state.sessionId,
          ts: Date.now(),
        });
      } catch (err) {
        // Allow reconnect policy to handle
        this.state.lastError = String(err);
        this._emitState();
      }
    }, 15000);
  }

  async send(method, payload) {
    // Resilient send that buffers when not authenticated
    if (!this.state.connection || this.state.status !== 'authenticated') {
      this._queue.enqueue({ method, payload });
      return { buffered: true };
    }

    try {
      await this.state.connection.invoke(method, payload);
      return { buffered: false, sent: true };
    } catch (err) {
      // On failure, buffer and let reconnect policy handle
      this._queue.enqueue({ method, payload });
      this.state.lastError = String(err);
      this._emitState();
      return { buffered: true, error: this.state.lastError };
    }
  }

  async _flushQueue() {
    if (!this.state.connection || this.state.status !== 'authenticated') return;
    const items = this._queue.drain();
    for (const item of items) {
      try {
        // Fire and forget to avoid blocking flush sequence
        // eslint-disable-next-line no-await-in-loop
        await this.state.connection.invoke(item.method, item.payload);
      } catch (err) {
        // Re-enqueue failed items to try later
        this._queue.enqueue(item);
        this.state.lastError = String(err);
        this._emitState();
        break; // stop flush on first failure to avoid tight loop
      }
    }
  }
}

module.exports = { TerraFusionOSBridge };
