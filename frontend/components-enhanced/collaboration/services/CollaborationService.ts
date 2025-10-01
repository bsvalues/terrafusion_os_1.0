/**
 * Terrafusion OS 1.0 - Collaboration Service
 * Government-Grade Multi-User Collaboration Platform
 *
 * Core service for managing enterprise collaboration functionality
 * with SignalR real-time integration and government compliance.
 */

import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import {
  CollaborationUser,
  Team,
  Project,
  Task,
  CollaborationSession,
  ChatMessage,
  ProjectDocument,
  CollaborationMetrics,
  CollaborationNotification,
  AuditEvent,
  ProjectStatus,
  TaskStatus,
  SessionType,
  NotificationType,
  NotificationPriority,
} from '../types/CollaborationTypes';

export class CollaborationService {
  private connection: HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();
  private currentUser: CollaborationUser | null = null;

  constructor(
    private apiBaseUrl: string = '/api',
    private hubUrl: string = '/collaborationHub'
  ) {}

  /**
   * Initialize SignalR connection for real-time collaboration
   */
  async initialize(user: CollaborationUser): Promise<void> {
    this.currentUser = user;

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${this.apiBaseUrl}${this.hubUrl}`, {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'User-Id': user.id,
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      this.setupEventHandlers();
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join user's teams and projects
      await this.joinUserContext(user);

      console.log('CollaborationService: Connected to SignalR hub');
    } catch (error) {
      console.error('CollaborationService: Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.isConnected = false;
      this.connection = null;
      console.log('CollaborationService: Disconnected from SignalR hub');
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection events
    this.connection.onreconnecting(() => {
      this.isConnected = false;
      this.emit('connection-status', { status: 'reconnecting' });
    });

    this.connection.onreconnected(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection-status', { status: 'connected' });
      if (this.currentUser) {
        this.joinUserContext(this.currentUser);
      }
    });

    this.connection.onclose(() => {
      this.isConnected = false;
      this.emit('connection-status', { status: 'disconnected' });
    });

    // Real-time collaboration events
    this.connection.on('UserJoined', (data) => this.emit('user-joined', data));
    this.connection.on('UserLeft', (data) => this.emit('user-left', data));
    this.connection.on('UserStatusChanged', (data) => this.emit('user-status-changed', data));
    this.connection.on('ProjectUpdated', (data) => this.emit('project-updated', data));
    this.connection.on('TaskUpdated', (data) => this.emit('task-updated', data));
    this.connection.on('TaskAssigned', (data) => this.emit('task-assigned', data));
    this.connection.on('MessageReceived', (data) => this.emit('message-received', data));
    this.connection.on('DocumentUpdated', (data) => this.emit('document-updated', data));
    this.connection.on('DocumentShared', (data) => this.emit('document-shared', data));
    this.connection.on('NotificationReceived', (data) => this.emit('notification-received', data));
    this.connection.on('SessionStarted', (data) => this.emit('session-started', data));
    this.connection.on('SessionEnded', (data) => this.emit('session-ended', data));
    this.connection.on('ParticipantJoined', (data) => this.emit('participant-joined', data));
    this.connection.on('ParticipantLeft', (data) => this.emit('participant-left', data));
    this.connection.on('ScreenShareStarted', (data) => this.emit('screen-share-started', data));
    this.connection.on('ScreenShareEnded', (data) => this.emit('screen-share-ended', data));
    this.connection.on('WhiteboardUpdated', (data) => this.emit('whiteboard-updated', data));
  }

  private async joinUserContext(user: CollaborationUser): Promise<void> {
    if (!this.connection || !this.isConnected) return;

    try {
      // Join user's personal channel
      await this.connection.invoke('JoinUserChannel', user.id);

      // Join team channels
      const teams = await this.getUserTeams(user.id);
      for (const team of teams) {
        await this.connection.invoke('JoinTeamChannel', team.id);
      }

      // Join project channels
      const projects = await this.getUserProjects(user.id);
      for (const project of projects) {
        await this.connection.invoke('JoinProjectChannel', project.id);
      }
    } catch (error) {
      console.error('CollaborationService: Failed to join user context:', error);
    }
  }

  // Event Management
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // User Management
  async getUsers(): Promise<CollaborationUser[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/users`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getUser(userId: string): Promise<CollaborationUser> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/users/${userId}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/users/${userId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ isOnline }),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('UpdateUserStatus', userId, isOnline);
    }
  }

  // Team Management
  async getTeams(): Promise<Team[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/teams`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/users/${userId}/teams`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async createTeam(team: Partial<Team>): Promise<Team> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/teams`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(team),
    });
    return response.json();
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/teams/${teamId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  async addTeamMember(teamId: string, userId: string, role?: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/teams/${teamId}/members`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, role }),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('JoinTeamChannel', teamId);
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('LeaveTeamChannel', teamId);
    }
  }

  // Project Management
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/users/${userId}/projects`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getProject(projectId: string): Promise<Project> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects/${projectId}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(project),
    });

    const newProject = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('JoinProjectChannel', newProject.id);
      await this.connection.invoke('NotifyProjectCreated', newProject);
    }

    return newProject;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects/${projectId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const updatedProject = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyProjectUpdated', updatedProject);
    }

    return updatedProject;
  }

  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/projects/${projectId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyProjectStatusChanged', projectId, status);
    }
  }

  // Task Management
  async getTasks(projectId: string): Promise<Task[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects/${projectId}/tasks`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async createTask(projectId: string, task: Partial<Task>): Promise<Task> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(task),
    });

    const newTask = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyTaskCreated', newTask);

      if (newTask.assignee) {
        await this.sendNotification({
          type: NotificationType.TASK_ASSIGNED,
          recipient: newTask.assignee,
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${newTask.title}`,
          priority: NotificationPriority.MEDIUM,
          data: { taskId: newTask.id, projectId },
        });
      }
    }

    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/tasks/${taskId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const updatedTask = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyTaskUpdated', updatedTask);
    }

    return updatedTask;
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyTaskStatusChanged', taskId, status);

      if (status === TaskStatus.DONE) {
        const task = await this.getTask(taskId);
        await this.sendNotification({
          type: NotificationType.TASK_COMPLETED,
          recipient: task.reporter,
          title: 'Task Completed',
          message: `Task "${task.title}" has been completed`,
          priority: NotificationPriority.MEDIUM,
          data: { taskId, projectId: task.projectId },
        });
      }
    }
  }

  async assignTask(taskId: string, assigneeId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/tasks/${taskId}/assign`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ assigneeId }),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyTaskAssigned', taskId, assigneeId);
    }
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/tasks/${taskId}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  // Document Management
  async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    const response = await fetch(
      `${this.apiBaseUrl}/collaboration/projects/${projectId}/documents`,
      {
        headers: this.getHeaders(),
      }
    );
    return response.json();
  }

  async createDocument(
    projectId: string,
    document: Partial<ProjectDocument>
  ): Promise<ProjectDocument> {
    const response = await fetch(
      `${this.apiBaseUrl}/collaboration/projects/${projectId}/documents`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(document),
      }
    );

    const newDocument = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyDocumentCreated', newDocument);
    }

    return newDocument;
  }

  async updateDocument(
    documentId: string,
    updates: Partial<ProjectDocument>
  ): Promise<ProjectDocument> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/documents/${documentId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const updatedDocument = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyDocumentUpdated', updatedDocument);
    }

    return updatedDocument;
  }

  async shareDocument(documentId: string, userIds: string[]): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/documents/${documentId}/share`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userIds }),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('NotifyDocumentShared', documentId, userIds);
    }
  }

  // Real-time Collaboration Sessions
  async startSession(projectId: string, type: SessionType): Promise<CollaborationSession> {
    const response = await fetch(
      `${this.apiBaseUrl}/collaboration/projects/${projectId}/sessions`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ type }),
      }
    );

    const session = await response.json();

    if (this.connection && this.isConnected) {
      await this.connection.invoke('JoinSession', session.id);
      await this.connection.invoke('NotifySessionStarted', session);
    }

    return session;
  }

  async joinSession(sessionId: string): Promise<void> {
    if (this.connection && this.isConnected) {
      await this.connection.invoke('JoinSession', sessionId);
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    if (this.connection && this.isConnected) {
      await this.connection.invoke('LeaveSession', sessionId);
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    if (this.connection && this.isConnected) {
      await this.connection.invoke('SendSessionMessage', sessionId, message);
    }
  }

  // Notifications
  async sendNotification(notification: Partial<CollaborationNotification>): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/notifications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(notification),
    });

    if (this.connection && this.isConnected) {
      await this.connection.invoke('SendNotification', notification);
    }
  }

  async getNotifications(userId: string): Promise<CollaborationNotification[]> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/users/${userId}/notifications`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/collaboration/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
  }

  // Analytics and Metrics
  async getMetrics(startDate: Date, endDate: Date): Promise<CollaborationMetrics> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/metrics`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ startDate, endDate }),
    });
    return response.json();
  }

  async getProjectMetrics(projectId: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/collaboration/projects/${projectId}/metrics`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  // Audit Trail
  async getAuditTrail(entityId: string, entityType: string): Promise<AuditEvent[]> {
    const response = await fetch(
      `${this.apiBaseUrl}/collaboration/audit/${entityType}/${entityId}`,
      {
        headers: this.getHeaders(),
      }
    );
    return response.json();
  }

  // Utility Methods
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAuthToken()}`,
    };
  }

  private getAuthToken(): string {
    // In a real implementation, this would get the token from secure storage
    return localStorage.getItem('authToken') || '';
  }

  isConnectedToHub(): boolean {
    return this.isConnected;
  }

  getConnectionState(): string {
    if (!this.connection) return 'disconnected';
    return this.connection.state;
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; connection: string; timestamp: Date }> {
    const connectionState = this.getConnectionState();
    const timestamp = new Date();

    try {
      if (this.connection && this.isConnected) {
        await this.connection.invoke('Ping');
        return { status: 'healthy', connection: connectionState, timestamp };
      }
    } catch (error) {
      console.error('CollaborationService health check failed:', error);
    }

    return { status: 'unhealthy', connection: connectionState, timestamp };
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();
