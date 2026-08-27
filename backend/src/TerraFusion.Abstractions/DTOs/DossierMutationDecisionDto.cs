using System.Text.Json.Serialization;

namespace TerraFusion.Abstractions.DTOs;

public abstract record DossierMutationDecisionRequest
{
  public required string SchemaVersion { get; init; }
  public required DossierMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required string ActorId { get; init; }
  public required DateTimeOffset EffectiveAt { get; init; }
  public string? TraceId { get; init; }
  public required DossierMutationHostAssertions HostAssertions { get; init; }
}

public sealed record DossierMutationHostAssertions
{
  public required bool ActorAuthorized { get; init; }
  public required bool CountyExists { get; init; }
  public required bool ParcelExists { get; init; }
  public required bool PiiApproved { get; init; }
}

public sealed record DossierCreateNoteDecisionRequest : DossierMutationDecisionRequest
{
  public required DossierCreateNoteCommand Command { get; init; }
}

public sealed record DossierCreateNoteCommand
{
  public required string NoteId { get; init; }
  public required long ExpectedVersion { get; init; }
  public required string Content { get; init; }
  public string? NoteType { get; init; }
}

public sealed record DossierRegisterDocumentDecisionRequest : DossierMutationDecisionRequest
{
  public required DossierRegisterDocumentCommand Command { get; init; }
}

public sealed record DossierRegisterDocumentCommand
{
  public required string DocumentId { get; init; }
  public required long ExpectedVersion { get; init; }
  public required string Name { get; init; }
  public required string DocumentType { get; init; }
  public required string MimeType { get; init; }
  public required long SizeBytes { get; init; }
  public required string ContentHash { get; init; }
  public string? Description { get; init; }
  public string? RetentionClass { get; init; }
  public string? StoragePath { get; init; }
}

public sealed record DossierTransitionDocumentStatusDecisionRequest : DossierMutationDecisionRequest
{
  public required DossierTransitionDocumentStatusCommand Command { get; init; }
}

public sealed record DossierTransitionDocumentStatusCommand
{
  public required string DocumentId { get; init; }
  public required long ExpectedVersion { get; init; }
  public required DossierDocumentStateSnapshot Current { get; init; }
  public required string RequestedStatus { get; init; }
  public string? Reason { get; init; }
}

public sealed record DossierDocumentStateSnapshot
{
  public required string DocumentId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required string Status { get; init; }
  public required long Version { get; init; }
  public required DateTimeOffset UpdatedAt { get; init; }
}

public sealed record DossierRegisterEvidenceDecisionRequest : DossierMutationDecisionRequest
{
  public required DossierRegisterEvidenceCommand Command { get; init; }
}

public sealed record DossierRegisterEvidenceCommand
{
  public required string EvidenceId { get; init; }
  public required string GenesisEventId { get; init; }
  public required long ExpectedVersion { get; init; }
  public required string Title { get; init; }
  public required string EvidenceType { get; init; }
  public string? DocumentId { get; init; }
  public DossierEvidenceDocumentSnapshot? Document { get; init; }
  public required string GenesisHash { get; init; }
}

public sealed record DossierEvidenceDocumentSnapshot
{
  public required string DocumentId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required string Status { get; init; }
  public required long Version { get; init; }
}

public sealed record DossierAppendCustodyEventDecisionRequest : DossierMutationDecisionRequest
{
  public required DossierAppendCustodyEventCommand Command { get; init; }
}

public sealed record DossierAppendCustodyEventCommand
{
  public required string EvidenceId { get; init; }
  public required string EventId { get; init; }
  public required long ExpectedVersion { get; init; }
  public required DossierEvidenceCustodySnapshot Current { get; init; }
  public required string Action { get; init; }
  public string? Notes { get; init; }
  public required string PreviousEventHash { get; init; }
  public required string EventHash { get; init; }
}

public sealed record DossierEvidenceCustodySnapshot
{
  public required string EvidenceId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required string Integrity { get; init; }
  public required long Version { get; init; }
  public required int ChainLength { get; init; }
  public required string LastEventHash { get; init; }
  public required DateTimeOffset LastEventAt { get; init; }
}

public sealed record DossierCreatePacketDecisionRequest : DossierMutationDecisionRequest
{
  public required DossierCreatePacketCommand Command { get; init; }
}

public sealed record DossierCreatePacketCommand
{
  public required string PacketId { get; init; }
  public required long ExpectedVersion { get; init; }
  public required DossierPacketTemplateSnapshot Template { get; init; }
  public required IReadOnlyList<DossierPacketDocumentSnapshot> CurrentDocuments { get; init; }
}

public sealed record DossierPacketTemplateSnapshot
{
  public required string PacketType { get; init; }
  public required string Name { get; init; }
  public required IReadOnlyList<string> RequiredDocumentTypes { get; init; }
}

public sealed record DossierPacketDocumentSnapshot
{
  public required string DocumentId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required string DocumentType { get; init; }
  public required string Status { get; init; }
  public required long Version { get; init; }
  public required DateTimeOffset UploadedAt { get; init; }
}

public abstract record DossierAcceptedMutation
{
  public required long Version { get; init; }
}

