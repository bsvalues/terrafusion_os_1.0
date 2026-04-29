using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: source abstraction for the
/// <c>pacs_schema_catalog</c>. The catalog is constructed by
/// <see cref="PacsSchemaCatalog.BuildAsync"/> from any
/// implementation of this interface, separating "where the bytes
/// come from" (filesystem / fixture / future Tyler-version-specific
/// adapter) from "the parsed shape the catalog exposes".
///
/// <para>This slice (C48-B) ships an in-memory fixture
/// implementation (<see cref="InMemoryPacsSchemaSource"/>) suitable
/// for tests and initial DI wiring. The production
/// Tyler-file-parsing source is C48-C territory; that slice will
/// declare actual file paths.</para>
/// </summary>
public interface IPacsSchemaSource
{
    /// <summary>
    /// Asynchronously reads the source's tables, columns,
    /// dictionaries, and version stamp. Implementations MUST honor
    /// the catalog's hard guards even at the source layer:
    /// <list type="bullet">
    /// <item>HG1: do not load parcel rows or PII into the returned
    /// records.</item>
    /// <item>HG2: do not embed <c>CountyId</c>; PACS schema is
    /// county-agnostic.</item>
    /// <item>HG6: every returned record carries a non-empty
    /// provenance path / line.</item>
    /// </list>
    /// </summary>
    Task<PacsSchemaSourceData> ReadAsync(CancellationToken ct);
}

/// <summary>
/// Slice C48-B: snapshot returned by an <see cref="IPacsSchemaSource"/>
/// containing the four classes of catalog metadata the parser
/// produces. The shape is intentionally flat and immutable; the
/// catalog's index structures are built from this on
/// <see cref="PacsSchemaCatalog.BuildAsync"/>.
/// </summary>
/// <param name="Tables">All PACS tables declared by the source.</param>
/// <param name="Columns">All PACS columns declared by the source. Each MUST reference an existing table by <see cref="PacsColumn.TableName"/>.</param>
/// <param name="Dictionaries">All PACS dictionaries declared by the source.</param>
/// <param name="Version">Version stamp identifying the source bytes + ingest moment.</param>
public sealed record PacsSchemaSourceData(
    IReadOnlyList<PacsTable> Tables,
    IReadOnlyList<PacsColumn> Columns,
    IReadOnlyList<PacsDictionary> Dictionaries,
    PacsSchemaVersion Version);
