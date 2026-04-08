import { MemStorage } from './storage';
import { DbStorage } from './db-storage';

// Create instances of both storage implementations
export const memStorage = new MemStorage();
export const dbStorage = new DbStorage();

// Use database storage instead of memory storage
// This is the main storage instance that should be used throughout the application
export const storage = dbStorage;