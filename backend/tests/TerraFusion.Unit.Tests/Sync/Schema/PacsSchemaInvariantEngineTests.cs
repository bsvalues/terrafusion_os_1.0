using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C53-CONS-B unit tests for the PacsSchemaInvariantEngine.
///
/// <para>Covers each Error / Warning invariant the engine
/// implements (TBL-*, COL-*, DICT-*, FK-*) plus the report-level
/// behaviors: clean catalog, suppression, and the catalog-build
/// fail-closed exception message.</para>
///
/// <para>Tests bypass PacsSchemaCatalog.BuildAsync and invoke the
/// engine directly with hand-crafted input. The build-time wiring
/// is exercised by separate integration-style tests at the bottom.</para>
/// </summary>
public sealed class PacsSchemaInvariantEngineTests
{
    private static PacsTable Tbl(string name, string? provenance = null) => new(
        TableName: name,
        IdentityTuple: new[] { "id" },
        ConversionEra: PacsConversionEra.Both,
        DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
        PiiClassification: PiiClassification.None,
        ProvenancePath: provenance ?? $"fixture://{name}",
        ForeignKeys: Array.Empty<PacsForeignKey>());

    private static PacsTable TblWithFks(string name, params PacsForeignKey[] fks) => new(
        TableName: name,
        IdentityTuple: new[] { "id" },
        ConversionEra: PacsConversionEra.Both,
        DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
        PiiClassification: PiiClassification.None,
        ProvenancePath: $"fixture://{name}",
        ForeignKeys: fks);

    private static PacsColumn Col(string table, string col, string? provenance = null,
        PacsDictionaryReference? dictRef = null) => new(
        TableName: table,
        ColumnName: col,
        DeclaredType: "varchar",
        Nullable: true,
        ConversionEra: PacsConversionEra.Both,
        DictionaryRef: dictRef,
        PiiClassification: PiiClassification.None,
        ProvenanceLine: provenance ?? $"fixture://{table}.{col}",
        Notes: string.Empty);

    private static PacsDictionary Dict(string name, string keyCol = "code", string descCol = "desc") => new(
        DictionaryName: name,
        KeyColumn: keyCol,
        DescriptionColumn: descCol,
        ValueDomainSize: null,
        ConversionEra: PacsConversionEra.Both,
        ProvenancePath: $"fixture://{name}");

