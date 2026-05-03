using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: in-memory <see cref="IPacsSchemaSource"/>. Constructs
/// a catalog from hand-supplied table / column / dictionary records
/// without any filesystem I/O.
///
/// <para>Purposes:</para>
/// <list type="bullet">
/// <item>Test harnesses build their own representative catalogs and
/// verify reader behavior without depending on operator filesystem
/// access.</item>
/// <item>Initial DI wiring while C48-C (the file-based parser) is
/// still pending — services that need <c>IPacsSchemaCatalog</c> can
/// be wired against an empty or fixture-shaped in-memory catalog
/// without blocking on real PACS schema file ingestion.</item>
/// </list>
///
/// <para>Production wiring against actual PACS schema files (Harris
/// PACS in the operator's Benton environment) is out of scope for
/// C48-B (declared by C48-A non-goals); a future file-based
/// <see cref="IPacsSchemaSource"/> implementation in C48-C will
/// replace this for production registrations once the file format
/// is confirmed with the operator.</para>
/// </summary>
public sealed class InMemoryPacsSchemaSource : IPacsSchemaSource
{
    private readonly PacsSchemaSourceData _data;

    /// <summary>
    /// Constructs an in-memory source backed by an explicit
    /// <see cref="PacsSchemaSourceData"/> snapshot. Caller-supplied
    /// data is returned verbatim by <see cref="ReadAsync"/>; the
    /// catalog's construction-time validation (HG6, HG7, integrity)
    /// runs against it as it would for any other source.
    /// </summary>
    public InMemoryPacsSchemaSource(PacsSchemaSourceData data)
    {
        _data = data;
    }

    /// <summary>
    /// Constructs an in-memory source from the four flat lists.
    /// Convenience for tests that don't already have a
    /// <see cref="PacsSchemaSourceData"/> in hand.
    /// </summary>
    public InMemoryPacsSchemaSource(
        IReadOnlyList<PacsTable> tables,
        IReadOnlyList<PacsColumn> columns,
        IReadOnlyList<PacsDictionary> dictionaries,
        PacsSchemaVersion version)
        : this(new PacsSchemaSourceData(tables, columns, dictionaries, version))
    {
    }

    /// <inheritdoc />
    public Task<PacsSchemaSourceData> ReadAsync(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult(_data);
    }
}
