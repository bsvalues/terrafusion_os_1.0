using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    // Core User and Team DTOs
    public class CollaborationUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string Department { get; set; } = string.Empty;
        public List<PermissionDto> Permissions { get; set; } = new();
        public string? Avatar { get; set; }
        public bool IsOnline { get; set; }
        public DateTime LastActive { get; set; }
        public SecurityClearance? GovernmentClearance { get; set; }
    }

    public class TeamDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public List<CollaborationUserDto> Members { get; set; } = new();
        public List<string> Owners { get; set; } = new();
        public List<TeamPermissionDto> Permissions { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTeamDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public string Department { get; set; } = string.Empty;
        
        public List<string> MemberIds { get; set; } = new();
    }

    public class UpdateTeamDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Department { get; set; }
        public bool? IsActive { get; set; }
    }

    // Project Management DTOs
    public class ProjectDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ProjectType Type { get; set; }
        public ProjectStatus Status { get; set; }
        public ProjectPriority Priority { get; set; }
        public TeamDto Team { get; set; } = new();
        public CollaborationUserDto Owner { get; set; } = new();
        public List<ProjectParticipantDto> Participants { get; set; } = new();
        public ProjectTimelineDto Timeline { get; set; } = new();
        public List<MilestoneDto> Milestones { get; set; } = new();
        public List<TaskDto> Tasks { get; set; } = new();
        public List<ProjectDocumentDto> Documents { get; set; } = new();
        public ProjectMetadataDto Metadata { get; set; } = new();
        public List<AuditEventDto> AuditTrail { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateProjectDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public ProjectType Type { get; set; } = ProjectType.Assessment;
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
        
        [Required]
        public string TeamId { get; set; } = string.Empty;
        
        [Required]
        public string OwnerId { get; set; } = string.Empty;
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public List<string> ParticipantIds { get; set; } = new();
    }

    public class UpdateProjectDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public ProjectStatus? Status { get; set; }
        public ProjectPriority? Priority { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class ProjectParticipantDto
    {
        public CollaborationUserDto User { get; set; } = new();
        public ProjectRole Role { get; set; }
        public List<ProjectPermissionDto> Permissions { get; set; } = new();
        public DateTime JoinedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class ProjectTimelineDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ProjectPhaseDto> Phases { get; set; } = new();
        public string CurrentPhase { get; set; } = string.Empty;
    }

    public class ProjectPhaseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public PhaseStatus Status { get; set; }
        public List<string> Deliverables { get; set; } = new();
        public string ResponsibleTeam { get; set; } = string.Empty;
    }

    public class ProjectMetadataDto
    {
        public decimal? EstimatedBudget { get; set; }
        public decimal? ActualBudget { get; set; }
        public List<ResourceRequirementDto> ResourceRequirements { get; set; } = new();
        public RiskAssessmentDto RiskAssessment { get; set; } = new();
        public List<string> ComplianceRequirements { get; set; } = new();
        public List<SystemIntegrationDto> Integrations { get; set; } = new();
    }

    // Task Management DTOs
    public class TaskDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProjectId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskType Type { get; set; }
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public CollaborationUserDto? Assignee { get; set; }
        public CollaborationUserDto Reporter { get; set; } = new();
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<TaskCommentDto> Comments { get; set; } = new();
        public List<string> Dependencies { get; set; } = new();
        public List<string> Tags { get; set; } = new();
    }

    public class CreateTaskDto
    {
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public TaskType Type { get; set; } = TaskType.Feature;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        
        public string? AssigneeId { get; set; }
        
        [Required]
        public string ReporterId { get; set; } = string.Empty;
        
        public decimal? EstimatedHours { get; set; }
        public DateTime? DueDate { get; set; }
        public List<string> Dependencies { get; set; } = new();
        public List<string> Tags { get; set; } = new();
    }

    public class UpdateTaskDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public TaskStatus? Status { get; set; }
        public TaskPriority? Priority { get; set; }
        public string? AssigneeId { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public DateTime? DueDate { get; set; }
        public List<string>? Dependencies { get; set; }
        public List<string>? Tags { get; set; }
    }

    public class TaskCommentDto
    {
        public string Id { get; set; } = string.Empty;
        public string TaskId { get; set; } = string.Empty;
        public CollaborationUserDto User { get; set; } = new();
        public string Content { get; set; } = string.Empty;
        public CommentType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public List<string> Mentions { get; set; } = new();
    }

    public class CreateTaskCommentDto
    {
        [Required]
        public string TaskId { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public CommentType Type { get; set; } = CommentType.Comment;
        public List<string> Mentions { get; set; } = new();
    }

    public class MilestoneDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProjectId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime TargetDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public MilestoneStatus Status { get; set; }
        public List<string> Deliverables { get; set; } = new();
        public List<string> Dependencies { get; set; } = new();
    }

    // Real-time Collaboration DTOs
    public class CollaborationSessionDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProjectId { get; set; } = string.Empty;
        public SessionType Type { get; set; }
        public List<SessionParticipantDto> Participants { get; set; } = new();
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public SessionStatus Status { get; set; }
        public ScreenShareDto? SharedScreen { get; set; }
        public WhiteboardSessionDto? Whiteboard { get; set; }
        public List<ChatMessageDto> Chat { get; set; } = new();
        public List<SessionRecordingDto> Recordings { get; set; } = new();
    }

    public class CreateSessionDto
    {
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        public SessionType Type { get; set; } = SessionType.Meeting;
    }

    public class SessionParticipantDto
    {
        public CollaborationUserDto User { get; set; } = new();
        public DateTime JoinTime { get; set; }
        public DateTime? LeaveTime { get; set; }
        public SessionRole Role { get; set; }
        public List<SessionPermissionDto> Permissions { get; set; } = new();
        public bool IsPresenting { get; set; }
        public bool IsMuted { get; set; }
        public bool HasVideo { get; set; }
    }

    public class ChatMessageDto
    {
        public string Id { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public CollaborationUserDto User { get; set; } = new();
        public string Content { get; set; } = string.Empty;
        public MessageType Type { get; set; }
        public DateTime Timestamp { get; set; }
        public List<string> Mentions { get; set; } = new();
        public List<MessageReactionDto> Reactions { get; set; } = new();
        public List<MessageAttachmentDto> Attachments { get; set; } = new();
    }

    public class SendMessageDto
    {
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public MessageType Type { get; set; } = MessageType.Text;
        public List<string> Mentions { get; set; } = new();
    }

    public class MessageReactionDto
    {
        public string Emoji { get; set; } = string.Empty;
        public CollaborationUserDto User { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class MessageAttachmentDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
    }

    // Document Management DTOs
    public class ProjectDocumentDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProjectId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DocumentType Type { get; set; }
        public string Content { get; set; } = string.Empty;
        public int Version { get; set; }
        public DocumentStatus Status { get; set; }
        public CollaborationUserDto Author { get; set; } = new();
        public CollaborationUserDto LastEditor { get; set; } = new();
        public List<DocumentEditorDto> Editors { get; set; } = new();
        public List<DocumentPermissionDto> Permissions { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<DocumentAuditEventDto> AuditTrail { get; set; } = new();
    }

    public class CreateDocumentDto
    {
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public DocumentType Type { get; set; } = DocumentType.Text;
        public string Content { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
    }

    public class UpdateDocumentDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Content { get; set; }
        public DocumentStatus? Status { get; set; }
        public List<string>? Tags { get; set; }
    }

    public class DocumentEditorDto
    {
        public CollaborationUserDto User { get; set; } = new();
        public bool IsActive { get; set; }
        public DocumentCursorDto? Cursor { get; set; }
        public DocumentSelectionDto? Selection { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class DocumentCursorDto
    {
        public int Line { get; set; }
        public int Column { get; set; }
    }

    public class DocumentSelectionDto
    {
        public int Start { get; set; }
        public int End { get; set; }
    }

    // Permission Management DTOs
    public class PermissionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public PermissionCategory Category { get; set; }
        public PermissionLevel Level { get; set; }
        public PermissionScope Scope { get; set; }
        public bool IsSystemPermission { get; set; }
    }

    public class TeamPermissionDto
    {
        public PermissionDto Permission { get; set; } = new();
        public CollaborationUserDto GrantedBy { get; set; } = new();
        public DateTime GrantedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public List<PermissionConditionDto> Conditions { get; set; } = new();
    }

    public class ProjectPermissionDto
    {
        public PermissionDto Permission { get; set; } = new();
        public ProjectPermissionScope Scope { get; set; }
        public CollaborationUserDto GrantedBy { get; set; } = new();
        public DateTime GrantedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class DocumentPermissionDto
    {
        public CollaborationUserDto User { get; set; } = new();
        public DocumentPermissionLevel Level { get; set; }
        public CollaborationUserDto GrantedBy { get; set; } = new();
        public DateTime GrantedAt { get; set; }
    }

    public class SessionPermissionDto
    {
        public SessionPermissionType Type { get; set; }
        public bool Granted { get; set; }
    }

    public class PermissionConditionDto
    {
        public ConditionType Type { get; set; }
        public object Value { get; set; } = new();
        public ConditionOperator Operator { get; set; }
    }

    // Notification DTOs
    public class CollaborationNotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public CollaborationUserDto Recipient { get; set; } = new();
        public CollaborationUserDto? Sender { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, object> Data { get; set; } = new();
        public NotificationPriority Priority { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public NotificationType Type { get; set; }
        
        [Required]
        public string RecipientId { get; set; } = string.Empty;
        
        public string? SenderId { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public Dictionary<string, object> Data { get; set; } = new();
        public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
        public DateTime? ExpiresAt { get; set; }
    }

    // Analytics DTOs
    public class CollaborationMetricsDto
    {
        public DateRangeDto Period { get; set; } = new();
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalSessions { get; set; }
        public double AverageSessionDuration { get; set; }
        public int MessagesExchanged { get; set; }
        public int DocumentsCreated { get; set; }
        public int DocumentsEdited { get; set; }
        public TaskMetricsDto TaskMetrics { get; set; } = new();
        public List<TeamMetricsDto> TeamMetrics { get; set; } = new();
        public List<DepartmentMetricsDto> DepartmentMetrics { get; set; } = new();
    }

    public class TaskMetricsDto
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double AverageCompletionTime { get; set; }
        public Dictionary<TaskPriority, int> TasksByPriority { get; set; } = new();
        public Dictionary<TaskStatus, int> TasksByStatus { get; set; } = new();
    }

    public class TeamMetricsDto
    {
        public TeamDto Team { get; set; } = new();
        public double Productivity { get; set; }
        public double CollaborationScore { get; set; }
        public int ProjectsCompleted { get; set; }
        public double AverageTaskCompletionTime { get; set; }
    }

    public class DepartmentMetricsDto
    {
        public string Department { get; set; } = string.Empty;
        public List<TeamMetricsDto> Teams { get; set; } = new();
        public double ResourceUtilization { get; set; }
        public double CrossTeamCollaboration { get; set; }
    }

    // Audit DTOs
    public class AuditEventDto
    {
        public string Id { get; set; } = string.Empty;
        public AuditEventType Type { get; set; }
        public string Entity { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public CollaborationUserDto User { get; set; } = new();
        public string Action { get; set; } = string.Empty;
        public Dictionary<string, object> Details { get; set; } = new();
        public DateTime Timestamp { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
    }

    public class DocumentAuditEventDto : AuditEventDto
    {
        public int DocumentVersion { get; set; }
        public string ChangesSummary { get; set; } = string.Empty;
        public string? ContentDiff { get; set; }
    }

    // Utility DTOs
    public class DateRangeDto
    {
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }

    public class ResourceRequirementDto
    {
        public ResourceType Type { get; set; }
        public int Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? EstimatedCost { get; set; }
    }

    public class RiskAssessmentDto
    {
        public RiskLevel OverallRisk { get; set; }
        public List<RiskDto> Risks { get; set; } = new();
        public List<MitigationStrategyDto> MitigationStrategies { get; set; } = new();
    }

    public class RiskDto
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public RiskLevel Impact { get; set; }
        public double Probability { get; set; }
        public RiskCategory Category { get; set; }
        public string? Mitigation { get; set; }
    }

    public class MitigationStrategyDto
    {
        public string RiskId { get; set; } = string.Empty;
        public string Strategy { get; set; } = string.Empty;
        public CollaborationUserDto Owner { get; set; } = new();
        public string Timeline { get; set; } = string.Empty;
        public decimal? Cost { get; set; }
    }

    public class SystemIntegrationDto
    {
        public string System { get; set; } = string.Empty;
        public IntegrationType Type { get; set; }
        public IntegrationStatus Status { get; set; }
        public Dictionary<string, object> Configuration { get; set; } = new();
        public DateTime? LastSync { get; set; }
    }

    public class ScreenShareDto
    {
        public string SessionId { get; set; } = string.Empty;
        public CollaborationUserDto Presenter { get; set; } = new();
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public ScreenShareQuality Quality { get; set; }
        public bool IsRecording { get; set; }
    }

    public class SessionRecordingDto
    {
        public string Id { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string Filename { get; set; } = string.Empty;
        public int Duration { get; set; }
        public long Size { get; set; }
        public VideoQuality Quality { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
    }

    public class WhiteboardSessionDto
    {
        public string Id { get; set; } = string.Empty;
        public string CollaborationSessionId { get; set; } = string.Empty;
        public List<CanvasElementDto> Canvas { get; set; } = new();
        public List<WhiteboardParticipantDto> Participants { get; set; } = new();
        public int Version { get; set; }
        public DateTime LastModified { get; set; }
    }

    public class CanvasElementDto
    {
        public string Id { get; set; } = string.Empty;
        public CanvasElementType Type { get; set; }
        public object Data { get; set; } = new();
        public PositionDto Position { get; set; } = new();
        public SizeDto Size { get; set; } = new();
        public ElementStyleDto Style { get; set; } = new();
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int Version { get; set; }
    }

    public class WhiteboardParticipantDto
    {
        public CollaborationUserDto User { get; set; } = new();
        public PositionDto Cursor { get; set; } = new();
        public WhiteboardTool Tool { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class PositionDto
    {
        public double X { get; set; }
        public double Y { get; set; }
    }

    public class SizeDto
    {
        public double Width { get; set; }
        public double Height { get; set; }
    }

    public class ElementStyleDto
    {
        public string Color { get; set; } = string.Empty;
        public string? BackgroundColor { get; set; }
        public double? FontSize { get; set; }
        public string? FontFamily { get; set; }
        public double? BorderWidth { get; set; }
        public string? BorderColor { get; set; }
        public double? Opacity { get; set; }
    }

    // Enums (matching TypeScript definitions)
    public enum UserRole
    {
        Administrator,
        DepartmentHead,
        TeamLead,
        ProjectManager,
        SeniorAnalyst,
        Analyst,
        Technician,
        Guest
    }

    public enum SecurityClearance
    {
        Public,
        Internal,
        Confidential,
        Secret,
        TopSecret
    }

    public enum ProjectType
    {
        Assessment,
        Valuation,
        Compliance,
        SystemIntegration,
        DataMigration,
        Reporting,
        Audit,
        Training
    }

    public enum ProjectStatus
    {
        Draft,
        Planning,
        Active,
        OnHold,
        Completed,
        Cancelled,
        Archived
    }

    public enum ProjectPriority
    {
        Low,
        Medium,
        High,
        Critical,
        Emergency
    }

    public enum ProjectRole
    {
        Owner,
        Manager,
        Contributor,
        Reviewer,
        Observer
    }

    public enum TaskType
    {
        Feature,
        Bug,
        Improvement,
        Documentation,
        Testing,
        Deployment,
        Maintenance
    }

    public enum TaskStatus
    {
        Backlog,
        ToDo,
        InProgress,
        InReview,
        Testing,
        Done,
        Blocked
    }

    public enum TaskPriority
    {
        Lowest,
        Low,
        Medium,
        High,
        Highest
    }

    public enum CommentType
    {
        Comment,
        System,
        Mention,
        StatusChange
    }

    public enum MilestoneStatus
    {
        Planned,
        InProgress,
        Completed,
        Delayed,
        Cancelled
    }

    public enum PhaseStatus
    {
        NotStarted,
        InProgress,
        Completed,
        Delayed
    }

    public enum SessionType
    {
        Meeting,
        Brainstorm,
        Review,
        Training,
        Presentation
    }

    public enum SessionStatus
    {
        Scheduled,
        Active,
        Paused,
        Ended,
        Cancelled
    }

    public enum SessionRole
    {
        Host,
        Presenter,
        Participant,
        Observer
    }

    public enum MessageType
    {
        Text,
        File,
        Image,
        System,
        Mention
    }

    public enum CanvasElementType
    {
        Text,
        Shape,
        Line,
        Image,
        StickyNote
    }

    public enum WhiteboardTool
    {
        Pen,
        Highlighter,
        Eraser,
        Text,
        Shape,
        Select
    }

    public enum PermissionCategory
    {
        System,
        Project,
        Team,
        Document,
        Collaboration
    }

    public enum PermissionLevel
    {
        None,
        Read,
        Write,
        Admin,
        Owner
    }

    public enum PermissionScope
    {
        Global,
        Department,
        Team,
        Project,
        Document
    }

    public enum ProjectPermissionScope
    {
        All,
        Tasks,
        Documents,
        Team,
        Settings
    }

    public enum ConditionType
    {
        TimeRange,
        Location,
        Department,
        Role,
        Clearance
    }

    public enum ConditionOperator
    {
        Equals,
        NotEquals,
        GreaterThan,
        LessThan,
        Contains,
        In
    }

    public enum DocumentType
    {
        Text,
        Spreadsheet,
        Presentation,
        Pdf,
        Image,
        Video,
        Form
    }

    public enum DocumentStatus
    {
        Draft,
        Review,
        Approved,
        Published,
        Archived
    }

    public enum DocumentPermissionLevel
    {
        None,
        View,
        Comment,
        Edit,
        Admin
    }

    public enum AuditEventType
    {
        Create,
        Update,
        Delete,
        View,
        Share,
        PermissionChange,
        Login,
        Logout
    }

    public enum NotificationType
    {
        TaskAssigned,
        TaskCompleted,
        TaskOverdue,
        ProjectUpdate,
        Mention,
        MeetingReminder,
        DocumentShared,
        TeamInvitation
    }

    public enum NotificationPriority
    {
        Low,
        Medium,
        High,
        Urgent
    }

    public enum ResourceType
    {
        Human,
        Hardware,
        Software,
        ExternalService
    }

    public enum RiskLevel
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum RiskCategory
    {
        Technical,
        Schedule,
        Budget,
        Resource,
        Compliance,
        External
    }

    public enum IntegrationType
    {
        Api,
        Database,
        FileSystem,
        Webhook,
        Etl
    }

    public enum IntegrationStatus
    {
        Configured,
        Active,
        Error,
        Disabled
    }

    public enum ScreenShareQuality
    {
        Low,
        Medium,
        High,
        Hd
    }

    public enum VideoQuality
    {
        Low240P,
        Medium480P,
        High720P,
        Hd1080P
    }

    public enum SessionPermissionType
    {
        Audio,
        Video,
        ScreenShare,
        Chat,
        Whiteboard,
        Recording
    }
}