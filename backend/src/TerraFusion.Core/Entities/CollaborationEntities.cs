using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Entities
{
    // Core User and Team Entities
    [Table("CollaborationUsers")]
    public class CollaborationUser
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(320)]
        public string Email { get; set; } = string.Empty;
        
        public UserRole Role { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Department { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Avatar { get; set; }
        
        public bool IsOnline { get; set; }
        
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        
        public SecurityClearance? GovernmentClearance { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
        public virtual ICollection<ProjectParticipant> ProjectParticipations { get; set; } = new List<ProjectParticipant>();
        public virtual ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
        public virtual ICollection<Task> AssignedTasks { get; set; } = new List<Task>();
        public virtual ICollection<Task> ReportedTasks { get; set; } = new List<Task>();
        public virtual ICollection<ProjectDocument> AuthoredDocuments { get; set; } = new List<ProjectDocument>();
        public virtual ICollection<CollaborationNotification> ReceivedNotifications { get; set; } = new List<CollaborationNotification>();
        public virtual ICollection<CollaborationNotification> SentNotifications { get; set; } = new List<CollaborationNotification>();
    }

    [Table("Teams")]
    public class Team
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Department { get; set; } = string.Empty;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }

    [Table("TeamMembers")]
    public class TeamMember
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string TeamId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public bool IsOwner { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation Properties
        [ForeignKey(nameof(TeamId))]
        public virtual Team Team { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
    }

    // Project Management Entities
    [Table("Projects")]
    public class Project
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;
        
        public ProjectType Type { get; set; }
        
        public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
        
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
        
        [Required]
        public string TeamId { get; set; } = string.Empty;
        
        [Required]
        public string OwnerId { get; set; } = string.Empty;
        
        public DateTime StartDate { get; set; }
        
        public DateTime EndDate { get; set; }
        
        [Column(TypeName = "text")]
        public string? MetadataJson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(TeamId))]
        public virtual Team Team { get; set; } = null!;
        
        [ForeignKey(nameof(OwnerId))]
        public virtual CollaborationUser Owner { get; set; } = null!;
        
        public virtual ICollection<ProjectParticipant> Participants { get; set; } = new List<ProjectParticipant>();
        public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
        public virtual ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();
        public virtual ICollection<ProjectDocument> Documents { get; set; } = new List<ProjectDocument>();
        public virtual ICollection<CollaborationSession> Sessions { get; set; } = new List<CollaborationSession>();
        public virtual ICollection<AuditEvent> AuditEvents { get; set; } = new List<AuditEvent>();
    }

    [Table("ProjectParticipants")]
    public class ProjectParticipant
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public ProjectRole Role { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation Properties
        [ForeignKey(nameof(ProjectId))]
        public virtual Project Project { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
    }

    [Table("Milestones")]
    public class Milestone
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime TargetDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        public MilestoneStatus Status { get; set; } = MilestoneStatus.Planned;
        
        [Column(TypeName = "text")]
        public string? DeliverablesJson { get; set; }
        
        [Column(TypeName = "text")]
        public string? DependenciesJson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(ProjectId))]
        public virtual Project Project { get; set; } = null!;
    }

    // Task Management Entities
    [Table("Tasks")]
    public class Task
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;
        
        public TaskType Type { get; set; }
        
        public DTOs.TaskStatus Status { get; set; } = DTOs.TaskStatus.Backlog;
        
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        
        public string? AssigneeId { get; set; }
        
        [Required]
        public string ReporterId { get; set; } = string.Empty;
        
        public decimal? EstimatedHours { get; set; }
        
        public decimal? ActualHours { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        [Column(TypeName = "text")]
        public string? DependenciesJson { get; set; }
        
        [Column(TypeName = "text")]
        public string? TagsJson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(ProjectId))]
        public virtual Project Project { get; set; } = null!;
        
        [ForeignKey(nameof(AssigneeId))]
        public virtual CollaborationUser? Assignee { get; set; }
        
        [ForeignKey(nameof(ReporterId))]
        public virtual CollaborationUser Reporter { get; set; } = null!;
        
        public virtual ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
    }

    [Table("TaskComments")]
    public class TaskComment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string TaskId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        [Column(TypeName = "text")]
        public string Content { get; set; } = string.Empty;
        
        public CommentType Type { get; set; } = CommentType.Comment;
        
        [Column(TypeName = "text")]
        public string? MentionsJson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? EditedAt { get; set; }
        
        // Navigation Properties
        [ForeignKey(nameof(TaskId))]
        public virtual Task Task { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
    }

    // Real-time Collaboration Entities
    [Table("CollaborationSessions")]
    public class CollaborationSession
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        public SessionType Type { get; set; }
        
        public SessionStatus Status { get; set; } = SessionStatus.Scheduled;
        
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        
        public DateTime? EndTime { get; set; }
        
        [Column(TypeName = "text")]
        public string? ConfigurationJson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(ProjectId))]
        public virtual Project Project { get; set; } = null!;
        
        public virtual ICollection<SessionParticipant> Participants { get; set; } = new List<SessionParticipant>();
        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    [Table("SessionParticipants")]
    public class SessionParticipant
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public SessionRole Role { get; set; }
        
        public DateTime JoinTime { get; set; } = DateTime.UtcNow;
        
        public DateTime? LeaveTime { get; set; }
        
        public bool IsPresenting { get; set; }
        
        public bool IsMuted { get; set; }
        
        public bool HasVideo { get; set; }
        
        [Column(TypeName = "text")]
        public string? PermissionsJson { get; set; }
        
        // Navigation Properties
        [ForeignKey(nameof(SessionId))]
        public virtual CollaborationSession Session { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
    }

    [Table("ChatMessages")]
    public class ChatMessage
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        [Column(TypeName = "text")]
        public string Content { get; set; } = string.Empty;
        
        public MessageType Type { get; set; } = MessageType.Text;
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [Column(TypeName = "text")]
        public string? MentionsJson { get; set; }
        
        [Column(TypeName = "text")]
        public string? AttachmentsJson { get; set; }
        
        // Navigation Properties
        [ForeignKey(nameof(SessionId))]
        public virtual CollaborationSession Session { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
    }

    // Document Management Entities
    [Table("ProjectDocuments")]
    public class ProjectDocument
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public DocumentType Type { get; set; }
        
        [Column(TypeName = "text")]
        public string Content { get; set; } = string.Empty;
        
        public int Version { get; set; } = 1;
        
        public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
        
        [Required]
        public string AuthorId { get; set; } = string.Empty;
        
        [Required]
        public string LastEditorId { get; set; } = string.Empty;
        
        [Column(TypeName = "text")]
        public string? TagsJson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(ProjectId))]
        public virtual Project Project { get; set; } = null!;
        
        [ForeignKey(nameof(AuthorId))]
        public virtual CollaborationUser Author { get; set; } = null!;
        
        [ForeignKey(nameof(LastEditorId))]
        public virtual CollaborationUser LastEditor { get; set; } = null!;
        
        public virtual ICollection<DocumentPermission> Permissions { get; set; } = new List<DocumentPermission>();
    }

    [Table("DocumentPermissions")]
    public class DocumentPermission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string DocumentId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public DocumentPermissionLevel Level { get; set; }
        
        [Required]
        public string GrantedById { get; set; } = string.Empty;
        
        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(DocumentId))]
        public virtual ProjectDocument Document { get; set; } = null!;
        
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
        
        [ForeignKey(nameof(GrantedById))]
        public virtual CollaborationUser GrantedBy { get; set; } = null!;
    }

    // Notification Entities
    [Table("CollaborationNotifications")]
    public class CollaborationNotification
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public NotificationType Type { get; set; }
        
        [Required]
        public string RecipientId { get; set; } = string.Empty;
        
        public string? SenderId { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;
        
        [Column(TypeName = "text")]
        public string? DataJson { get; set; }
        
        public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
        
        public bool IsRead { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ReadAt { get; set; }
        
        public DateTime? ExpiresAt { get; set; }
        
        // Navigation Properties
        [ForeignKey(nameof(RecipientId))]
        public virtual CollaborationUser Recipient { get; set; } = null!;
        
        [ForeignKey(nameof(SenderId))]
        public virtual CollaborationUser? Sender { get; set; }
    }

    // Audit and Compliance Entities
    [Table("AuditEvents")]
    public class AuditEvent
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public AuditEventType Type { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Entity { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string EntityId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Action { get; set; } = string.Empty;
        
        [Column(TypeName = "text")]
        public string? DetailsJson { get; set; }
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [Required]
        [StringLength(45)]
        public string IpAddress { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string UserAgent { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string SessionId { get; set; } = string.Empty;
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
    }

    [Table("DocumentAuditEvents")]
    public class DocumentAuditEvent : AuditEvent
    {
        public int DocumentVersion { get; set; }
        
        [Required]
        [StringLength(1000)]
        public string ChangesSummary { get; set; } = string.Empty;
        
        [Column(TypeName = "text")]
        public string? ContentDiff { get; set; }
    }

    // Permission Management Entities
    [Table("Permissions")]
    public class Permission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public PermissionCategory Category { get; set; }
        
        public PermissionLevel Level { get; set; }
        
        public PermissionScope Scope { get; set; }
        
        public bool IsSystemPermission { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("UserPermissions")]
    public class UserPermission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string PermissionId { get; set; } = string.Empty;
        
        [Required]
        public string GrantedById { get; set; } = string.Empty;
        
        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiresAt { get; set; }
        
        [Column(TypeName = "text")]
        public string? ConditionsJson { get; set; }
        
        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public virtual CollaborationUser User { get; set; } = null!;
        
        [ForeignKey(nameof(PermissionId))]
        public virtual Permission Permission { get; set; } = null!;
        
        [ForeignKey(nameof(GrantedById))]
        public virtual CollaborationUser GrantedBy { get; set; } = null!;
    }

    // Whiteboard Collaboration Entities (simplified for database storage)
    [Table("WhiteboardSessions")]
    public class WhiteboardSession
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string CollaborationSessionId { get; set; } = string.Empty;
        
        [Column(TypeName = "text")]
        public string CanvasData { get; set; } = string.Empty;
        
        public int Version { get; set; } = 1;
        
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey(nameof(CollaborationSessionId))]
        public virtual CollaborationSession CollaborationSession { get; set; } = null!;
    }
}