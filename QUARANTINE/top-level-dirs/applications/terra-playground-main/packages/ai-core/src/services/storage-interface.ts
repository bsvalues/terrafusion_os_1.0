/**
 * Storage Interface
 *
 * Defines the storage interface used by agent components.
 */

/**
 * Generic storage interface
 */
export interface IStorage {
  /**
   * Initialize the storage
   */
  initialize(): Promise<void>;

  /**
   * Get an item by key from storage
   */
  getItem<T>(collection: string, key: string): Promise<T | null>;

  /**
   * Set an item in storage
   */
  setItem<T>(collection: string, key: string, value: T): Promise<void>;

  /**
   * Delete an item from storage
   */
  deleteItem(collection: string, key: string): Promise<boolean>;

  /**
   * Check if an item exists in storage
   */
  hasItem(collection: string, key: string): Promise<boolean>;

  /**
   * Find items that match a filter
   */
  find<T>(collection: string, filter?: Record<string, any>, options?: FindOptions): Promise<T[]>;

  /**
   * Update items that match a filter
   */
  update<T>(collection: string, filter: Record<string, any>, update: Partial<T>): Promise<number>;

  /**
   * Delete items that match a filter
   */
  delete(collection: string, filter: Record<string, any>): Promise<number>;

  /**
   * Count items that match a filter
   */
  count(collection: string, filter?: Record<string, any>): Promise<number>;
}

/**
 * Find options for querying data
 */
export interface FindOptions {
  /**
   * Number of items to skip
   */
  skip?: number;

  /**
   * Number of items to limit
   */
  limit?: number;

  /**
   * Sort direction
   */
  sort?: Record<string, 1 | -1>;
}

/**
 * In-memory storage implementation
 */
export class MemoryStorage implements IStorage {
  private storage: Map<string, Map<string, any>> = new Map();

  /**
   * Initialize the storage
   */
  public async initialize(): Promise<void> {
    // Memory storage doesn't need initialization
  }

  /**
   * Get an item by key from storage
   */
  public async getItem<T>(collection: string, key: string): Promise<T | null> {
    const collectionMap = this.storage.get(collection);
    if (!collectionMap) {
      return null;
    }
    return collectionMap.get(key) || null;
  }

  /**
   * Set an item in storage
   */
  public async setItem<T>(collection: string, key: string, value: T): Promise<void> {
    if (!this.storage.has(collection)) {
      this.storage.set(collection, new Map());
    }
    const collectionMap = this.storage.get(collection)!;
    collectionMap.set(key, value);
  }

  /**
   * Delete an item from storage
   */
  public async deleteItem(collection: string, key: string): Promise<boolean> {
    const collectionMap = this.storage.get(collection);
    if (!collectionMap) {
      return false;
    }
    return collectionMap.delete(key);
  }

  /**
   * Check if an item exists in storage
   */
  public async hasItem(collection: string, key: string): Promise<boolean> {
    const collectionMap = this.storage.get(collection);
    if (!collectionMap) {
      return false;
    }
    return collectionMap.has(key);
  }

  /**
   * Find items that match a filter
   */
  public async find<T>(
    collection: string,
    filter?: Record<string, any>,
    options?: FindOptions
  ): Promise<T[]> {
    const collectionMap = this.storage.get(collection);
    if (!collectionMap) {
      return [];
    }

    let result = Array.from(collectionMap.values()) as T[];

    // Apply filter if provided
    if (filter) {
      result = result.filter(item => {
        for (const [key, value] of Object.entries(filter)) {
          if ((item as any)[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sort if provided
    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      if (sortEntries.length > 0) {
        result.sort((a, b) => {
          for (const [key, direction] of sortEntries) {
            const valueA = (a as any)[key];
            const valueB = (b as any)[key];
            if (valueA < valueB) return -1 * direction;
            if (valueA > valueB) return 1 * direction;
          }
          return 0;
        });
      }
    }

    // Apply pagination if provided
    if (options?.skip || options?.limit) {
      const skip = options.skip || 0;
      const limit = options.limit || result.length;
      result = result.slice(skip, skip + limit);
    }

    return result;
  }

  /**
   * Update items that match a filter
   */
  public async update<T>(
    collection: string,
    filter: Record<string, any>,
    update: Partial<T>
  ): Promise<number> {
    const collectionMap = this.storage.get(collection);
    if (!collectionMap) {
      return 0;
    }

    let count = 0;
    for (const [key, item] of collectionMap.entries()) {
      let matches = true;
      for (const [filterKey, filterValue] of Object.entries(filter)) {
        if (item[filterKey] !== filterValue) {
          matches = false;
          break;
        }
      }

      if (matches) {
        collectionMap.set(key, { ...item, ...update });
        count++;
      }
    }

    return count;
  }

  /**
   * Delete items that match a filter
   */
  public async delete(collection: string, filter: Record<string, any>): Promise<number> {
    const collectionMap = this.storage.get(collection);
    if (!collectionMap) {
      return 0;
    }

    const keysToDelete: string[] = [];
    for (const [key, item] of collectionMap.entries()) {
      let matches = true;
      for (const [filterKey, filterValue] of Object.entries(filter)) {
        if (item[filterKey] !== filterValue) {
          matches = false;
          break;
        }
      }

      if (matches) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      collectionMap.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Count items that match a filter
   */
  public async count(collection: string, filter?: Record<string, any>): Promise<number> {
    const items = await this.find(collection, filter);
    return items.length;
  }
}
