// AI Data Layer - DbSet Extension Methods for AI Entities
// These extension methods provide typed DbSet access to AI-specific entities
// (GPT configurations, RAG datasets, embeddings, conversations, usage metrics, audits)
// registered in TerraFusionDbContext via the EF Core Set<T>() API.
//
// NOTE: These are structural accessors, not seed data. They provide a clean API
// surface for AI services to access their entities without modifying TerraFusionDbContext directly.

using Microsoft.EntityFrameworkCore;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.AI.Data
{
    /// <summary>
    /// Extension methods for accessing AI-specific DbSets from TerraFusionDbContext.
    /// These entities must be registered in the DbContext's OnModelCreating or via
    /// the entity type configuration system for these accessors to function correctly.
    /// </summary>
    public static class TerraFusionDbContextExtensions
    {
        public static DbSet<GPTConfiguration> GPTConfigurations(this TerraFusionDbContext context)
            => context.Set<GPTConfiguration>();

        public static DbSet<RAGDataset> RAGDatasets(this TerraFusionDbContext context)
            => context.Set<RAGDataset>();

        public static DbSet<RAGDocument> RAGDocuments(this TerraFusionDbContext context)
            => context.Set<RAGDocument>();

        public static DbSet<RAGEmbedding> RAGEmbeddings(this TerraFusionDbContext context)
            => context.Set<RAGEmbedding>();

        public static DbSet<GPTConversation> GPTConversations(this TerraFusionDbContext context)
            => context.Set<GPTConversation>();

        public static DbSet<GPTMessage> GPTMessages(this TerraFusionDbContext context)
            => context.Set<GPTMessage>();

        public static DbSet<GPTUsageMetric> GPTUsageMetrics(this TerraFusionDbContext context)
            => context.Set<GPTUsageMetric>();

        public static DbSet<GPTAudit> GPTAudits(this TerraFusionDbContext context)
            => context.Set<GPTAudit>();
    }
}
