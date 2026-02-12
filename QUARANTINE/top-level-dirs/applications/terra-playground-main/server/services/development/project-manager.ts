import { db } from '../../db';
import { eq } from 'drizzle-orm';
import {
  devProjects,
  DevProjectType,
  DevProjectStatus,
  insertDevProjectSchema,
  type DevProject,
  type InsertDevProject,
} from '../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectManagerInterface {
  createProject(project: InsertDevProject): Promise<DevProject>;
  getProjects(): Promise<DevProject[]>;
  getProjectById(projectId: string): Promise<DevProject | null>;
  updateProject(projectId: string, project: Partial<InsertDevProject>): Promise<DevProject | null>;
  deleteProject(projectId: string): Promise<boolean>;
  getProjectTypes(): string[];
  getProjectStatuses(): string[];
  getProjectLanguages(): string[];
}

class ProjectManager implements ProjectManagerInterface {
  /**
   * Create a new development project
   */
  async createProject(project: InsertDevProject): Promise<DevProject> {
    const validatedData = insertDevProjectSchema.parse(project);

    const projectId = uuidv4();
    const newProject = await db
      .insert(devProjects)
      .values({
        ...validatedData,
        projectId,
        lastUpdated: new Date(),
        createdAt: new Date(),
      })
      .returning();

    return newProject[0];
  }

  /**
   * Get all development projects
   */
  async getProjects(): Promise<DevProject[]> {
    return await db.select().from(devProjects).orderBy(devProjects.lastUpdated);
  }

  /**
   * Get a specific project by ID
   */
  async getProjectById(projectId: string): Promise<DevProject | null> {
    const result = await db.select().from(devProjects).where(eq(devProjects.projectId, projectId));
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    project: Partial<InsertDevProject>
  ): Promise<DevProject | null> {
    const result = await db
      .update(devProjects)
      .set({
        ...project,
        lastUpdated: new Date(),
      })
      .where(eq(devProjects.projectId, projectId))
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const result = await db
      .delete(devProjects)
      .where(eq(devProjects.projectId, projectId))
      .returning();

    return result.length > 0;
  }

  /**
   * Get available project types
   */
  getProjectTypes(): string[] {
    return Object.values(DevProjectType);
  }

  /**
   * Get available project statuses
   */
  getProjectStatuses(): string[] {
    return Object.values(DevProjectStatus);
  }

  /**
   * Get available programming languages
   */
  getProjectLanguages(): string[] {
    return ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'csharp'];
  }
}

export const projectManager = new ProjectManager();
