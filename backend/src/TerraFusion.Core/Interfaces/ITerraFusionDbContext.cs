using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Models;

namespace TerraFusion.Core.Interfaces;

public interface ITerraFusionDbContext
{
    // Core Government Entities
    DbSet<Property> Properties { get; set; }
    DbSet<County> Counties { get; set; }
    DbSet<PropertyAssessment> PropertyAssessments { get; set; }
    DbSet<TaxLevy> TaxLevies { get; set; }
    DbSet<GovernmentUser> GovernmentUsers { get; set; }
    DbSet<AuditLog> AuditLogs { get; set; }
    
    // AI System Entities
    DbSet<AIAgent> AIAgents { get; set; }
    DbSet<AIModel> AIModels { get; set; }
    DbSet<PerformanceMetric> PerformanceMetrics { get; set; }

    // Module System Entities
    DbSet<Module> Modules { get; set; }
    DbSet<Valuation> Valuations { get; set; }

    // Marketplace Entities
    DbSet<Plugin> Plugins { get; set; }
    
    // Security Entities
    DbSet<SecurityEvent> SecurityEvents { get; set; }
    DbSet<UserSession> UserSessions { get; set; }

    // Collaboration Entities
    DbSet<CollaborationUser> CollaborationUsers { get; set; }
    DbSet<Team> Teams { get; set; }
    DbSet<TeamMember> TeamMembers { get; set; }
    DbSet<Project> Projects { get; set; }
    DbSet<ProjectParticipant> ProjectParticipants { get; set; }
    DbSet<ProjectDocument> ProjectDocuments { get; set; }
    DbSet<TerraFusion.Core.Entities.Task> Tasks { get; set; }
    DbSet<TaskComment> TaskComments { get; set; }
    DbSet<Milestone> Milestones { get; set; }
    DbSet<DocumentPermission> DocumentPermissions { get; set; }
    DbSet<CollaborationNotification> CollaborationNotifications { get; set; }
    DbSet<AuditEvent> AuditEvents { get; set; }

    // Permission Entities
    DbSet<Permission> Permissions { get; set; }
    DbSet<UserPermission> UserPermissions { get; set; }

    // Codex 3-6-9 Framework Entities
    DbSet<CodexMetric> CodexMetrics { get; set; }
    DbSet<CodexScore> CodexScores { get; set; }
    DbSet<CodexUltimatePower> CodexUltimatePowerRecords { get; set; }
    DbSet<CodexAlert> CodexAlerts { get; set; }

    // Dais County Ops — Exemptions, Appeals, Certification, Notices, Queue (Phase 7)
    DbSet<Exemption> Exemptions { get; set; }
    DbSet<Appeal> Appeals { get; set; }
    DbSet<CertificationStep> CertificationSteps { get; set; }
    DbSet<Notice> Notices { get; set; }
    DbSet<QueueItem> QueueItems { get; set; }

    System.Threading.Tasks.Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    DbSet<TEntity> Set<TEntity>() where TEntity : class;
    EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;
}