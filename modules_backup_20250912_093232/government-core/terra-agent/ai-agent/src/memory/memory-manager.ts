/**
 * Memory Manager for TerraAgent AI
 */

import { MemoryEntry } from '../types/agent-types.js';

export class MemoryManager {
  private config: any;
  private memories: Map<string, MemoryEntry> = new Map();

  constructor(config: any) {
    this.config = config;
  }

  public async store(memory: MemoryEntry): Promise<void> {
    this.memories.set(memory.id, memory);
  }

  public async retrieve(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // Simple text matching for now
    const relevant = Array.from(this.memories.values())
      .filter(memory => memory.content.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);

    return relevant;
  }

  public async update(memoryId: string, updates: Partial<MemoryEntry>): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (memory) {
      Object.assign(memory, updates);
      this.memories.set(memoryId, memory);
    }
  }

  public async delete(memoryId: string): Promise<void> {
    this.memories.delete(memoryId);
  }
}
