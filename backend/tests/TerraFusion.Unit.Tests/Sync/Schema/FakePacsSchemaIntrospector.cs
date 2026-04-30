using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Sync.Workbench.Schema;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C48-C: controllable in-memory fake of
/// <see cref="IPacsSchemaIntrospector"/> for
/// <see cref="LivePacsSchemaSource"/> tests. Exposes the three
/// flat lists directly so tests can construct any introspection
/// shape without going through the SQL-Server-specific code path.
/// </summary>
internal sealed class FakePacsSchemaIntrospector : IPacsSchemaIntrospector
{
    public List<IntrospectedTable> Tables { get; } = new();
    public List<IntrospectedColumn> Columns { get; } = new();
    public List<IntrospectedPrimaryKeyMember> PrimaryKeys { get; } = new();

    /// <summary>
    /// Slice C49-FK-B: declared foreign-key membership rows.
    /// </summary>
    public List<IntrospectedForeignKeyMember> ForeignKeys { get; } = new();

    public bool ReturnNullResult { get; set; }
    public int ReadInvocationCount { get; private set; }

    public Task<PacsSchemaIntrospectionResult> ReadAsync(CancellationToken ct)
    {
        ReadInvocationCount++;
        if (ReturnNullResult)
        {
            return Task.FromResult<PacsSchemaIntrospectionResult>(null!);
        }
        return Task.FromResult(new PacsSchemaIntrospectionResult(Tables, Columns, PrimaryKeys, ForeignKeys));
    }
}