public sealed record DossierCreateNoteMutation : DossierAcceptedMutation
{
  public required string NoteId { get; init; }
  public required string Content { get; init; }
  public required string NoteType { get; init; }
  public required string CreatedBy { get; init; }
  public required DateTimeOffset CreatedAt { get; init; }
}

public sealed record DossierRegisterDocumentMutation : DossierAcceptedMutation
{
  public required string DocumentId { get; init; }
  public required string Name { get; init; }
  public required string DocumentType { get; init; }
  public required DossierDocumentStatus Status { get; init; }
  public required string MimeType { get; init; }
  public required long SizeBytes { get; init; }
  public required string ContentHash { get; init; }
  public string? Description { get; init; }
  public string? RetentionClass { get; init; }
  public string? StoragePath { get; init; }
  public required bool EntersCustodyChain { get; init; }
  public required string UploadedBy { get; init; }
  public required DateTimeOffset UploadedAt { get; init; }
}

public sealed record DossierTransitionDocumentStatusMutation : DossierAcceptedMutation
{
  public required string DocumentId { get; init; }
  public required DossierDocumentStatus Status { get; init; }
  public required DateTimeOffset UpdatedAt { get; init; }
}

public sealed record DossierRegisterEvidenceMutation : DossierAcceptedMutation
{
  public required string EvidenceId { get; init; }
  public required string Title { get; init; }
  public required string EvidenceType { get; init; }
  public string? DocumentId { get; init; }
  public required DossierEvidenceIntegrity Integrity { get; init; }
  public required string CreatedBy { get; init; }
  public required DateTimeOffset CreatedAt { get; init; }
  public required DossierCustodyEventMutation GenesisEvent { get; init; }
  public required int ChainLength { get; init; }
}

public sealed record DossierAppendCustodyEventMutation : DossierAcceptedMutation
{
  public required string EvidenceId { get; init; }
  public required DossierEvidenceIntegrity Integrity { get; init; }
  public required DossierCustodyEventMutation Event { get; init; }
  public required int ChainLength { get; init; }
}

public sealed record DossierCustodyEventMutation
{
  public required string EventId { get; init; }
  public required string Action { get; init; }
  public required string Actor { get; init; }
  public string? Notes { get; init; }
  public required string PreviousEventHash { get; init; }
  public required string EventHash { get; init; }
  public required DateTimeOffset Timestamp { get; init; }
}

public sealed record DossierCreatePacketMutation : DossierAcceptedMutation
{
  public required string PacketId { get; init; }
  public required string PacketType { get; init; }
  public required string Name { get; init; }
  public required DossierPacketStatus Status { get; init; }
  public required decimal CompletenessPercent { get; init; }
  public required int SatisfiedCount { get; init; }
  public required int TotalRequired { get; init; }
  public required string CreatedBy { get; init; }
  public required DateTimeOffset CreatedAt { get; init; }
  public required IReadOnlyList<DossierPacketItemMutation> Items { get; init; }
}

public sealed record DossierPacketItemMutation
{
  public required string DocumentType { get; init; }
  public required bool Required { get; init; }
  public required bool Satisfied { get; init; }
  public string? DocumentId { get; init; }
  public DateTimeOffset? SatisfiedAt { get; init; }
}

public sealed record DossierMutationAcceptedDecision<TMutation> where TMutation : DossierAcceptedMutation
{
  public required string SchemaVersion { get; init; }
  public required DossierMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public string? TraceId { get; init; }
  public required DossierMutationDecision Decision { get; init; }
  public required TMutation Mutation { get; init; }
  public required IReadOnlyList<DossierMutationViolation> Violations { get; init; }
}

public sealed record DossierMutationRejectedDecision
{
  public required string SchemaVersion { get; init; }
  public required DossierMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public string? TraceId { get; init; }
  public required DossierMutationDecision Decision { get; init; }
  public required IReadOnlyList<DossierMutationViolation> Violations { get; init; }
}

public sealed record DossierMutationViolation
{
  public required DossierMutationViolationCode Code { get; init; }
  public required string Message { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<DossierMutationOperation>))]
public enum DossierMutationOperation
{
  createNote,
  registerDocument,
  transitionDocumentStatus,
  registerEvidence,
  appendCustodyEvent,
  createPacket,
}

[JsonConverter(typeof(JsonStringEnumConverter<DossierMutationDecision>))]
public enum DossierMutationDecision
{
  accepted,
  rejected,
}

[JsonConverter(typeof(JsonStringEnumConverter<DossierDocumentStatus>))]
public enum DossierDocumentStatus { active, sealed, archived }

[JsonConverter(typeof(JsonStringEnumConverter<DossierEvidenceIntegrity>))]
public enum DossierEvidenceIntegrity { pending, verified, disputed }

[JsonConverter(typeof(JsonStringEnumConverter<DossierPacketStatus>))]
public enum DossierPacketStatus { draft, complete }

[JsonConverter(typeof(JsonStringEnumConverter<DossierMutationViolationCode>))]
public enum DossierMutationViolationCode
{
  HOST_ASSERTION_FAILED,
  INVALID_INPUT,
  INVALID_STATUS,
  INVALID_TRANSITION,
  INVALID_CURRENT_STATE,
  IDENTITY_MISMATCH,
  VERSION_CONFLICT,
  HASH_CHAIN_CONFLICT,
  DUPLICATE_TEMPLATE_REQUIREMENT,
}
