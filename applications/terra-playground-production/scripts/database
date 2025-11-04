#!/bin/bash

# Database Conversion System Setup Script
# This script sets up and initializes the database conversion system

echo "=============================================="
echo "   Database Conversion System Setup Tool      "
echo "=============================================="
echo ""

# Create required directories
echo "Creating required directories..."
mkdir -p server/services/database-conversion
mkdir -p server/services/database-conversion/converters
mkdir -p server/agents
mkdir -p logs/database-conversion

# Update schema
echo "Updating database schema..."
node server/services/database-conversion/db-schema-updates.js

# Apply schema changes to database
echo "Applying schema changes to database..."
npm run db:push

# Update storage interface
echo "Updating storage interface..."
node - << 'EOF'
const fs = require('fs').promises;
const path = require('path');

async function updateStorageInterface() {
  try {
    console.log('Updating storage interface with database conversion methods...');
    
    // Path to storage file
    const storageFilePath = path.join(__dirname, 'server/storage.ts');
    
    // Read the current storage file
    const storageContent = await fs.readFile(storageFilePath, 'utf-8');
    
    // Check if the conversion project methods already exist
    if (storageContent.includes('createConversionProject')) {
      console.log('Conversion project methods already exist in storage interface. No update needed.');
      return;
    }
    
    // Find the IStorage interface
    const iStorageStartIndex = storageContent.indexOf('export interface IStorage {');
    if (iStorageStartIndex === -1) {
      throw new Error('Could not find IStorage interface');
    }
    
    // Find the end of the IStorage interface
    const iStorageEndIndex = storageContent.indexOf('}', iStorageStartIndex);
    if (iStorageEndIndex === -1) {
      throw new Error('Could not find end of IStorage interface');
    }
    
    // New methods to add to IStorage
    const newMethods = `
  // Database Conversion methods
  createConversionProject(project: ConversionProject): Promise<ConversionProject>;
  getConversionProjects(): Promise<ConversionProject[]>;
  getConversionProject(id: string): Promise<ConversionProject | undefined>;
  updateConversionProject(id: string, updates: Partial<ConversionProject>): Promise<ConversionProject | undefined>;
  deleteConversionProject(id: string): Promise<boolean>;
  
  createConnectionTemplate(template: InsertConnectionTemplate): Promise<ConnectionTemplate>;
  getConnectionTemplates(isPublic?: boolean): Promise<ConnectionTemplate[]>;
  getConnectionTemplate(id: number): Promise<ConnectionTemplate | undefined>;
  updateConnectionTemplate(id: number, updates: Partial<InsertConnectionTemplate>): Promise<ConnectionTemplate | undefined>;
  deleteConnectionTemplate(id: number): Promise<boolean>;
  
  createConversionLog(log: InsertConversionLog): Promise<ConversionLog>;
  getConversionLogs(projectId: string): Promise<ConversionLog[]>;`;
    
    // Insert the new methods into the IStorage interface
    const updatedContent = 
      storageContent.slice(0, iStorageEndIndex) + 
      newMethods + 
      storageContent.slice(iStorageEndIndex);
    
    // Write the updated storage file back
    await fs.writeFile(storageFilePath, updatedContent, 'utf-8');
    
    console.log('Storage interface updated successfully with database conversion methods.');
    
    // Now update MemStorage and PgStorage implementations
    await updateStorageImplementations();
  } catch (error) {
    console.error('Error updating storage interface:', error);
  }
}

