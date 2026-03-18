// Wave 4 — GPT/RAG AI Entity EF Configurations
// These entity types live in TerraFusion.AI.Entities, which cannot be referenced
// by TerraFusion.Data directly (circular dep: Data → AI → Data).
//
// Solution: TerraFusionDbContext exposes a static hook:
//   public static Action<ModelBuilder>? OnModelCreatingExtensions
//
// Program.cs (which references both Data and AI) wires this once:
//   TerraFusionDbContext.OnModelCreatingExtensions = GptAiEntityConfigurations.Apply;
//
// The hook is called at the end of OnModelCreating, before ConfigureEncryption.

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;

namespace TerraFusion.AI.Data;

public static class GptAiEntityConfigurations
{
    /// <summary>
    /// Wired by Program.cs into TerraFusionDbContext.OnModelCreatingExtensions.
    /// Registers all AI-only entity types without introducing a circular assembly reference.
    /// </summary>
    public static void Apply(ModelBuilder mb)
    {
        mb.ApplyConfiguration(new GPTMessageConfiguration());
        mb.ApplyConfiguration(new RAGDatasetConfiguration());
        mb.ApplyConfiguration(new RAGDocumentConfiguration());
        mb.ApplyConfiguration(new RAGEmbeddingConfiguration());
        mb.ApplyConfiguration(new GPTUsageMetricConfiguration());
        mb.ApplyConfiguration(new GPTAuditConfiguration());
        mb.ApplyConfiguration(new GPTMarketplaceInstallConfiguration());
    }

    private sealed class GPTMessageConfiguration : IEntityTypeConfiguration<GPTMessage>
    {
        public void Configure(EntityTypeBuilder<GPTMessage> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("GPTMessages");

            builder.Property(e => e.ConversationId).IsRequired();
            builder.Property(e => e.Role).IsRequired().HasMaxLength(20);
            builder.Property(e => e.Content).IsRequired().HasColumnType("text");

            builder.Property(e => e.Cost).HasColumnType("decimal(18,6)");
            builder.Property(e => e.ModelUsed).HasMaxLength(100);
            builder.Property(e => e.Provider).HasMaxLength(50);
            builder.Property(e => e.FunctionName).HasMaxLength(200);
            builder.Property(e => e.FunctionArgs).HasColumnType("jsonb");
            builder.Property(e => e.FunctionResult).HasColumnType("jsonb");
            builder.Property(e => e.RAGDocumentsUsed).HasColumnType("jsonb");
            builder.Property(e => e.RAGScore).HasColumnType("decimal(3,2)");
            builder.Property(e => e.FinishReason).HasMaxLength(50);
            builder.Property(e => e.CreatedAt).IsRequired();

            builder.HasOne(e => e.Conversation)
                   .WithMany()
                   .HasForeignKey(e => e.ConversationId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(e => e.ConversationId).HasDatabaseName("IX_GPTMessages_ConversationId");
            builder.HasIndex(e => e.Role).HasDatabaseName("IX_GPTMessages_Role");
            builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_GPTMessages_CreatedAt");
            builder.HasIndex(e => e.Provider).HasDatabaseName("IX_GPTMessages_Provider");
        }
    }

    private sealed class RAGDatasetConfiguration : IEntityTypeConfiguration<RAGDataset>
    {
        public void Configure(EntityTypeBuilder<RAGDataset> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("RAGDatasets");

            builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
            builder.Property(e => e.Description).HasColumnType("text");
            builder.Property(e => e.Category).HasMaxLength(100);
            builder.Property(e => e.EmbeddingProvider).IsRequired().HasMaxLength(50);
            builder.Property(e => e.EmbeddingModel).IsRequired().HasMaxLength(100);
            builder.Property(e => e.VectorDimension).HasDefaultValue(1536);
            builder.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(200);

            builder.HasIndex(e => e.Name).HasDatabaseName("IX_RAGDatasets_Name");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_RAGDatasets_CountyId");
            builder.HasIndex(e => e.Category).HasDatabaseName("IX_RAGDatasets_Category");
            builder.HasIndex(e => e.Status).HasDatabaseName("IX_RAGDatasets_Status");
        }
    }

    private sealed class RAGDocumentConfiguration : IEntityTypeConfiguration<RAGDocument>
    {
        public void Configure(EntityTypeBuilder<RAGDocument> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("RAGDocuments");

            builder.Property(e => e.DatasetId).IsRequired();
            builder.Property(e => e.Title).IsRequired().HasMaxLength(500);
            builder.Property(e => e.Content).IsRequired().HasColumnType("text");
            builder.Property(e => e.SourceUrl).HasMaxLength(1000);
            builder.Property(e => e.DocumentType).HasMaxLength(100);
            builder.Property(e => e.Author).HasMaxLength(200);
            builder.Property(e => e.Tags).HasColumnType("jsonb");
            builder.Property(e => e.Metadata).HasColumnType("jsonb");
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();

            builder.HasOne(e => e.Dataset)
                   .WithMany()
                   .HasForeignKey(e => e.DatasetId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(e => e.DatasetId).HasDatabaseName("IX_RAGDocuments_DatasetId");
            builder.HasIndex(e => e.Title).HasDatabaseName("IX_RAGDocuments_Title");
            builder.HasIndex(e => e.DocumentType).HasDatabaseName("IX_RAGDocuments_DocumentType");
            builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_RAGDocuments_CreatedAt");
        }
    }

