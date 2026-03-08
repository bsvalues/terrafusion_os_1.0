using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services;

/// <summary>
/// R2 Wave 4: Dossier document-management and evidence chain service.
/// County-isolated. All queries scoped to the caller's county.
/// </summary>
public interface IDossierDocumentService
{
  Task<DocumentSearchResultDto> SearchDocumentsAsync(DocumentSearchRequestDto request, Guid countyId);
  Task<DossierDocumentDto?> GetDocumentAsync(string documentId, Guid countyId);
  Task<EvidenceSearchResultDto> SearchEvidenceAsync(EvidenceSearchRequestDto request, Guid countyId);
  Task<List<ChainEventDto>> GetChainOfCustodyAsync(string evidenceId, Guid countyId);
  Task<DossierStatsDto> GetStatsAsync(Guid countyId);
}

// ── Request DTOs ────────────────────────────────────────────────

public sealed class DocumentSearchRequestDto
{
  public string? Query { get; set; }
  public string? Type { get; set; }
  public string? Status { get; set; }
  public string? ParcelId { get; set; }
  public int Limit { get; set; } = 25;
  public int Offset { get; set; } = 0;
}

public sealed class EvidenceSearchRequestDto
{
  public string? ParcelId { get; set; }
  public string? EvidenceType { get; set; }
  public string? Integrity { get; set; }
  public int Limit { get; set; } = 25;
  public int Offset { get; set; } = 0;
}

// ── Response DTOs ───────────────────────────────────────────────

public sealed class DossierDocumentDto
{
  public string Id { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string Type { get; set; } = string.Empty;
  public string ParcelId { get; set; } = string.Empty;
  public string UploadedBy { get; set; } = string.Empty;
  public DateTime UploadedAt { get; set; }
  public string Size { get; set; } = string.Empty;
  public string Status { get; set; } = "active";
  public int CustodyChain { get; set; }
  public string? MimeType { get; set; }
  public string? Hash { get; set; }
}

public sealed class DocumentSearchResultDto
{
  public List<DossierDocumentDto> Results { get; set; } = new();
  public int Total { get; set; }
  public bool HasMore { get; set; }
}

public sealed class EvidenceItemDto
{
  public string Id { get; set; } = string.Empty;
  public string Title { get; set; } = string.Empty;
  public string ParcelId { get; set; } = string.Empty;
  public string EvidenceType { get; set; } = string.Empty;
  public string CreatedBy { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; }
  public string Integrity { get; set; } = "verified";
  public int ChainLength { get; set; }
  public string LastAction { get; set; } = string.Empty;
}

public sealed class EvidenceSearchResultDto
{
  public List<EvidenceItemDto> Results { get; set; } = new();
  public int Total { get; set; }
  public bool HasMore { get; set; }
}

public sealed class ChainEventDto
{
  public DateTime Timestamp { get; set; }
  public string Actor { get; set; } = string.Empty;
  public string Action { get; set; } = string.Empty;
  public string Hash { get; set; } = string.Empty;
}

public sealed class DossierStatsDto
{
  public int TotalDocuments { get; set; }
  public int ActiveDocuments { get; set; }
  public int SealedRecords { get; set; }
  public int ArchivedDocuments { get; set; }
  public int DocumentTypes { get; set; }
  public int TotalEvidence { get; set; }
  public int VerifiedEvidence { get; set; }
  public int PendingEvidence { get; set; }
  public int DisputedEvidence { get; set; }
}
