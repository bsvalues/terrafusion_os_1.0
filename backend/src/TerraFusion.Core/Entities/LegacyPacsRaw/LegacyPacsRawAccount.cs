using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice B1-A: raw PACS <c>account</c> landing zone.
///
/// <para>The PACS doctrine: <c>account</c> is the global party/entity
/// identity record. One row per person OR organization. The
/// <c>file_as_name</c> column is the assessor's display label
/// ("Smith, John &amp; Mary" or "Acme Corp"); <see cref="FirstName"/>
/// and <see cref="LastName"/> are populated for natural persons but
/// may be NULL for organizations. <see cref="AcctId"/> is the source-
/// side primary key.</para>
///
/// <para>This row carries the rich PII surface: driver's license
/// number, state, email, plus two flags
/// (<see cref="WebSuppression"/> and <see cref="ConfidentialFlag"/>)
/// that govern downstream public-display redaction. The doctrine
/// keeps PII verbatim at the raw layer so audit traces are complete;
/// redaction is the canonical-layer's job (Block B's later slices).</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> and
/// <see cref="SourceQueryHash"/> must be present on every landed row.
/// The <c>provenance-coverage</c> gate verifies this from the
/// database itself.</para>
/// </summary>
public sealed class LegacyPacsRawAccount
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity ──────────────────────────────────────
    /// <summary>PACS-side primary key. Source-side UNIQUE.</summary>
    public long AcctId { get; set; }

    // ── Display + name surface ────────────────────────────────────
    /// <summary>Assessor's display label. Always present.</summary>
    public string? FileAsName { get; set; }

    /// <summary>Natural-person first name. NULL for organizations.</summary>
    public string? FirstName { get; set; }

    /// <summary>Natural-person last name. NULL for organizations.</summary>
    public string? LastName { get; set; }

    // ── PII surface — preserved verbatim at this layer ────────────
    public string? DlNum { get; set; }
    public string? DlState { get; set; }
    public string? EmailAddr { get; set; }

    // ── Redaction flags (consulted by canonical-layer projection) ─
    /// <summary>
    /// Public-suppress flag. When true, downstream public-display
    /// surfaces hide the row even if other fields are not
    /// confidential.
    /// </summary>
    public bool WebSuppression { get; set; }

    /// <summary>
    /// Full PII confidential flag. When true, downstream canonical
    /// projection must blank PII fields and substitute the display
    /// name with "[Confidential]".
    /// </summary>
    public bool ConfidentialFlag { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
