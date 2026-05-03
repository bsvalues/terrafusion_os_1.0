using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.Doctrine;

/// <summary>
/// H2 — Block-C contract v1 schema-shape regression band.
///
/// <para>Per <c>docs/pacs/block-c-contract-v1.md</c>. This is the
/// teeth on the doctrine freeze. Any silent drift on a frozen
/// shape MUST fail one of these tests.</para>
///
/// <para>To intentionally change a shape: publish
/// <c>docs/pacs/block-c-contract-v2.md</c> (or vN+1), update this
/// test class to match the new contract, and reference both in
/// the commit message. There is no quiet drift path.</para>
///
/// <para>Tests reflect over the EF model rather than asserting raw
/// SQL — they survive provider changes (Postgres / SQLite /
/// InMemory) and only fail when the conceptual schema actually
/// drifts.</para>
/// </summary>
public sealed class BlockCContractV1Tests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public BlockCContractV1Tests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"h2-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    // ───────────────────────────────────────────────────────────────
    // §2.1 — sync_bridge.source_xref shape
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_SourceXref_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(SourceXref));
        et.Should().NotBeNull(
            "Block-C contract v1 §2.1 freezes sync_bridge.source_xref");

        // Single-column primary key on XrefId.
        var pk = et!.FindPrimaryKey();
        pk.Should().NotBeNull();
        pk!.Properties.Should().HaveCount(1);
        pk.Properties[0].Name.Should().Be(nameof(SourceXref.XrefId));

        // Frozen column set.
        et.PropertyNames().Should().Contain(new[]
        {
            nameof(SourceXref.XrefId),
            nameof(SourceXref.TfEntityType),
            nameof(SourceXref.TfEntityId),
            nameof(SourceXref.SourceSystem),
            nameof(SourceXref.SourceDatabase),
            nameof(SourceXref.SourceTable),
            nameof(SourceXref.SourceKeyJson),
            nameof(SourceXref.SourceQueryHash),
            nameof(SourceXref.LoadBatchId),
            nameof(SourceXref.FirstSeenAt),
            nameof(SourceXref.LastSeenAt),
            nameof(SourceXref.ConfidenceScore),
            nameof(SourceXref.IsActive),
        });
    }

    [Fact]
    public void Contract_SourceXref_IsExposedAs_SyncBridgeSourceXrefs_DbSet()
    {
        // The DbSet name is the production-side handle for the
        // table; renaming it is a contract bump.
        var prop = typeof(TerraFusionDbContext).GetProperty(
            "SyncBridgeSourceXrefs",
            BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull(
            "Block-C contract v1 §2.1 names the source_xref DbSet");
        prop!.PropertyType.Should().Be(typeof(DbSet<SourceXref>));
    }

    // ───────────────────────────────────────────────────────────────
    // §2.2 — sync_bridge.promotion_gate_result shape
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_PromotionGateResult_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(PromotionGateResult));
        et.Should().NotBeNull(
            "Block-C contract v1 §2.2 freezes promotion_gate_result");

        var pk = et!.FindPrimaryKey();
        pk.Should().NotBeNull();
        pk!.Properties.Should().HaveCount(1);
        pk.Properties[0].Name.Should().Be(
            nameof(PromotionGateResult.GateResultId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(PromotionGateResult.GateResultId),
            nameof(PromotionGateResult.LoadBatchId),
            nameof(PromotionGateResult.GateName),
            nameof(PromotionGateResult.GateStage),
            nameof(PromotionGateResult.Status),
            nameof(PromotionGateResult.Expected),
            nameof(PromotionGateResult.Actual),
            nameof(PromotionGateResult.Detail),
            nameof(PromotionGateResult.ExecutedAt),
        });
    }

    [Theory]
    [InlineData("SOURCE_TO_RAW")]
    [InlineData("RAW_TO_TRUTH")]
    [InlineData("TRUTH_TO_CANONICAL")]
    [InlineData("CANONICAL_TO_PRODUCT")]
    [InlineData("ARCH")]
    public async System.Threading.Tasks.Task Contract_PromotionGateResult_Accepts_FrozenGateStageVocabulary(string stage)
    {
        // Closed vocabulary per §2.2. These five strings are the
        // entire frozen stage set; adding a sixth requires a v2
        // contract bump.
        var batch = await SeedCompletedBatchAsync();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch,
            GateName = $"contract-test-{stage}",
            GateStage = stage,
            Status = "PASS",
        });
        await _db.SaveChangesAsync();

        var saved = await _db.SyncBridgePromotionGateResults
            .Where(g => g.GateStage == stage)
            .CountAsync();
        saved.Should().Be(1);
    }

    [Theory]
    [InlineData("PASS")]
    [InlineData("FAIL")]
    [InlineData("WARN")]
    [InlineData("SKIP")]
    public async System.Threading.Tasks.Task Contract_PromotionGateResult_Accepts_FrozenStatusVocabulary(string status)
    {
        var batch = await SeedCompletedBatchAsync();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch,
            GateName = $"contract-test-status-{status}",
            GateStage = "ARCH",
            Status = status,
        });
        await _db.SaveChangesAsync();

        var saved = await _db.SyncBridgePromotionGateResults
            .Where(g => g.Status == status)
            .CountAsync();
        saved.Should().Be(1);
    }

    // ───────────────────────────────────────────────────────────────
    // §2.3 — sync_bridge.load_batch shape
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_LoadBatch_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(LoadBatch));
        et.Should().NotBeNull(
            "Block-C contract v1 §2.3 freezes load_batch");

        var pk = et!.FindPrimaryKey();
        pk.Should().NotBeNull();
        pk!.Properties.Should().HaveCount(1);
        pk.Properties[0].Name.Should().Be(nameof(LoadBatch.LoadBatchId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(LoadBatch.LoadBatchId),
            nameof(LoadBatch.SourceFamily),
            nameof(LoadBatch.SourceSystem),
            nameof(LoadBatch.SourceFileOrDatabase),
            nameof(LoadBatch.SourceQueryName),
            nameof(LoadBatch.SourceQueryHash),
            nameof(LoadBatch.RestoreSource),
            nameof(LoadBatch.Operator),
            nameof(LoadBatch.StartedAt),
            nameof(LoadBatch.CompletedAt),
            nameof(LoadBatch.Status),
            nameof(LoadBatch.ProofGateReportPath),
            nameof(LoadBatch.RowsExtracted),
            nameof(LoadBatch.RowsPromoted),
            nameof(LoadBatch.ErrorSummary),
            nameof(LoadBatch.CreatedAt),
        });
    }

    // ───────────────────────────────────────────────────────────────
    // §2.4 — SourceFamilies closed vocabulary
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_SourceFamilies_ContainsBlockCAndDFamilies()
    {
        // PACS-side families that must exist in v1 (drives Block A/B/C
        // ingestion) plus ArcGIS REST reserved for Block D.
        SourceFamilies.All.Should().Contain(SourceFamilies.PacsOltp,
            "Block-C contract v1 §2.4 requires PACS_OLTP");
        SourceFamilies.All.Should().Contain(SourceFamilies.ArcGisRest,
            "Block-C contract v1 §2.4 reserves ARCGIS_REST for Block D");

        // Full v1 closed-vocab set.
        SourceFamilies.All.Should().BeEquivalentTo(new[]
        {
            "PACS_OLTP",
            "PACS_BACKUP",
            "CAMACLOUD",
            "PACS_SPATIAL",
            "PACS_LISTS",
            "PACS_DBPROJECT",
            "PACS_SYNCSERVICE_DB",
            "WEB_INTERNET_BENTON",
            "TAAPPSVR",
            "PROVAL",
            "ASCEND",
            "CIAPS",
            "BENTON_DYNLOADER",
            "ARCGIS_REST",
            "LEGACY_UNKNOWN",
        }, "Block-C contract v1 §2.4 freezes the SourceFamilies vocabulary");
    }

    [Fact]
    public void Contract_SourceFamilies_IsKnown_RejectsUnknown()
    {
        SourceFamilies.IsKnown("PACS_OLTP").Should().BeTrue();
        SourceFamilies.IsKnown("ARCGIS_REST").Should().BeTrue();
        SourceFamilies.IsKnown("NOT_A_FAMILY").Should().BeFalse();
        SourceFamilies.IsKnown(string.Empty).Should().BeFalse();
    }

    // ───────────────────────────────────────────────────────────────
    // §3 — canonical_tf lane shapes
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_TfParcel_IsRegisteredAndKeyed()
    {
        var et = _db.Model.FindEntityType(typeof(TfParcel));
        et.Should().NotBeNull("Block-C contract v1 §3.1 freezes tf_parcel");
        et!.FindPrimaryKey()!.Properties[0].Name
            .Should().Be(nameof(TfParcel.TfParcelId));
        et.PropertyNames().Should().Contain(new[]
        {
            nameof(TfParcel.TfParcelId),
            nameof(TfParcel.CountyId),
            nameof(TfParcel.ParcelStatus),
        });
    }

    [Fact]
    public void Contract_TfSale_IsRegistered()
    {
        var et = _db.Model.FindEntityType(typeof(TfSale));
        et.Should().NotBeNull("Block-C contract v1 §3.2 freezes tf_sale");
    }

    [Fact]
    public void Contract_TfImprovement_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(TfImprovement));
        et.Should().NotBeNull(
            "Block-C contract v1 §3.3 freezes tf_improvement");

        et!.FindPrimaryKey()!.Properties[0].Name
            .Should().Be(nameof(TfImprovement.TfImprovementId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(TfImprovement.TfImprovementId),
            nameof(TfImprovement.CountyId),
            nameof(TfImprovement.TfParcelId),
            nameof(TfImprovement.ImprvTypeCd),
            nameof(TfImprovement.ImprvClassCd),
            nameof(TfImprovement.IsHomesite),
            nameof(TfImprovement.ImprvVal),
            nameof(TfImprovement.YearBuilt),
            nameof(TfImprovement.EffectiveYearBuilt),
            nameof(TfImprovement.ActualYearBuilt),
            nameof(TfImprovement.PromotionLoadBatchId),
        });
    }

    [Fact]
    public void Contract_TfImprovementFeature_HasFrozenShape_AndLineageColumn()
    {
        var et = _db.Model.FindEntityType(typeof(TfImprovementFeature));
        et.Should().NotBeNull(
            "Block-C contract v1 §3.4 freezes tf_improvement_feature");

        et!.FindPrimaryKey()!.Properties[0].Name
            .Should().Be(nameof(TfImprovementFeature.TfImprovementFeatureId));

        // Documented xref exception: features carry SourceImprvDetailLandedRowId
        // as a lineage column, not their own source_xref row.
        et.PropertyNames().Should().Contain(
            nameof(TfImprovementFeature.SourceImprvDetailLandedRowId),
            "Block-C contract v1 §3.4 documents this lineage column as the " +
            "ONLY exception to the source_xref-per-canonical-row rule");

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(TfImprovementFeature.TfImprovementId),
            nameof(TfImprovementFeature.FeatureCode),
            nameof(TfImprovementFeature.MethodCd),
            nameof(TfImprovementFeature.ClassCd),
            nameof(TfImprovementFeature.SubClassCd),
            nameof(TfImprovementFeature.ConditionCd),
            nameof(TfImprovementFeature.Area),
            nameof(TfImprovementFeature.Value),
            nameof(TfImprovementFeature.NumUnits),
            nameof(TfImprovementFeature.YrBuilt),
            nameof(TfImprovementFeature.PromotionLoadBatchId),
        });
    }

    [Fact]
    public void Contract_TfLand_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(TfLand));
        et.Should().NotBeNull(
            "Block-C contract v1 §3.5 freezes tf_land");

        et!.FindPrimaryKey()!.Properties[0].Name
            .Should().Be(nameof(TfLand.TfLandId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(TfLand.TfLandId),
            nameof(TfLand.CountyId),
            nameof(TfLand.TfParcelId),
            nameof(TfLand.LandSegTypeCd),
            nameof(TfLand.LandSegStateCd),
            nameof(TfLand.LandSegClassCd),
            nameof(TfLand.LandSegUseCd),
            nameof(TfLand.SoilCd),
            nameof(TfLand.IsHomesite),
            nameof(TfLand.SizeAcres),
            nameof(TfLand.SizeSquareFeet),
            nameof(TfLand.LandSegMarketVal),
            nameof(TfLand.LandSegAgValue),
            nameof(TfLand.LandSegAssessedVal),
            nameof(TfLand.LandSegEffAge),
            nameof(TfLand.PromotionLoadBatchId),
        });
    }

    [Fact]
    public void Contract_AllCanonicalTfDbSets_AreRegistered()
    {
        // Smoke gate: every Block-C canonical lane is exposed as a DbSet.
        var ctx = typeof(TerraFusionDbContext);
        var expected = new[]
        {
            ("TfParcels",            typeof(DbSet<TfParcel>)),
            ("TfSales",              typeof(DbSet<TfSale>)),
            ("TfOwners",             typeof(DbSet<TfOwner>)),
            ("TfParcelOwnerLinks",   typeof(DbSet<TfParcelOwnerLink>)),
            ("TfAssessmentWsdors",   typeof(DbSet<TfAssessmentWsdor>)),
            ("TfImprovements",       typeof(DbSet<TfImprovement>)),
            ("TfImprovementFeatures",typeof(DbSet<TfImprovementFeature>)),
            ("TfLands",              typeof(DbSet<TfLand>)),
        };

        foreach (var (name, type) in expected)
        {
            var prop = ctx.GetProperty(name,
                BindingFlags.Public | BindingFlags.Instance);
            prop.Should().NotBeNull(
                $"Block-C contract v1 §3 requires DbSet '{name}'");
            prop!.PropertyType.Should().Be(type);
        }
    }

    // ───────────────────────────────────────────────────────────────
    // §4 — truth_pacs lane shapes
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_TruthPacsLanes_AreRegistered()
    {
        var ctx = typeof(TerraFusionDbContext);
        var expected = new[]
        {
            ("TruthPacsSales",            typeof(DbSet<TruthPacsSale>)),
            ("TruthPacsOwnerCurrents",    typeof(DbSet<TruthPacsOwnerCurrent>)),
            ("TruthPacsWashPropOwnerVals",typeof(DbSet<TruthPacsWashPropOwnerVal>)),
            ("TruthPacsImprvCurrents",    typeof(DbSet<TruthPacsImprvCurrent>)),
            ("TruthPacsLandCurrents",     typeof(DbSet<TruthPacsLandCurrent>)),
        };

        foreach (var (name, type) in expected)
        {
            var prop = ctx.GetProperty(name,
                BindingFlags.Public | BindingFlags.Instance);
            prop.Should().NotBeNull(
                $"Block-C contract v1 §4 requires truth_pacs DbSet '{name}'");
            prop!.PropertyType.Should().Be(type);
        }
    }

    [Fact]
    public void Contract_TruthPacsImprvCurrent_PreservesPacs4Key()
    {
        var et = _db.Model.FindEntityType(typeof(TruthPacsImprvCurrent));
        et.Should().NotBeNull();
        et!.PropertyNames().Should().Contain(new[]
        {
            nameof(TruthPacsImprvCurrent.PropValYr),
            nameof(TruthPacsImprvCurrent.SupNum),
            nameof(TruthPacsImprvCurrent.PropId),
            nameof(TruthPacsImprvCurrent.ImprvId),
            // Dual-batch lineage invariant.
            nameof(TruthPacsImprvCurrent.SourceImprvLandedRowId),
            nameof(TruthPacsImprvCurrent.SourceSuppAssocLandedRowId),
            nameof(TruthPacsImprvCurrent.ImprvLoadBatchId),
            nameof(TruthPacsImprvCurrent.SuppAssocLoadBatchId),
            nameof(TruthPacsImprvCurrent.PromotionLoadBatchId),
        });
    }

    [Fact]
    public void Contract_TruthPacsLandCurrent_PreservesPacs4Key()
    {
        var et = _db.Model.FindEntityType(typeof(TruthPacsLandCurrent));
        et.Should().NotBeNull();
        et!.PropertyNames().Should().Contain(new[]
        {
            nameof(TruthPacsLandCurrent.PropValYr),
            nameof(TruthPacsLandCurrent.SupNum),
            nameof(TruthPacsLandCurrent.PropId),
            nameof(TruthPacsLandCurrent.LandSegId),
            nameof(TruthPacsLandCurrent.SourceLandLandedRowId),
            nameof(TruthPacsLandCurrent.SourceSuppAssocLandedRowId),
            nameof(TruthPacsLandCurrent.LandLoadBatchId),
            nameof(TruthPacsLandCurrent.SuppAssocLoadBatchId),
            nameof(TruthPacsLandCurrent.PromotionLoadBatchId),
        });
    }

    [Fact]
    public void Contract_TruthPacsSale_QualificationFilteredAndDualLineage()
    {
        var et = _db.Model.FindEntityType(typeof(TruthPacsSale));
        et.Should().NotBeNull();
        et!.PropertyNames().Should().Contain(new[]
        {
            nameof(TruthPacsSale.ChgOfOwnerId),
            nameof(TruthPacsSale.PropId),
            nameof(TruthPacsSale.PropValYr),
            nameof(TruthPacsSale.SupNum),
            nameof(TruthPacsSale.SlCountyRatioCd),
            nameof(TruthPacsSale.SourceSaleLandedRowId),
            nameof(TruthPacsSale.SourceSuppAssocLandedRowId),
            nameof(TruthPacsSale.SaleLoadBatchId),
            nameof(TruthPacsSale.SuppAssocLoadBatchId),
            nameof(TruthPacsSale.PromotionLoadBatchId),
        });
    }

    // ───────────────────────────────────────────────────────────────
    // §5 — legacy_tf_unproven quarantine surfaces
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_LegacyTfUnproven_QuarantineSurfaces_AreRegistered()
    {
        var ctx = typeof(TerraFusionDbContext);
        var expected = new[]
        {
            ("LegacyTfUnprovenSales",
                typeof(DbSet<LegacyTfUnprovenSale>)),
            ("LegacyTfUnprovenOwnerCurrents",
                typeof(DbSet<LegacyTfUnprovenOwnerCurrent>)),
            ("LegacyTfUnprovenWashPropOwnerVals",
                typeof(DbSet<LegacyTfUnprovenWashPropOwnerVal>)),
            ("LegacyTfUnprovenImprvCurrents",
                typeof(DbSet<LegacyTfUnprovenImprvCurrent>)),
            ("LegacyTfUnprovenLandCurrents",
                typeof(DbSet<LegacyTfUnprovenLandCurrent>)),
            ("LegacyTfUnprovenImprvAttrs",
                typeof(DbSet<LegacyTfUnprovenImprvAttr>)),
        };

        foreach (var (name, type) in expected)
        {
            var prop = ctx.GetProperty(name,
                BindingFlags.Public | BindingFlags.Instance);
            prop.Should().NotBeNull(
                $"Block-C contract v1 §5 requires quarantine DbSet '{name}'");
            prop!.PropertyType.Should().Be(type);
        }
    }

    [Fact]
    public void Contract_LegacyTfUnprovenImprvCurrent_HasQuarantineShape()
    {
        var et = _db.Model.FindEntityType(typeof(LegacyTfUnprovenImprvCurrent));
        et.Should().NotBeNull();
        et!.FindPrimaryKey()!.Properties[0].Name
            .Should().Be(nameof(LegacyTfUnprovenImprvCurrent.UnprovenRowId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(LegacyTfUnprovenImprvCurrent.UnprovenRowId),
            nameof(LegacyTfUnprovenImprvCurrent.PropValYr),
            nameof(LegacyTfUnprovenImprvCurrent.SupNum),
            nameof(LegacyTfUnprovenImprvCurrent.PropId),
            nameof(LegacyTfUnprovenImprvCurrent.ImprvId),
            nameof(LegacyTfUnprovenImprvCurrent.SourceTruthImprvId),
            nameof(LegacyTfUnprovenImprvCurrent.PromotionLoadBatchId),
            nameof(LegacyTfUnprovenImprvCurrent.QuarantineReason),
        });
    }

    [Fact]
    public void Contract_LegacyTfUnprovenLandCurrent_HasQuarantineShape()
    {
        var et = _db.Model.FindEntityType(typeof(LegacyTfUnprovenLandCurrent));
        et.Should().NotBeNull();
        et!.FindPrimaryKey()!.Properties[0].Name
            .Should().Be(nameof(LegacyTfUnprovenLandCurrent.UnprovenRowId));

        et.PropertyNames().Should().Contain(
            nameof(LegacyTfUnprovenLandCurrent.QuarantineReason),
            "every quarantine surface must carry a QuarantineReason " +
            "per Block-C contract v1 §5");
    }

    // ───────────────────────────────────────────────────────────────
    // v1.1 addendum — canonical_tf.dict_neighborhood (Slice E1)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_1_DictNeighborhood_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(DictNeighborhood));
        et.Should().NotBeNull(
            "Block-C contract v1.1 §3.7 freezes canonical_tf.dict_neighborhood");

        var pk = et!.FindPrimaryKey();
        pk.Should().NotBeNull();
        pk!.Properties.Should().HaveCount(1);
        pk.Properties[0].Name.Should().Be(
            nameof(DictNeighborhood.DictNeighborhoodId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(DictNeighborhood.DictNeighborhoodId),
            nameof(DictNeighborhood.CountyId),
            nameof(DictNeighborhood.HoodCd),
            nameof(DictNeighborhood.HoodName),
            nameof(DictNeighborhood.HoodDescription),
            nameof(DictNeighborhood.HoodGroupCd),
            nameof(DictNeighborhood.IsActive),
            nameof(DictNeighborhood.LoadBatchId),
            nameof(DictNeighborhood.SourceQueryHash),
            nameof(DictNeighborhood.CreatedAt),
            nameof(DictNeighborhood.UpdatedAt),
        });
    }

    [Fact]
    public void Contract_v1_1_DictNeighborhood_HasUniqueCountyHoodCdIndex()
    {
        // Sovereign-county isolation requires that hood_cd is unique
        // WITHIN a county, but the same code can appear across
        // counties with different meanings.
        var et = _db.Model.FindEntityType(typeof(DictNeighborhood));
        et.Should().NotBeNull();

        var indexes = et!.GetIndexes().ToList();
        indexes.Should().Contain(idx =>
            idx.IsUnique
            && idx.Properties.Count == 2
            && idx.Properties[0].Name == nameof(DictNeighborhood.CountyId)
            && idx.Properties[1].Name == nameof(DictNeighborhood.HoodCd),
            "Block-C contract v1.1 §3.7 freezes (CountyId, HoodCd) as the natural unique key");
    }

    [Fact]
    public void Contract_v1_1_DictNeighborhood_DbSetIsRegistered()
    {
        var prop = typeof(TerraFusionDbContext).GetProperty(
            "DictNeighborhoods",
            BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull(
            "Block-C contract v1.1 §3.7 names the dict_neighborhood DbSet");
        prop!.PropertyType.Should().Be(typeof(DbSet<DictNeighborhood>));
    }

    // ───────────────────────────────────────────────────────────────
    // v1.2 addendum — canonical_tf.attribute_definition (Slice E2)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_2_AttributeDefinition_HasFrozenShape()
    {
        var et = _db.Model.FindEntityType(typeof(AttributeDefinition));
        et.Should().NotBeNull(
            "Block-C contract v1.2 §3.8 freezes canonical_tf.attribute_definition");

        var pk = et!.FindPrimaryKey();
        pk.Should().NotBeNull();
        pk!.Properties.Should().HaveCount(1);
        pk.Properties[0].Name.Should().Be(
            nameof(AttributeDefinition.AttributeDefinitionId));

        et.PropertyNames().Should().Contain(new[]
        {
            nameof(AttributeDefinition.AttributeDefinitionId),
            nameof(AttributeDefinition.CountyId),
            nameof(AttributeDefinition.IAttrId),
            nameof(AttributeDefinition.AttributeCode),
            nameof(AttributeDefinition.AttributeName),
            nameof(AttributeDefinition.DataType),
            nameof(AttributeDefinition.ValueDomain),
            nameof(AttributeDefinition.AppliesTo),
            nameof(AttributeDefinition.IsActive),
            nameof(AttributeDefinition.LoadBatchId),
            nameof(AttributeDefinition.SourceQueryHash),
            nameof(AttributeDefinition.CreatedAt),
            nameof(AttributeDefinition.UpdatedAt),
        });
    }

    [Fact]
    public void Contract_v1_2_AttributeDefinition_HasUniqueCountyIAttrIdIndex()
    {
        // Sovereign-county isolation requires that i_attr_id is unique
        // WITHIN a county; the same id can be a different attribute
        // across counties.
        var et = _db.Model.FindEntityType(typeof(AttributeDefinition));
        et.Should().NotBeNull();

        var indexes = et!.GetIndexes().ToList();
        indexes.Should().Contain(idx =>
            idx.IsUnique
            && idx.Properties.Count == 2
            && idx.Properties[0].Name == nameof(AttributeDefinition.CountyId)
            && idx.Properties[1].Name == nameof(AttributeDefinition.IAttrId),
            "Block-C contract v1.2 §3.8 freezes (CountyId, IAttrId) as the natural unique key");
    }

    [Fact]
    public void Contract_v1_2_AttributeDefinition_HasUniqueCountyAttributeCodeIndex()
    {
        // Two i_attr_ids must not collapse onto the same canonical
        // handle within a single county.
        var et = _db.Model.FindEntityType(typeof(AttributeDefinition));
        et.Should().NotBeNull();

        var indexes = et!.GetIndexes().ToList();
        indexes.Should().Contain(idx =>
            idx.IsUnique
            && idx.Properties.Count == 2
            && idx.Properties[0].Name == nameof(AttributeDefinition.CountyId)
            && idx.Properties[1].Name == nameof(AttributeDefinition.AttributeCode),
            "Block-C contract v1.2 §3.8 freezes (CountyId, AttributeCode) as a uniqueness invariant");
    }

    [Fact]
    public void Contract_v1_2_AttributeDefinition_DbSetIsRegistered()
    {
        var prop = typeof(TerraFusionDbContext).GetProperty(
            "AttributeDefinitions",
            BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull(
            "Block-C contract v1.2 §3.8 names the attribute_definition DbSet");
        prop!.PropertyType.Should().Be(typeof(DbSet<AttributeDefinition>));
    }

    // ───────────────────────────────────────────────────────────────
    // v1.3 addendum — nullable FK from
    // tf_improvement_feature + tf_land → attribute_definition (E3a)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_3_TfImprovementFeature_HasNullableAttributeIdColumn()
    {
        var et = _db.Model.FindEntityType(typeof(TfImprovementFeature));
        et.Should().NotBeNull();

        var attributeId = et!
            .FindProperty(nameof(TfImprovementFeature.AttributeId));
        attributeId.Should().NotBeNull(
            "Block-C contract v1.3 §3.4 adds AttributeId to tf_improvement_feature");
        attributeId!.IsNullable.Should().BeTrue(
            "v1.3 keeps AttributeId nullable; non-null flip is reserved for E3b (v2)");
        attributeId.ClrType.Should().Be(typeof(Guid?));
    }

    [Fact]
    public void Contract_v1_3_TfLand_HasNullableAttributeIdColumn()
    {
        var et = _db.Model.FindEntityType(typeof(TfLand));
        et.Should().NotBeNull();

        var attributeId = et!
            .FindProperty(nameof(TfLand.AttributeId));
        attributeId.Should().NotBeNull(
            "Block-C contract v1.3 §3.5 adds AttributeId to tf_land");
        attributeId!.IsNullable.Should().BeTrue(
            "v1.3 keeps AttributeId nullable; non-null flip is reserved for E3b (v2)");
        attributeId.ClrType.Should().Be(typeof(Guid?));
    }

    [Fact]
    public void Contract_v1_3_TfImprovementFeature_HasFkToAttributeDefinition()
    {
        var et = _db.Model.FindEntityType(typeof(TfImprovementFeature));
        et.Should().NotBeNull();

        var fk = et!.GetForeignKeys().FirstOrDefault(f =>
            f.PrincipalEntityType.ClrType == typeof(AttributeDefinition));
        fk.Should().NotBeNull(
            "Block-C contract v1.3 freezes a FK from tf_improvement_feature → attribute_definition");
        fk!.Properties.Should().ContainSingle()
            .Which.Name.Should().Be(nameof(TfImprovementFeature.AttributeId));
        fk.PrincipalKey.Properties.Should().ContainSingle()
            .Which.Name.Should().Be(nameof(AttributeDefinition.AttributeDefinitionId));
        fk.DeleteBehavior.Should().Be(DeleteBehavior.NoAction,
            "v1.3 §3.4: NoAction on delete to prevent silent orphaning");
    }

    [Fact]
    public void Contract_v1_3_TfLand_HasFkToAttributeDefinition()
    {
        var et = _db.Model.FindEntityType(typeof(TfLand));
        et.Should().NotBeNull();

        var fk = et!.GetForeignKeys().FirstOrDefault(f =>
            f.PrincipalEntityType.ClrType == typeof(AttributeDefinition));
        fk.Should().NotBeNull(
            "Block-C contract v1.3 freezes a FK from tf_land → attribute_definition");
        fk!.Properties.Should().ContainSingle()
            .Which.Name.Should().Be(nameof(TfLand.AttributeId));
        fk.PrincipalKey.Properties.Should().ContainSingle()
            .Which.Name.Should().Be(nameof(AttributeDefinition.AttributeDefinitionId));
        fk.DeleteBehavior.Should().Be(DeleteBehavior.NoAction,
            "v1.3 §3.5: NoAction on delete to prevent silent orphaning");
    }

    // ───────────────────────────────────────────────────────────────
    // v1.4 addendum — QuarantineReasons closed vocabulary (E4a)
    //
    // History note: v1.0 §5.2 documented only NO_PARCEL_XREF as the
    // emitted vocabulary. The E4a audit found that NO_OWNER_XREF and
    // BOTH_MISSING were already shipping in production projectors
    // (PacsWsdorCanonicalProjector) but undocumented. v1.4 corrects
    // the omission cumulatively and adds UNKNOWN_ATTRIBUTE for the
    // future i_attr_id-aware projector.
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_4_QuarantineReasons_AllContainsFrozenSet()
    {
        // Closed vocabulary per v1.4 §5.2 (corrected from v1.0).
        QuarantineReasons.All.Should().BeEquivalentTo(new[]
        {
            "NO_PARCEL_XREF",     // v1.0 (emitted by all 5 projectors)
            "NO_OWNER_XREF",      // v1.0 historical (B4) — newly documented in v1.4
            "BOTH_MISSING",       // v1.0 historical (B4) — newly documented in v1.4
            "UNKNOWN_ATTRIBUTE",  // v1.4 NEW (E4b will emit it)
        }, "Block-C contract v1.4 §5.2 freezes the QuarantineReasons vocabulary");
    }

    // ───────────────────────────────────────────────────────────────
    // v1.6 addendum — two-layer quarantine vocabulary disjointness
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_6_LandingQuarantineReasons_AllContainsExpectedValues()
    {
        // v1.6 §2: landing-layer vocabulary is currently a
        // single-value set. Future additions require a v1.x bump.
        LandingQuarantineReasons.All.Should().BeEquivalentTo(new[]
        {
            "UNKNOWN_I_ATTR_VAL_CD",
        }, "Block-C contract v1.6 §2 freezes the LandingQuarantineReasons vocabulary");

        LandingQuarantineReasons.IsKnown(LandingQuarantineReasons.UnknownIAttrValCd)
            .Should().BeTrue();
        LandingQuarantineReasons.IsKnown("not-a-reason").Should().BeFalse();
        LandingQuarantineReasons.IsKnown(string.Empty).Should().BeFalse();
    }

    [Fact]
    public void Contract_v1_6_QuarantineVocabularies_AreDisjoint()
    {
        // v1.6 §3: the two vocabularies must never share a string.
        // This is what makes v1.5 §2.4's filter-by-reason cleanup
        // strategy safe across layers.
        var canonicalSet = QuarantineReasons.All;
        var landingSet = LandingQuarantineReasons.All;
        canonicalSet.Intersect(landingSet).Should().BeEmpty(
            "Block-C contract v1.6 §3 freezes vocabulary disjointness");
    }

    [Fact]
    public void Contract_v1_6_CanonicalIsKnown_RejectsLandingReason()
    {
        // Cross-IsKnown check: QuarantineReasons.IsKnown returns
        // false for any landing-layer string. Without this, a
        // canonical-layer cleanup pass could incorrectly recognize
        // a landing-layer row as one of its own.
        QuarantineReasons.IsKnown(LandingQuarantineReasons.UnknownIAttrValCd)
            .Should().BeFalse(
                "Block-C contract v1.6 §3: canonical-layer vocab " +
                "MUST NOT recognize landing-layer reasons");
    }

    [Fact]
    public void Contract_v1_6_LandingIsKnown_RejectsCanonicalReason()
    {
        // Symmetric check: LandingQuarantineReasons.IsKnown returns
        // false for any canonical-layer string.
        LandingQuarantineReasons.IsKnown(QuarantineReasons.UnknownAttribute)
            .Should().BeFalse(
                "Block-C contract v1.6 §3: landing-layer vocab " +
                "MUST NOT recognize canonical-layer reasons");
        LandingQuarantineReasons.IsKnown(QuarantineReasons.NoParcelXref)
            .Should().BeFalse();
        LandingQuarantineReasons.IsKnown(QuarantineReasons.NoOwnerXref)
            .Should().BeFalse();
        LandingQuarantineReasons.IsKnown(QuarantineReasons.BothMissing)
            .Should().BeFalse();
    }

    [Fact]
    public async System.Threading.Tasks.Task Contract_v1_5_AttributeCoverageGateName_IsReachable()
    {
        // v1.5 §3 adds a sixth canonical-imprv gate name. Asserting
        // that the gate name persists round-trip via the existing
        // promotion_gate_result shape with no schema change.
        var batch = await SeedCompletedBatchAsync();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch,
            GateName = "canonical-imprv-attribute-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = "0",
            Detail = "considered=0 resolved=0 quarantined=0",
        });
        await _db.SaveChangesAsync();

        var saved = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-imprv-attribute-coverage");
        saved.GateStage.Should().Be("TRUTH_TO_CANONICAL");
        saved.Status.Should().Be("PASS");
    }

    [Fact]
    public void Contract_v1_4_QuarantineReasons_IsKnown_RejectsUnknown()
    {
        QuarantineReasons.IsKnown(QuarantineReasons.NoParcelXref).Should().BeTrue();
        QuarantineReasons.IsKnown(QuarantineReasons.NoOwnerXref).Should().BeTrue();
        QuarantineReasons.IsKnown(QuarantineReasons.BothMissing).Should().BeTrue();
        QuarantineReasons.IsKnown(QuarantineReasons.UnknownAttribute).Should().BeTrue();
        QuarantineReasons.IsKnown("AMBIGUOUS_PARCEL_XREF").Should().BeFalse(
            "v1.4 §5.2 explicitly excludes the aspirational values that " +
            "appeared in earlier entity XML docs but were never emitted");
        QuarantineReasons.IsKnown("PARCEL_XREF_INACTIVE").Should().BeFalse();
        QuarantineReasons.IsKnown("not-a-reason").Should().BeFalse();
        QuarantineReasons.IsKnown(string.Empty).Should().BeFalse();
    }

    // ───────────────────────────────────────────────────────────────
    // v1.10 addendum — ConversionEras closed vocabulary (G1)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_10_ConversionEras_AllContainsFrozenSet()
    {
        // v1.10 §2: closed vocabulary for the ConversionEra column on
        // truth_pacs.* (and later canonical_tf.*). Adding a new era is
        // a v1.x bump — there is no runtime extensibility hook.
        ConversionEras.All.Should().BeEquivalentTo(new[]
        {
            "PRE_CONVERSION_2017",
            "POST_CONVERSION",
            "UNKNOWN",
        }, "Block-C contract v1.10 §2 freezes the ConversionEras vocabulary");
    }

    [Fact]
    public void Contract_v1_10_ConversionEras_IsKnown_RejectsUnknown()
    {
        ConversionEras.IsKnown(ConversionEras.PreConversion2017).Should().BeTrue();
        ConversionEras.IsKnown(ConversionEras.PostConversion).Should().BeTrue();
        ConversionEras.IsKnown(ConversionEras.Unknown).Should().BeTrue();
        ConversionEras.IsKnown("PRE_2018").Should().BeFalse();
        ConversionEras.IsKnown("not-an-era").Should().BeFalse();
        ConversionEras.IsKnown(string.Empty).Should().BeFalse();
    }

    [Fact]
    public void Contract_v1_10_ConversionEras_CutoverYearIs2018()
    {
        // v1.10 §2: the cutover boundary is the 2018 valuation/tax
        // year. Years strictly less than 2018 are pre-conversion;
        // years >= 2018 are post-conversion.
        ConversionEras.CutoverYear.Should().Be((short)2018,
            "Block-C contract v1.10 §2 freezes the conversion cutover year");
    }

    [Theory]
    [InlineData((short)2010, "PRE_CONVERSION_2017")]
    [InlineData((short)2016, "PRE_CONVERSION_2017")]
    [InlineData((short)2017, "PRE_CONVERSION_2017")]
    [InlineData((short)2018, "POST_CONVERSION")]
    [InlineData((short)2019, "POST_CONVERSION")]
    [InlineData((short)2026, "POST_CONVERSION")]
    public void Contract_v1_10_ConversionEras_FromYear_RespectsCutover(
        short year, string expected)
    {
        ConversionEras.FromYear(year).Should().Be(expected,
            "Block-C contract v1.10 §2: FromYear({0}) MUST resolve to {1}",
            year, expected);
    }

    [Fact]
    public void Contract_v1_10_ConversionEras_TruthLayer_NeverEmitsUnknown()
    {
        // v1.10 §2: truth-layer rows always have a year column that
        // disambiguates. Only canonical-layer rows (whose contributing
        // truth rows can disagree on era) are allowed to carry
        // UNKNOWN. The FromYear helper is the truth-layer entry point
        // and must NEVER return UNKNOWN.
        for (short year = 1900; year <= 2100; year++)
        {
            ConversionEras.FromYear(year).Should().NotBe(
                ConversionEras.Unknown,
                "Block-C contract v1.10 §2: truth-layer FromYear({0}) " +
                "MUST resolve to a definite era", year);
        }
    }

    // ───────────────────────────────────────────────────────────────
    // v1.11 addendum — ConversionEra propagation to canonical_tf (G2)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_v1_11_MajorityOfTruth_EmptyOrAllNull_ReturnsUnknown()
    {
        // v1.11 §2: when no contributing truth row reports an era,
        // the canonical row's era is UNKNOWN.
        ConversionEras.MajorityOfTruth(Array.Empty<string?>())
            .Should().Be(ConversionEras.Unknown);
        ConversionEras.MajorityOfTruth(new string?[] { null, null, null })
            .Should().Be(ConversionEras.Unknown);
    }

    [Fact]
    public void Contract_v1_11_MajorityOfTruth_SingleContributor_ReturnsThatEra()
    {
        // v1.11 §2: 1:1 projections (every truth → canonical mapping
        // today) reduce to verbatim copy.
        ConversionEras.MajorityOfTruth(new string?[] { ConversionEras.PostConversion })
            .Should().Be(ConversionEras.PostConversion);
        ConversionEras.MajorityOfTruth(new string?[] { ConversionEras.PreConversion2017 })
            .Should().Be(ConversionEras.PreConversion2017);
    }

    [Fact]
    public void Contract_v1_11_MajorityOfTruth_AllAgree_ReturnsAgreedEra()
    {
        ConversionEras.MajorityOfTruth(new string?[]
        {
            ConversionEras.PostConversion,
            ConversionEras.PostConversion,
            ConversionEras.PostConversion,
        }).Should().Be(ConversionEras.PostConversion);
    }

    [Fact]
    public void Contract_v1_11_MajorityOfTruth_Disagree_ReturnsUnknown()
    {
        // v1.11 §2: contributors that span the cutover collapse to
        // UNKNOWN. The canonical layer cannot pretend the row is
        // unambiguously one era when its truth contributors disagree.
        ConversionEras.MajorityOfTruth(new string?[]
        {
            ConversionEras.PreConversion2017,
            ConversionEras.PostConversion,
        }).Should().Be(ConversionEras.Unknown);
    }

    [Fact]
    public void Contract_v1_11_MajorityOfTruth_NullsIgnored_AmongstAgreement()
    {
        // v1.11 §2: null contributors (pre-G1 rows that haven't been
        // re-promoted) are skipped, not voted. Surviving non-null
        // contributors decide.
        ConversionEras.MajorityOfTruth(new string?[]
        {
            null,
            ConversionEras.PostConversion,
            null,
            ConversionEras.PostConversion,
        }).Should().Be(ConversionEras.PostConversion);
    }

    [Fact]
    public void Contract_v1_11_MajorityOfTruth_UnknownVocabTokens_AreIgnored()
    {
        // v1.11 §2: out-of-vocabulary tokens are doctrine violations
        // upstream. The helper does not propagate them — it skips
        // them as if they were null. If only such tokens appear, the
        // result is UNKNOWN.
        ConversionEras.MajorityOfTruth(new string?[]
        {
            "BOGUS_ERA",
            ConversionEras.PostConversion,
        }).Should().Be(ConversionEras.PostConversion);

        ConversionEras.MajorityOfTruth(new string?[]
        {
            "BOGUS_ERA",
            "ANOTHER_BAD_TOKEN",
        }).Should().Be(ConversionEras.Unknown);
    }

    [Fact]
    public void Contract_v1_11_CanonicalTf_AllSixEntities_HaveConversionEraColumn()
    {
        // v1.11 §3: all six canonical lanes that derive from truth
        // carry a nullable ConversionEra column with MaxLength = 20.
        var entityTypes = new[]
        {
            typeof(TfSale),
            typeof(TfOwner),
            typeof(TfAssessmentWsdor),
            typeof(TfImprovement),
            typeof(TfImprovementFeature),
            typeof(TfLand),
        };

        foreach (var clrType in entityTypes)
        {
            var entityType = _db.Model.FindEntityType(clrType);
            entityType.Should().NotBeNull(
                $"v1.11 §3: {clrType.Name} must be mapped");
            var conversionEra = entityType!.FindProperty("ConversionEra");
            conversionEra.Should().NotBeNull(
                $"v1.11 §3: {clrType.Name}.ConversionEra must exist");
            conversionEra!.IsNullable.Should().BeTrue(
                $"v1.11 §3: {clrType.Name}.ConversionEra must be " +
                "nullable for back-compat with pre-G2 rows");
            conversionEra.GetMaxLength().Should().Be(20,
                $"v1.11 §3: {clrType.Name}.ConversionEra max length " +
                "is 20 (matches the truth_pacs.* column shape)");
        }
    }

    [Fact]
    public void Contract_v1_10_TruthPacs_AllFiveEntities_HaveConversionEraColumn()
    {
        // v1.10 §3: all five truth_pacs lanes carry a nullable
        // ConversionEra column (back-compat with rows promoted before
        // G1; new promotions always set it).
        var entityTypes = new[]
        {
            typeof(TruthPacsSale),
            typeof(TruthPacsOwnerCurrent),
            typeof(TruthPacsWashPropOwnerVal),
            typeof(TruthPacsImprvCurrent),
            typeof(TruthPacsLandCurrent),
        };

        foreach (var clrType in entityTypes)
        {
            var entityType = _db.Model.FindEntityType(clrType);
            entityType.Should().NotBeNull(
                $"v1.10 §3: {clrType.Name} must be mapped");
            var conversionEra = entityType!.FindProperty("ConversionEra");
            conversionEra.Should().NotBeNull(
                $"v1.10 §3: {clrType.Name}.ConversionEra must exist");
            conversionEra!.IsNullable.Should().BeTrue(
                $"v1.10 §3: {clrType.Name}.ConversionEra must be " +
                "nullable for back-compat with pre-G1 rows");
            conversionEra.GetMaxLength().Should().Be(20,
                $"v1.10 §3: {clrType.Name}.ConversionEra max length " +
                "is 20 (longest vocabulary token + headroom)");
        }
    }

    // ───────────────────────────────────────────────────────────────
    // §6 — migration list (Block A / B / C scaffolding)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public void Contract_RequiredMigrations_ArePresentInDataAssembly()
    {
        // Reflect over TerraFusion.Data assembly to find every type
        // tagged with [Migration]. Each Block-A/B/C migration MUST
        // appear; removing one is a v2 contract bump.
        var dataAssembly = typeof(TerraFusionDbContext).Assembly;
        var migrationIds = dataAssembly.GetTypes()
            .Select(t => t.GetCustomAttribute<MigrationAttribute>())
            .Where(a => a != null)
            .Select(a => a!.Id)
            .ToList();

        // Each migration name fragment is a Block A/B/C/G1-A landing
        // that contributed shape to the v1 contract.
        var requiredFragments = new[]
        {
            // v1 control tower + tf_parcel + GIS scaffold
            "AddCanonicalTfAndSyncBridgeV1",
            "AddGisTfParcelGeom",
            // Block A — sales
            "AddTruthPacsSale",
            "AddTfSaleAndUnprovenSale",
            // Block B — owners + WSDOR assessment
            "AddTruthPacsOwnerCurrent",
            "AddTfOwnerAndLink",
            "AddTruthPacsWashPropOwnerVal",
            "AddTfAssessmentWsdorAndQuarantine",
            // Block C — improvement + land
            "AddTruthPacsImprvCurrent",
            "AddTruthPacsLandCurrent",
            "AddTfImprovementAndFeature",
            // Block-C contract v1.1 — first dictionary table (E1).
            // Note: this migration also closes the tf_land schema
            // gap (entities committed pre-H3, migration deferred).
            "AddDictNeighborhood",
            // Block-C contract v1.2 — i_attr_id mapping spine (E2).
            "AddAttributeDefinition",
            // Block-C contract v1.3 — nullable AttributeId FK on
            // tf_improvement_feature + tf_land (E3a).
            "AddAttributeIdNullableFkToFeatureAndLand",
            // Block-C contract v1.10 — ConversionEra column + index
            // on all five truth_pacs lanes (G1).
            "AddConversionEraToTruthPacs",
            // Block-C contract v1.11 — ConversionEra column + index
            // on six canonical_tf lanes (G2).
            "AddConversionEraToCanonicalTf",
        };

        foreach (var fragment in requiredFragments)
        {
            migrationIds.Should().Contain(
                id => id.EndsWith("_" + fragment),
                $"Block-C contract v1 §6 requires migration '*_{fragment}'");
        }
    }

    // ───────────────────────────────────────────────────────────────
    // helpers
    // ───────────────────────────────────────────────────────────────

    private async System.Threading.Tasks.Task<Guid> SeedCompletedBatchAsync()
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = "h2-contract-test",
            SourceQueryHash = "h2",
            Operator = "h2-test",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }
}

internal static class BlockCContractV1TestExtensions
{
    public static IEnumerable<string> PropertyNames(this IEntityType et)
        => et.GetProperties().Select(p => p.Name);
}
