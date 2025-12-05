// TEMPORARY STUBS FOR BACKEND STRUCTURAL BUILD
// TODO: Replace with real AI data layer from WIP branch.

using Microsoft.EntityFrameworkCore;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.AI.Data
{
    public static class TerraFusionDbContextExtensions
    {
        public static DbSet<GPTConfiguration> GPTConfigurations(this TerraFusionDbContext context)
            => context.Set<GPTConfiguration>();

        public static DbSet<RAGDataset> RAGDatasets(this TerraFusionDbContext context)
            => context.Set<RAGDataset>();

        public static DbSet<RAGDocument> RAGDocuments(this TerraFusionDbContext context)
            => context.Set<RAGDocument>();

        public static DbSet<GPTConversation> GPTConversations(this TerraFusionDbContext context)
            => context.Set<GPTConversation>();

        public static DbSet<GPTMessage> GPTMessages(this TerraFusionDbContext context)
            => context.Set<GPTMessage>();

        public static DbSet<GPTUsageMetric> GPTUsageMetrics(this TerraFusionDbContext context)
            => context.Set<GPTUsageMetric>();
    }
}
