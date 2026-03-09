// TerraFusionGPT Suite: EF Core Configurations
// Reactivated from GPTConfiguration.cs.disabled — only entities available in TerraFusion.Core

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations
{
    /// <summary>
    /// EF Core configuration for GPTConfiguration entity
    /// </summary>
    public class GPTConfigurationConfiguration : IEntityTypeConfiguration<GPTConfiguration>
    {
        public void Configure(EntityTypeBuilder<GPTConfiguration> builder)
        {
            builder.HasKey(e => e.Id);

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

            // Indexes for performance
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

    /// <summary>
    /// EF Core configuration for GPTConversation entity
    /// </summary>
    public class GPTConversationConfiguration : IEntityTypeConfiguration<GPTConversation>
    {
        public void Configure(EntityTypeBuilder<GPTConversation> builder)
        {
            builder.HasKey(e => e.Id);

            builder.Property(e => e.GPTConfigurationId).IsRequired();
            builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            builder.Property(e => e.CountyId).IsRequired();

            builder.Property(e => e.Title).HasMaxLength(500);
            builder.Property(e => e.TotalCost).HasColumnType("decimal(18,4)");
            builder.Property(e => e.Feedback).HasColumnType("text");

            builder.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");

            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();

            // Foreign key relationship
            builder.HasOne(e => e.GPTConfiguration)
                   .WithMany()
                   .HasForeignKey(e => e.GPTConfigurationId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(e => e.GPTConfigurationId).HasDatabaseName("IX_GPTConversations_GPTConfigurationId");
            builder.HasIndex(e => e.UserId).HasDatabaseName("IX_GPTConversations_UserId");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_GPTConversations_CountyId");
            builder.HasIndex(e => e.Status).HasDatabaseName("IX_GPTConversations_Status");
            builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_GPTConversations_CreatedAt");
            builder.HasIndex(e => e.LastMessageAt).HasDatabaseName("IX_GPTConversations_LastMessageAt");
            builder.HasIndex(e => new { e.UserId, e.GPTConfigurationId }).HasDatabaseName("IX_GPTConversations_UserGPT");
        }
    }

    // NOTE: Remaining GPT entity configurations (GPTMessage, RAGDataset, RAGDocument,
    // GPTMarketplaceInstall, GPTUsageMetric) are in GPTConfiguration.cs.disabled.
    // They require entities currently only in TerraFusion.AI.Entities which TerraFusion.Data
    // cannot reference without a circular dependency. Reactivate when entities move to Core.
}
