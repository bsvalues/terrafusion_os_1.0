using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDaisEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Appeals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AppealGround = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PetitionerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FiledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HearingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DecisionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentValue = table.Column<decimal>(type: "numeric", nullable: false),
                    RequestedValue = table.Column<decimal>(type: "numeric", nullable: false),
                    DecidedValue = table.Column<decimal>(type: "numeric", nullable: true),
                    DecisionNotes = table.Column<string>(type: "text", nullable: true),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appeals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appeals_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditFindings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FindingType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditFindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditFindings_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditReconciliations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    Offices = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Discrepancies = table.Column<int>(type: "integer", nullable: false),
                    TotalReconciled = table.Column<decimal>(type: "numeric", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditReconciliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditReconciliations_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BayesianAnalyses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterName = table.Column<string>(type: "text", nullable: false),
                    PriorDistribution = table.Column<string>(type: "text", nullable: false),
                    PriorParameters = table.Column<string>(type: "text", nullable: false),
                    ObservedData = table.Column<string>(type: "text", nullable: false),
                    PosteriorMean = table.Column<double>(type: "double precision", nullable: false),
                    PosteriorStd = table.Column<double>(type: "double precision", nullable: false),
                    CredibleInterval95 = table.Column<string>(type: "text", nullable: false),
                    SampleSize = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BayesianAnalyses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CamaCharacteristics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    BuildingType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    BuildingTypeDescription = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Region = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    SquareFeet = table.Column<decimal>(type: "numeric", nullable: false),
                    Stories = table.Column<decimal>(type: "numeric", nullable: true),
                    BasementSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    GarageSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    QualityGrade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ConditionGrade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ComplexityGrade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ExteriorWall = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    RoofType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Foundation = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    HvacType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    InteriorFinish = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    YearBuilt = table.Column<int>(type: "integer", nullable: true),
                    EffectiveAge = table.Column<int>(type: "integer", nullable: true),
                    EconomicLife = table.Column<int>(type: "integer", nullable: true),
                    LandAreaSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    LandZone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    LandAdjustmentFactor = table.Column<decimal>(type: "numeric", nullable: true),
                    Bedrooms = table.Column<int>(type: "integer", nullable: true),
                    Bathrooms = table.Column<int>(type: "integer", nullable: true),
                    Fireplaces = table.Column<int>(type: "integer", nullable: true),
                    HasPool = table.Column<bool>(type: "boolean", nullable: true),
                    FunctionalObsolescence = table.Column<decimal>(type: "numeric", nullable: true),
                    ExternalObsolescence = table.Column<decimal>(type: "numeric", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CamaCharacteristics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CamaCharacteristics_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CertificationSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    StepCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CompletedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    DependsOnStepId = table.Column<Guid>(type: "uuid", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificationSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificationSteps_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClerkDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordingNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Grantor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Grantee = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Consideration = table.Column<decimal>(type: "numeric", nullable: false),
                    Fees = table.Column<decimal>(type: "numeric", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClerkDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClerkDocuments_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClerkLiens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LienType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LienHolder = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReleasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReleaseReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClerkLiens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClerkLiens_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ComparableSales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SalePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    PropertyType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Neighborhood = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    GrossLivingArea = table.Column<decimal>(type: "numeric", nullable: true),
                    LotSizeSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    YearBuilt = table.Column<int>(type: "integer", nullable: true),
                    Bedrooms = table.Column<int>(type: "integer", nullable: true),
                    Bathrooms = table.Column<int>(type: "integer", nullable: true),
                    Condition = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    QualityGrade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SaleQualification = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    VerificationSource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    IngestedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IngestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComparableSales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComparableSales_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CostMatrices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    MatrixType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BaseRate = table.Column<decimal>(type: "numeric", nullable: false),
                    Multiplier = table.Column<decimal>(type: "numeric", nullable: false),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BuildingType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    BuildingTypeDescription = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BaseCost = table.Column<decimal>(type: "numeric", nullable: false),
                    MatrixYear = table.Column<int>(type: "integer", nullable: false),
                    SourceMatrixId = table.Column<int>(type: "integer", nullable: false),
                    MatrixDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DataPoints = table.Column<int>(type: "integer", nullable: false),
                    MinCost = table.Column<decimal>(type: "numeric", nullable: false),
                    MaxCost = table.Column<decimal>(type: "numeric", nullable: false),
                    County = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    State = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    AdjustmentFactors = table.Column<string>(type: "text", nullable: false),
                    CostPerSqFt = table.Column<decimal>(type: "numeric", nullable: false),
                    AdjustmentFactor = table.Column<decimal>(type: "numeric", nullable: false),
                    Grade = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    YearBuilt = table.Column<int>(type: "integer", nullable: true),
                    DepreciationRate = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostMatrices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DataQualityAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Scope = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TotalRecords = table.Column<int>(type: "integer", nullable: false),
                    CompleteRecords = table.Column<int>(type: "integer", nullable: false),
                    CompletenessScore = table.Column<double>(type: "double precision", nullable: false),
                    ConsistentRecords = table.Column<int>(type: "integer", nullable: false),
                    ConsistencyScore = table.Column<double>(type: "double precision", nullable: false),
                    TimelyRecords = table.Column<int>(type: "integer", nullable: false),
                    TimelinessScore = table.Column<double>(type: "double precision", nullable: false),
                    AccurateRecords = table.Column<int>(type: "integer", nullable: false),
                    AccuracyScore = table.Column<double>(type: "double precision", nullable: false),
                    OverallScore = table.Column<double>(type: "double precision", nullable: false),
                    Grade = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    IssueCount = table.Column<int>(type: "integer", nullable: false),
                    Issues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataQualityAssessments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DelinquencyRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AmountOverdue = table.Column<decimal>(type: "numeric", nullable: false),
                    OldestDelinquentYear = table.Column<int>(type: "integer", nullable: false),
                    IsDelinquent = table.Column<bool>(type: "boolean", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DelinquencyRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DelinquencyRecords_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DossierDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RetentionClass = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EntersCustodyChain = table.Column<bool>(type: "boolean", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierDocuments_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DossierNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    NoteType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierNotes_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DossierPackets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PacketType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CompletenessPercent = table.Column<double>(type: "double precision", nullable: false),
                    SatisfiedCount = table.Column<int>(type: "integer", nullable: false),
                    TotalRequired = table.Column<int>(type: "integer", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierPackets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierPackets_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EtlSyncJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TotalRecords = table.Column<int>(type: "integer", nullable: false),
                    ProcessedRecords = table.Column<int>(type: "integer", nullable: false),
                    FailedRecords = table.Column<int>(type: "integer", nullable: false),
                    SkippedRecords = table.Column<int>(type: "integer", nullable: false),
                    DurationMs = table.Column<long>(type: "bigint", nullable: false),
                    RecordsPerSecond = table.Column<double>(type: "double precision", nullable: false),
                    Errors = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Watermark = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EtlSyncJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Exemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProgramCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ApplicantName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ApplicationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExemptionAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    RcwReference = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DenialReason = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exemptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Exemptions_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InstallmentPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NumberOfPayments = table.Column<int>(type: "integer", nullable: false),
                    MonthlyAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstallmentPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InstallmentPlans_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LevyCertifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    DistrictCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DistrictName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    PriorYearLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RequestedLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CertifiedLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AssessedValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NewConstructionValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AnnexationValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LevyRate = table.Column<double>(type: "double precision", nullable: false),
                    StatutoryLimit = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ConstitutionalLimit = table.Column<double>(type: "double precision", nullable: false),
                    AggregateLimit = table.Column<double>(type: "double precision", nullable: false),
                    WithinConstitutionalLimit = table.Column<bool>(type: "boolean", nullable: false),
                    WithinAggregateLimit = table.Column<bool>(type: "boolean", nullable: false),
                    WasReduced = table.Column<bool>(type: "boolean", nullable: false),
                    ReductionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevyCertifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketAnalyses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnalysisType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MarketAreaName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ParcelIds = table.Column<string>(type: "text", nullable: false),
                    SampleSize = table.Column<int>(type: "integer", nullable: false),
                    MedianSalePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    MeanSalePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    MedianPricePerSqft = table.Column<decimal>(type: "numeric", nullable: false),
                    CoefficientOfDispersion = table.Column<double>(type: "double precision", nullable: false),
                    PriceRelatedDifferential = table.Column<double>(type: "double precision", nullable: false),
                    MedianRatio = table.Column<double>(type: "double precision", nullable: false),
                    TimeTrendCoefficient = table.Column<double>(type: "double precision", nullable: false),
                    TimeTrendRSquared = table.Column<double>(type: "double precision", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MarketAreaBoundary = table.Column<string>(type: "text", nullable: false),
                    ComparableSummary = table.Column<string>(type: "text", nullable: false),
                    AdditionalMetrics = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketAnalyses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MlPredictions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ModelType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ModelVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PredictedValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    ModelAccuracy = table.Column<double>(type: "double precision", nullable: false),
                    MeanAbsoluteError = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RootMeanSquaredError = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FeatureCount = table.Column<int>(type: "integer", nullable: false),
                    TrainingSamples = table.Column<int>(type: "integer", nullable: false),
                    InferenceTimeMs = table.Column<long>(type: "bigint", nullable: false),
                    InputFeatures = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FeatureImportances = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MlPredictions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MonteCarloSimulations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SimulationName = table.Column<string>(type: "text", nullable: false),
                    Iterations = table.Column<int>(type: "integer", nullable: false),
                    InputDistributions = table.Column<string>(type: "text", nullable: false),
                    ResultMean = table.Column<double>(type: "double precision", nullable: false),
                    ResultMedian = table.Column<double>(type: "double precision", nullable: false),
                    ResultStd = table.Column<double>(type: "double precision", nullable: false),
                    Percentile5 = table.Column<double>(type: "double precision", nullable: false),
                    Percentile25 = table.Column<double>(type: "double precision", nullable: false),
                    Percentile75 = table.Column<double>(type: "double precision", nullable: false),
                    Percentile95 = table.Column<double>(type: "double precision", nullable: false),
                    HistogramBins = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonteCarloSimulations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TemplateId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DeliveryMethod = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Fields = table.Column<string>(type: "text", nullable: true),
                    RcwReference = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notices_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QueueItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaskType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AssignedTo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SlaHours = table.Column<int>(type: "integer", nullable: true),
                    SlaDeadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueueItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QueueItems_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RcwCalculations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Statute = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CurrentUseClassification = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MarketValue = table.Column<decimal>(type: "numeric", nullable: false),
                    ReducedValue = table.Column<decimal>(type: "numeric", nullable: false),
                    ExemptionAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    TaxSavings = table.Column<decimal>(type: "numeric", nullable: false),
                    LevyRate = table.Column<double>(type: "double precision", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    Income = table.Column<decimal>(type: "numeric", nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    Qualifies = table.Column<bool>(type: "boolean", nullable: false),
                    DisqualificationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RcwCalculations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RegressionAnalyses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelIds = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    DependentVariable = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IndependentVariables = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Coefficients = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Intercept = table.Column<double>(type: "double precision", nullable: false),
                    RSquared = table.Column<double>(type: "double precision", nullable: false),
                    AdjustedRSquared = table.Column<double>(type: "double precision", nullable: false),
                    FStatistic = table.Column<double>(type: "double precision", nullable: false),
                    PValue = table.Column<double>(type: "double precision", nullable: false),
                    StandardErrors = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ResidualDiagnostics = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    SampleSize = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegressionAnalyses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SpatialAnalyses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnalysisType = table.Column<string>(type: "text", nullable: false),
                    VariableName = table.Column<string>(type: "text", nullable: false),
                    WeightMatrixType = table.Column<string>(type: "text", nullable: false),
                    StatisticValue = table.Column<double>(type: "double precision", nullable: false),
                    ExpectedValue = table.Column<double>(type: "double precision", nullable: false),
                    Variance = table.Column<double>(type: "double precision", nullable: false),
                    ZScore = table.Column<double>(type: "double precision", nullable: false),
                    PValue = table.Column<double>(type: "double precision", nullable: false),
                    SampleSize = table.Column<int>(type: "integer", nullable: false),
                    LocalIndicators = table.Column<string>(type: "text", nullable: false),
                    ClusterMap = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpatialAnalyses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaxSales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalOwed = table.Column<decimal>(type: "numeric", nullable: false),
                    DelinquentYears = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxSales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxSales_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaxStatements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    TotalDue = table.Column<decimal>(type: "numeric", nullable: false),
                    Paid = table.Column<decimal>(type: "numeric", nullable: false),
                    Balance = table.Column<decimal>(type: "numeric", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxStatements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxStatements_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ValuationPipelines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    PipelineName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    TotalParcels = table.Column<int>(type: "integer", nullable: false),
                    CompletedParcels = table.Column<int>(type: "integer", nullable: false),
                    FailedParcels = table.Column<int>(type: "integer", nullable: false),
                    InProgressParcels = table.Column<int>(type: "integer", nullable: false),
                    CurrentStage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DurationMs = table.Column<long>(type: "bigint", nullable: false),
                    AvgValueChangePercent = table.Column<double>(type: "double precision", nullable: false),
                    MedianValueChangePercent = table.Column<double>(type: "double precision", nullable: false),
                    CoefficientOfDispersion = table.Column<double>(type: "double precision", nullable: false),
                    PriceRelatedDifferential = table.Column<double>(type: "double precision", nullable: false),
                    StageDetails = table.Column<string>(type: "text", nullable: true),
                    Errors = table.Column<string>(type: "text", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValuationPipelines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ValuationRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    PropertyType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CostApproachValue = table.Column<decimal>(type: "numeric", nullable: true),
                    CostConfidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BuildingType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Region = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    SquareFeet = table.Column<decimal>(type: "numeric", nullable: true),
                    Rcn = table.Column<decimal>(type: "numeric", nullable: true),
                    DepreciationPercent = table.Column<decimal>(type: "numeric", nullable: true),
                    Rcnld = table.Column<decimal>(type: "numeric", nullable: true),
                    LandValue = table.Column<decimal>(type: "numeric", nullable: true),
                    SiteImprovementValue = table.Column<decimal>(type: "numeric", nullable: true),
                    IncomeApproachValue = table.Column<decimal>(type: "numeric", nullable: true),
                    IncomeConfidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    GrossIncome = table.Column<decimal>(type: "numeric", nullable: true),
                    VacancyRate = table.Column<decimal>(type: "numeric", nullable: true),
                    OperatingExpenses = table.Column<decimal>(type: "numeric", nullable: true),
                    NetOperatingIncome = table.Column<decimal>(type: "numeric", nullable: true),
                    CapRate = table.Column<decimal>(type: "numeric", nullable: true),
                    SalesComparisonValue = table.Column<decimal>(type: "numeric", nullable: true),
                    SalesConfidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ComparableCount = table.Column<int>(type: "integer", nullable: true),
                    MedianAdjustedPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    FinalReconciledValue = table.Column<decimal>(type: "numeric", nullable: true),
                    Spread = table.Column<decimal>(type: "numeric", nullable: true),
                    OverallConfidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValuationRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ValuationRecords_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TitleChainEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FromParty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ToParty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TransferDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TitleChainEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TitleChainEntries_ClerkDocuments_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "ClerkDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TitleChainEntries_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DossierEvidenceItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EvidenceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Integrity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierEvidenceItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierEvidenceItems_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DossierEvidenceItems_DossierDocuments_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "DossierDocuments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DossierPacketItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PacketId = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Required = table.Column<bool>(type: "boolean", nullable: false),
                    Satisfied = table.Column<bool>(type: "boolean", nullable: false),
                    SatisfiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierPacketItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierPacketItems_DossierDocuments_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "DossierDocuments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DossierPacketItems_DossierPackets_PacketId",
                        column: x => x.PacketId,
                        principalTable: "DossierPackets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaxPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiptId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    StatementId = table.Column<Guid>(type: "uuid", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxPayments_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaxPayments_TaxStatements_StatementId",
                        column: x => x.StatementId,
                        principalTable: "TaxStatements",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DossierCustodyEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EvidenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Actor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierCustodyEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierCustodyEvents_DossierEvidenceItems_EvidenceId",
                        column: x => x.EvidenceId,
                        principalTable: "DossierEvidenceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appeals_CountyId",
                table: "Appeals",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditFindings_CountyId_ParcelId",
                table: "AuditFindings",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditFindings_CountyId_TaxYear",
                table: "AuditFindings",
                columns: new[] { "CountyId", "TaxYear" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditReconciliations_CountyId_TaxYear",
                table: "AuditReconciliations",
                columns: new[] { "CountyId", "TaxYear" });

            migrationBuilder.CreateIndex(
                name: "IX_CamaCharacteristics_CountyId_ParcelId_TaxYear",
                table: "CamaCharacteristics",
                columns: new[] { "CountyId", "ParcelId", "TaxYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CertificationSteps_CountyId",
                table: "CertificationSteps",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_ClerkDocuments_CountyId_ParcelId",
                table: "ClerkDocuments",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_ClerkDocuments_CountyId_RecordingNumber",
                table: "ClerkDocuments",
                columns: new[] { "CountyId", "RecordingNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClerkLiens_CountyId_ParcelId",
                table: "ClerkLiens",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_ComparableSales_CountyId_Neighborhood",
                table: "ComparableSales",
                columns: new[] { "CountyId", "Neighborhood" });

            migrationBuilder.CreateIndex(
                name: "IX_ComparableSales_CountyId_ParcelId",
                table: "ComparableSales",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_ComparableSales_CountyId_PropertyType_SaleDate",
                table: "ComparableSales",
                columns: new[] { "CountyId", "PropertyType", "SaleDate" });

            migrationBuilder.CreateIndex(
                name: "IX_CostMatrices_CountyId_BuildingType_Region_MatrixYear",
                table: "CostMatrices",
                columns: new[] { "CountyId", "BuildingType", "Region", "MatrixYear" });

            migrationBuilder.CreateIndex(
                name: "IX_DelinquencyRecords_CountyId_ParcelId",
                table: "DelinquencyRecords",
                columns: new[] { "CountyId", "ParcelId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DossierCustodyEvents_EvidenceId",
                table: "DossierCustodyEvents",
                column: "EvidenceId");

            migrationBuilder.CreateIndex(
                name: "IX_DossierDocuments_CountyId_DocumentType",
                table: "DossierDocuments",
                columns: new[] { "CountyId", "DocumentType" });

            migrationBuilder.CreateIndex(
                name: "IX_DossierDocuments_CountyId_ParcelId",
                table: "DossierDocuments",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_DossierEvidenceItems_CountyId_ParcelId",
                table: "DossierEvidenceItems",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_DossierEvidenceItems_DocumentId",
                table: "DossierEvidenceItems",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DossierNotes_CountyId_ParcelId",
                table: "DossierNotes",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_DossierPacketItems_DocumentId",
                table: "DossierPacketItems",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DossierPacketItems_PacketId",
                table: "DossierPacketItems",
                column: "PacketId");

            migrationBuilder.CreateIndex(
                name: "IX_DossierPackets_CountyId_ParcelId",
                table: "DossierPackets",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_Exemptions_CountyId",
                table: "Exemptions",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_InstallmentPlans_CountyId_ParcelId",
                table: "InstallmentPlans",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_Notices_CountyId",
                table: "Notices",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_CountyId",
                table: "QueueItems",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxPayments_CountyId_ParcelId",
                table: "TaxPayments",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_TaxPayments_CountyId_ReceiptId",
                table: "TaxPayments",
                columns: new[] { "CountyId", "ReceiptId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxPayments_StatementId",
                table: "TaxPayments",
                column: "StatementId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxSales_CountyId_ParcelId",
                table: "TaxSales",
                columns: new[] { "CountyId", "ParcelId" });

            migrationBuilder.CreateIndex(
                name: "IX_TaxStatements_CountyId_ParcelId_TaxYear",
                table: "TaxStatements",
                columns: new[] { "CountyId", "ParcelId", "TaxYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TitleChainEntries_CountyId_ParcelId_TransferDate",
                table: "TitleChainEntries",
                columns: new[] { "CountyId", "ParcelId", "TransferDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TitleChainEntries_DocumentId",
                table: "TitleChainEntries",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_ValuationRecords_CountyId_ParcelId_TaxYear",
                table: "ValuationRecords",
                columns: new[] { "CountyId", "ParcelId", "TaxYear" });

            migrationBuilder.CreateIndex(
                name: "IX_ValuationRecords_CountyId_Status",
                table: "ValuationRecords",
                columns: new[] { "CountyId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Appeals");

            migrationBuilder.DropTable(
                name: "AuditFindings");

            migrationBuilder.DropTable(
                name: "AuditReconciliations");

            migrationBuilder.DropTable(
                name: "BayesianAnalyses");

            migrationBuilder.DropTable(
                name: "CamaCharacteristics");

            migrationBuilder.DropTable(
                name: "CertificationSteps");

            migrationBuilder.DropTable(
                name: "ClerkLiens");

            migrationBuilder.DropTable(
                name: "ComparableSales");

            migrationBuilder.DropTable(
                name: "CostMatrices");

            migrationBuilder.DropTable(
                name: "DataQualityAssessments");

            migrationBuilder.DropTable(
                name: "DelinquencyRecords");

            migrationBuilder.DropTable(
                name: "DossierCustodyEvents");

            migrationBuilder.DropTable(
                name: "DossierNotes");

            migrationBuilder.DropTable(
                name: "DossierPacketItems");

            migrationBuilder.DropTable(
                name: "EtlSyncJobs");

            migrationBuilder.DropTable(
                name: "Exemptions");

            migrationBuilder.DropTable(
                name: "InstallmentPlans");

            migrationBuilder.DropTable(
                name: "LevyCertifications");

            migrationBuilder.DropTable(
                name: "MarketAnalyses");

            migrationBuilder.DropTable(
                name: "MlPredictions");

            migrationBuilder.DropTable(
                name: "MonteCarloSimulations");

            migrationBuilder.DropTable(
                name: "Notices");

            migrationBuilder.DropTable(
                name: "QueueItems");

            migrationBuilder.DropTable(
                name: "RcwCalculations");

            migrationBuilder.DropTable(
                name: "RegressionAnalyses");

            migrationBuilder.DropTable(
                name: "SpatialAnalyses");

            migrationBuilder.DropTable(
                name: "TaxPayments");

            migrationBuilder.DropTable(
                name: "TaxSales");

            migrationBuilder.DropTable(
                name: "TitleChainEntries");

            migrationBuilder.DropTable(
                name: "ValuationPipelines");

            migrationBuilder.DropTable(
                name: "ValuationRecords");

            migrationBuilder.DropTable(
                name: "DossierEvidenceItems");

            migrationBuilder.DropTable(
                name: "DossierPackets");

            migrationBuilder.DropTable(
                name: "TaxStatements");

            migrationBuilder.DropTable(
                name: "ClerkDocuments");

            migrationBuilder.DropTable(
                name: "DossierDocuments");
        }
    }
}
