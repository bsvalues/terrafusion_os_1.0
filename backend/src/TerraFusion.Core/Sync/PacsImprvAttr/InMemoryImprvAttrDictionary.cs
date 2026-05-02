using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Sync.PacsImprvAttr;

/// <summary>
/// Slice C1-C: simple in-memory <see cref="IImprvAttrDictionary"/>.
/// Production v1 wires this with a configured set; tests inject
/// arbitrary vocabularies. A DB-backed implementation is a future
/// D1 concern.
/// </summary>
public sealed class InMemoryImprvAttrDictionary : IImprvAttrDictionary
{
    private readonly IReadOnlySet<string> _codes;

    public InMemoryImprvAttrDictionary(IEnumerable<string> codes)
    {
        ArgumentNullException.ThrowIfNull(codes);
        _codes = new HashSet<string>(codes, StringComparer.Ordinal);
    }

    public bool Contains(string code)
        => !string.IsNullOrEmpty(code) && _codes.Contains(code);

    public int Count => _codes.Count;
}
