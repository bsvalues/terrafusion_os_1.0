// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterRegistry = void 0;
/**
 * Tiny in-process registry mapping adapter name → adapter instance.
 *
 * Duplicate registration is rejected to prevent silent override of an
 * already-active backend (e.g., a daemon swapping the live model out from
 * under callers).
 */
class AdapterRegistry {
    constructor() {
        this.adapters = new Map();
    }
    register(adapter) {
        if (this.adapters.has(adapter.name)) {
            throw new Error(`adapter already registered: ${adapter.name}`);
        }
        this.adapters.set(adapter.name, adapter);
        return this;
    }
    get(name) {
        return this.adapters.get(name);
    }
    require(name) {
        const adapter = this.adapters.get(name);
        if (!adapter) {
            throw new Error(`adapter not registered: ${name}`);
        }
        return adapter;
    }
    list() {
        return [...this.adapters.values()];
    }
    has(name) {
        return this.adapters.has(name);
    }
    unregister(name) {
        return this.adapters.delete(name);
    }
    async closeAll() {
        const adapters = this.list();
        this.adapters.clear();
        await Promise.all(adapters.map(a => a.close()));
    }
}
exports.AdapterRegistry = AdapterRegistry;