async function updateStorageImplementations() {
  try {
    console.log('Updating storage implementations...');
    
    // Path to storage file
    const storageFilePath = path.join(__dirname, 'server/storage.ts');
    
    // Read the current storage file
    const storageContent = await fs.readFile(storageFilePath, 'utf-8');
    
    // Check if the implementations already exist
    if (storageContent.includes('async createConversionProject(project: ConversionProject)')) {
      console.log('Storage implementations already exist. No update needed.');
      return;
    }
    
    // Find the MemStorage class
    const memStorageStartIndex = storageContent.indexOf('export class MemStorage implements IStorage {');
    if (memStorageStartIndex === -1) {
      throw new Error('Could not find MemStorage class');
    }
    
    // Find the end of the MemStorage class
    let memStorageEndIndex = -1;
    let braceCount = 1;
    let pos = storageContent.indexOf('{', memStorageStartIndex) + 1;
    
    while (braceCount > 0 && pos < storageContent.length) {
      const char = storageContent.charAt(pos);
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      pos++;
      if (braceCount === 0) memStorageEndIndex = pos;
    }
    
    if (memStorageEndIndex === -1) {
      throw new Error('Could not find end of MemStorage class');
    }
    
    // Find the constructor in MemStorage to add new Maps
    const memConstructorIndex = storageContent.indexOf('constructor()', memStorageStartIndex);
    if (memConstructorIndex === -1) {
      throw new Error('Could not find MemStorage constructor');
    }
    
    // Find where to insert the new Maps in the constructor
    const memConstructorEndIndex = storageContent.indexOf('}', memConstructorIndex);
    if (memConstructorEndIndex === -1) {
      throw new Error('Could not find end of MemStorage constructor');
    }
    
    // New Maps to add to constructor
    const newMaps = `
    this.conversionProjects = new Map<string, ConversionProject>();
    this.connectionTemplates = new Map<number, ConnectionTemplate>();
    this.conversionLogs = new Map<number, ConversionLog>();`;
    
    // New properties to add to class
    const newProperties = `
  private conversionProjects: Map<string, ConversionProject>;
  private connectionTemplates: Map<number, ConnectionTemplate>;
  private conversionLogs: Map<number, ConversionLog>;`;
    
    // New methods to add to MemStorage
    const memStorageMethods = `
  // Database Conversion methods
  async createConversionProject(project: ConversionProject): Promise<ConversionProject> {
    this.conversionProjects.set(project.id, project);
    return project;
  }
  
  async getConversionProjects(): Promise<ConversionProject[]> {
    return Array.from(this.conversionProjects.values());
  }
  
  async getConversionProject(id: string): Promise<ConversionProject | undefined> {
    return this.conversionProjects.get(id);
  }
  
  async updateConversionProject(id: string, updates: Partial<ConversionProject>): Promise<ConversionProject | undefined> {
    const project = this.conversionProjects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.conversionProjects.set(id, updatedProject);
    
    return updatedProject;
  }
  
  async deleteConversionProject(id: string): Promise<boolean> {
    return this.conversionProjects.delete(id);
  }
  
  async createConnectionTemplate(template: InsertConnectionTemplate): Promise<ConnectionTemplate> {
    const id = this.getNextId(this.connectionTemplates);
    const newTemplate = { ...template, id, createdAt: new Date(), updatedAt: new Date() } as ConnectionTemplate;
    this.connectionTemplates.set(id, newTemplate);
    return newTemplate;
  }
  
  async getConnectionTemplates(isPublic?: boolean): Promise<ConnectionTemplate[]> {
    const templates = Array.from(this.connectionTemplates.values());
    if (isPublic !== undefined) {
      return templates.filter(t => t.isPublic === isPublic);
    }
    return templates;
  }
  
  async getConnectionTemplate(id: number): Promise<ConnectionTemplate | undefined> {
    return this.connectionTemplates.get(id);
  }
  
  async updateConnectionTemplate(id: number, updates: Partial<InsertConnectionTemplate>): Promise<ConnectionTemplate | undefined> {
    const template = this.connectionTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
    this.connectionTemplates.set(id, updatedTemplate);
    
    return updatedTemplate;
  }
  
  async deleteConnectionTemplate(id: number): Promise<boolean> {
    return this.connectionTemplates.delete(id);
  }
  
  async createConversionLog(log: InsertConversionLog): Promise<ConversionLog> {
    const id = this.getNextId(this.conversionLogs);
    const newLog = { ...log, id } as ConversionLog;
    this.conversionLogs.set(id, newLog);
    return newLog;
  }
  
  async getConversionLogs(projectId: string): Promise<ConversionLog[]> {
    return Array.from(this.conversionLogs.values())
      .filter(log => log.projectId === projectId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }`;
    
    // Find the PgStorage class
    const pgStorageStartIndex = storageContent.indexOf('export class PgStorage implements IStorage {');
    if (pgStorageStartIndex === -1) {
      throw new Error('Could not find PgStorage class');
    }
    
    // Find the end of the PgStorage class
    let pgStorageEndIndex = -1;
    braceCount = 1;
    pos = storageContent.indexOf('{', pgStorageStartIndex) + 1;
    
    while (braceCount > 0 && pos < storageContent.length) {
      const char = storageContent.charAt(pos);
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      pos++;
      if (braceCount === 0) pgStorageEndIndex = pos;
    }
    
    if (pgStorageEndIndex === -1) {
      throw new Error('Could not find end of PgStorage class');
    }
    
    // New methods to add to PgStorage
    const pgStorageMethods = `
  // Database Conversion methods
  async createConversionProject(project: ConversionProject): Promise<ConversionProject> {
    const [result] = await db.insert(conversionProjects).values(project).returning();
    return result;
  }
  
  async getConversionProjects(): Promise<ConversionProject[]> {
    return db.select().from(conversionProjects);
  }
  
  async getConversionProject(id: string): Promise<ConversionProject | undefined> {
    const [result] = await db.select().from(conversionProjects).where(eq(conversionProjects.id, id));
    return result;
  }
  
  async updateConversionProject(id: string, updates: Partial<ConversionProject>): Promise<ConversionProject | undefined> {
    const [result] = await db
      .update(conversionProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversionProjects.id, id))
      .returning();
    return result;
  }
  
  async deleteConversionProject(id: string): Promise<boolean> {
    const result = await db
      .delete(conversionProjects)
      .where(eq(conversionProjects.id, id));
    return result.rowCount > 0;
  }
  
  async createConnectionTemplate(template: InsertConnectionTemplate): Promise<ConnectionTemplate> {
    const [result] = await db.insert(connectionTemplates).values(template).returning();
    return result;
  }
  
  async getConnectionTemplates(isPublic?: boolean): Promise<ConnectionTemplate[]> {
    if (isPublic !== undefined) {
      return db.select().from(connectionTemplates).where(eq(connectionTemplates.isPublic, isPublic));
    }
    return db.select().from(connectionTemplates);
  }
  
  async getConnectionTemplate(id: number): Promise<ConnectionTemplate | undefined> {
    const [result] = await db.select().from(connectionTemplates).where(eq(connectionTemplates.id, id));
    return result;
  }
  
  async updateConnectionTemplate(id: number, updates: Partial<InsertConnectionTemplate>): Promise<ConnectionTemplate | undefined> {
    const [result] = await db
      .update(connectionTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(connectionTemplates.id, id))
      .returning();
    return result;
  }
  
  async deleteConnectionTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(connectionTemplates)
      .where(eq(connectionTemplates.id, id));
    return result.rowCount > 0;
  }
  
  async createConversionLog(log: InsertConversionLog): Promise<ConversionLog> {
    const [result] = await db.insert(conversionLogs).values(log).returning();
    return result;
  }
  
  async getConversionLogs(projectId: string): Promise<ConversionLog[]> {
    return db
      .select()
      .from(conversionLogs)
      .where(eq(conversionLogs.projectId, projectId))
      .orderBy(asc(conversionLogs.timestamp));
  }`;
    
    // Find where to insert the import
    const importIndex = storageContent.indexOf('import {');
    if (importIndex === -1) {
      throw new Error('Could not find imports');
    }
    
    // Add new imports
    const newImports = `import {
  users, User, InsertUser, 
  properties, Property, InsertProperty,
  landRecords, LandRecord, InsertLandRecord,
  improvements, Improvement, InsertImprovement,
  fields, Field, InsertField,
  appeals, Appeal, InsertAppeal,
  appealComments, AppealComment, InsertAppealComment,
  appealEvidence, AppealEvidence, InsertAppealEvidence,
  auditLogs, AuditLog, InsertAuditLog,
  aiAgents, AiAgent, InsertAiAgent,
  systemActivities, SystemActivity, InsertSystemActivity,
  mcpToolExecutionLogs, MCPToolExecutionLog, InsertMCPToolExecutionLog,
  pacsModules, PacsModule, InsertPacsModule,
  agentMessages, AgentMessage, InsertAgentMessage,
  propertyInsightShares, PropertyInsightShare, InsertPropertyInsightShare,
  comparableSales, ComparableSale, InsertComparableSale,
  comparableSalesAnalyses, ComparableSalesAnalysis, InsertComparableSalesAnalysis,
  comparableAnalysisEntries, ComparableAnalysisEntry, InsertComparableAnalysisEntry,
  importStaging, StagedProperty, InsertStagedProperty,
  validationRules, ValidationRule, InsertValidationRule,
  validationIssues, ValidationIssue, InsertValidationIssue,
  workflowDefinitions, WorkflowDefinition, InsertWorkflowDefinition,
  workflowInstances, WorkflowInstance, InsertWorkflowInstance,
  workflowStepHistory, WorkflowStepHistory, InsertWorkflowStepHistory,
  complianceReports, ComplianceReport, InsertComplianceReport,
  agentExperiences, AgentExperience, InsertAgentExperience,
  learningUpdates, LearningUpdate, InsertLearningUpdate,
  dataLineageRecords, DataLineageRecord, InsertDataLineageRecord,
  codeImprovements, CodeImprovement, InsertCodeImprovement,
  conversionProjects, ConversionProject, InsertConversionProject,
  connectionTemplates, ConnectionTemplate, InsertConnectionTemplate,
  conversionLogs, ConversionLog, InsertConversionLog
} from "@shared/schema";`;
    
    // Build updated content
    let updatedContent = storageContent.slice(0, importIndex) + newImports;
    updatedContent += storageContent.slice(storageContent.indexOf(';', importIndex) + 1);
    
    // Insert properties into MemStorage
    const memPropsInsertIndex = memStorageStartIndex + 'export class MemStorage implements IStorage {'.length;
    updatedContent = 
      updatedContent.slice(0, memPropsInsertIndex) + 
      newProperties + 
      updatedContent.slice(memPropsInsertIndex);
    
    // Insert Maps into MemStorage constructor
    updatedContent = 
      updatedContent.slice(0, memConstructorEndIndex) + 
      newMaps + 
      updatedContent.slice(memConstructorEndIndex);
    
    // Insert methods into MemStorage
    updatedContent = 
      updatedContent.slice(0, memStorageEndIndex - 1) + 
      memStorageMethods + 
      updatedContent.slice(memStorageEndIndex - 1);
    
    // Insert methods into PgStorage
    updatedContent = 
      updatedContent.slice(0, pgStorageEndIndex - 1) + 
      pgStorageMethods + 
      updatedContent.slice(pgStorageEndIndex - 1);
    
    // Write the updated storage file back
    await fs.writeFile(storageFilePath, updatedContent, 'utf-8');
    
    console.log('Storage implementations updated successfully.');
  } catch (error) {
    console.error('Error updating storage implementations:', error);
  }
}

// Run the updates
updateStorageInterface();
EOF

echo "Setup completed successfully!"
echo "To use the database conversion system, register the DatabaseConversionAgent in your server initialization."
echo "Example:"
echo "  const databaseConversionService = new DatabaseConversionService(storage, mcpService, llmService);"
echo "  const databaseConversionAgent = new DatabaseConversionAgent(storage, mcpService, databaseConversionService, llmService);"

# Make script executable
chmod +x setup-database-conversion.sh