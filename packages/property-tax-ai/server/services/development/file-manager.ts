import { db } from '../../db';
import { eq, and } from 'drizzle-orm';
import { 
  devProjectFiles, 
  DevFileType,
  insertDevProjectFileSchema,
  type DevProjectFile,
  type InsertDevProjectFile
} from '../../../shared/schema';
import path from 'path';

export interface FileInfo {
  name: string;
  path: string;
  type: string;
  size?: number;
  content?: string;
  children?: FileInfo[];
}

export interface FileManagerInterface {
  createFile(file: InsertDevProjectFile): Promise<DevProjectFile>;
  getProjectFiles(projectId: string): Promise<DevProjectFile[]>;
  getFileByPath(projectId: string, filePath: string): Promise<DevProjectFile | null>;
  updateFile(projectId: string, filePath: string, updatedData: Partial<InsertDevProjectFile>): Promise<DevProjectFile | null>;
  deleteFile(projectId: string, filePath: string): Promise<boolean>;
  buildFileTree(projectId: string): Promise<FileInfo[]>;
}

class FileManager implements FileManagerInterface {
  /**
   * Create a new file in a project
   */
  async createFile(file: InsertDevProjectFile): Promise<DevProjectFile> {
    const validatedData = insertDevProjectFileSchema.parse(file);
    
    const newFile = await db.insert(devProjectFiles).values({
      ...validatedData,
      size: validatedData.content ? Buffer.from(validatedData.content).length : 0,
      lastUpdated: new Date()
    }).returning();
    
    return newFile[0];
  }

  /**
   * Get all files for a project
   */
  async getProjectFiles(projectId: string): Promise<DevProjectFile[]> {
    return await db
      .select()
      .from(devProjectFiles)
      .where(eq(devProjectFiles.projectId, projectId))
      .orderBy(devProjectFiles.path);
  }

  /**
   * Get a specific file by its path within a project
   */
  async getFileByPath(projectId: string, filePath: string): Promise<DevProjectFile | null> {
    const result = await db
      .select()
      .from(devProjectFiles)
      .where(
        and(
          eq(devProjectFiles.projectId, projectId),
          eq(devProjectFiles.path, filePath)
        )
      );
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update a file
   */
  async updateFile(
    projectId: string,
    filePath: string,
    updatedData: Partial<InsertDevProjectFile>
  ): Promise<DevProjectFile | null> {
    // Recalculate size if content was updated
    const fileData: Partial<InsertDevProjectFile> = { ...updatedData };
    
    if (fileData.content) {
      fileData.size = Buffer.from(fileData.content).length;
    }
    
    const result = await db
      .update(devProjectFiles)
      .set({
        ...fileData,
        lastUpdated: new Date()
      })
      .where(
        and(
          eq(devProjectFiles.projectId, projectId),
          eq(devProjectFiles.path, filePath)
        )
      )
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete a file
   */
  async deleteFile(projectId: string, filePath: string): Promise<boolean> {
    const result = await db
      .delete(devProjectFiles)
      .where(
        and(
          eq(devProjectFiles.projectId, projectId),
          eq(devProjectFiles.path, filePath)
        )
      )
      .returning();

    return result.length > 0;
  }

  /**
   * Build a file tree structure from flat file list
   */
  async buildFileTree(projectId: string): Promise<FileInfo[]> {
    const files = await this.getProjectFiles(projectId);
    const root: FileInfo[] = [];
    const map: { [key: string]: FileInfo } = {};

    // First pass: create file objects and map paths to objects
    files.forEach(file => {
      const fileInfo: FileInfo = {
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size || undefined,
        content: file.type === DevFileType.FILE ? (file.content || undefined) : undefined,
        children: file.type === DevFileType.DIRECTORY ? [] : undefined
      };
      
      map[file.path] = fileInfo;
      
      // If root level
      if (!file.parentPath) {
        root.push(fileInfo);
      }
    });
    
    // Second pass: link children to parents
    files.forEach(file => {
      if (file.parentPath && map[file.parentPath] && map[file.parentPath].children) {
        map[file.parentPath].children!.push(map[file.path]);
      }
    });
    
    return root;
  }
  
  /**
   * Get the parent directory path
   */
  getParentPath(filePath: string): string | null {
    const parentPath = path.dirname(filePath);
    return parentPath === '.' ? null : parentPath;
  }
}

export const fileManager = new FileManager();