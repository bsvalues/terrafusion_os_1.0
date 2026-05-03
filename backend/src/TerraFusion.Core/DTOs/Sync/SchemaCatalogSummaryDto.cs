using System;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C48-D admin/diagnostic wire shape for
/// <c>GET /api/sync/schema/catalog/summary</c>. Surfaces the live
/// PACS schema catalog's coverage counts and version stamp without
/// exposing any per-row data (HG1 PII-free).
///
/// <para>Per the C48-A Source/target model and the SCOPE-3 surface
/// inventory, this endpoint is classified as <b>Proof / Admin</b>:
/// it exists to verify the bridge is wired and queryable, NOT as a
/// consumer-facing product API. Long-term operator-facing schema
/// browsing UX would belong to Workbench/Studio per SCOPE-2.</para>
///
/// <para>When the catalog is not registered (operator has not
/// opted in via <c>ConnectionStrings:HarrisPacs</c>), the endpoint
/// returns <c>Configured = false</c> and all numeric / text fields
/// are <c>null</c>. Callers MUST handle this case gracefully —
/// "catalog not configured" is a valid runtime state during
/// development and on counties where the live catalog has not
/// been wired yet.</para>
/// </summary>
/// <param name="Configured">
/// <c>true</c> when the catalog DI registration has produced a
/// real catalog instance; <c>false</c> when the catalog is not
/// registered and the remaining fields are <c>null</c>.
/// </param>
/// <param name="TableCount">Number of tables in the catalog. <c>null</c> when not configured.</param>
/// <param name="ColumnCount">Number of columns in the catalog. <c>null</c> when not configured.</param>
/// <param name="DictionaryCount">Number of dictionaries in the catalog. <c>null</c> when not configured (note: live introspection in C48-C produces zero dictionaries; future slice adds inference).</param>
/// <param name="PacsRelease">Operator-supplied PACS release label (e.g. <c>"Harris PACS 9.0.4.2"</c>); <c>null</c> when not configured or not declared.</param>
/// <param name="IngestedAtUtc">UTC timestamp when the catalog was constructed. <c>null</c> when not configured.</param>
public sealed record SchemaCatalogSummaryDto(
    bool Configured,
    int? TableCount,
    int? ColumnCount,
    int? DictionaryCount,
    string? PacsRelease,
    DateTime? IngestedAtUtc);