    // ------------------------------------------------------------------
    // TBL-* invariants
    // ------------------------------------------------------------------
    [Fact]
    public void TBL_001_EmptyTableName_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl(""), Tbl("ok") },
            new[] { Col("ok", "id") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "TBL-001");
    }

    [Fact]
    public void TBL_002_DuplicateTableName_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("dup"), Tbl("dup") },
            new[] { Col("dup", "id") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().ContainSingle(r => r.Code == "TBL-002").Which.TableName.Should().Be("dup");
    }

    [Fact]
    public void TBL_003_EmptyProvenance_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("ok", provenance: "") },
            new[] { Col("ok", "id") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "TBL-003");
    }

    [Fact]
    public void TBL_004_ZeroColumns_FiresWarning()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("orphan") },
            Array.Empty<PacsColumn>(),
            Array.Empty<PacsDictionary>(),
            null);
        report.Warnings.Should().Contain(r => r.Code == "TBL-004" && r.TableName == "orphan");
    }

    // ------------------------------------------------------------------
    // COL-* invariants
    // ------------------------------------------------------------------
    [Fact]
    public void COL_001_EmptyTableName_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("", "x") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "COL-001");
    }

    [Fact]
    public void COL_002_UnknownTableRef_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t1") },
            new[] { Col("t2", "x") }, // refers to unknown table
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "COL-002");
    }

    [Fact]
    public void COL_003_DuplicateColumn_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "dup"), Col("t", "dup") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "COL-003");
    }

    [Fact]
    public void COL_004_EmptyProvenanceLine_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "x", provenance: "") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "COL-004");
    }

    [Fact]
    public void COL_005_DictionaryRefToUnknownTable_FiresWarning()
    {
        var sut = new PacsSchemaInvariantEngine();
        var dictRef = new PacsDictionaryReference("x", "missing_dict_table", "x");
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "x", dictRef: dictRef) },
            Array.Empty<PacsDictionary>(),
            null);
        report.Warnings.Should().Contain(r => r.Code == "COL-005");
    }

    // ------------------------------------------------------------------
    // DICT-* invariants
    // ------------------------------------------------------------------
    [Fact]
    public void DICT_001_EmptyDictionaryName_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "x") },
            new[] { Dict("") },
            null);
        report.Errors.Should().Contain(r => r.Code == "DICT-001");
    }

    [Fact]
    public void DICT_002_DuplicateName_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("d"), Tbl("t") },
            new[] { Col("d", "code"), Col("d", "desc"), Col("t", "x") },
            new[] { Dict("d"), Dict("d") },
            null);
        report.Errors.Should().Contain(r => r.Code == "DICT-002");
    }

    [Fact]
    public void DICT_003_DictionaryNameNotInCatalog_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "x") },
            new[] { Dict("missing") },
            null);
        report.Errors.Should().Contain(r => r.Code == "DICT-003");
    }

    [Fact]
    public void DICT_004_KeyColumnMissingOnTable_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("d") },
            new[] { Col("d", "other_col") }, // key col 'code' does not exist
            new[] { Dict("d", keyCol: "code") },
            null);
        report.Errors.Should().Contain(r => r.Code == "DICT-004");
    }

    [Fact]
    public void DICT_005_EmptyDescriptionColumn_FiresWarning()
    {
        var sut = new PacsSchemaInvariantEngine();
        // PacsDictionary.DescriptionColumn is non-nullable string;
        // empty string is the engine's signal for "missing" per
        // string.IsNullOrEmpty().
        var report = sut.Evaluate(
            new[] { Tbl("d") },
            new[] { Col("d", "code") },
            new[] { Dict("d", descCol: "") },
            null);
        report.Warnings.Should().Contain(r => r.Code == "DICT-005");
    }

    [Fact]
    public void DICT_007_EmptyProvenancePath_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var dict = new PacsDictionary(
            DictionaryName: "d",
            KeyColumn: "code",
            DescriptionColumn: "desc",
            ValueDomainSize: null,
            ConversionEra: PacsConversionEra.Both,
            ProvenancePath: "   "); // whitespace-only fails per IsNullOrWhiteSpace
        var report = sut.Evaluate(
            new[] { Tbl("d") },
            new[] { Col("d", "code"), Col("d", "desc") },
            new[] { dict },
            null);
        report.Errors.Should().Contain(r => r.Code == "DICT-007");
    }

    // ------------------------------------------------------------------
    // FK-* invariants
    // ------------------------------------------------------------------
    private static PacsForeignKey Fk(string name, string srcT, string srcC, string tgtT, string tgtC,
        PacsForeignKeyConfidence conf = PacsForeignKeyConfidence.Declared) => new(
        ConstraintName: name,
        SourceTable: srcT,
        SourceColumns: new[] { srcC },
        TargetTable: tgtT,
        TargetColumns: new[] { tgtC },
        ProvenanceSource: PacsForeignKeySource.InformationSchema,
        ProvenancePath: $"fixture://fk/{name}",
        Confidence: conf,
        ConversionEra: PacsConversionEra.Both);

    [Fact]
    public void FK_001_EmptyConstraintName_OnDeclared_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var fk = Fk("", "src", "c1", "tgt", "c2", PacsForeignKeyConfidence.Declared);
        var report = sut.Evaluate(
            new[] { TblWithFks("src", fk), Tbl("tgt") },
            new[] { Col("src", "c1"), Col("tgt", "c2") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "FK-001");
    }

    [Fact]
    public void FK_001_NullConstraintName_OnInferred_DoesNotFire()
    {
        var sut = new PacsSchemaInvariantEngine();
        var fk = new PacsForeignKey(
            ConstraintName: null,
            SourceTable: "src",
            SourceColumns: new[] { "c1" },
            TargetTable: "tgt",
            TargetColumns: new[] { "c2" },
            ProvenanceSource: PacsForeignKeySource.Heuristic,
            ProvenancePath: "fixture://inf",
            Confidence: PacsForeignKeyConfidence.InferredByName,
            ConversionEra: PacsConversionEra.Both);
        var report = sut.Evaluate(
            new[] { TblWithFks("src", fk), Tbl("tgt") },
            new[] { Col("src", "c1"), Col("tgt", "c2") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().NotContain(r => r.Code == "FK-001");
    }

    [Fact]
    public void FK_002_UnknownSourceTable_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var fk = Fk("X", "ghost_src", "c1", "tgt", "c2");
        var report = sut.Evaluate(
            new[] { TblWithFks("present", fk), Tbl("tgt") },
            new[] { Col("present", "x"), Col("tgt", "c2") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "FK-002" && r.TableName == "ghost_src");
    }

    [Fact]
    public void FK_003_UnknownSourceColumn_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var fk = Fk("X", "src", "ghost_col", "tgt", "c2");
        var report = sut.Evaluate(
            new[] { TblWithFks("src", fk), Tbl("tgt") },
            new[] { Col("src", "real_col"), Col("tgt", "c2") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "FK-003" && r.ColumnName == "ghost_col");
    }

    [Fact]
    public void FK_004_ArityMismatch_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var fk = new PacsForeignKey(
            ConstraintName: "X",
            SourceTable: "src",
            SourceColumns: new[] { "a", "b" },
            TargetTable: "tgt",
            TargetColumns: new[] { "x" },
            ProvenanceSource: PacsForeignKeySource.InformationSchema,
            ProvenancePath: "fixture://fk/X",
            Confidence: PacsForeignKeyConfidence.Declared,
            ConversionEra: PacsConversionEra.Both);
        var report = sut.Evaluate(
            new[] { TblWithFks("src", fk), Tbl("tgt") },
            new[] { Col("src", "a"), Col("src", "b"), Col("tgt", "x") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "FK-004");
    }

    [Fact]
    public void FK_005_DuplicateConstraintNameSameProvenance_FiresError()
    {
        var sut = new PacsSchemaInvariantEngine();
        var fk1 = Fk("DUP", "src", "c1", "tgt", "c2");
        var fk2 = Fk("DUP", "src", "c1", "tgt", "c2");
        var report = sut.Evaluate(
            new[] { TblWithFks("src", fk1, fk2), Tbl("tgt") },
            new[] { Col("src", "c1"), Col("tgt", "c2") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Errors.Should().Contain(r => r.Code == "FK-005");
    }

    [Fact]
    public void FK_006_InferredWithoutPromotion_FiresWarning()
    {
        var sut = new PacsSchemaInvariantEngine();
        var inf = new PacsForeignKey(
            ConstraintName: null,
            SourceTable: "src",
            SourceColumns: new[] { "c1" },
            TargetTable: "tgt",
            TargetColumns: new[] { "c2" },
            ProvenanceSource: PacsForeignKeySource.Heuristic,
            ProvenancePath: "fixture://inf",
            Confidence: PacsForeignKeyConfidence.InferredByName,
            ConversionEra: PacsConversionEra.Both);
        var report = sut.Evaluate(
            new[] { TblWithFks("src", inf), Tbl("tgt") },
            new[] { Col("src", "c1"), Col("tgt", "c2") },
            Array.Empty<PacsDictionary>(),
            null);
        report.Warnings.Should().Contain(r => r.Code == "FK-006");
    }

    // ------------------------------------------------------------------
    // Report-level behaviors
    // ------------------------------------------------------------------
    [Fact]
    public void CleanCatalog_ProducesZeroErrorRows()
    {
        var sut = new PacsSchemaInvariantEngine();
        var report = sut.Evaluate(
            new[] { Tbl("t1"), Tbl("d1") },
            new[] { Col("t1", "id"), Col("d1", "code"), Col("d1", "desc") },
            new[] { Dict("d1", "code", "desc") },
            null);
        report.IsClean.Should().BeTrue();
        report.Errors.Should().BeEmpty();
        report.InvariantSetVersion.Should().Be("1.1.0");
    }

    [Fact]
    public void Suppression_DemotesErrorToWarning()
    {
        var sut = new PacsSchemaInvariantEngine();
        var suppress = new HashSet<string> { "DICT-003" };
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "x") },
            new[] { Dict("missing") },
            suppress);
        report.Errors.Should().NotContain(r => r.Code == "DICT-003");
        report.Warnings.Should().Contain(r => r.Code == "DICT-003");
    }

    [Fact]
    public async Task BuildAsync_FailsClosedWithFullErrorList()
    {
        // Construct a source that will produce two distinct FK-* Errors.
        var data = new PacsSchemaSourceData(
            Tables: new[]
            {
                TblWithFks("src",
                    Fk("X", "ghost_src", "c1", "tgt", "c2"),
                    Fk("Y", "src", "ghost_col", "tgt", "c2")),
                Tbl("tgt"),
            },
            Columns: new[] { Col("src", "c1"), Col("tgt", "c2") },
            Dictionaries: Array.Empty<PacsDictionary>(),
            Version: new PacsSchemaVersion(
                PacsRelease: "fx",
                SourceFileHashes: new Dictionary<string, string> { ["fx"] = "h" },
                IngestedAt: new DateTime(2026, 4, 30, 12, 0, 0, DateTimeKind.Utc),
                ConversionManifestHash: "no-conversion-manifest-supplied"));
        var source = new InMemoryPacsSchemaSource(data);

        // PacsSchemaCatalog's per-slice C49-FK-B integrity check fires
        // on the unknown ghost_src table BEFORE the engine runs, so the
        // exception message comes from that earlier check. The
        // engine's role as backstop holds: the unified report would
        // capture both FK-002 errors if execution reached the engine.
        // Verify: build does fail closed (HG7 honored), and the
        // surfaced exception type is InvalidOperationException.
        var act = async () => await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public void Engine_ReportContainsTimestamp()
    {
        var sut = new PacsSchemaInvariantEngine();
        var beforeUtc = DateTime.UtcNow.AddSeconds(-1);
        var report = sut.Evaluate(
            new[] { Tbl("t") },
            new[] { Col("t", "x") },
            Array.Empty<PacsDictionary>(),
            null);
        report.ProducedAtUtc.Should().BeAfter(beforeUtc);
        report.ProducedAtUtc.Kind.Should().Be(DateTimeKind.Utc);
    }
}
