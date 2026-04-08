/**
 * Collaboration Storage Interface for Building Cost Building System
 *
 * This module provides database interactions for collaboration features such as
 * comments, shared projects, and collaborative editing.
 */
import { and, eq } from 'drizzle-orm';
import {
  Comment,
  comments,
  ProjectMember,
  projectMembers,
  projects,
  users
} from '../../shared/schema';
import { db } from '../db';

// Comments related functions
export async function getCommentsByProject(
  projectId: string
): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(comments.createdAt);
}

export async function getCommentsByProperty(
  propertyId: string
): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.propertyId, propertyId))
    .orderBy(comments.createdAt);
}

export async function getComment(id: number): Promise<Comment | undefined> {
  const results = await db.select().from(comments).where(eq(comments.id, id));
  return results[0];
}

export async function createComment(comment: {
  projectId?: string;
  propertyId?: string;
  parentCommentId?: string;
  userId: string;
  content: string;
  metadata?: Record<string, any>;
}): Promise<Comment> {
  const results = await db.insert(comments).values(comment).returning();
  return results[0];
}

export async function updateComment(
  id: number,
  data: Partial<Comment>
): Promise<Comment | undefined> {
  const results = await db
    .update(comments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, id))
    .returning();
  return results[0];
}

export async function deleteComment(id: number): Promise<void> {
  await db.delete(comments).where(eq(comments.id, id));
}

// Projects related functions
export async function getProjectsByUser(
  userId: string
): Promise<any[]> {
  // Join projects with members to get projects where user is a member
  const results = await db
    .select({
      id: projects.id,
      projectId: projects.projectId,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      status: projects.status,
      isPublic: projects.isPublic,
      role: projectMembers.role,
    })
    .from(projects)
    .innerJoin(
      projectMembers,
      and(eq(projects.projectId, projectMembers.projectId), eq(projectMembers.userId, userId))
    );

  return results;
}

export async function getProject(projectId: string): Promise<any | undefined> {
  const results = await db.select().from(projects).where(eq(projects.projectId, projectId));
  return results[0];
}

export async function createProject(project: any): Promise<any> {
  const results = await db.insert(projects).values(project).returning();
  return results[0];
}

export async function updateProject(
  projectId: string,
  data: any
): Promise<any | undefined> {
  const results = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.projectId, projectId))
    .returning();
  return results[0];
}

export async function deleteProject(projectId: string): Promise<void> {
  // Delete all members first (foreign key constraint)
  await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

  // Delete the project
  await db.delete(projects).where(eq(projects.projectId, projectId));
}

// Project Members related functions
export async function getProjectMembers(
  projectId: string
): Promise<(ProjectMember & { username?: string })[]> {
  // Join with users to get usernames
  const results = await db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      invitedBy: projectMembers.invitedBy,
      lastActivity: projectMembers.lastActivity,
      username: users.username,
    })
    .from(projectMembers)
    .leftJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

  // Convert null usernames to undefined for type compatibility
  return results.map(result => ({
    ...result,
    username: result.username ?? undefined
  }));
}

export async function getProjectMember(
  projectId: string,
  userId: string
): Promise<ProjectMember | undefined> {
  const results = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return results[0];
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const member = await getProjectMember(projectId, userId);
  return !!member;
}

export async function getProjectMemberRole(
  projectId: string,
  userId: string
): Promise<string | null> {
  const member = await getProjectMember(projectId, userId);
  return member ? member.role : null;
}

export async function addProjectMember(member: {
  projectId: string;
  userId: string;
  role?: string;
  invitedBy?: string;
}): Promise<ProjectMember> {
  const results = await db.insert(projectMembers).values(member).returning();
  return results[0];
}

export async function updateProjectMember(
  projectId: string,
  userId: string,
  data: Partial<ProjectMember>
): Promise<ProjectMember | undefined> {
  const results = await db
    .update(projectMembers)
    .set(data)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .returning();
  return results[0];
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
}

// Project Items functionality removed - table doesn't exist in current schema
