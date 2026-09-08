using System.Text.Json.Serialization;

namespace TerraFusion.API.DTOs;

public sealed record DossierPacketScope(Guid CountyId, int TaxYear, string ParcelId, Guid PacketId);
public sealed record DossierPacketCommand(string RequestId, string ExpectedRevision);
public sealed record DossierPacketNarrativeCommand(string RequestId, string ExpectedRevision, string Content);
public sealed record DossierPacketReviseCommand(string RequestId, string ExpectedRevision, string Reason);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record DossierPacketFinalizeRequest(string? County, int? TaxYear, string? ParcelId, string RequestId, string ExpectedRevision);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record DossierPacketNarrativeRequest(string? County, int? TaxYear, string? ParcelId, string RequestId, string ExpectedRevision, string Content);
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record DossierPacketReviseRequest(string? County, int? TaxYear, string? ParcelId, string RequestId, string ExpectedRevision, string Reason);
public sealed record DossierCurrentPacket(Guid CountyId, int TaxYear, string ParcelId, Guid PacketId,
    string PacketRevision, Guid? FinalizationId, string Status);
public sealed record DossierPreparedHandoff(string EnvelopeJson, string ContentHash, DossierCurrentPacket CurrentPacket);
public sealed record DossierPacketAppealLink(Guid PacketId, Guid AppealId, Guid HandoffId, string PacketRevision, Guid ReceiptId);
