using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class TaskConfiguration : IEntityTypeConfiguration<TerraFusion.Core.Entities.Task>
{
    public void Configure(EntityTypeBuilder<TerraFusion.Core.Entities.Task> builder)
    {
        builder.ToTable("Tasks");
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.Id).HasMaxLength(450);
        builder.Property(t => t.ProjectId).IsRequired().HasMaxLength(450);
        builder.Property(t => t.Title).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Description).IsRequired().HasMaxLength(2000);
        builder.Property(t => t.AssigneeId).HasMaxLength(450);
        builder.Property(t => t.ReporterId).IsRequired().HasMaxLength(450);
        builder.Property(t => t.EstimatedHours).HasPrecision(10, 2);
        builder.Property(t => t.ActualHours).HasPrecision(10, 2);
        builder.Property(t => t.DependenciesJson).HasColumnType("text");
        builder.Property(t => t.TagsJson).HasColumnType("text");
        
        // Explicit relationships to resolve navigation ambiguity
        builder.HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(t => t.Assignee)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);
            
        builder.HasOne(t => t.Reporter)
            .WithMany(u => u.ReportedTasks)
            .HasForeignKey(t => t.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Comments relationship
        builder.HasMany(t => t.Comments)
            .WithOne(c => c.Task)
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Indexes
        builder.HasIndex(t => t.ProjectId);
        builder.HasIndex(t => t.AssigneeId);
        builder.HasIndex(t => t.ReporterId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.Priority);
        builder.HasIndex(t => t.DueDate);
        builder.HasIndex(t => t.CreatedAt);
    }
}
