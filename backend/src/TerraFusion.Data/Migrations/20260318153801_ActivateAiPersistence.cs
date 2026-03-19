using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class ActivateAiPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GPTConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsSystemGPT = table.Column<bool>(type: "boolean", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    CountyId = table.Column<int>(type: "integer", nullable: true),
                    ModelProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ModelName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SystemPrompt = table.Column<string>(type: "text", nullable: false),
                    Temperature = table.Column<decimal>(type: "numeric(3,2)", nullable: false, defaultValue: 0.7m),
                    MaxTokens = table.Column<int>(type: "integer", nullable: false, defaultValue: 4000),
                    TopP = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    FrequencyPenalty = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    PresencePenalty = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    EnableRAG = table.Column<bool>(type: "boolean", nullable: false),
                    RAGDatasetId = table.Column<int>(type: "integer", nullable: true),
                    RAGTopK = table.Column<int>(type: "integer", nullable: false),
                    RAGScoreThreshold = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    EnableFunctions = table.Column<bool>(type: "boolean", nullable: false),
                    FunctionsJson = table.Column<string>(type: "jsonb", nullable: true),
                    RequiredRole = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AllowedCounties = table.Column<string>(type: "jsonb", nullable: true),
                    TotalConversations = table.Column<long>(type: "bigint", nullable: false),
                    TotalMessages = table.Column<long>(type: "bigint", nullable: false),
                    TotalTokensUsed = table.Column<long>(type: "bigint", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    AverageRating = table.Column<decimal>(type: "numeric(3,2)", nullable: true),
                    RatingCount = table.Column<int>(type: "integer", nullable: false),
                    InstallCount = table.Column<int>(type: "integer", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "1.0"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GPTConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RAGDatasets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CountyId = table.Column<int>(type: "integer", nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EmbeddingProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EmbeddingModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    VectorDimension = table.Column<int>(type: "integer", nullable: false, defaultValue: 1536),
                    DocumentCount = table.Column<int>(type: "integer", nullable: false),
                    TotalChunks = table.Column<int>(type: "integer", nullable: false),
                    LastIndexedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RAGDatasets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GPTConversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GPTConfigurationId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CountyId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalMessages = table.Column<int>(type: "integer", nullable: false),
                    TotalTokensUsed = table.Column<long>(type: "bigint", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    Duration = table.Column<int>(type: "integer", nullable: true),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    Feedback = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GPTConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GPTConversations_GPTConfigurations_GPTConfigurationId",
                        column: x => x.GPTConfigurationId,
                        principalTable: "GPTConfigurations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GPTMarketplaceInstalls",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GPTConfigurationId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CountyId = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    InstallDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    Review = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GPTMarketplaceInstalls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GPTMarketplaceInstalls_GPTConfigurations_GPTConfigurationId",
                        column: x => x.GPTConfigurationId,
                        principalTable: "GPTConfigurations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GPTUsageMetrics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GPTConfigurationId = table.Column<int>(type: "integer", nullable: false),
                    ConversationId = table.Column<int>(type: "integer", nullable: true),
                    MessageId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CountyId = table.Column<int>(type: "integer", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ModelName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PromptTokens = table.Column<int>(type: "integer", nullable: false),
                    CompletionTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    PromptTokenCost = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    CompletionTokenCost = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    ResponseTime = table.Column<int>(type: "integer", nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GPTUsageMetrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GPTUsageMetrics_GPTConfigurations_GPTConfigurationId",
                        column: x => x.GPTConfigurationId,
                        principalTable: "GPTConfigurations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RAGDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DatasetId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    SourceUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DocumentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Author = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PublishedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Tags = table.Column<string>(type: "jsonb", nullable: true),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true),
                    ChunkCount = table.Column<int>(type: "integer", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IndexedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RAGDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RAGDocuments_RAGDatasets_DatasetId",
                        column: x => x.DatasetId,
                        principalTable: "RAGDatasets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GPTMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversationId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    PromptTokens = table.Column<int>(type: "integer", nullable: false),
                    CompletionTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    ModelUsed = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FunctionName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FunctionArgs = table.Column<string>(type: "jsonb", nullable: true),
                    FunctionResult = table.Column<string>(type: "jsonb", nullable: true),
                    RAGDocumentsUsed = table.Column<string>(type: "jsonb", nullable: true),
                    RAGScore = table.Column<decimal>(type: "numeric(3,2)", nullable: true),
                    ResponseTime = table.Column<int>(type: "integer", nullable: true),
                    FinishReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GPTMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GPTMessages_GPTConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "GPTConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RAGEmbeddings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DocumentId = table.Column<int>(type: "integer", nullable: false),
                    DatasetId = table.Column<int>(type: "integer", nullable: false),
                    ChunkIndex = table.Column<int>(type: "integer", nullable: false),
                    ChunkText = table.Column<string>(type: "text", nullable: false),
                    Embedding = table.Column<float[]>(type: "real[]", nullable: false),
                    TokenCount = table.Column<int>(type: "integer", nullable: false),
                    StartPosition = table.Column<int>(type: "integer", nullable: false),
                    EndPosition = table.Column<int>(type: "integer", nullable: false),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RAGEmbeddings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RAGEmbeddings_RAGDatasets_DatasetId",
                        column: x => x.DatasetId,
                        principalTable: "RAGDatasets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RAGEmbeddings_RAGDocuments_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "RAGDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GPTAudit",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<int>(type: "integer", nullable: false),
                    ConversationId = table.Column<int>(type: "integer", nullable: false),
                    GPTConfigurationId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CountyId = table.Column<int>(type: "integer", nullable: false),
                    RAGUsed = table.Column<bool>(type: "boolean", nullable: false),
                    RAGDatasetId = table.Column<int>(type: "integer", nullable: true),
                    RAGDocumentIds = table.Column<string>(type: "jsonb", nullable: true),
                    RAGChunkDetails = table.Column<string>(type: "jsonb", nullable: true),
                    RAGChunksRetrieved = table.Column<int>(type: "integer", nullable: false),
                    RAGAverageScore = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    EmbeddingProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmbeddingModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LLMProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    LLMModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RAGRetrievalTimeMs = table.Column<int>(type: "integer", nullable: true),
                    LLMGenerationTimeMs = table.Column<int>(type: "integer", nullable: true),
                    TotalResponseTimeMs = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClientInfo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GPTAudit", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GPTAudit_GPTConfigurations_GPTConfigurationId",
                        column: x => x.GPTConfigurationId,
                        principalTable: "GPTConfigurations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GPTAudit_GPTConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "GPTConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GPTAudit_GPTMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "GPTMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GPTAudit_RAGDatasets_RAGDatasetId",
                        column: x => x.RAGDatasetId,
                        principalTable: "RAGDatasets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_GPTAudit_ConversationId",
                table: "GPTAudit",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTAudit_CountyId",
                table: "GPTAudit",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTAudit_CreatedAt",
                table: "GPTAudit",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GPTAudit_GPTConfigurationId",
                table: "GPTAudit",
                column: "GPTConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTAudit_MessageId",
                table: "GPTAudit",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTAudit_RAGDatasetId",
                table: "GPTAudit",
                column: "RAGDatasetId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_Category",
                table: "GPTConfigurations",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_CountyId",
                table: "GPTConfigurations",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_CreatedByUserId",
                table: "GPTConfigurations",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_InstallCount",
                table: "GPTConfigurations",
                column: "InstallCount");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_IsFeatured",
                table: "GPTConfigurations",
                column: "IsFeatured");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_IsPublic",
                table: "GPTConfigurations",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_IsSystemGPT",
                table: "GPTConfigurations",
                column: "IsSystemGPT");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_Name",
                table: "GPTConfigurations",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_Rating",
                table: "GPTConfigurations",
                columns: new[] { "AverageRating", "RatingCount" });

            migrationBuilder.CreateIndex(
                name: "IX_GPTConfigurations_Status",
                table: "GPTConfigurations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_CountyId",
                table: "GPTConversations",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_CreatedAt",
                table: "GPTConversations",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_GPTConfigurationId",
                table: "GPTConversations",
                column: "GPTConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_LastMessageAt",
                table: "GPTConversations",
                column: "LastMessageAt");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_Status",
                table: "GPTConversations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_UserGPT",
                table: "GPTConversations",
                columns: new[] { "UserId", "GPTConfigurationId" });

            migrationBuilder.CreateIndex(
                name: "IX_GPTConversations_UserId",
                table: "GPTConversations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMarketplaceInstalls_CountyId",
                table: "GPTMarketplaceInstalls",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMarketplaceInstalls_GPTConfigurationId",
                table: "GPTMarketplaceInstalls",
                column: "GPTConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMarketplaceInstalls_InstallDate",
                table: "GPTMarketplaceInstalls",
                column: "InstallDate");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMarketplaceInstalls_UserGPT_Unique",
                table: "GPTMarketplaceInstalls",
                columns: new[] { "UserId", "GPTConfigurationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GPTMarketplaceInstalls_UserId",
                table: "GPTMarketplaceInstalls",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMessages_ConversationId",
                table: "GPTMessages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMessages_CreatedAt",
                table: "GPTMessages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMessages_Provider",
                table: "GPTMessages",
                column: "Provider");

            migrationBuilder.CreateIndex(
                name: "IX_GPTMessages_Role",
                table: "GPTMessages",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_ConversationId",
                table: "GPTUsageMetrics",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_CountyId",
                table: "GPTUsageMetrics",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_CountyTimestamp",
                table: "GPTUsageMetrics",
                columns: new[] { "CountyId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_GPTConfigurationId",
                table: "GPTUsageMetrics",
                column: "GPTConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_GPTTimestamp",
                table: "GPTUsageMetrics",
                columns: new[] { "GPTConfigurationId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_Provider",
                table: "GPTUsageMetrics",
                column: "Provider");

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_Timestamp",
                table: "GPTUsageMetrics",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_GPTUsageMetrics_UserId",
                table: "GPTUsageMetrics",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDatasets_Category",
                table: "RAGDatasets",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDatasets_CountyId",
                table: "RAGDatasets",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDatasets_Name",
                table: "RAGDatasets",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDatasets_Status",
                table: "RAGDatasets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDocuments_CreatedAt",
                table: "RAGDocuments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDocuments_DatasetId",
                table: "RAGDocuments",
                column: "DatasetId");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDocuments_DocumentType",
                table: "RAGDocuments",
                column: "DocumentType");

            migrationBuilder.CreateIndex(
                name: "IX_RAGDocuments_Title",
                table: "RAGDocuments",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_RAGEmbeddings_DatasetId",
                table: "RAGEmbeddings",
                column: "DatasetId");

            migrationBuilder.CreateIndex(
                name: "IX_RAGEmbeddings_DocumentId",
                table: "RAGEmbeddings",
                column: "DocumentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GPTAudit");

            migrationBuilder.DropTable(
                name: "GPTMarketplaceInstalls");

            migrationBuilder.DropTable(
                name: "GPTUsageMetrics");

            migrationBuilder.DropTable(
                name: "RAGEmbeddings");

            migrationBuilder.DropTable(
                name: "GPTMessages");

            migrationBuilder.DropTable(
                name: "RAGDocuments");

            migrationBuilder.DropTable(
                name: "GPTConversations");

            migrationBuilder.DropTable(
                name: "RAGDatasets");

            migrationBuilder.DropTable(
                name: "GPTConfigurations");
        }
    }
}
