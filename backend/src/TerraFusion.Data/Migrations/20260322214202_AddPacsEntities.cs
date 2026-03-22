using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPacsEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PacsParcel",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropTypeCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    GeoId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SimpleGeoId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    StateCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Zoning = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Topography = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Utilities = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RoadAccess = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PropCmnt = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                    PropCreateDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PacsParcel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PacsParcel_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PilotDrafts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "text", nullable: false),
                    ProposedBy = table.Column<string>(type: "text", nullable: false),
                    ActionSummary = table.Column<string>(type: "text", nullable: false),
                    ActionPayloadJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    HumanApproverId = table.Column<string>(type: "text", nullable: true),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PilotDrafts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pacs_appeals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<decimal>(type: "numeric", nullable: false),
                    PacsCaseId = table.Column<int>(type: "integer", nullable: false),
                    ProtType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ProtStatus = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    StatusDateChanged = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompleteDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FullRatificationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AppraisalStaff = table.Column<int>(type: "integer", nullable: true),
                    HearingAppraisalStaff = table.Column<int>(type: "integer", nullable: true),
                    AssignedPanel = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    HearingStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HearingFinishedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ArrivedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HearingRescheduled = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    FullBoardHearing = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    AppraiserMeetingDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AppraiserMeetingAppraiserId = table.Column<int>(type: "integer", nullable: true),
                    AppraiserMeetingAppraiserComments = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    AppraiserMeetingTaxpayerComments = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    TaxpayerDocRequested = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    TaxpayerEvidenceRequested = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    TaxpayerEvidenceDeliveredDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FirstMotion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FirstMotionDecisionCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    FirstMotionDecisionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FirstMotionPass = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    SecondMotion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SecondMotionDecisionCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SecondMotionDecisionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SecondMotionPass = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    OtherMotion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DecisionReasonCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SustainDistrictVal = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    ProtValType = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    ProtComments = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    TaxpayerComments = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    DistrictComments = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    ArbInstructions = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AppraiserAssignedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbAssignedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AppraiserAssignedLandVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AppraiserAssignedImprvVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BoeAssignedLandVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BoeAssignedImprvVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    OpinionOfValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginAppraisedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginAssessedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginLandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginLandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginAgUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginAgMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginTimberUse = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginTimberMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginTenPercentCap = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BeginExemptions = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BeginEntities = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FinalMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalAppraisedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalAssessedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalLandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalLandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalAgUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalAgMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalTimberUse = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalTimberMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalTenPercentCap = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FinalExemptions = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FinalEntities = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HighlyDisputedProperty = table.Column<bool>(type: "boolean", nullable: true),
                    TaxesPaid = table.Column<bool>(type: "boolean", nullable: true),
                    CasePrepared = table.Column<bool>(type: "boolean", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_appeals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_appeals_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_exemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PacsOwnerId = table.Column<int>(type: "integer", nullable: false),
                    ExemptTaxYear = table.Column<decimal>(type: "numeric", nullable: false),
                    OwnerTaxYear = table.Column<decimal>(type: "numeric", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    PropTypeCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ExemptTypeCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ExemptSubtypeCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ApplicantName = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TerminationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EffectiveTaxYear = table.Column<decimal>(type: "numeric", nullable: true),
                    QualifyYear = table.Column<decimal>(type: "numeric", nullable: true),
                    ReviewLastYear = table.Column<decimal>(type: "numeric", nullable: true),
                    ApplyPctOwner = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    ExemptionPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    CombinedDispIncome = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    SpValueType = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    SpValueOption = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    SpDateApproved = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SpExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SpComment = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    AbsentFlag = table.Column<bool>(type: "boolean", nullable: true),
                    AbsentExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AbsentComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    DeferralDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExemptQualifyCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ReviewRequestDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewStatusCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ApplyNoExemptionAmount = table.Column<bool>(type: "boolean", nullable: true),
                    ApplyLocalOptionPctOnly = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_exemptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_exemptions_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_improvements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    PacsImprvId = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    ImprvTypeCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ImprvStateCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ImprvDesc = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    MiscCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    PrimaryImprv = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    ImprvHomesite = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    NumImprv = table.Column<int>(type: "integer", nullable: true),
                    BuildingNumber = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: true),
                    BuildingName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ImprvVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    OriginalVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BaseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CalcVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AdjustedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FlatVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    DistVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LockedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LivingAreaUp = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvAdjAmt = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvAdjFactor = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvMassAdjFactor = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ValueType = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    ImprvValSource = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    ImpNewYear = table.Column<decimal>(type: "numeric", nullable: true),
                    ImpNewVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImpNewPc = table.Column<decimal>(type: "numeric", nullable: true),
                    EconomicPct = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    PhysicalPct = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    FunctionalPct = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    DepPct = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    EconomicComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PhysicalComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FunctionalComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    DepComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ActualYearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    EffectiveYearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    PercentComplete = table.Column<decimal>(type: "numeric", nullable: true),
                    PercentCompleteComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PrimaryUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SecondaryUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Stories = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    HsPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PermanentCropLandAcres = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    PermanentCropPlantedAcres = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    MobileHomeMake = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeSerialNum = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeSerialNum2 = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeSerialNum3 = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeHudNum = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeHudNum2 = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeHudNum3 = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeTitleNum = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeYear = table.Column<decimal>(type: "numeric", nullable: true),
                    MobileHomeTipOut = table.Column<decimal>(type: "numeric", nullable: true),
                    ImprvImageUrl = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ImprvComment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_improvements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_improvements_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_land_details",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    PacsLandSegId = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    LandTypeCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LandSegDesc = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    StateCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    LandSegHomesite = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    LandClassCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    LandInfluenceCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LandSoilCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    AgLandTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LandAdjTypeCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    AppraisalCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    PrimaryUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SubUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    TypeSchedule = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SizeAcres = table.Column<decimal>(type: "numeric(12,4)", nullable: true),
                    SizeSquareFeet = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                    SizeUseableAcres = table.Column<decimal>(type: "numeric(12,4)", nullable: true),
                    SizeUseableSquareFeet = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                    EffSizeAcres = table.Column<decimal>(type: "numeric(12,4)", nullable: true),
                    EffectiveFront = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    EffectiveDepth = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    WidthFront = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    WidthBack = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    DepthRight = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    DepthLeft = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    WaterfrontFootage = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    NumLots = table.Column<decimal>(type: "numeric", nullable: true),
                    MktUnitPrice = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    LandSegMktVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktCalcVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktAdjVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktFlatVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktValSource = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    LandSegOrigVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandSegUp = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    LandAdjFactor = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    LandAdjAmt = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandMassAdjFactor = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    OaMktVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NonTaxedMktVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    DistVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgUseCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    AgUnitPrice = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    AgApply = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    AgVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgCalcVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgAdjVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgFlatVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgValType = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    AgValSource = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    AgLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgEffTaxYear = table.Column<decimal>(type: "numeric", nullable: true),
                    AgApplyYear = table.Column<decimal>(type: "numeric", nullable: true),
                    AgTimberConvDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OaAgVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Timber78Val = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Timber78ValPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    HsPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    NewConstructionFlag = table.Column<bool>(type: "boolean", nullable: true),
                    NewConstructionValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandNewVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ApplicationNumber = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    RecordingNumber = table.Column<string>(type: "character varying(23)", maxLength: 23, nullable: true),
                    AssessmentYrQualified = table.Column<decimal>(type: "numeric", nullable: true),
                    CurrentUseEffectiveAcres = table.Column<decimal>(type: "numeric(12,4)", nullable: true),
                    EffectiveTaxYear = table.Column<decimal>(type: "numeric", nullable: true),
                    MiscValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgPbrsPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    LockedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LockedAgUseCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    LandSegComment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_land_details", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_land_details_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_owners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PacsOwnerId = table.Column<int>(type: "integer", nullable: false),
                    OwnerTaxYear = table.Column<decimal>(type: "numeric", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    FileAsName = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    FirstName = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    LastName = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    PctOwnership = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    TypeOfInterest = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    HsProp = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    Over65Defer = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    AgAppFiled = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    PctImprvHs = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctImprvNhs = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctLandHs = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctLandNhs = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctAgUse = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctAgMkt = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctTimUse = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctTimMkt = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PctPersProp = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    OwnerComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LinkedCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_owners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_owners_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_property_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    ClassCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    StateCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    PropertyUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ImprvTypeCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ImprvDetSubClassCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    NumImprv = table.Column<int>(type: "integer", nullable: true),
                    YearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    ActualYearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    EffectiveYearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    ActualAge = table.Column<int>(type: "integer", nullable: true),
                    LivingArea = table.Column<decimal>(type: "numeric", nullable: true),
                    ConditionCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    PercentComplete = table.Column<decimal>(type: "numeric", nullable: true),
                    HeatAcCode = table.Column<string>(type: "character varying(75)", maxLength: 75, nullable: true),
                    ClassCdHighValueImprv = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LivingAreaHighValueImprv = table.Column<decimal>(type: "numeric", nullable: true),
                    ImprvUnitPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    ImprvAddVal = table.Column<decimal>(type: "numeric", nullable: true),
                    AppraisedVal = table.Column<decimal>(type: "numeric", nullable: true),
                    LandTypeCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LandSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    LandAcres = table.Column<decimal>(type: "numeric", nullable: true),
                    LandTotalAcres = table.Column<decimal>(type: "numeric", nullable: true),
                    LandUseableAcres = table.Column<decimal>(type: "numeric", nullable: true),
                    LandUseableSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    LandFrontFeet = table.Column<decimal>(type: "numeric", nullable: true),
                    LandDepth = table.Column<decimal>(type: "numeric", nullable: true),
                    LandNumLots = table.Column<decimal>(type: "numeric", nullable: true),
                    LandTotalSqft = table.Column<decimal>(type: "numeric", nullable: true),
                    LandUnitPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    MainLandUnitPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    MainLandTotalAdj = table.Column<decimal>(type: "numeric", nullable: true),
                    LandApprMethod = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    LsTable = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: true),
                    SizeAdjPct = table.Column<decimal>(type: "numeric", nullable: true),
                    NeighborhoodCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RegionCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    AbsSubdv = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SubsetCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    MapId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SubMarketCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Zoning = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CharacteristicZoning1 = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CharacteristicZoning2 = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CharacteristicView = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    VisibilityAccessCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RoadAccess = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Utilities = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Topography = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SchoolId = table.Column<int>(type: "integer", nullable: true),
                    CityId = table.Column<int>(type: "integer", nullable: true),
                    LastAppraisalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MobileHomeMake = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeSerialNum = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeHudNum = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MobileHomeTitleNum = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_property_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_property_profiles_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsChgOfOwnerId = table.Column<int>(type: "integer", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    SeqNum = table.Column<int>(type: "integer", nullable: false),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AdjustedSalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ListingPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ListingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SaleTypeCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SaleStateCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SaleClassCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SaleLandTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SaleRatioTypeCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SaleRatioCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SaleCountyRatioCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SaleQualifier = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SaleAdjCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SaleFinancingCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SalesExcludeCalcCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    PrimaryUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SecondaryUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SaleImprTypeCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SlSubClassCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SaleRatio = table.Column<decimal>(type: "numeric(8,4)", nullable: true),
                    SaleAdjSlPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    SaleAdjSlAmt = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    SaleAdjReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SaleRatioCdReason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SuppressOnRatioRptCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SuppressOnRatioReason = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Realtor = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    GrantorName = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    GranteeName = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    FinanceComment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AmtDown = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AmtFinanced = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    InterestRate = table.Column<decimal>(type: "numeric(6,4)", nullable: true),
                    FinanceYears = table.Column<decimal>(type: "numeric", nullable: true),
                    AmtFinanced2 = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    InterestRate2 = table.Column<decimal>(type: "numeric(6,4)", nullable: true),
                    FinanceYears2 = table.Column<decimal>(type: "numeric", nullable: true),
                    SlYearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    SlLivingArea = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    SlImprvUnitPrice = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    SlLandSqft = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                    SlLandAcres = table.Column<decimal>(type: "numeric(12,4)", nullable: true),
                    SlLandFrontFeet = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    SlLandDepth = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    SlLandUnitPrice = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    AppraisedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Market = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MonthlyIncome = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AnnualIncome = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PersPropertyVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ExemptionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NumDaysOnMarket = table.Column<decimal>(type: "numeric", nullable: true),
                    LandOnlySale = table.Column<bool>(type: "boolean", nullable: true),
                    ContinueCurrentUse = table.Column<bool>(type: "boolean", nullable: true),
                    ConfidentialSale = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    WacCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    SaleComment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImportDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_sales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_sales_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_situs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PacsSitusId = table.Column<int>(type: "integer", nullable: false),
                    PrimaryFlag = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    StreetNum = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    StreetPrefix = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    StreetName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    StreetSuffix = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    UnitNum = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    City = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    State = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    Zip = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SitusDisplay = table.Column<string>(type: "character varying(173)", maxLength: 173, nullable: true),
                    BuildingNum = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    SubNum = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_situs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_situs_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_tax_areas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYear = table.Column<decimal>(type: "numeric", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    PacsTaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaNumber = table.Column<string>(type: "character varying(23)", maxLength: 23, nullable: true),
                    TaxAreaState = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TaxAreaDescription = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Comment = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    TaxAreaIdPending = table.Column<int>(type: "integer", nullable: true),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsAnnexValue = table.Column<bool>(type: "boolean", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_tax_areas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_tax_areas_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_valuations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    AppraisedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Market = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgLateLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgHsUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgHsMktVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AgHsLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Timber78 = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberUse = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberLateLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberHsUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberHsMktVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TimberHsLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TenPercentCap = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FreezeCeiling = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    FreezeYear = table.Column<decimal>(type: "numeric", nullable: true),
                    HscapQualifyYear = table.Column<decimal>(type: "numeric", nullable: true),
                    HscapBaseYear = table.Column<decimal>(type: "numeric", nullable: true),
                    HscapPrevHsVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    HscapNewHsVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    HscapPrevReapprYear = table.Column<decimal>(type: "numeric", nullable: true),
                    LastAppraisalYear = table.Column<decimal>(type: "numeric", nullable: true),
                    NewVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValHs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValNhs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValImprvHs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValImprvNhs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValLandHs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewValLandNhs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NewYear = table.Column<decimal>(type: "numeric", nullable: true),
                    RemodelValCurrYr = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostLandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostLandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostAgUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostAgMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostAgLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostTimberMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostTimberUse = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CostTimberLoss = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeLandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeLandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncomeImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprLandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MktapprLandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbLandHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbLandNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbImprvHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbImprvNonHstdVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbAgUseVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbAgMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbTimberMarket = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ArbTimberUse = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AbatedPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    AbatedAmt = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AbatedYear = table.Column<decimal>(type: "numeric", nullable: true),
                    TifImprvVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TifLandVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TifFlag = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    RenderedVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    RenderedYear = table.Column<decimal>(type: "numeric", nullable: true),
                    PpFarm = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PpNonFarm = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PpSqFt = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    DorValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NonTaxedMktVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LegalDesc = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LegalDesc2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LegalAcreage = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    EffSizeAcres = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    NeighborhoodCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    AbsSubdvCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RegionCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SubsetCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    MapId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Block = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TractOrLot = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MblHmPark = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MblHmSpace = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TownshipCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TownshipSection = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TownshipQSection = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RangeCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    StateDistrictCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Mapsco = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PropertyUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SecondaryUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    AssessmentUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SubMarketCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    VisibilityAccessCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ApprMethod = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    SubType = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    UrbanGrowthCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    PropState = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    Cycle = table.Column<int>(type: "integer", nullable: true),
                    LastAppraiserId = table.Column<int>(type: "integer", nullable: true),
                    NextAppraiserId = table.Column<int>(type: "integer", nullable: true),
                    ValueAppraiserId = table.Column<int>(type: "integer", nullable: true),
                    LandAppraiserId = table.Column<int>(type: "integer", nullable: true),
                    LastAppraisalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextAppraisalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextAppraisalReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LastActualAppraisalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RecalcDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GisCoordX = table.Column<decimal>(type: "numeric(10,6)", nullable: true),
                    GisCoordY = table.Column<decimal>(type: "numeric(10,6)", nullable: true),
                    OilWells = table.Column<decimal>(type: "numeric", nullable: true),
                    IrrWells = table.Column<decimal>(type: "numeric", nullable: true),
                    IrrAcres = table.Column<decimal>(type: "numeric", nullable: true),
                    IrrCapacity = table.Column<decimal>(type: "numeric", nullable: true),
                    UbiNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TaxRegistration = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BusinessStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BusinessCloseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BusinessSoldDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SupCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SupDesc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SupDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SupAction = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    SupComment = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                    UdiParent = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    UdiParentPropId = table.Column<int>(type: "integer", nullable: true),
                    UdiStatus = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    VitFlag = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    HasLockedValues = table.Column<bool>(type: "boolean", nullable: true),
                    PropInactiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NoticeMailDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ChangeDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_valuations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_valuations_PacsParcel_ParcelId",
                        column: x => x.ParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_improvement_attributes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprovementId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    PacsImprvId = table.Column<int>(type: "integer", nullable: false),
                    PacsImprvDetId = table.Column<int>(type: "integer", nullable: false),
                    PacsImprvAttrId = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    PacsAttrValId = table.Column<int>(type: "integer", nullable: false),
                    AttributeCode = table.Column<string>(type: "character varying(75)", maxLength: 75, nullable: false),
                    AttributeValue = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    AttrUnit = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    AttrUnitPrice = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    AttrFactor = table.Column<decimal>(type: "numeric(10,6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PacsParcelId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_improvement_attributes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_improvement_attributes_PacsParcel_PacsParcelId",
                        column: x => x.PacsParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_pacs_improvement_attributes_pacs_improvements_ImprovementId",
                        column: x => x.ImprovementId,
                        principalTable: "pacs_improvements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pacs_improvement_details",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprovementId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacsPropId = table.Column<int>(type: "integer", nullable: false),
                    PropValYear = table.Column<int>(type: "integer", nullable: false),
                    PacsImprvId = table.Column<int>(type: "integer", nullable: false),
                    PacsImprvDetId = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<int>(type: "integer", nullable: false),
                    SeqNum = table.Column<int>(type: "integer", nullable: true),
                    ImprvDetClassCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ImprvDetMethCd = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ImprvDetTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ImprvDetSubClassCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ImprvDetDesc = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ConditionCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    LeaseClass = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ImprvDetArea = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    ImprvDetAreaType = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    CubicArea = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    CalcArea = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    SketchArea = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    NetRentableArea = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    Perimeter = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    Length = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Width = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Height = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    NumStories = table.Column<int>(type: "integer", nullable: true),
                    NumUnits = table.Column<int>(type: "integer", nullable: true),
                    FloorNumber = table.Column<decimal>(type: "numeric", nullable: true),
                    LoadFactor = table.Column<decimal>(type: "numeric", nullable: true),
                    YearBuilt = table.Column<decimal>(type: "numeric", nullable: true),
                    YearNew = table.Column<decimal>(type: "numeric", nullable: true),
                    DepreciationYear = table.Column<decimal>(type: "numeric", nullable: true),
                    EffectiveTaxYear = table.Column<decimal>(type: "numeric", nullable: true),
                    ActualAge = table.Column<decimal>(type: "numeric", nullable: true),
                    PercentComplete = table.Column<decimal>(type: "numeric", nullable: true),
                    PercentCompleteComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ImprvDetVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetValSource = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    UnitPrice = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    ImprvDetOrigUp = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    ImprvDetOrigVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetAdjFactor = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    ImprvDetAdjAmt = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetCalcVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetAdjVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetFlatVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    DepreciatedReplacementCostNew = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetCostUnitPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetMsVal = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ImprvDetMsUnitPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AddFactor = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    SizeAdjPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    NewValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    EconomicPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PhysicalPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    PhysicalPctSource = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true),
                    FunctionalPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    DepPct = table.Column<decimal>(type: "numeric(5,4)", nullable: true),
                    EconomicComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PhysicalComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FunctionalComment = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SketchCommands = table.Column<string>(type: "character varying(1800)", maxLength: 1800, nullable: true),
                    PermanentCropAcres = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    PermanentCropIrrigationAcres = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    PermanentCropAgeGroup = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    PermanentCropTrellis = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    PermanentCropIrrigationSystemType = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    PermanentCropIrrigationSubClass = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    PermanentCropDensity = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPacsSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PacsParcelId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacs_improvement_details", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pacs_improvement_details_PacsParcel_PacsParcelId",
                        column: x => x.PacsParcelId,
                        principalTable: "PacsParcel",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_pacs_improvement_details_pacs_improvements_ImprovementId",
                        column: x => x.ImprovementId,
                        principalTable: "pacs_improvements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PacsAppeal_HearingDate",
                table: "pacs_appeals",
                column: "HearingStartDate");

            migrationBuilder.CreateIndex(
                name: "IX_PacsAppeal_Natural",
                table: "pacs_appeals",
                columns: new[] { "PacsPropId", "PropValYear", "PacsCaseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsAppeal_ParcelId",
                table: "pacs_appeals",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsAppeal_Status",
                table: "pacs_appeals",
                column: "ProtStatus");

            migrationBuilder.CreateIndex(
                name: "IX_PacsExemption_Natural",
                table: "pacs_exemptions",
                columns: new[] { "PacsPropId", "PacsOwnerId", "ExemptTaxYear", "ExemptTypeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsExemption_ParcelId",
                table: "pacs_exemptions",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsExemption_TypeCode",
                table: "pacs_exemptions",
                column: "ExemptTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_pacs_improvement_attributes_PacsParcelId",
                table: "pacs_improvement_attributes",
                column: "PacsParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprvAttr_Code",
                table: "pacs_improvement_attributes",
                column: "AttributeCode");

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprvAttr_ImprvId",
                table: "pacs_improvement_attributes",
                column: "ImprovementId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprvAttr_Natural",
                table: "pacs_improvement_attributes",
                columns: new[] { "PacsPropId", "PropValYear", "PacsImprvId", "PacsImprvDetId", "PacsImprvAttrId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pacs_improvement_details_PacsParcelId",
                table: "pacs_improvement_details",
                column: "PacsParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprvDet_ImprvId",
                table: "pacs_improvement_details",
                column: "ImprovementId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprvDet_Natural",
                table: "pacs_improvement_details",
                columns: new[] { "PacsPropId", "PropValYear", "PacsImprvId", "PacsImprvDetId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprv_ParcelId",
                table: "pacs_improvements",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsImprv_PropYearId",
                table: "pacs_improvements",
                columns: new[] { "PacsPropId", "PropValYear", "PacsImprvId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsLand_Natural",
                table: "pacs_land_details",
                columns: new[] { "PacsPropId", "PropValYear", "PacsLandSegId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsLand_ParcelId",
                table: "pacs_land_details",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsLand_TypeCode",
                table: "pacs_land_details",
                column: "LandTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_PacsOwner_Name",
                table: "pacs_owners",
                column: "FileAsName");

            migrationBuilder.CreateIndex(
                name: "IX_PacsOwner_Natural",
                table: "pacs_owners",
                columns: new[] { "PacsPropId", "OwnerTaxYear", "PacsOwnerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsOwner_ParcelId",
                table: "pacs_owners",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsPropertyProfile_ParcelId",
                table: "pacs_property_profiles",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsPropertyProfile_PropYear",
                table: "pacs_property_profiles",
                columns: new[] { "PacsPropId", "PropValYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsSale_Date",
                table: "pacs_sales",
                column: "SaleDate");

            migrationBuilder.CreateIndex(
                name: "IX_PacsSale_Natural",
                table: "pacs_sales",
                columns: new[] { "PacsChgOfOwnerId", "PacsPropId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsSale_ParcelId",
                table: "pacs_sales",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsSale_Price",
                table: "pacs_sales",
                column: "SalePrice");

            migrationBuilder.CreateIndex(
                name: "IX_PacsSitus_ParcelId",
                table: "pacs_situs",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsSitus_PropPrimary",
                table: "pacs_situs",
                columns: new[] { "PacsPropId", "PrimaryFlag" });

            migrationBuilder.CreateIndex(
                name: "IX_PacsTaxArea_AreaNumber",
                table: "pacs_tax_areas",
                column: "TaxAreaNumber");

            migrationBuilder.CreateIndex(
                name: "IX_PacsTaxArea_ParcelId",
                table: "pacs_tax_areas",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsTaxArea_PropYear",
                table: "pacs_tax_areas",
                columns: new[] { "PacsPropId", "TaxYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsValuation_Hood",
                table: "pacs_valuations",
                column: "NeighborhoodCode");

            migrationBuilder.CreateIndex(
                name: "IX_PacsValuation_ParcelId",
                table: "pacs_valuations",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_PacsValuation_PropYearSup",
                table: "pacs_valuations",
                columns: new[] { "PacsPropId", "PropValYear", "SupNum" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PacsValuation_UseCode",
                table: "pacs_valuations",
                column: "PropertyUseCd");

            migrationBuilder.CreateIndex(
                name: "IX_PacsParcel_CountyId",
                table: "PacsParcel",
                column: "CountyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pacs_appeals");

            migrationBuilder.DropTable(
                name: "pacs_exemptions");

            migrationBuilder.DropTable(
                name: "pacs_improvement_attributes");

            migrationBuilder.DropTable(
                name: "pacs_improvement_details");

            migrationBuilder.DropTable(
                name: "pacs_land_details");

            migrationBuilder.DropTable(
                name: "pacs_owners");

            migrationBuilder.DropTable(
                name: "pacs_property_profiles");

            migrationBuilder.DropTable(
                name: "pacs_sales");

            migrationBuilder.DropTable(
                name: "pacs_situs");

            migrationBuilder.DropTable(
                name: "pacs_tax_areas");

            migrationBuilder.DropTable(
                name: "pacs_valuations");

            migrationBuilder.DropTable(
                name: "PilotDrafts");

            migrationBuilder.DropTable(
                name: "pacs_improvements");

            migrationBuilder.DropTable(
                name: "PacsParcel");
        }
    }
}
