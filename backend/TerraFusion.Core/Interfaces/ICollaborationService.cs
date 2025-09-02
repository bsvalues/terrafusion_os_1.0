using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces
{
    public interface ICollaborationService
    {
        // User Management
        Task<CollaborationUserDto?> GetUserAsync(string userId);
        Task<List<CollaborationUserDto>> GetUsersAsync();
        Task<CollaborationUserDto> CreateUserAsync(CollaborationUserDto user);
        Task<CollaborationUserDto?> UpdateUserAsync(string userId, CollaborationUserDto user);
        Task<bool> DeleteUserAsync(string userId);
        Task<bool> UpdateUserStatusAsync(string userId, bool isOnline);

        // Team Management
        Task<List<TeamDto>> GetTeamsAsync();
        Task<TeamDto?> GetTeamAsync(string teamId);
        Task<List<TeamDto>> GetUserTeamsAsync(string userId);
        Task<TeamDto> CreateTeamAsync(CreateTeamDto createTeamDto, string creatorId);
        Task<TeamDto?> UpdateTeamAsync(string teamId, UpdateTeamDto updateTeamDto);
        Task<bool> DeleteTeamAsync(string teamId);
        Task<bool> AddTeamMemberAsync(string teamId, string userId, bool isOwner = false);
        Task<bool> RemoveTeamMemberAsync(string teamId, string userId);
        Task<bool> UpdateTeamMemberRoleAsync(string teamId, string userId, bool isOwner);

        // Project Management
        Task<List<ProjectDto>> GetProjectsAsync();
        Task<ProjectDto?> GetProjectAsync(string projectId);
        Task<List<ProjectDto>> GetUserProjectsAsync(string userId);
        Task<ProjectDto> CreateProjectAsync(CreateProjectDto createProjectDto, string creatorId);
        Task<ProjectDto?> UpdateProjectAsync(string projectId, UpdateProjectDto updateProjectDto);
        Task<bool> DeleteProjectAsync(string projectId);
        Task<bool> UpdateProjectStatusAsync(string projectId, ProjectStatus status);
        Task<bool> AddProjectParticipantAsync(string projectId, string userId, ProjectRole role);
        Task<bool> RemoveProjectParticipantAsync(string projectId, string userId);
        Task<CollaborationMetricsDto> GetProjectMetricsAsync(string projectId);

        // Task Management
        Task<List<TaskDto>> GetProjectTasksAsync(string projectId);
        Task<TaskDto?> GetTaskAsync(string taskId);
        Task<List<TaskDto>> GetUserTasksAsync(string userId);
        Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto, string creatorId);
        Task<TaskDto?> UpdateTaskAsync(string taskId, UpdateTaskDto updateTaskDto);
        Task<bool> DeleteTaskAsync(string taskId);
        Task<bool> UpdateTaskStatusAsync(string taskId, DTOs.TaskStatus status);
        Task<bool> AssignTaskAsync(string taskId, string assigneeId);
        Task<List<TaskCommentDto>> GetTaskCommentsAsync(string taskId);
        Task<TaskCommentDto> AddTaskCommentAsync(CreateTaskCommentDto createCommentDto, string userId);
        Task<bool> UpdateTaskCommentAsync(string commentId, string content);
        Task<bool> DeleteTaskCommentAsync(string commentId);

        // Milestone Management
        Task<List<MilestoneDto>> GetProjectMilestonesAsync(string projectId);
        Task<MilestoneDto?> GetMilestoneAsync(string milestoneId);
        Task<MilestoneDto> CreateMilestoneAsync(string projectId, MilestoneDto milestoneDto, string creatorId);
        Task<MilestoneDto?> UpdateMilestoneAsync(string milestoneId, MilestoneDto milestoneDto);
        Task<bool> DeleteMilestoneAsync(string milestoneId);
        Task<bool> CompleteMilestoneAsync(string milestoneId);

        // Document Management
        Task<List<ProjectDocumentDto>> GetProjectDocumentsAsync(string projectId);
        Task<ProjectDocumentDto?> GetDocumentAsync(string documentId);
        Task<ProjectDocumentDto> CreateDocumentAsync(CreateDocumentDto createDocumentDto, string creatorId);
        Task<ProjectDocumentDto?> UpdateDocumentAsync(string documentId, UpdateDocumentDto updateDocumentDto, string editorId);
        Task<bool> DeleteDocumentAsync(string documentId);
        Task<bool> ShareDocumentAsync(string documentId, List<string> userIds, DocumentPermissionLevel level, string grantedById);
        Task<bool> UpdateDocumentPermissionsAsync(string documentId, string userId, DocumentPermissionLevel level);
        Task<List<DocumentPermissionDto>> GetDocumentPermissionsAsync(string documentId);

        // Real-time Session Management
        Task<CollaborationSessionDto> StartSessionAsync(CreateSessionDto createSessionDto, string hostId);
        Task<CollaborationSessionDto?> GetSessionAsync(string sessionId);
        Task<List<CollaborationSessionDto>> GetProjectSessionsAsync(string projectId);
        Task<bool> EndSessionAsync(string sessionId);
        Task<bool> JoinSessionAsync(string sessionId, string userId, SessionRole role);
        Task<bool> LeaveSessionAsync(string sessionId, string userId);
        Task<List<ChatMessageDto>> GetSessionMessagesAsync(string sessionId);
        Task<ChatMessageDto> SendSessionMessageAsync(SendMessageDto sendMessageDto, string senderId);

        // Notification Management
        Task<List<CollaborationNotificationDto>> GetUserNotificationsAsync(string userId, bool unreadOnly = false);
        Task<CollaborationNotificationDto> CreateNotificationAsync(CreateNotificationDto createNotificationDto);
        Task<bool> MarkNotificationReadAsync(string notificationId);
        Task<bool> MarkAllNotificationsReadAsync(string userId);
        Task<bool> DeleteNotificationAsync(string notificationId);
        Task<int> GetUnreadNotificationCountAsync(string userId);

        // Analytics and Reporting
        Task<CollaborationMetricsDto> GetCollaborationMetricsAsync(DateTime startDate, DateTime endDate);
        Task<List<TeamMetricsDto>> GetTeamMetricsAsync(string? departmentFilter = null);
        Task<TaskMetricsDto> GetTaskMetricsAsync(string? projectId = null, string? userId = null);

        // Audit Trail
        Task<List<AuditEventDto>> GetAuditTrailAsync(string entityType, string entityId);
        Task<List<AuditEventDto>> GetUserAuditTrailAsync(string userId, DateTime? startDate = null, DateTime? endDate = null);
        Task CreateAuditEventAsync(string entityType, string entityId, string userId, AuditEventType eventType, string action, Dictionary<string, object>? details = null, string? sessionId = null, string? ipAddress = null, string? userAgent = null);
    }

    public interface IPermissionService
    {
        // Permission Management
        Task<List<PermissionDto>> GetPermissionsAsync();
        Task<List<PermissionDto>> GetUserPermissionsAsync(string userId);
        Task<bool> HasPermissionAsync(string userId, string permissionName, string? entityId = null);
        Task<bool> GrantPermissionAsync(string userId, string permissionId, string grantedById, DateTime? expiresAt = null);
        Task<bool> RevokePermissionAsync(string userId, string permissionId);
        Task<List<PermissionDto>> GetEntityPermissionsAsync(string entityType, string entityId);

        // Role-based Access Control
        Task<bool> CanAccessProjectAsync(string userId, string projectId, ProjectPermissionScope scope = ProjectPermissionScope.All);
        Task<bool> CanAccessTeamAsync(string userId, string teamId);
        Task<bool> CanAccessDocumentAsync(string userId, string documentId, DocumentPermissionLevel requiredLevel = DocumentPermissionLevel.View);
        Task<bool> CanModifyTaskAsync(string userId, string taskId);

        // Government Compliance
        Task<bool> ValidateSecurityClearanceAsync(string userId, SecurityClearance requiredClearance);
        Task<List<string>> GetUserAccessibleEntitiesAsync(string userId, string entityType);
    }

    public interface IWhiteboardService
    {
        // Whiteboard Management
        Task<WhiteboardSessionDto?> GetWhiteboardSessionAsync(string sessionId);
        Task<WhiteboardSessionDto> CreateWhiteboardSessionAsync(string collaborationSessionId);
        Task<bool> UpdateWhiteboardCanvasAsync(string whiteboardId, List<CanvasElementDto> elements, string userId);
        Task<bool> AddCanvasElementAsync(string whiteboardId, CanvasElementDto element, string userId);
        Task<bool> UpdateCanvasElementAsync(string whiteboardId, string elementId, CanvasElementDto element, string userId);
        Task<bool> DeleteCanvasElementAsync(string whiteboardId, string elementId, string userId);
        Task<bool> ClearWhiteboardAsync(string whiteboardId, string userId);
        Task<List<WhiteboardParticipantDto>> GetWhiteboardParticipantsAsync(string whiteboardId);
        Task<bool> UpdateParticipantCursorAsync(string whiteboardId, string userId, PositionDto cursor);
        Task<bool> UpdateParticipantToolAsync(string whiteboardId, string userId, WhiteboardTool tool, string color);
    }

    public interface IIntegrationService
    {
        // System Integration Management
        Task<List<SystemIntegrationDto>> GetSystemIntegrationsAsync(string projectId);
        Task<SystemIntegrationDto?> GetSystemIntegrationAsync(string integrationId);
        Task<SystemIntegrationDto> CreateSystemIntegrationAsync(string projectId, SystemIntegrationDto integrationDto);
        Task<SystemIntegrationDto?> UpdateSystemIntegrationAsync(string integrationId, SystemIntegrationDto integrationDto);
        Task<bool> DeleteSystemIntegrationAsync(string integrationId);
        Task<bool> TestIntegrationConnectionAsync(string integrationId);
        Task<bool> SyncIntegrationDataAsync(string integrationId);
        Task<Dictionary<string, object>> GetIntegrationStatusAsync(string integrationId);

        // Harris PACS Integration
        Task<Dictionary<string, object>> GetHarrisPACSStatusAsync();
        Task<bool> SyncHarrisPACSDataAsync(string countyId);
        Task<List<Dictionary<string, object>>> GetHarrisPACSPropertiesAsync(string countyId, int page = 1, int pageSize = 100);

        // Tyler Tech Integration  
        Task<Dictionary<string, object>> GetTylerTechStatusAsync();
        Task<bool> SyncTylerTechDataAsync(string countyId);
        Task<List<Dictionary<string, object>>> GetTylerTechDataAsync(string countyId, string dataType, int page = 1, int pageSize = 100);

        // FTP Management
        Task<bool> UploadFileAsync(string integrationId, string localFilePath, string remoteFilePath);
        Task<bool> DownloadFileAsync(string integrationId, string remoteFilePath, string localFilePath);
        Task<List<string>> ListDirectoryAsync(string integrationId, string remotePath);
        Task<bool> DeleteRemoteFileAsync(string integrationId, string remoteFilePath);
    }

    public interface IAnalyticsService
    {
        // Advanced Analytics
        Task<Dictionary<string, object>> GetDashboardDataAsync(string userId, string dashboardType);
        Task<List<Dictionary<string, object>>> GetExecutiveReportsAsync(DateTime startDate, DateTime endDate);
        Task<Dictionary<string, object>> GetProductivityAnalyticsAsync(string teamId, DateTime startDate, DateTime endDate);
        Task<Dictionary<string, object>> GetCollaborationTrendsAsync(DateTime startDate, DateTime endDate);
        Task<List<Dictionary<string, object>>> GetPerformanceMetricsAsync(string entityType, string entityId);
        
        // Report Generation
        Task<byte[]> GenerateReportPdfAsync(string reportType, Dictionary<string, object> parameters);
        Task<byte[]> GenerateReportExcelAsync(string reportType, Dictionary<string, object> parameters);
        Task<string> ScheduleReportAsync(string reportType, Dictionary<string, object> parameters, string schedule, string userId);
        Task<bool> CancelScheduledReportAsync(string scheduleId);
    }

    public interface IExportService
    {
        // Export/Import Services
        Task<byte[]> ExportProjectDataAsync(string projectId, string format);
        Task<byte[]> ExportTeamDataAsync(string teamId, string format);
        Task<byte[]> ExportTaskDataAsync(string projectId, string format);
        Task<byte[]> ExportDocumentsAsync(string projectId, string format);
        Task<bool> ImportProjectDataAsync(byte[] data, string format, string userId);
        Task<Dictionary<string, object>> ValidateImportDataAsync(byte[] data, string format);

        // PDF Generation
        Task<byte[]> GenerateProjectReportPdfAsync(string projectId);
        Task<byte[]> GenerateTaskReportPdfAsync(string projectId);
        Task<byte[]> GenerateTimelineReportPdfAsync(string projectId);
        Task<byte[]> GenerateAuditReportPdfAsync(string entityType, string entityId);

        // Excel Generation
        Task<byte[]> GenerateTasksExcelAsync(string projectId);
        Task<byte[]> GenerateMetricsExcelAsync(Dictionary<string, object> metrics);
        Task<byte[]> GenerateTimeTrackingExcelAsync(string projectId, DateTime startDate, DateTime endDate);
    }
}