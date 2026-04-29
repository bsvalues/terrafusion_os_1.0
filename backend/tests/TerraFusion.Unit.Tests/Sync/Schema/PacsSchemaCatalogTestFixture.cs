using System;
using System.Collections.Generic;
using TerraFusion.Sync.Workbench.Schema;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C48-B: shared in-memory fixture for
/// <see cref="PacsSchemaCatalog"/> tests. Provides representative
/// PACS-shaped tables, columns, and dictionaries so HG1–HG7 and
/// lookup behavior can be exercised without depending on Tyler
/// files (which live outside the repo per C48-A's source-of-truth
/// boundary).
///
/// <para>The fixture is intentionally small (3 tables, 1
/// dictionary, ~10 columns) — it proves the parser machinery, not
/// the Tyler ingest. C48-C will provide a real-Tyler-files fixture
/// alongside the production source.</para>
/// </summary>
internal static class PacsSchemaCatalogTestFixture
{
    internal const string SchemaVersionFixturePath = "fixture://c48b-test-fixture";

    /// <summary>
    /// Builds a representative <see cref="PacsSchemaSourceData"/>
    /// approximating PACS sales-chain shape: a <c>chg_of_owner</c>
    /// table with composite identity, a <c>sale</c> table with
    /// dictionary FK into <c>sl_ratio_type_cd_lookup</c>, and an
    /// <c>imprv</c> table illustrating the 2017 conversion era
    /// distinction.
    /// </summary>
    internal static PacsSchemaSourceData BuildRepresentative()
    {
        var sale_ratio_type_dict_ref = new PacsDictionaryReference(
            LocalColumn: "sl_ratio_type_cd",
            DictionaryTable: "sl_ratio_type_cd_lookup",
            DictionaryKeyColumn: "sl_ratio_type_cd");

        var tables = new List<PacsTable>
        {
            new(
                TableName: "chg_of_owner",
                IdentityTuple: new[] { "chg_of_owner_id" },
                ConversionEra: PacsConversionEra.Both,
                DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
                PiiClassification: PiiClassification.Indirect,
                ProvenancePath: SchemaVersionFixturePath + "#chg_of_owner"),
            new(
                TableName: "sale",
                IdentityTuple: new[] { "chg_of_owner_id" },
                ConversionEra: PacsConversionEra.Both,
                DictionaryReferences: new[] { sale_ratio_type_dict_ref },
                PiiClassification: PiiClassification.None,
                ProvenancePath: SchemaVersionFixturePath + "#sale"),
            new(
                TableName: "imprv",
                IdentityTuple: new[] { "prop_id", "imprv_id" },
                ConversionEra: PacsConversionEra.Both,
                DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
                PiiClassification: PiiClassification.None,
                ProvenancePath: SchemaVersionFixturePath + "#imprv"),
        };

        var columns = new List<PacsColumn>
        {
            new(
                TableName: "chg_of_owner",
                ColumnName: "chg_of_owner_id",
                DeclaredType: "int",
                Nullable: false,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#chg_of_owner.chg_of_owner_id",
                Notes: ""),
            new(
                TableName: "chg_of_owner",
                ColumnName: "grantor_cv",
                DeclaredType: "varchar(150)",
                Nullable: true,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.Direct,
                ProvenanceLine: SchemaVersionFixturePath + "#chg_of_owner.grantor_cv",
                Notes: "Concatenated grantor name (PII)."),
            new(
                TableName: "sale",
                ColumnName: "chg_of_owner_id",
                DeclaredType: "int",
                Nullable: false,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#sale.chg_of_owner_id",
                Notes: ""),
            new(
                TableName: "sale",
                ColumnName: "sl_ratio_type_cd",
                DeclaredType: "varchar(5)",
                Nullable: true,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: sale_ratio_type_dict_ref,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#sale.sl_ratio_type_cd",
                Notes: "FK into sl_ratio_type_cd_lookup."),
            new(
                TableName: "sale",
                ColumnName: "wac_cd",
                DeclaredType: "varchar(5)",
                Nullable: true,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#sale.wac_cd",
                Notes: "WAC qualification code."),
            new(
                TableName: "imprv",
                ColumnName: "imprv_id",
                DeclaredType: "int",
                Nullable: false,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#imprv.imprv_id",
                Notes: ""),
            new(
                TableName: "imprv",
                ColumnName: "imprv_state_cd",
                DeclaredType: "varchar(5)",
                Nullable: true,
                ConversionEra: PacsConversionEra.Pre2017,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#imprv.imprv_state_cd",
                Notes: "Pre-2017 column; readers crossing the cut MUST branch on era."),
            new(
                TableName: "imprv",
                ColumnName: "imprv_status_cd",
                DeclaredType: "varchar(5)",
                Nullable: true,
                ConversionEra: PacsConversionEra.Post2017,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#imprv.imprv_status_cd",
                Notes: "Post-2017 successor to imprv_state_cd."),
            new(
                TableName: "imprv",
                ColumnName: "ambiguous_legacy_flag",
                DeclaredType: "bit",
                Nullable: true,
                ConversionEra: PacsConversionEra.Unknown,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: SchemaVersionFixturePath + "#imprv.ambiguous_legacy_flag",
                Notes: "Era undeclared in the conversion manifest; treat as ambiguous."),
        };

        var dictionaries = new List<PacsDictionary>
        {
            new(
                DictionaryName: "sl_ratio_type_cd_lookup",
                KeyColumn: "sl_ratio_type_cd",
                DescriptionColumn: "sl_ratio_type_desc",
                ValueDomainSize: 12,
                ConversionEra: PacsConversionEra.Both,
                ProvenancePath: SchemaVersionFixturePath + "#sl_ratio_type_cd_lookup"),
        };

        var version = new PacsSchemaVersion(
            TylerRelease: "PACS-9.0.4-fixture",
            SourceFileHashes: new Dictionary<string, string>
            {
                [SchemaVersionFixturePath] = "deadbeef" + new string('0', 56),
            },
            IngestedAt: new DateTime(2026, 4, 29, 12, 0, 0, DateTimeKind.Utc),
            ConversionManifestHash: "cafef00d" + new string('0', 56));

        return new PacsSchemaSourceData(tables, columns, dictionaries, version);
    }
}
