import type { ModelAdapter } from './modelAdapter.js';

/**
 * Tiny in-process registry mapping adapter name → adapter instance.
 *
 * Duplicate registration is rejected to prevent silent override of an
 * already-active backend (e.g., a daemon swapping the live model out from
 * under callers).
 */
export class AdapterRegistry {
  private readonly adapters = new Map<string, ModelAdapter>();

  register(adapter: ModelAdapter): this {
    if (this.adapters.has(adapter.name)) {
      throw new Error(`adapter already registered: ${adapter.name}`);
    }
    this.adapters.set(adapter.name, adapter);
    return this;
  }

  get(name: string): ModelAdapter | undefined {
    return this.adapters.get(name);
  }

  require(name: string): ModelAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`adapter not registered: ${name}`);
    }
    return adapter;
  }

  list(): ModelAdapter[] {
    return [...this.adapters.values()];
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  unregister(name: string): boolean {
    return this.adapters.delete(name);
  }

  async closeAll(): Promise<void> {
    const adapters = this.list();
    this.adapters.clear();
    await Promise.all(adapters.map(a => a.close()));
  }
}
