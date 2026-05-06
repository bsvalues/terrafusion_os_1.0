using System;
using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsImprvAttr;

/// <summary>
/// ATTR-DRAIN-1: thread-safe refreshable variant of
/// <see cref="IImprvAttrDictionary"/>. Atomic swap-in of a new
/// vocabulary set without restarting the host.
///
/// <para>The original <see cref="InMemoryImprvAttrDictionary"/> is
/// immutable — fine for tests and for fixed configurations, but a
/// production singleton needs to absorb dictionary refreshes from
/// PACS without a process bounce. This implementation wraps an
/// <see cref="IReadOnlySet{T}"/> field under a single atomic
/// reference assignment; readers see either the old set in full
/// or the new set in full, never a torn state.</para>
/// </summary>
public sealed class RefreshableImprvAttrDictionary : IImprvAttrDictionary
{
    private IReadOnlySet<string> _codes;

    public RefreshableImprvAttrDictionary(IEnumerable<string>? initialCodes = null)
    {
        _codes = new HashSet<string>(
            initialCodes ?? Array.Empty<string>(),
            StringComparer.Ordinal);
    }

    public bool Contains(string code)
    {
        // Snapshot the reference once for the duration of this call;
        // even if Refresh swaps under us, this read sees a consistent set.
        var snapshot = Volatile.Read(ref _codes);
        return !string.IsNullOrEmpty(code) && snapshot.Contains(code);
    }

    public int Count => Volatile.Read(ref _codes).Count;

    /// <summary>
    /// Atomically swap the recognized vocabulary. Subsequent
    /// <see cref="Contains"/> calls see the new set.
    /// </summary>
    public void Refresh(IEnumerable<string> codes)
    {
        ArgumentNullException.ThrowIfNull(codes);
        var next = new HashSet<string>(codes, StringComparer.Ordinal);
        Volatile.Write(ref _codes, next);
    }
}
