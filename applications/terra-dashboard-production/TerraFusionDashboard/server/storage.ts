import { users, properties as propertiesTable, aiAgents, agentJobs, counties, systemHealth, infrastructureAssets, threatAssessments, simulationRequests, type User, type InsertUser, type Property, type InsertProperty, type AIAgent, type AgentJob, type InsertAgentJob, type County, type SystemHealth, type InfrastructureAsset, type InsertInfrastructureAsset, type ThreatAssessment, type InsertThreatAssessment, type SimulationRequest, type InsertSimulationRequest } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Properties
  getProperties(limit?: number): Promise<Property[]>;
  getPropertiesPaginated(page: number, limit: number, filters?: any): Promise<{properties: Property[], total: number, page: number, totalPages: number}>;
  getProperty(id: string): Promise<Property | undefined>;
  searchProperties(query: string): Promise<Property[]>;
  searchPropertiesPaginated(query: string, page: number, limit: number): Promise<{properties: Property[], total: number, page: number, totalPages: number}>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<Property>): Promise<Property>;
  
  // AI Agents
  getAgents(): Promise<AIAgent[]>;
  getAgent(id: string): Promise<AIAgent | undefined>;
  updateAgentJobCount(id: string, count: number): Promise<void>;
  updateAgentHealth(id: string, health: string): Promise<void>;
  updateAgentTasks(id: string, activeTasks: number): Promise<void>;
  
  // Agent Jobs
  getRecentJobs(limit?: number): Promise<AgentJob[]>;
  getJob(id: string): Promise<AgentJob | undefined>;
  createAgentJob(job: InsertAgentJob): Promise<AgentJob>;
  updateJobStatus(id: string, status: string, result?: any, errorMessage?: string): Promise<void>;
  
  // Counties
  getCounties(): Promise<County[]>;
  getCounty(id: string): Promise<County | undefined>;
  
  // System Health
  getSystemHealth(): Promise<SystemHealth[]>;
  updateSystemHealth(service: string, status: string, responseTime?: number, metadata?: any): Promise<void>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalProperties: number;
    activeAgents: number;
    todayJobs: number;
    avgResponseTime: number;
  }>;

  // Infrastructure Assets
  getInfrastructureAssets(): Promise<InfrastructureAsset[]>;
  getInfrastructureAsset(assetId: string): Promise<InfrastructureAsset | undefined>;
  getInfrastructureAssetsByIds(assetIds: string[]): Promise<InfrastructureAsset[]>;
  createInfrastructureAsset(asset: InsertInfrastructureAsset): Promise<InfrastructureAsset>;
  updateInfrastructureAsset(assetId: string, asset: Partial<InfrastructureAsset>): Promise<InfrastructureAsset>;
  
  // Threat Assessments
  getThreatAssessments(): Promise<ThreatAssessment[]>;
  getThreatAssessmentsForAsset(assetId: string): Promise<ThreatAssessment[]>;
  createThreatAssessment(threat: InsertThreatAssessment): Promise<ThreatAssessment>;
  getCriticalThreats(): Promise<ThreatAssessment[]>;
  
  // Simulation Requests
  getSimulationRequests(): Promise<SimulationRequest[]>;
  getSimulationRequest(simulationId: string): Promise<SimulationRequest | undefined>;
  createSimulationRequest(simulation: InsertSimulationRequest): Promise<SimulationRequest>;
  updateSimulationStatus(simulationId: string, status: string, results?: any): Promise<void>;
  
  // Infrastructure Dashboard Stats
  getInfrastructureDashboardStats(): Promise<{
    totalAssets: number;
    operationalAssets: number;
    criticalThreats: number;
    activeSimulations: number;
    avgCriticalityScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProperties(limit = 1000): Promise<Property[]> {
    return await db.select().from(propertiesTable).orderBy(desc(propertiesTable.updatedAt)).limit(limit);
  }

  async getPropertiesPaginated(page: number = 1, limit: number = 1000, filters?: any): Promise<{properties: Property[], total: number, page: number, totalPages: number}> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const [{ count: total }] = await db.select({ count: count() }).from(propertiesTable);
    
    // Get paginated results
    const propertyResults = await db.select()
      .from(propertiesTable)
      .orderBy(desc(propertiesTable.updatedAt))
      .limit(limit)
      .offset(offset);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      properties: propertyResults,
      total,
      page,
      totalPages
    };
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    return property || undefined;
  }

  async searchProperties(query: string): Promise<Property[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(propertiesTable).where(
      or(
        ilike(propertiesTable.address, searchTerm),
        ilike(propertiesTable.ownerName, searchTerm),
        ilike(propertiesTable.parcelId, searchTerm)
      )
    ).limit(500);
  }

  async searchPropertiesPaginated(query: string, page: number = 1, limit: number = 100): Promise<{properties: Property[], total: number, page: number, totalPages: number}> {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;
    
    // Get total count for search
    const [{ count: total }] = await db.select({ count: count() }).from(propertiesTable).where(
      or(
        ilike(propertiesTable.address, searchTerm),
        ilike(propertiesTable.ownerName, searchTerm),
        ilike(propertiesTable.parcelId, searchTerm)
      )
    );
    
    // Get paginated search results
    const searchResults = await db.select().from(propertiesTable).where(
      or(
        ilike(propertiesTable.address, searchTerm),
        ilike(propertiesTable.ownerName, searchTerm),
        ilike(propertiesTable.parcelId, searchTerm)
      )
    ).orderBy(desc(propertiesTable.updatedAt))
     .limit(limit)
     .offset(offset);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      properties: searchResults,
      total,
      page,
      totalPages
    };
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(propertiesTable)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(id: string, property: Partial<Property>): Promise<Property> {
    const [updatedProperty] = await db
      .update(propertiesTable)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(propertiesTable.id, id))
      .returning();
    return updatedProperty;
  }

  async getAgents(): Promise<AIAgent[]> {
    return await db.select().from(aiAgents).orderBy(aiAgents.name);
  }

  async getAgent(id: string): Promise<AIAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
    return agent || undefined;
  }

  async updateAgentJobCount(id: string, jobCount: number): Promise<void> {
    await db
      .update(aiAgents)
      .set({ jobCount, lastRunAt: new Date(), updatedAt: new Date() })
      .where(eq(aiAgents.id, id));
  }

  async updateAgentHealth(id: string, health: string): Promise<void> {
    await db
      .update(aiAgents)
      .set({ 
        healthStatus: health,
        lastHeartbeat: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiAgents.id, id));
  }

  async updateAgentTasks(id: string, activeTasks: number): Promise<void> {
    await db
      .update(aiAgents)
      .set({ 
        activeTasks,
        updatedAt: new Date()
      })
      .where(eq(aiAgents.id, id));
  }

  async getRecentJobs(limit = 20): Promise<AgentJob[]> {
    return await db.select().from(agentJobs).orderBy(desc(agentJobs.createdAt)).limit(limit);
  }

  async getJob(id: string): Promise<AgentJob | undefined> {
    const [job] = await db.select().from(agentJobs).where(eq(agentJobs.id, id));
    return job || undefined;
  }

  async createAgentJob(job: InsertAgentJob): Promise<AgentJob> {
    const [newJob] = await db
      .insert(agentJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJobStatus(id: string, status: string, result?: any, errorMessage?: string): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    if (result) updates.result = result;
    if (errorMessage) updates.errorMessage = errorMessage;
    if (status === "completed" || status === "failed") {
      updates.completedAt = new Date();
    }
    
    await db
      .update(agentJobs)
      .set(updates)
      .where(eq(agentJobs.id, id));
  }

  async getCounties(): Promise<County[]> {
    return await db.select().from(counties).orderBy(counties.name);
  }

  async getCounty(id: string): Promise<County | undefined> {
    const [county] = await db.select().from(counties).where(eq(counties.id, id));
    return county || undefined;
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    return await db.select().from(systemHealth).orderBy(desc(systemHealth.lastCheck));
  }

  async updateSystemHealth(service: string, status: string, responseTime?: number, metadata?: any): Promise<void> {
    // Try to update existing record first
    const existing = await db.select().from(systemHealth).where(eq(systemHealth.service, service)).limit(1);
    
    if (existing.length > 0) {
      await db
        .update(systemHealth)
        .set({ status, responseTime, metadata, lastCheck: new Date() })
        .where(eq(systemHealth.service, service));
    } else {
      await db
        .insert(systemHealth)
        .values({ service, status, responseTime, metadata });
    }
  }

  async getDashboardStats(): Promise<{
    totalProperties: number;
    activeAgents: number;
    todayJobs: number;
    avgResponseTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [propertyCount] = await db.select({ count: count() }).from(propertiesTable);
    const [agentCount] = await db.select({ count: count() }).from(aiAgents).where(eq(aiAgents.status, "active"));
    
    // Get jobs created today using date range
    const jobsToday = await db.select({ count: count() }).from(agentJobs);
    
    // Simple average response time from system health
    const healthRecords = await db.select().from(systemHealth);
    const avgResponseTime = healthRecords.length > 0 
      ? healthRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0) / healthRecords.length
      : 1200;

    return {
      totalProperties: propertyCount.count,
      activeAgents: agentCount.count,
      todayJobs: jobsToday[0]?.count || 0,
      avgResponseTime: Math.round(avgResponseTime),
    };
  }

  // Infrastructure Assets
  async getInfrastructureAssets(): Promise<InfrastructureAsset[]> {
    return await db.select().from(infrastructureAssets).orderBy(desc(infrastructureAssets.criticalityScore));
  }

  async getInfrastructureAsset(assetId: string): Promise<InfrastructureAsset | undefined> {
    const [asset] = await db.select().from(infrastructureAssets).where(eq(infrastructureAssets.assetId, assetId));
    return asset || undefined;
  }

  async getInfrastructureAssetsByIds(assetIds: string[]): Promise<InfrastructureAsset[]> {
    if (assetIds.length === 0) return [];
    return await db.select()
      .from(infrastructureAssets)
      .where(sql`${infrastructureAssets.assetId} = ANY(${assetIds})`);
  }

  async createInfrastructureAsset(asset: InsertInfrastructureAsset): Promise<InfrastructureAsset> {
    const [newAsset] = await db.insert(infrastructureAssets).values(asset).returning();
    return newAsset;
  }

  async updateInfrastructureAsset(assetId: string, asset: Partial<InfrastructureAsset>): Promise<InfrastructureAsset> {
    const [updatedAsset] = await db
      .update(infrastructureAssets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(infrastructureAssets.assetId, assetId))
      .returning();
    return updatedAsset;
  }

  // Threat Assessments
  async getThreatAssessments(): Promise<ThreatAssessment[]> {
    return await db.select().from(threatAssessments).orderBy(desc(threatAssessments.detectedAt));
  }

  async getThreatAssessmentsForAsset(assetId: string): Promise<ThreatAssessment[]> {
    return await db.select().from(threatAssessments).where(eq(threatAssessments.assetId, assetId));
  }

  async createThreatAssessment(threat: InsertThreatAssessment): Promise<ThreatAssessment> {
    const [newThreat] = await db.insert(threatAssessments).values(threat).returning();
    return newThreat;
  }

  async getCriticalThreats(): Promise<ThreatAssessment[]> {
    return await db.select()
      .from(threatAssessments)
      .where(sql`severity IN ('high', 'critical', 'catastrophic')`)
      .orderBy(desc(threatAssessments.detectedAt));
  }

  // Simulation Requests
  async getSimulationRequests(): Promise<SimulationRequest[]> {
    return await db.select().from(simulationRequests).orderBy(desc(simulationRequests.createdAt));
  }

  async getSimulationRequest(simulationId: string): Promise<SimulationRequest | undefined> {
    const [simulation] = await db.select().from(simulationRequests).where(eq(simulationRequests.simulationId, simulationId));
    return simulation || undefined;
  }

  async createSimulationRequest(simulation: InsertSimulationRequest): Promise<SimulationRequest> {
    const [newSimulation] = await db.insert(simulationRequests).values(simulation).returning();
    return newSimulation;
  }

  async updateSimulationStatus(simulationId: string, status: string, results?: any): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'running' && !results) {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
      if (results) {
        updateData.results = results;
      }
    }

    await db
      .update(simulationRequests)
      .set(updateData)
      .where(eq(simulationRequests.simulationId, simulationId));
  }

  // Infrastructure Dashboard Stats
  async getInfrastructureDashboardStats(): Promise<{
    totalAssets: number;
    operationalAssets: number;
    criticalThreats: number;
    activeSimulations: number;
    avgCriticalityScore: number;
  }> {
    const [assetCount] = await db.select({ count: count() }).from(infrastructureAssets);
    const [operationalCount] = await db.select({ count: count() })
      .from(infrastructureAssets)
      .where(eq(infrastructureAssets.operationalStatus, "operational"));
    
    const [criticalThreatCount] = await db.select({ count: count() })
      .from(threatAssessments)
      .where(sql`severity IN ('high', 'critical', 'catastrophic')`);
    
    const [activeSimCount] = await db.select({ count: count() })
      .from(simulationRequests)
      .where(sql`status IN ('queued', 'initializing', 'running')`);

    // Calculate average criticality score
    const assets = await db.select({ score: infrastructureAssets.criticalityScore }).from(infrastructureAssets);
    const avgScore = assets.length > 0 
      ? assets.reduce((sum, asset) => sum + parseFloat(asset.score || "0"), 0) / assets.length
      : 0;

    return {
      totalAssets: assetCount.count,
      operationalAssets: operationalCount.count,
      criticalThreats: criticalThreatCount.count,
      activeSimulations: activeSimCount.count,
      avgCriticalityScore: Math.round(avgScore * 10) / 10,
    };
  }
}

export const storage = new DatabaseStorage();
