namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: per-column conversion-era flag for the
/// <c>pacs_schema_catalog</c>. Per
/// <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c> Hard Guard 5
/// (HG5 Conversion-aware), every <see cref="PacsColumn"/> carries a
/// <see cref="PacsConversionEra"/> so readers spanning the 2017 PACS
/// conversion cut MUST branch on it instead of silently producing
/// partial results.
///
/// <para>The 2017 conversion altered the population pattern of
/// several columns across the <c>imprv_*</c> family, the sales chain,
/// and the abstract-subdivision references. Readers that ingest data
/// crossing the cut without consulting this flag produce silently
/// wrong answers — the worst possible failure mode.</para>
/// </summary>
public enum PacsConversionEra
{
    /// <summary>
    /// Conversion era is not known for this column. The catalog
    /// records this when the conversion manifest does not declare
    /// the column. Readers querying an <see cref="Unknown"/> column
    /// MUST receive an explicit signal — never a silent default.
    /// (HG5 + HG7.)
    /// </summary>
    Unknown = 0,

    /// <summary>
    /// Column was populated only before the 2017 conversion. Readers
    /// running against post-2017 data MUST treat this column as
    /// effectively absent.
    /// </summary>
    Pre2017 = 1,

    /// <summary>
    /// Column was introduced or re-populated after the 2017
    /// conversion. Readers running against pre-2017 data MUST treat
    /// this column as effectively absent.
    /// </summary>
    Post2017 = 2,

    /// <summary>
    /// Column was populated continuously across the 2017 conversion
    /// cut. Safe for readers spanning the cut. The default era for
    /// stable identity columns (e.g. PK columns).
    /// </summary>
    Both = 3,
}
