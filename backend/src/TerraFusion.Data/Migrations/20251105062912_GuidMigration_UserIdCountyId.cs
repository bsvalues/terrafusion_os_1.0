using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class GuidMigration_UserIdCountyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CodexAlerts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Environment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    County = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Domain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AlertLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    Threshold = table.Column<double>(type: "double precision", nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    RecommendedAction = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Acknowledged = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Resolved = table.Column<bool>(type: "boolean", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodexAlerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodexMetrics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Environment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    County = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Domain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MetricName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RawValue = table.Column<double>(type: "double precision", nullable: false),
                    ScaledValue = table.Column<double>(type: "double precision", nullable: false),
                    Unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AlertLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodexMetrics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodexScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Environment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    County = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Domain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AmplifiedScore = table.Column<double>(type: "double precision", nullable: false),
                    AlertLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RecommendedAction = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodexScores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodexUltimatePower",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Environment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    County = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UltimatePowerScore = table.Column<double>(type: "double precision", nullable: false),
                    Percentage = table.Column<double>(type: "double precision", nullable: false),
                    AlertLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RecommendedAction = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Trend = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DomainScoresJson = table.Column<string>(type: "jsonb", nullable: false),
                    IsChampionshipMode = table.Column<bool>(type: "boolean", nullable: false),
                    IsFISMACompliant = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodexUltimatePower", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Experiments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DatasetId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DatasetVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ModelId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ModelVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HyperparamsJson = table.Column<string>(type: "jsonb", nullable: true),
                    SwarmConfigJson = table.Column<string>(type: "jsonb", nullable: true),
                    Seed = table.Column<long>(type: "bigint", nullable: false),
                    Owner = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Experiments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    EmailEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    EmailAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailCriticalAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    EmailWarningAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    EmailInfoAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    EmailDailySummary = table.Column<bool>(type: "boolean", nullable: false),
                    EmailAchievements = table.Column<bool>(type: "boolean", nullable: false),
                    SlackEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SlackWebhook = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SlackCriticalAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    SlackWarningAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    SlackInfoAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    SlackStatusUpdates = table.Column<bool>(type: "boolean", nullable: false),
                    SlackDailySummary = table.Column<bool>(type: "boolean", nullable: false),
                    SlackAchievements = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsWebhook = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TeamsCriticalAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsWarningAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsInfoAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsStatusUpdates = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsDailySummary = table.Column<bool>(type: "boolean", nullable: false),
                    TeamsAchievements = table.Column<bool>(type: "boolean", nullable: false),
                    UltimatePowerScoreThreshold = table.Column<double>(type: "double precision", nullable: false),
                    DomainScoreThreshold = table.Column<double>(type: "double precision", nullable: false),
                    CriticalAlertThreshold = table.Column<double>(type: "double precision", nullable: false),
                    WarningAlertThreshold = table.Column<double>(type: "double precision", nullable: false),
                    DailySummaryEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DailySummaryTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    DailySummaryTimezone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DailySummaryIncludeAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    DailySummaryIncludePerformance = table.Column<bool>(type: "boolean", nullable: false),
                    DailySummaryIncludeTrends = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuantumNotebooks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CellsJson = table.Column<string>(type: "text", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    Language = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "javascript"),
                    Visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "private"),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LastExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExecutionCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuantumNotebooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuantumNotebooks_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuantumNotebooks_GovernmentUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "GovernmentUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Workflows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "data-processing"),
                    Complexity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "moderate"),
                    DefinitionJson = table.Column<string>(type: "text", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    IsTemplate = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    TemplateId = table.Column<int>(type: "integer", nullable: true),
                    Visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "private"),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    NodeCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExecutionCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastExecutionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AverageExecutionTime = table.Column<double>(type: "double precision", precision: 18, scale: 2, nullable: true),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workflows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Workflows_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Workflows_GovernmentUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "GovernmentUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Workflows_Workflows_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "Workflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ExperimentRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExperimentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExecutionDetailsJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExperimentRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExperimentRuns_Experiments_ExperimentId",
                        column: x => x.ExperimentId,
                        principalTable: "Experiments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnalysisResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AnalysisType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    NotebookId = table.Column<int>(type: "integer", nullable: true),
                    InputDataJson = table.Column<string>(type: "text", nullable: false),
                    ParametersJson = table.Column<string>(type: "text", nullable: true),
                    TestStatistic = table.Column<double>(type: "double precision", precision: 18, scale: 6, nullable: false),
                    PValue = table.Column<double>(type: "double precision", precision: 18, scale: 10, nullable: false),
                    DegreesOfFreedom = table.Column<double>(type: "double precision", precision: 18, scale: 6, nullable: true),
                    EffectSizeType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EffectSizeValue = table.Column<double>(type: "double precision", precision: 18, scale: 6, nullable: true),
                    ConfidenceIntervalLower = table.Column<double>(type: "double precision", precision: 18, scale: 6, nullable: true),
                    ConfidenceIntervalUpper = table.Column<double>(type: "double precision", precision: 18, scale: 6, nullable: true),
                    Conclusion = table.Column<string>(type: "text", nullable: true),
                    LatexOutput = table.Column<string>(type: "text", nullable: true),
                    ApaOutput = table.Column<string>(type: "text", nullable: true),
                    ResultJson = table.Column<string>(type: "text", nullable: false),
                    ExecutionTimeMs = table.Column<int>(type: "integer", nullable: false),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalysisResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnalysisResults_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnalysisResults_GovernmentUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "GovernmentUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnalysisResults_QuantumNotebooks_NotebookId",
                        column: x => x.NotebookId,
                        principalTable: "QuantumNotebooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowExecutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkflowId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "running"),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationMs = table.Column<int>(type: "integer", nullable: true),
                    TotalNodes = table.Column<int>(type: "integer", nullable: false),
                    NodesExecuted = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    NodesFailed = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExecutionLogJson = table.Column<string>(type: "text", nullable: true),
                    OutputJson = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    ErrorStackTrace = table.Column<string>(type: "text", nullable: true),
                    ContextJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowExecutions_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowExecutions_GovernmentUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "GovernmentUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowExecutions_Workflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_AnalysisType",
                table: "AnalysisResults",
                column: "AnalysisType");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_CountyId",
                table: "AnalysisResults",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_CreatedAt",
                table: "AnalysisResults",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_IsArchived",
                table: "AnalysisResults",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_NotebookId",
                table: "AnalysisResults",
                column: "NotebookId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_PValue",
                table: "AnalysisResults",
                column: "PValue");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_UserId",
                table: "AnalysisResults",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisResults_UserId_AnalysisType",
                table: "AnalysisResults",
                columns: new[] { "UserId", "AnalysisType" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexAlerts_Ack_Timestamp",
                table: "CodexAlerts",
                columns: new[] { "Acknowledged", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexAlerts_County_Timestamp",
                table: "CodexAlerts",
                columns: new[] { "County", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexAlerts_Domain_Level_Timestamp",
                table: "CodexAlerts",
                columns: new[] { "Domain", "AlertLevel", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexAlerts_Resolved_Timestamp",
                table: "CodexAlerts",
                columns: new[] { "Resolved", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexAlerts_Timestamp",
                table: "CodexAlerts",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_CodexMetrics_County_Timestamp",
                table: "CodexMetrics",
                columns: new[] { "County", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexMetrics_Domain_Timestamp",
                table: "CodexMetrics",
                columns: new[] { "Domain", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexMetrics_Environment_Timestamp",
                table: "CodexMetrics",
                columns: new[] { "Environment", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexMetrics_Timestamp",
                table: "CodexMetrics",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_CodexScores_County_Timestamp",
                table: "CodexScores",
                columns: new[] { "County", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexScores_Domain_Timestamp",
                table: "CodexScores",
                columns: new[] { "Domain", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexScores_Env_Domain_Timestamp",
                table: "CodexScores",
                columns: new[] { "Environment", "Domain", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexScores_Timestamp",
                table: "CodexScores",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_CodexUltimatePower_ChampionshipMode",
                table: "CodexUltimatePower",
                column: "IsChampionshipMode");

            migrationBuilder.CreateIndex(
                name: "IX_CodexUltimatePower_County_Timestamp",
                table: "CodexUltimatePower",
                columns: new[] { "County", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexUltimatePower_Env_Timestamp",
                table: "CodexUltimatePower",
                columns: new[] { "Environment", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CodexUltimatePower_FISMACompliant",
                table: "CodexUltimatePower",
                column: "IsFISMACompliant");

            migrationBuilder.CreateIndex(
                name: "IX_CodexUltimatePower_Timestamp",
                table: "CodexUltimatePower",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentRuns_CreatedAt",
                table: "ExperimentRuns",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentRuns_ExperimentId",
                table: "ExperimentRuns",
                column: "ExperimentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentRuns_Status",
                table: "ExperimentRuns",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Experiments_CreatedAt",
                table: "Experiments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPreferences_UserId",
                table: "NotificationPreferences",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuantumNotebooks_CountyId",
                table: "QuantumNotebooks",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_QuantumNotebooks_CreatedAt",
                table: "QuantumNotebooks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_QuantumNotebooks_IsArchived",
                table: "QuantumNotebooks",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_QuantumNotebooks_Language",
                table: "QuantumNotebooks",
                column: "Language");

            migrationBuilder.CreateIndex(
                name: "IX_QuantumNotebooks_UserId",
                table: "QuantumNotebooks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuantumNotebooks_UserId_Name",
                table: "QuantumNotebooks",
                columns: new[] { "UserId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_CountyId",
                table: "WorkflowExecutions",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_StartedAt",
                table: "WorkflowExecutions",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_Status",
                table: "WorkflowExecutions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_UserId",
                table: "WorkflowExecutions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_WorkflowId",
                table: "WorkflowExecutions",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_WorkflowId_StartedAt",
                table: "WorkflowExecutions",
                columns: new[] { "WorkflowId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_WorkflowId_Status",
                table: "WorkflowExecutions",
                columns: new[] { "WorkflowId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_Category",
                table: "Workflows",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_Complexity",
                table: "Workflows",
                column: "Complexity");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_CountyId",
                table: "Workflows",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_CreatedAt",
                table: "Workflows",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_IsArchived",
                table: "Workflows",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_IsTemplate",
                table: "Workflows",
                column: "IsTemplate");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_TemplateId",
                table: "Workflows",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_UserId",
                table: "Workflows",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_UserId_Name",
                table: "Workflows",
                columns: new[] { "UserId", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnalysisResults");

            migrationBuilder.DropTable(
                name: "CodexAlerts");

            migrationBuilder.DropTable(
                name: "CodexMetrics");

            migrationBuilder.DropTable(
                name: "CodexScores");

            migrationBuilder.DropTable(
                name: "CodexUltimatePower");

            migrationBuilder.DropTable(
                name: "ExperimentRuns");

            migrationBuilder.DropTable(
                name: "NotificationPreferences");

            migrationBuilder.DropTable(
                name: "WorkflowExecutions");

            migrationBuilder.DropTable(
                name: "QuantumNotebooks");

            migrationBuilder.DropTable(
                name: "Experiments");

            migrationBuilder.DropTable(
                name: "Workflows");
        }
    }
}
