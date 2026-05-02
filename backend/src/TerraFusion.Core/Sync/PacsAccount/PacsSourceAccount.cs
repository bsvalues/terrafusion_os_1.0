namespace TerraFusion.Core.Sync.PacsAccount;

/// <summary>
/// Slice B1-A: source-shaped PACS account row, before landing.
/// All fields preserved verbatim from the PACS source.
/// </summary>
public sealed record PacsSourceAccount(
    long AcctId,
    string? FileAsName,
    string? FirstName,
    string? LastName,
    string? DlNum,
    string? DlState,
    string? EmailAddr,
    bool WebSuppression,
    bool ConfidentialFlag);
