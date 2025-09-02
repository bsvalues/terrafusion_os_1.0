import { 
  type User, type InsertUser,
  type File, type InsertFile,
  type DataSource, type InsertDataSource,
  type Embedding, type InsertEmbedding,
  type RagEmbedding,
  type Pipeline, type InsertPipeline,
  users, files, dataSources, embeddings, pipelines
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";
import logger from "./lib/logger";

/**
 * PostgreSQL database storage implementation
 * Handles all CRUD operations with the database
 */
export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error("Database error in getUser", { error, userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error("Database error in getUserByUsername", { error, username });
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      logger.error("Database error in createUser", { error, user });
      throw error;
    }
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    try {
      const result = await db.select().from(files).where(eq(files.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error("Database error in getFile", { error, fileId: id });
      throw error;
    }
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    try {
      return await db.select().from(files).where(eq(files.userId, userId));
    } catch (error) {
      logger.error("Database error in getFilesByUser", { error, userId });
      throw error;
    }
  }

  async createFile(file: InsertFile): Promise<File> {
    try {
      const result = await db.insert(files).values(file).returning();
      return result[0];
    } catch (error) {
      logger.error("Database error in createFile", { error, file });
      throw error;
    }
  }

  async updateFile(id: number, updates: Partial<File>): Promise<File> {
    try {
      const result = await db
        .update(files)
        .set(updates)
        .where(eq(files.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("File not found");
      }
      
      return result[0];
    } catch (error) {
      logger.error("Database error in updateFile", { error, fileId: id, updates });
      throw error;
    }
  }

  async deleteFile(id: number): Promise<void> {
    try {
      await db.delete(files).where(eq(files.id, id));
    } catch (error) {
      logger.error("Database error in deleteFile", { error, fileId: id });
      throw error;
    }
  }

  // Data source operations
  async getDataSource(id: number): Promise<DataSource | undefined> {
    try {
      const result = await db.select().from(dataSources).where(eq(dataSources.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error("Database error in getDataSource", { error, dataSourceId: id });
      throw error;
    }
  }

  async getDataSourcesByUser(userId: number): Promise<DataSource[]> {
    try {
      return await db.select().from(dataSources).where(eq(dataSources.userId, userId));
    } catch (error) {
      logger.error("Database error in getDataSourcesByUser", { error, userId });
      throw error;
    }
  }

  async createDataSource(source: InsertDataSource): Promise<DataSource> {
    try {
      const result = await db.insert(dataSources).values(source).returning();
      return result[0];
    } catch (error) {
      logger.error("Database error in createDataSource", { error, source });
      throw error;
    }
  }

  async deleteDataSource(id: number): Promise<void> {
    try {
      await db.delete(dataSources).where(eq(dataSources.id, id));
    } catch (error) {
      logger.error("Database error in deleteDataSource", { error, dataSourceId: id });
      throw error;
    }
  }

  // Embedding operations
  async createEmbedding(embedding: InsertEmbedding): Promise<Embedding> {
    try {
      const result = await db.insert(embeddings).values(embedding).returning();
      return result[0];
    } catch (error) {
      logger.error("Database error in createEmbedding", { error, embedding });
      throw error;
    }
  }

  async getEmbeddingsByFileIds(fileIds: number[]): Promise<RagEmbedding[]> {
    try {
      if (fileIds.length === 0) {
        return [];
      }
      
      const results = await db
        .select()
        .from(embeddings)
        .where(inArray(embeddings.fileId, fileIds));

      return results.map(embedding => ({
        text: embedding.chunk,
        vector: JSON.parse(embedding.vector)
      }));
    } catch (error) {
      logger.error("Database error in getEmbeddingsByFileIds", { error, fileIds });
      throw error;
    }
  }

  async getAllEmbeddings(): Promise<Embedding[]> {
    try {
      return await db.select().from(embeddings);
    } catch (error) {
      logger.error("Database error in getAllEmbeddings", { error });
      throw error;
    }
  }

  // Pipeline operations
  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    try {
      // Ensure nodes and edges are properly set (not undefined)
      const pipelineToInsert = {
        ...pipeline,
        nodes: pipeline.nodes || [],
        edges: pipeline.edges || []
      };
      const result = await db.insert(pipelines).values(pipelineToInsert).returning();
      return result[0];
    } catch (error) {
      logger.error("Database error in createPipeline", { error, pipeline });
      throw error;
    }
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    try {
      const result = await db.select().from(pipelines).where(eq(pipelines.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      logger.error("Database error in getPipeline", { error, pipelineId: id });
      throw error;
    }
  }

  async getPipelinesByUser(userId: number): Promise<Pipeline[]> {
    try {
      return await db.select().from(pipelines).where(eq(pipelines.userId, userId));
    } catch (error) {
      logger.error("Database error in getPipelinesByUser", { error, userId });
      throw error;
    }
  }

  async updatePipeline(id: number, updates: Partial<Pipeline>): Promise<Pipeline> {
    try {
      const result = await db
        .update(pipelines)
        .set(updates)
        .where(eq(pipelines.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Pipeline not found");
      }
      
      return result[0];
    } catch (error) {
      logger.error("Database error in updatePipeline", { error, pipelineId: id, updates });
      throw error;
    }
  }

  async deletePipeline(id: number): Promise<void> {
    try {
      await db.delete(pipelines).where(eq(pipelines.id, id));
    } catch (error) {
      logger.error("Database error in deletePipeline", { error, pipelineId: id });
      throw error;
    }
  }
}