using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class CollaborationUserConfiguration : IEntityTypeConfiguration<CollaborationUser>
{
    public void Configure(EntityTypeBuilder<CollaborationUser> builder)
    {
        builder.ToTable("CollaborationUsers");
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.Id).HasMaxLength(450);
        builder.Property(u => u.UserId).HasMaxLength(450);
        builder.Property(u => u.Name).IsRequired().HasMaxLength(200);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(320);
        builder.Property(u => u.Department).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Avatar).HasMaxLength(500);
        
        // Explicit Task relationships to resolve navigation ambiguity
        builder.HasMany(u => u.AssignedTasks)
            .WithOne(t => t.Assignee)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(u => u.ReportedTasks)
            .WithOne(t => t.Reporter)
            .HasForeignKey(t => t.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Team relationships
        builder.HasMany(u => u.TeamMemberships)
            .WithOne(tm => tm.User)
            .HasForeignKey(tm => tm.UserId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Project relationships
        builder.HasMany(u => u.ProjectParticipations)
            .WithOne(pp => pp.User)
            .HasForeignKey(pp => pp.UserId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(u => u.OwnedProjects)
            .WithOne(p => p.Owner)
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Document relationships
        builder.HasMany(u => u.AuthoredDocuments)
            .WithOne(d => d.Author)
            .HasForeignKey(d => d.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Notification relationships
        builder.HasMany(u => u.ReceivedNotifications)
            .WithOne(n => n.Recipient)
            .HasForeignKey(n => n.RecipientId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(u => u.SentNotifications)
            .WithOne(n => n.Sender)
            .HasForeignKey(n => n.SenderId)
            .OnDelete(DeleteBehavior.SetNull);
            
        // Indexes
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.UserId);
        builder.HasIndex(u => u.Department);
    }
}
