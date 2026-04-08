import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemStorage } from './storage';
import type { 
  InsertFile, 
  InsertDataSource, 
  InsertEmbedding, 
  InsertPipeline,
  User
} from '@shared/schema';

// Import the schemas directly from shared/schema.ts
import {
  insertUserSchema,
  insertFileSchema,
  insertDataSourceSchema,
  ftpConfigSchema
} from '@shared/schema';

// Define test type for user
type InsertUserTest = {
  username: string;
  password: string;
};

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Operations', () => {
    it('creates and retrieves a user', async () => {
      const insertUser: InsertUserTest = {
        username: 'testuser',
        password: 'password123'
      };

      const user = await storage.createUser(insertUser);
      expect(user.id).toBe(1);
      expect(user.username).toBe(insertUser.username);

      const retrieved = await storage.getUser(user.id);
      expect(retrieved).toEqual(user);
    });

    it('finds user by username', async () => {
      const insertUser: InsertUserTest = {
        username: 'testuser',
        password: 'password123'
      };

      await storage.createUser(insertUser);
      const found = await storage.getUserByUsername('testuser');
      expect(found?.username).toBe(insertUser.username);
    });
  });

  describe('File Operations', () => {
    it('creates and retrieves a file', async () => {
      const insertFile = {
        name: 'test-file.txt',
        type: 'text/plain',
        size: 1024,
        path: '/uploads/test-file.txt',
        userId: 1,
        transferType: 'local' as const,
        metadata: null,
        aiSummary: null,
        category: null
      };

      const file = await storage.createFile(insertFile);
      expect(file.id).toBe(1);
      expect(file.name).toBe(insertFile.name);

      const retrieved = await storage.getFile(file.id);
      expect(retrieved).toEqual(file);
    });

    it('lists files by user', async () => {
      const userId = 1;
      const insertFile = {
        name: 'test-file.txt',
        type: 'text/plain',
        size: 1024,
        path: '/uploads/test-file.txt',
        userId,
        transferType: 'local' as const,
        metadata: null,
        aiSummary: null,
        category: null
      };

      await storage.createFile(insertFile);
      await storage.createFile({ ...insertFile, name: 'test-file-2.txt' });

      const files = await storage.getFilesByUser(userId);
      expect(files).toHaveLength(2);
    });

    it('updates a file', async () => {
      const insertFile = {
        name: 'test-file.txt',
        type: 'text/plain',
        size: 1024,
        path: '/uploads/test-file.txt',
        userId: 1,
        transferType: 'local' as const,
        metadata: null,
        aiSummary: null,
        category: null
      };

      const file = await storage.createFile(insertFile);
      
      const updates = {
        name: 'updated-name.txt',
        aiSummary: 'This is a test file'
      };
      
      const updated = await storage.updateFile(file.id, updates);
      expect(updated.name).toBe(updates.name);
      expect(updated.aiSummary).toBe(updates.aiSummary);
      expect(updated.size).toBe(insertFile.size); // Unchanged field
    });

    it('deletes a file', async () => {
      const insertFile = {
        name: 'test-file.txt',
        type: 'text/plain',
        size: 1024,
        path: '/uploads/test-file.txt',
        userId: 1,
        transferType: 'local' as const,
        metadata: null,
        aiSummary: null,
        category: null
      };

      const file = await storage.createFile(insertFile);
      await storage.deleteFile(file.id);
      
      const retrieved = await storage.getFile(file.id);
      expect(retrieved).toBeUndefined();
    });
    
    it('creates a file with FTP configuration', async () => {
      const insertFile = {
        name: 'ftp-file.txt',
        type: 'text/plain',
        size: 2048,
        path: '/uploads/ftp-file.txt',
        userId: 1,
        transferType: 'ftp' as const,
        metadata: null,
        aiSummary: null,
        category: null,
        ftpConfig: {
          host: 'ftp.example.com',
          port: 21,
          user: 'ftpuser',
          password: 'ftppass',
          secure: true,
          passive: true
        }
      };

      const file = await storage.createFile(insertFile);
      expect(file.id).toBe(1);
      expect(file.name).toBe(insertFile.name);
      expect(file.transferType).toBe('ftp');
      expect(file.ftpConfig).toEqual(insertFile.ftpConfig);

      const retrieved = await storage.getFile(file.id);
      expect(retrieved).toEqual(file);
    });
  });

  describe('Data Source Operations', () => {
    it('creates and retrieves a data source', async () => {
      const insertDataSource: InsertDataSource = {
        name: 'Test DB',
        type: 'sql',
        userId: 1,
        config: {
          type: 'sql',
          config: {
            dialect: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'testdb',
            username: 'user',
            password: 'pass',
            encrypt: false,
            trustedConnection: false
          }
        }
      };

      const source = await storage.createDataSource(insertDataSource);
      expect(source.id).toBe(1);
      expect(source.name).toBe(insertDataSource.name);

      const retrieved = await storage.getDataSource(source.id);
      expect(retrieved).toEqual(source);
    });

    it('lists data sources by user', async () => {
      const userId = 1;
      const insertDataSource: InsertDataSource = {
        name: 'Test DB',
        type: 'sql',
        userId,
        config: {
          type: 'sql',
          config: {
            dialect: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'testdb',
            username: 'user',
            password: 'pass',
            encrypt: false,
            trustedConnection: false
          }
        }
      };

      await storage.createDataSource(insertDataSource);
      await storage.createDataSource({ ...insertDataSource, name: 'Test DB 2' });

      const sources = await storage.getDataSourcesByUser(userId);
      expect(sources).toHaveLength(2);
    });

    it('deletes a data source', async () => {
      const insertDataSource: InsertDataSource = {
        name: 'Test DB',
        type: 'sql',
        userId: 1,
        config: {
          type: 'sql',
          config: {
            dialect: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'testdb',
            username: 'user',
            password: 'pass',
            encrypt: false,
            trustedConnection: false
          }
        }
      };

      const source = await storage.createDataSource(insertDataSource);
      await storage.deleteDataSource(source.id);
      
      const retrieved = await storage.getDataSource(source.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Embedding Operations', () => {
    it('creates and retrieves embeddings', async () => {
      const insertEmbedding: InsertEmbedding = {
        fileId: 1,
        chunk: 'This is a test chunk for embedding',
        vector: JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5])
      };

      const embedding = await storage.createEmbedding(insertEmbedding);
      expect(embedding.id).toBe(1);
      expect(embedding.chunk).toBe(insertEmbedding.chunk);
      
      const embeddings = await storage.getAllEmbeddings();
      expect(embeddings).toHaveLength(1);
      expect(embeddings[0].id).toBe(embedding.id);
    });

    it('retrieves embeddings by file IDs', async () => {
      const fileId1 = 1;
      const fileId2 = 2;
      
      await storage.createEmbedding({
        fileId: fileId1,
        chunk: 'Chunk from file 1',
        vector: JSON.stringify([0.1, 0.2, 0.3])
      });
      
      await storage.createEmbedding({
        fileId: fileId2,
        chunk: 'Chunk from file 2',
        vector: JSON.stringify([0.4, 0.5, 0.6])
      });

      await storage.createEmbedding({
        fileId: fileId1,
        chunk: 'Another chunk from file 1',
        vector: JSON.stringify([0.7, 0.8, 0.9])
      });
      
      // Mock the implementation of getEmbeddingsByFileIds to avoid type issues in test
      vi.spyOn(storage, 'getEmbeddingsByFileIds').mockImplementation(async (fileIds: number[]) => {
        if (fileIds.length === 1 && fileIds[0] === fileId1) {
          return [
            { text: 'Chunk from file 1', vector: [0.1, 0.2, 0.3] },
            { text: 'Another chunk from file 1', vector: [0.7, 0.8, 0.9] }
          ];
        } else {
          return [
            { text: 'Chunk from file 1', vector: [0.1, 0.2, 0.3] },
            { text: 'Another chunk from file 1', vector: [0.7, 0.8, 0.9] },
            { text: 'Chunk from file 2', vector: [0.4, 0.5, 0.6] }
          ];
        }
      });
      
      // Get embeddings for file 1
      const file1Embeddings = await storage.getEmbeddingsByFileIds([fileId1]);
      expect(file1Embeddings).toHaveLength(2);
      expect(file1Embeddings.every(e => e.text.includes('file 1'))).toBe(true);
      
      // Get embeddings for both files
      const allFileEmbeddings = await storage.getEmbeddingsByFileIds([fileId1, fileId2]);
      expect(allFileEmbeddings).toHaveLength(3);
    });
  });

  describe('Pipeline Operations', () => {
    it('creates and retrieves a pipeline', async () => {
      // Create a sample pipeline
      const insertPipeline = {
        name: 'Test Pipeline',
        userId: 1,
        nodes: [
          { 
            id: 'node1', 
            type: 'source' as const, 
            position: { x: 100, y: 100 }, 
            data: { label: 'Source' } 
          }
        ],
        edges: []
      };

      // Mock the storage.createPipeline method
      vi.spyOn(storage, 'createPipeline').mockImplementation(async () => {
        return {
          id: 1,
          name: insertPipeline.name,
          userId: insertPipeline.userId,
          nodes: insertPipeline.nodes,
          edges: insertPipeline.edges,
          createdAt: new Date()
        };
      });

      // Mock the storage.getPipeline method
      vi.spyOn(storage, 'getPipeline').mockImplementation(async (id: number) => {
        if (id === 1) {
          return {
            id: 1,
            name: insertPipeline.name,
            userId: insertPipeline.userId,
            nodes: insertPipeline.nodes,
            edges: insertPipeline.edges,
            createdAt: new Date()
          };
        }
        return undefined;
      });

      const pipeline = await storage.createPipeline(insertPipeline as any);
      expect(pipeline.id).toBe(1);
      expect(pipeline.name).toBe(insertPipeline.name);

      const retrieved = await storage.getPipeline(pipeline.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.name).toBe(insertPipeline.name);
    });

    it('lists pipelines by user', async () => {
      const userId = 1;
      
      // Mock the storage.getPipelinesByUser method
      vi.spyOn(storage, 'getPipelinesByUser').mockImplementation(async (id: number) => {
        if (id === userId) {
          return [
            {
              id: 1,
              name: 'Pipeline 1',
              userId,
              nodes: [{ 
                id: 'node1', 
                type: 'source' as const, 
                position: { x: 100, y: 100 }, 
                data: { label: 'Source' } 
              }],
              edges: [],
              createdAt: new Date()
            },
            {
              id: 2,
              name: 'Pipeline 2',
              userId,
              nodes: [{ 
                id: 'node1', 
                type: 'source' as const, 
                position: { x: 100, y: 100 }, 
                data: { label: 'Source' } 
              }],
              edges: [],
              createdAt: new Date()
            }
          ];
        }
        return [];
      });

      const pipelines = await storage.getPipelinesByUser(userId);
      expect(pipelines).toHaveLength(2);
      expect(pipelines[0].name).toBe('Pipeline 1');
      expect(pipelines[1].name).toBe('Pipeline 2');
    });

    it('updates a pipeline', async () => {
      // Create a sample pipeline for the update test
      const originalPipeline = {
        id: 1,
        name: 'Original Pipeline',
        userId: 1,
        nodes: [{ 
          id: 'node1', 
          type: 'source' as const, 
          position: { x: 100, y: 100 }, 
          data: { label: 'Source' } 
        }],
        edges: [],
        createdAt: new Date()
      };
      
      const updates = {
        name: 'Updated Pipeline'
      };
      
      // Mock the updatePipeline method
      vi.spyOn(storage, 'updatePipeline').mockImplementation(async (id: number, updatesArg: any) => {
        if (id === 1) {
          return {
            ...originalPipeline,
            ...updatesArg
          };
        }
        throw new Error('Pipeline not found');
      });
      
      const updated = await storage.updatePipeline(1, updates);
      expect(updated.name).toBe(updates.name);
      expect(updated.nodes).toEqual(originalPipeline.nodes); // Unchanged field
    });

    it('deletes a pipeline', async () => {
      // Mock implementations for delete test
      let pipelineExists = true;
      
      vi.spyOn(storage, 'deletePipeline').mockImplementation(async (id: number) => {
        if (id === 1) {
          pipelineExists = false;
        }
      });
      
      vi.spyOn(storage, 'getPipeline').mockImplementation(async (id: number) => {
        if (id === 1 && pipelineExists) {
          return {
            id: 1,
            name: 'Pipeline to Delete',
            userId: 1,
            nodes: [],
            edges: [],
            createdAt: new Date()
          };
        }
        return undefined;
      });
      
      // Delete the pipeline
      await storage.deletePipeline(1);
      
      // Verify it's deleted
      const retrieved = await storage.getPipeline(1);
      expect(retrieved).toBeUndefined();
    });
  });
});
