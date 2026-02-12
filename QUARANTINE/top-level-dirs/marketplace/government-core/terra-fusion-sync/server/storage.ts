import { 
  type User, type InsertUser,
  type File, type InsertFile,
  type DataSource, type InsertDataSource,
  type Embedding, type InsertEmbedding,
  type RagEmbedding,
  type Pipeline, type InsertPipeline
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUser(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<File>): Promise<File>;
  deleteFile(id: number): Promise<void>;

  // Data source operations
  getDataSource(id: number): Promise<DataSource | undefined>;
  getDataSourcesByUser(userId: number): Promise<DataSource[]>;
  createDataSource(source: InsertDataSource): Promise<DataSource>;
  deleteDataSource(id: number): Promise<void>;

  // Embedding operations
  createEmbedding(embedding: InsertEmbedding): Promise<Embedding>;
  getEmbeddingsByFileIds(fileIds: number[]): Promise<RagEmbedding[]>;
  getAllEmbeddings(): Promise<Embedding[]>;

  // Pipeline operations
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  getPipelinesByUser(userId: number): Promise<Pipeline[]>;
  updatePipeline(id: number, updates: Partial<Pipeline>): Promise<Pipeline>;
  deletePipeline(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private dataSources: Map<number, DataSource>;
  private embeddings: Map<number, Embedding>;
  private pipelines: Map<number, Pipeline>;
  private currentIds: { 
    users: number; 
    files: number; 
    dataSources: number;
    embeddings: number;
    pipelines: number;
  };

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.dataSources = new Map();
    this.embeddings = new Map();
    this.pipelines = new Map();
    this.currentIds = { 
      users: 1, 
      files: 1, 
      dataSources: 1,
      embeddings: 1,
      pipelines: 1
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // File operations with FTP support
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentIds.files++;
    const file: File = {
      id,
      ...insertFile,
      metadata: insertFile.metadata || null,
      aiSummary: insertFile.aiSummary || null,
      category: insertFile.category || null,
      createdAt: new Date(),
      transferType: insertFile.transferType || "local",
      ftpConfig: insertFile.ftpConfig || null
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<File>): Promise<File> {
    const file = await this.getFile(id);
    if (!file) throw new Error("File not found");

    const updated: File = { 
      ...file,
      ...updates,
      metadata: updates.metadata ?? file.metadata,
      aiSummary: updates.aiSummary ?? file.aiSummary,
      category: updates.category ?? file.category,
      ftpConfig: updates.ftpConfig ?? file.ftpConfig,
      transferType: updates.transferType ?? file.transferType
    };
    this.files.set(id, updated);
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  // Data source operations
  async getDataSource(id: number): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }

  async getDataSourcesByUser(userId: number): Promise<DataSource[]> {
    return Array.from(this.dataSources.values()).filter(
      (source) => source.userId === userId
    );
  }

  async createDataSource(insertSource: InsertDataSource): Promise<DataSource> {
    const id = this.currentIds.dataSources++;
    const source: DataSource = {
      id,
      ...insertSource,
      status: "pending",
      createdAt: new Date()
    };
    this.dataSources.set(id, source);
    return source;
  }

  async deleteDataSource(id: number): Promise<void> {
    this.dataSources.delete(id);
  }

  // Embedding methods with vector serialization
  async createEmbedding(insertEmbedding: InsertEmbedding): Promise<Embedding> {
    const id = this.currentIds.embeddings++;
    const embedding: Embedding = {
      id,
      fileId: insertEmbedding.fileId,
      chunk: insertEmbedding.chunk,
      vector: JSON.stringify(insertEmbedding.vector),
      createdAt: new Date()
    };
    this.embeddings.set(id, embedding);
    return embedding;
  }

  async getEmbeddingsByFileIds(fileIds: number[]): Promise<RagEmbedding[]> {
    return Array.from(this.embeddings.values())
      .filter(embedding => fileIds.includes(embedding.fileId))
      .map(embedding => ({
        text: embedding.chunk,
        vector: JSON.parse(embedding.vector)
      }));
  }

  async getAllEmbeddings(): Promise<Embedding[]> {
    return Array.from(this.embeddings.values());
  }

  // Pipeline operations
  async createPipeline(insertPipeline: InsertPipeline): Promise<Pipeline> {
    const id = this.currentIds.pipelines++;
    const pipeline: Pipeline = {
      id,
      name: insertPipeline.name,
      nodes: insertPipeline.nodes || [],
      edges: insertPipeline.edges || [],
      userId: insertPipeline.userId,
      createdAt: new Date()
    };
    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  async getPipeline(id: number): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }

  async getPipelinesByUser(userId: number): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values()).filter(
      (pipeline) => pipeline.userId === userId
    );
  }

  async updatePipeline(id: number, updates: Partial<Pipeline>): Promise<Pipeline> {
    const pipeline = await this.getPipeline(id);
    if (!pipeline) throw new Error("Pipeline not found");

    const updated: Pipeline = {
      ...pipeline,
      ...updates,
      nodes: updates.nodes ?? pipeline.nodes,
      edges: updates.edges ?? pipeline.edges
    };
    this.pipelines.set(id, updated);
    return updated;
  }

  async deletePipeline(id: number): Promise<void> {
    this.pipelines.delete(id);
  }
}

// The MemStorage class is already exported as part of the main exports