    private sealed class RAGEmbeddingConfiguration : IEntityTypeConfiguration<RAGEmbedding>
    {
        public void Configure(EntityTypeBuilder<RAGEmbedding> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("RAGEmbeddings");

            builder.Property(e => e.DocumentId).IsRequired();
            builder.Property(e => e.DatasetId).IsRequired();
            builder.Property(e => e.ChunkText).IsRequired().HasColumnType("text");
            builder.Property(e => e.Metadata).HasColumnType("jsonb");
            builder.Property(e => e.CreatedAt).IsRequired();

            // RAGEmbedding.Embedding is float[] mapped to vector(1536) in PostgreSQL.
            // In-memory provider ignores column type — no pgvector extension needed for tests.
            builder.Property(e => e.Embedding).IsRequired();

            builder.HasOne(e => e.Document)
                   .WithMany()
                   .HasForeignKey(e => e.DocumentId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.Dataset)
                   .WithMany()
                   .HasForeignKey(e => e.DatasetId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(e => e.DocumentId).HasDatabaseName("IX_RAGEmbeddings_DocumentId");
            builder.HasIndex(e => e.DatasetId).HasDatabaseName("IX_RAGEmbeddings_DatasetId");
        }
    }

    private sealed class GPTUsageMetricConfiguration : IEntityTypeConfiguration<GPTUsageMetric>
    {
        public void Configure(EntityTypeBuilder<GPTUsageMetric> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("GPTUsageMetrics");

            builder.Property(e => e.GPTConfigurationId).IsRequired();
            builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            builder.Property(e => e.CountyId).IsRequired();
            builder.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            builder.Property(e => e.ModelName).IsRequired().HasMaxLength(100);
            builder.Property(e => e.PromptTokenCost).HasColumnType("decimal(18,6)");
            builder.Property(e => e.CompletionTokenCost).HasColumnType("decimal(18,6)");
            builder.Property(e => e.TotalCost).HasColumnType("decimal(18,6)");
            builder.Property(e => e.ErrorMessage).HasColumnType("text");
            builder.Property(e => e.Timestamp).IsRequired();

            builder.HasOne(e => e.GPTConfiguration)
                   .WithMany()
                   .HasForeignKey(e => e.GPTConfigurationId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(e => e.GPTConfigurationId).HasDatabaseName("IX_GPTUsageMetrics_GPTConfigurationId");
            builder.HasIndex(e => e.ConversationId).HasDatabaseName("IX_GPTUsageMetrics_ConversationId");
            builder.HasIndex(e => e.UserId).HasDatabaseName("IX_GPTUsageMetrics_UserId");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_GPTUsageMetrics_CountyId");
            builder.HasIndex(e => e.Provider).HasDatabaseName("IX_GPTUsageMetrics_Provider");
            builder.HasIndex(e => e.Timestamp).HasDatabaseName("IX_GPTUsageMetrics_Timestamp");
            builder.HasIndex(e => new { e.CountyId, e.Timestamp }).HasDatabaseName("IX_GPTUsageMetrics_CountyTimestamp");
            builder.HasIndex(e => new { e.GPTConfigurationId, e.Timestamp }).HasDatabaseName("IX_GPTUsageMetrics_GPTTimestamp");
        }
    }

    private sealed class GPTAuditConfiguration : IEntityTypeConfiguration<GPTAudit>
    {
        public void Configure(EntityTypeBuilder<GPTAudit> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("GPTAudit");

            builder.Property(e => e.MessageId).IsRequired();
            builder.Property(e => e.ConversationId).IsRequired();
            builder.Property(e => e.GPTConfigurationId).IsRequired();
            builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            builder.Property(e => e.CountyId).IsRequired();
            builder.Property(e => e.RAGDocumentIds).HasColumnType("jsonb");
            builder.Property(e => e.RAGChunkDetails).HasColumnType("jsonb");
            builder.Property(e => e.RAGAverageScore).HasColumnType("decimal(5,4)");
            builder.Property(e => e.EmbeddingProvider).HasMaxLength(50);
            builder.Property(e => e.EmbeddingModel).HasMaxLength(100);
            builder.Property(e => e.LLMProvider).HasMaxLength(50);
            builder.Property(e => e.LLMModel).HasMaxLength(100);
            builder.Property(e => e.ClientInfo).HasMaxLength(100);
            builder.Property(e => e.CreatedAt).IsRequired();

            builder.HasIndex(e => e.MessageId).HasDatabaseName("IX_GPTAudit_MessageId");
            builder.HasIndex(e => e.ConversationId).HasDatabaseName("IX_GPTAudit_ConversationId");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_GPTAudit_CountyId");
            builder.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_GPTAudit_CreatedAt");
        }
    }

    private sealed class GPTMarketplaceInstallConfiguration : IEntityTypeConfiguration<GPTMarketplaceInstall>
    {
        public void Configure(EntityTypeBuilder<GPTMarketplaceInstall> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("GPTMarketplaceInstalls");

            builder.Property(e => e.GPTConfigurationId).IsRequired();
            builder.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            builder.Property(e => e.CountyId).IsRequired();
            builder.Property(e => e.Version).HasMaxLength(20);
            builder.Property(e => e.Review).HasColumnType("text");
            builder.Property(e => e.InstallDate).IsRequired();
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();

            builder.HasOne(e => e.GPTConfiguration)
                   .WithMany()
                   .HasForeignKey(e => e.GPTConfigurationId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(e => e.GPTConfigurationId).HasDatabaseName("IX_GPTMarketplaceInstalls_GPTConfigurationId");
            builder.HasIndex(e => e.UserId).HasDatabaseName("IX_GPTMarketplaceInstalls_UserId");
            builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_GPTMarketplaceInstalls_CountyId");
            builder.HasIndex(e => e.InstallDate).HasDatabaseName("IX_GPTMarketplaceInstalls_InstallDate");
            builder.HasIndex(e => new { e.UserId, e.GPTConfigurationId })
                   .IsUnique()
                   .HasDatabaseName("IX_GPTMarketplaceInstalls_UserGPT_Unique");
        }
    }
}
