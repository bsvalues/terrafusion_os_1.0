// Wave 4 — GPT Core Entity EF Configurations
// Entities live in TerraFusion.Core.Entities (no circular dep with TerraFusion.Data).
// AI-only entities (GPTMessage, RAGDataset, etc.) are registered via
// TerraFusionDbContext.OnModelCreatingExtensions in TerraFusion.AI.

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

/// <summary>
/// Static container matching DbContext call-site:
///   modelBuilder.ApplyConfiguration(new GptCoreEntityConfigurations.GPTConfigurationConfiguration());
/// </summary>
public static class GptCoreEntityConfigurations
{
    public sealed class GPTConfigurationConfiguration : IEntityTypeConfiguration<GPTConfiguration>
    {
        public void Configure(EntityTypeBuilder<GPTConfiguration> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("GPTConfigurations");

            builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
            builder.Property(e => e.DisplayName).IsRequired().HasMaxLength(200);
            builder.Property(e => e.Description).HasColumnType("text");
            builder.Property(e => e.IconUrl).HasMaxLength(500);
            builder.Property(e => e.Category).HasMaxLength(100);

            builder.Property(e => e.ModelProvider).IsRequired().HasMaxLength(50);
            builder.Property(e => e.ModelName).IsRequired().HasMaxLength(100);
            builder.Property(e => e.SystemPrompt).IsRequired().HasColumnType("text");
            builder.Property(e => e.Temperature).HasColumnType("decimal(3,2)").HasDefaultValue(0.7m);
            builder.Property(e => e.MaxTokens).HasDefaultValue(4000);

            builder.Property(e => e.FunctionsJson).HasColumnType("jsonb");
            builder.Property(e => e.AllowedCounties).HasColumnType("jsonb");

            builder.Property(e => e.TotalCost).HasColumnType("decimal(18,4)");
            builder.Property(e => e.AverageRating).HasColumnType("decimal(3,2)");
            builder.Property(e => e.Price).HasColumnType("decimal(18,2)");

            builder.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");
            builder.Property(e => e.Version).HasMaxLength(20).HasDefaultValue("1.0");

            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(200);

            builder.HasIndex(e => e.Name).HasDatabaseName("IX_GPTConfigurations_Name");
            builder.HasIndex(e => e.IsSystemGPT).HasDatabaseName("IX_GPTConfigurations_IsSystemGPT");
            builder.HasIndex(e => e.IsPublic).HasDatabaseName("IX_GPTConfigurations_IsPublic");
            builder.HasIndex(e => e.IsFeatured).HasDatabaseName("IX_GPTConfigurations_IsFeatured");
            builder.HasIndex(e => e.Category).HasDatabaseName("IX_GPTConfigurations_Category");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_GPTConfigurations_CountyId");
            builder.HasIndex(e => e.CreatedByUserId).HasDatabaseName("IX_GPTConfigurations_CreatedByUserId");
            builder.HasIndex(e => e.Status).HasDatabaseName("IX_GPTConfigurations_Status");
            builder.HasIndex(e => e.InstallCount).HasDatabaseName("IX_GPTConfigurations_InstallCount");
            builder.HasIndex(e => new { e.AverageRating, e.RatingCount }).HasDatabaseName("IX_GPTConfigurations_Rating");
        }
    }

    public sealed class GPTConversationConfiguration : IEntityTypeConfiguration<GPTConversation>
    {
        public void Configure(EntityTypeBuilder<GPTConversation> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("GPTConversations");

            builder.Property(e => e.GPTConfigurationId).IsRequired();
            builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            builder.Property(e => e.CountyId).IsRequired();

            builder.Property(e => e.Title).HasMaxLength(500);
            builder.Property(e => e.TotalCost).HasColumnType("decimal(18,4)");
            builder.Property(e => e.Feedback).HasColumnType("text");

            builder.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");

            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();

            builder.HasOne(e => e.GPTConfiguration)
                   .WithMany()
                   .HasForeignKey(e => e.GPTConfigurationId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(e => e.GPTConfigurationId).HasDatabaseName("IX_GPTConversations_GPTConfigurationId");
            builder.HasIndex(e => e.UserId).HasDatabaseName("IX_GPTConversations_UserId");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_GPTConversations_CountyId");
            builder.HasIndex(e => e.Status).HasDatabaseName("IX_GPTConversations_Status");
            builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_GPTConversations_CreatedAt");
            builder.HasIndex(e => e.LastMessageAt).HasDatabaseName("IX_GPTConversations_LastMessageAt");
            builder.HasIndex(e => new { e.UserId, e.GPTConfigurationId }).HasDatabaseName("IX_GPTConversations_UserGPT");
        }
    }
}
