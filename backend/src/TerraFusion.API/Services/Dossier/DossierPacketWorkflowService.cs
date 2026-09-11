using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TerraFusion.API.DTOs;
using TerraFusion.Core.Entities;
using IAppealService = TerraFusion.Core.Services.IAppealService;
using TerraFusion.Data;

namespace TerraFusion.API.Services.Dossier;

/// <summary>Authenticated host snapshots and durable receipts. All packet judgments run in the suite.</summary>
public sealed class DossierPacketWorkflowService(TerraFusionDbContext db, IDossierPacketWorkflowDecisionPort decisions, IAppealService appeals)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static JsonObject Node(object value) => JsonSerializer.SerializeToNode(value, Json)!.AsObject();
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    private static DossierWorkflowException Missing() => new(404, "PACKET_NOT_FOUND", "No packet exists in this county, year and parcel.");
    private static DossierWorkflowException Conflict(string message) => new(409, "REVISION_CONFLICT", message);
    private static DossierWorkflowException Invalid(string message) => new(400, "INVALID_INPUT", message);

    public async Task<JsonObject> ListPacketsAsync(Guid countyId, int taxYear, string parcelId, CancellationToken ct)
    {
        if (countyId == Guid.Empty || taxYear is < 1900 or > 2200 || string.IsNullOrWhiteSpace(parcelId) || parcelId.Length > 50)
            throw Invalid("Explicit county/year/parcel identity required.");
        var packets = await db.DossierPackets.AsNoTracking().Where(x => x.CountyId == countyId && x.TaxYear == taxYear && x.ParcelId == parcelId)
            .OrderBy(x => x.Name).ThenBy(x => x.Id).Select(x => new { packetId = x.Id, x.Name, x.Status }).ToArrayAsync(ct);
        return Node(new { countyId, taxYear, parcelId, packets });
    }

    public Task<JsonObject> GetPacketAsync(DossierPacketScope scope, string actor, CancellationToken ct) => Transaction(async () =>
    {
        var source = await Load(scope, actor, "read-" + Guid.NewGuid().ToString("N"), ct);
        var result = await decisions.DecideAsync(source.Request, ct);
        RequireSelectedBasis(source.Packet, source.Request, result);
        JsonObject? handoff = null;
        if (source.Packet.Status == "sealed" && result["decision"]?.GetValue<string>() == "accepted")
        {
            var rows = await db.DossierWorkflowRecords.AsNoTracking().Where(x => x.CountyId == scope.CountyId && x.TaxYear == scope.TaxYear && x.Kind == "packet-handoff").ToListAsync(ct);
            var currentSealId = source.Request["finalization"]?["finalizationId"]?.GetValue<string>();
            var latest = rows.Where(x =>
                {
                    var payload = Payload(x);
                    return currentSealId != null && payload["packetId"]?.GetValue<string>() == scope.PacketId.ToString("D") &&
                        payload["packetRevision"]?.GetValue<string>() == source.Revision &&
                        payload["finalizationId"]?.GetValue<string>() == currentSealId;
                })
                .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id).FirstOrDefault();
            if (latest != null)
            {
                var prepared = await GetPreparedHandoffAsync(scope.CountyId, scope.TaxYear, scope.ParcelId, latest.Id, source.Revision, ct);
                handoff = JsonNode.Parse(prepared.EnvelopeJson)!.AsObject();
            }
        }
        return new JsonObject { ["countyId"] = scope.CountyId.ToString("D"), ["taxYear"] = scope.TaxYear,
            ["parcelId"] = scope.ParcelId, ["packetId"] = scope.PacketId.ToString("D"), ["name"] = source.Packet.Name,
            ["revision"] = source.Revision, ["status"] = result["status"]?.DeepClone(), ["packetStatus"] = source.Packet.Status,
            ["narrative"] = source.Request["narrative"]!.DeepClone(), ["evidence"] = source.Request["evidence"]!.DeepClone(),
            ["decision"] = result.DeepClone(), ["finalization"] = source.Request["finalization"]?.DeepClone(), ["handoff"] = handoff };
    }, ct);

    public Task<JsonObject> SaveNarrativeAsync(DossierPacketScope scope, string actor, DossierPacketNarrativeCommand command, CancellationToken ct) => Transaction(async () =>
    {
        ValidateCommand(command.RequestId, command.ExpectedRevision, actor);
        if (command.Content == null || command.Content.Length > 16000) throw Invalid("Narrative must be at most16000 characters.");
        var requestHash = Hash(JsonSerializer.Serialize(new { scope, actor, command }, Json));
        var prior = await Retry(scope.CountyId, command.RequestId, requestHash, ct);
        if (prior != null) return Payload(prior);
        var source = await Load(scope, actor, command.RequestId, ct);
        if (source.Revision != command.ExpectedRevision) throw Conflict("Source revision changed; reload before saving.");
        if (source.Packet.Status == "sealed") throw Conflict("Reopen the sealed packet before editing its narrative.");
        var id = Guid.NewGuid(); var now = DateTime.UtcNow;
        var payload = Node(new { recordId = id, packetId = scope.PacketId, scope.CountyId, scope.TaxYear, scope.ParcelId,
            content = command.Content, revision = Hash(command.Content), recordedAt = now, recordedBy = actor });
        AddRecord(scope, actor, command.RequestId, requestHash, "packet-narrative", source.Revision, id, now, payload);
        await db.SaveChangesAsync(ct);
        return payload;
    }, ct);

    public Task<JsonObject> FinalizeAsync(DossierPacketScope scope, string actor, DossierPacketCommand command, CancellationToken ct) =>
        DecideAndPersist(scope, actor, command, "finalize", "packet-finalization", ct);

    public Task<JsonObject> PrepareAsync(DossierPacketScope scope, string actor, DossierPacketCommand command, CancellationToken ct) =>
        DecideAndPersist(scope, actor, command, "prepare", "packet-handoff", ct);

    public Task<JsonObject> ReviseAsync(DossierPacketScope scope, string actor, DossierPacketReviseCommand command, CancellationToken ct) => Transaction(async () =>
    {
        ValidateCommand(command.RequestId, command.ExpectedRevision, actor);
        if (string.IsNullOrWhiteSpace(command.Reason) || command.Reason.Length > 2000) throw Invalid("A bounded revision reason is required.");
        var requestHash = Hash(JsonSerializer.Serialize(new { scope, actor, command, operation = "revise" }, Json));
        var prior = await Retry(scope.CountyId, command.RequestId, requestHash, ct);
        if (prior != null) return Payload(prior);
        var source = await Load(scope, actor, command.RequestId, ct);
        if (source.Revision != command.ExpectedRevision) throw Conflict("Source revision changed; reload before reopening.");
        source.Request["operation"] = "revise"; source.Request["revisionReason"] = command.Reason;
        var result = await decisions.DecideAsync(source.Request, ct);
        RequireAccepted(result);
        if (result["status"]?.GetValue<string>() != "draft") throw new DossierWorkflowException(503, "INVALID_CANONICAL_RESULT", "Canonical revise did not return draft.");
        var id = Guid.NewGuid(); var now = DateTime.UtcNow;
        var payload = Node(new { recordId = id, scope.PacketId, scope.CountyId, scope.TaxYear, scope.ParcelId,
            packetRevision = source.Revision, reason = command.Reason, status = "draft", recordedAt = now, recordedBy = actor,
            previousFinalizationId = source.Request["finalization"]?["finalizationId"]?.GetValue<string>(), provenance = decisions.Provenance(command.RequestId) });
        source.Packet.Status = "draft"; source.Packet.UpdatedAt = now;
        AddRecord(scope, actor, command.RequestId, requestHash, "packet-revision", source.Revision, id, now, payload);
        await db.SaveChangesAsync(ct);
        return payload;
    }, ct);

    private Task<JsonObject> DecideAndPersist(DossierPacketScope scope, string actor, DossierPacketCommand command, string operation, string kind, CancellationToken ct) => Transaction(async () =>
    {
        ValidateCommand(command.RequestId, command.ExpectedRevision, actor);
        var requestHash = Hash(JsonSerializer.Serialize(new { scope, actor, command, operation }, Json));
        var prior = await Retry(scope.CountyId, command.RequestId, requestHash, ct);
        if (prior != null) return Payload(prior);
        var source = await Load(scope, actor, command.RequestId, ct);
        if (source.Revision != command.ExpectedRevision) throw Conflict("Packet sources changed; reload before continuing.");
        var id = Guid.NewGuid(); var now = DateTime.UtcNow;
        source.Request["operation"] = operation;
        source.Request["effectiveAt"] = now.ToString("O");
        source.Request[operation == "prepare" ? "handoffId" : "finalizationId"] = id.ToString("D");
        source.Request["contractId"] = operation == "prepare" ? "dossier.appeal-handoff" : "dossier.packet-finalization";
        var result = await decisions.DecideAsync(source.Request, ct);
        RequireAccepted(result);
        var payload = result[operation == "prepare" ? "handoff" : "snapshot"]?.DeepClone().AsObject()
            ?? throw new DossierWorkflowException(503, "INVALID_CANONICAL_RESULT", "Canonical decision omitted its artifact.");
        RequireSelectedBasis(source.Packet, source.Request, result);
        if (payload["packetId"]?.GetValue<string>() != scope.PacketId.ToString("D") || payload["countyId"]?.GetValue<string>() != scope.CountyId.ToString("D") ||
            payload["taxYear"]?.GetValue<int>() != scope.TaxYear || payload["parcelId"]?.GetValue<string>() != scope.ParcelId ||
            payload["packetRevision"]?.GetValue<string>() != source.Revision || payload[operation == "prepare" ? "handoffId" : "finalizationId"]?.GetValue<string>() != id.ToString("D"))
            throw new DossierWorkflowException(503, "INVALID_CANONICAL_RESULT", "Canonical artifact identity does not match its request.");
        if (operation == "finalize") { source.Packet.Status = "sealed"; source.Packet.UpdatedAt = now; }
        AddRecord(scope, actor, command.RequestId, requestHash, kind, source.Revision, id, now, payload);
        await db.SaveChangesAsync(ct);
        return payload;
    }, ct);

    public Task<DossierPreparedHandoff> GetPreparedHandoffAsync(Guid countyId, int taxYear, string parcelId, Guid handoffId, string expectedPacketRevision, CancellationToken ct) => Transaction(async () =>
    {
        var row = await db.DossierWorkflowRecords.AsNoTracking().SingleOrDefaultAsync(x => x.Id == handoffId && x.CountyId == countyId && x.TaxYear == taxYear && x.Kind == "packet-handoff", ct) ?? throw Missing();
        var envelope = Payload(row);
        if (envelope["parcelId"]?.GetValue<string>() != parcelId || envelope["packetRevision"]?.GetValue<string>() != expectedPacketRevision) throw Conflict("Handoff does not match requested parcel/revision.");
        var scope = new DossierPacketScope(countyId, taxYear, parcelId, Guid.Parse(envelope["packetId"]!.GetValue<string>()));
        var source = await Load(scope, row.CreatedBy, row.RequestId, ct);
        if (source.Revision != expectedPacketRevision) throw Conflict("Handoff sources changed since preparation.");
        source.Request["contractId"] = "dossier.appeal-handoff"; source.Request["operation"] = "prepare";
        source.Request["handoffId"] = handoffId.ToString("D"); source.Request["effectiveAt"] = envelope["preparedAt"]!.DeepClone();
        source.Request["actorId"] = envelope["preparedBy"]!.DeepClone();
        var checkedResult = await decisions.DecideAsync(source.Request, ct);
        RequireAccepted(checkedResult);
        RequireSelectedBasis(source.Packet, source.Request, checkedResult);
        if (!JsonNode.DeepEquals(envelope, checkedResult["handoff"])) throw Conflict("Persisted handoff no longer matches the canonical source decision.");
        return new DossierPreparedHandoff(row.PayloadJson, row.ContentHash, new(countyId, taxYear, parcelId, scope.PacketId,
            source.Revision, Guid.Parse(envelope["finalizationId"]!.GetValue<string>()), source.Packet.Status));
    }, ct);

    public Task<DossierPacketAppealLink> LinkAppealAsync(Guid countyId, int taxYear, string parcelId, Guid handoffId, string expectedPacketRevision,
        Guid appealId, string requestId, string actor, CancellationToken ct) => Transaction(async () =>
    {
        ValidateCommand(requestId, expectedPacketRevision, actor);
        var handoff = await GetPreparedHandoffAsync(countyId, taxYear, parcelId, handoffId, expectedPacketRevision, ct);
        var scope = new DossierPacketScope(countyId, taxYear, parcelId, handoff.CurrentPacket.PacketId);
        var requestHash = Hash(JsonSerializer.Serialize(new { scope, actor, handoffId, expectedPacketRevision, appealId, kind = "packet-appeal-link" }, Json));
        var prior = await Retry(countyId, requestId, requestHash, ct);
        if (prior != null) return Payload(prior).Deserialize<DossierPacketAppealLink>(Json)!;
        // Resolve through the Dais-owned service. Dais persists within its transaction before linking.
        var appeal = await appeals.GetByIdAsync(appealId, countyId);
        if (appeal == null || appeal.CountyId != countyId || appeal.TaxYear != taxYear || appeal.ParcelId != parcelId) throw Missing();
        var packet = await db.DossierPackets.SingleAsync(x => x.Id == scope.PacketId && x.CountyId == countyId, ct);
        if (packet.AppealId.HasValue && packet.AppealId != appealId) throw Conflict("Packet is already linked to a different appeal.");
        var link = new DossierPacketAppealLink(packet.Id, appealId, handoffId, expectedPacketRevision, Guid.NewGuid());
        packet.AppealId = appealId; packet.UpdatedAt = DateTime.UtcNow;
        AddRecord(scope, actor, requestId, requestHash, "packet-appeal-link", expectedPacketRevision, link.ReceiptId, DateTime.UtcNow, Node(link));
        await db.SaveChangesAsync(ct);
        return link;
    }, ct);

    private static void RequireAccepted(JsonObject result)
    {
        if (result["decision"]?.GetValue<string>() == "accepted") return;
        var violation = result["violations"]?.AsArray().FirstOrDefault();
        throw new DossierWorkflowException(409, violation?["code"]?.GetValue<string>() ?? "CANONICAL_REFUSAL", violation?["message"]?.GetValue<string>() ?? "Canonical packet decision refused the operation.");
    }

    private static void RequireSelectedBasis(DossierPacket packet, JsonObject request, JsonObject result)
    {
        if (result["decision"]?.GetValue<string>() != "accepted") return;
        // Compare the suite's selection with persisted selection; never choose documents in the host.
        var items = result["snapshot"]?["items"] as JsonArray ?? result["readiness"]?["items"] as JsonArray ??
            (request["operation"]?.GetValue<string>() == "prepare" ? request["finalization"]?["items"] as JsonArray : null)
            ?? throw new DossierWorkflowException(503, "INVALID_CANONICAL_RESULT", "Canonical decision omitted its selected basis.");
        var persisted = packet.Items.Select(x => JsonSerializer.Serialize(new { documentType = x.DocumentType,
            required = x.Required, satisfied = x.Satisfied, documentId = x.DocumentId?.ToString("D") }, Json))
            .OrderBy(x => x, StringComparer.Ordinal);
        var selected = items.Select(x => JsonSerializer.Serialize(new { documentType = x!["documentType"]!.GetValue<string>(),
            required = x["required"]!.GetValue<bool>(), satisfied = x["satisfied"]!.GetValue<bool>(),
            documentId = x["documentId"]?.GetValue<string>() }, Json)).OrderBy(x => x, StringComparer.Ordinal);
        // SatisfiedAt is host workflow metadata, not the suite's document upload time; both are bound
        // independently by the source revision and canonical snapshot rather than treated as equal.
        if (!persisted.SequenceEqual(selected, StringComparer.Ordinal))
            throw new DossierWorkflowException(409, "PACKET_SELECTION_MISMATCH", "Persisted packet selection does not match the canonical selected basis.");
    }

    // These database columns store UTC. SQLite materializes them as Unspecified, not local time.
    private static DateTime StoredUtc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private async Task<(DossierPacket Packet, JsonObject Request, string Revision)> Load(DossierPacketScope scope, string actor, string commandId, CancellationToken ct)
    {
        if (scope.CountyId == Guid.Empty || scope.PacketId == Guid.Empty || scope.TaxYear is < 1900 or > 2200 || string.IsNullOrWhiteSpace(scope.ParcelId) || scope.ParcelId.Length > 50) throw Invalid("Explicit packet county/year/parcel identity required.");
        var packet = await db.DossierPackets.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == scope.PacketId && x.CountyId == scope.CountyId && x.TaxYear == scope.TaxYear && x.ParcelId == scope.ParcelId, ct) ?? throw Missing();
        if (!await db.Properties.AnyAsync(x => x.CountyId == scope.CountyId && x.ParcelId == scope.ParcelId, ct)) throw Missing();
        var documents = await db.DossierDocuments.AsNoTracking().Where(x => x.CountyId == scope.CountyId && x.ParcelId == scope.ParcelId).OrderBy(x => x.Id).ToListAsync(ct);
        var evidence = await db.DossierEvidenceItems.AsNoTracking().Where(x => x.CountyId == scope.CountyId && x.ParcelId == scope.ParcelId).OrderBy(x => x.Id).ToListAsync(ct);
        if (documents.Count > 1000 || evidence.Count > 1000) throw Invalid("Packet source snapshot exceeds the bounded1000-record limit.");
        var references = packet.Items.Where(x => x.DocumentId.HasValue).Select(x => x.DocumentId!.Value)
            .Concat(evidence.Where(x => x.DocumentId.HasValue).Select(x => x.DocumentId!.Value)).Distinct();
        if (references.Any(id => documents.All(x => x.Id != id))) throw Conflict("A packet/evidence document reference does not resolve in the packet scope.");
        var rows = await db.DossierWorkflowRecords.AsNoTracking().Where(x => x.CountyId == scope.CountyId && x.TaxYear == scope.TaxYear &&
            (x.Kind == "packet-narrative" || x.Kind == "packet-finalization")).ToListAsync(ct);
        var scoped = rows.Where(x => Payload(x)["packetId"]?.GetValue<string>() == scope.PacketId.ToString("D")).OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id).ToArray();
        var narrativeRow = scoped.FirstOrDefault(x => x.Kind == "packet-narrative");
        var content = narrativeRow == null ? "" : Payload(narrativeRow)["content"]!.GetValue<string>();
        var narrative = new { content, revision = narrativeRow?.ContentHash ?? Hash(""), contentHash = Hash(content) };
        var docs = documents.Select(x => new { documentId = x.Id, x.CountyId, taxYear = scope.TaxYear, x.ParcelId, x.DocumentType, x.Status,
            uploadedAt = StoredUtc(x.UploadedAt).ToString("O"), revision = Hash(JsonSerializer.Serialize(new { x.Id, x.Version, x.ContentHash, x.Status, x.UpdatedAt }, Json)), contentHash = x.ContentHash }).ToArray();
        var items = new JsonArray(evidence.Select(x => (JsonNode)Node(new { evidenceId = x.Id,
            revision = Hash(JsonSerializer.Serialize(new { x.Id, x.Version, x.Integrity, x.Title, x.DocumentId }, Json)),
            contentHash = x.DocumentId.HasValue ? documents.Single(d => d.Id == x.DocumentId).ContentHash : Hash(JsonSerializer.Serialize(new { x.Id, x.Title, x.EvidenceType, x.Integrity }, Json)),
            x.CountyId, taxYear = scope.TaxYear, x.ParcelId })).ToArray());
        for (var index = 0; index < evidence.Count; index++) if (evidence[index].DocumentId.HasValue) items[index]!["documentId"] = evidence[index].DocumentId!.Value.ToString("D");
        var template = new { packet.PacketType, name = packet.Name, requiredDocumentTypes = packet.Items.Where(x => x.Required).OrderBy(x => x.DocumentType, StringComparer.Ordinal).Select(x => x.DocumentType).ToArray() };
        var packetItems = packet.Items.OrderBy(x => x.Id).Select(x => new { x.Id, x.PacketId, x.DocumentType,
            x.DocumentId, x.Required, x.Satisfied, satisfiedAt = x.SatisfiedAt.HasValue ? StoredUtc(x.SatisfiedAt.Value).ToString("O") : null }).ToArray();
        var sourceJson = JsonSerializer.Serialize(new { scope, packet.PacketType, packet.Name, template, packetItems, documents = docs, narrative, evidence = items }, Json);
        var revision = Hash(sourceJson);
        var request = Node(new { schemaVersion = "1.0.0", contractId = "dossier.packet-finalization", operation = "evaluate", commandId,
            scope.CountyId, scope.TaxYear, scope.ParcelId, actorId = actor, effectiveAt = DateTime.UtcNow.ToString("O"), expectedRevision = revision, traceId = commandId,
            hostAssertions = new { actorAuthorized = true, countyExists = true, parcelExists = true, piiApproved = true },
            packet = new { packetId = packet.Id, packet.CountyId, taxYear = scope.TaxYear, packet.ParcelId, packet.PacketType, packet.Name, packet.Status, revision },
            template, currentDocuments = docs, narrative, evidence = items, provenance = decisions.Provenance(commandId) });
        var seal = scoped.FirstOrDefault(x => x.Kind == "packet-finalization");
        if (seal != null) request["finalization"] = Payload(seal);
        return (packet, request, revision);
    }

    private async Task<DossierWorkflowRecord?> Retry(Guid county, string requestId, string hash, CancellationToken ct)
    {
        var prior = await db.DossierWorkflowRecords.AsNoTracking().SingleOrDefaultAsync(x => x.CountyId == county && x.RequestId == requestId, ct);
        if (prior != null && prior.RequestHash != hash) throw Conflict("RequestId already belongs to different inputs or actor.");
        return prior;
    }
    private static JsonObject Payload(DossierWorkflowRecord row)
    {
        if (Hash(row.PayloadJson) != row.ContentHash) throw new DossierWorkflowException(409, "CONTENT_HASH_MISMATCH", "Stored packet receipt integrity failed.");
        return JsonNode.Parse(row.PayloadJson)!.AsObject();
    }
    private void AddRecord(DossierPacketScope scope, string actor, string requestId, string requestHash, string kind, string revision, Guid id, DateTime now, JsonObject payload)
    {
        var json = payload.ToJsonString(Json); var hash = Hash(json);
        db.DossierWorkflowRecords.Add(new DossierWorkflowRecord { Id = id, CountyId = scope.CountyId, TaxYear = scope.TaxYear, Kind = kind,
            RequestId = requestId, RequestHash = requestHash, Revision = revision, ContentHash = hash, PayloadJson = json, CreatedBy = actor, CreatedAt = now });
        db.AuditLogs.Add(new AuditLog { Id = Guid.NewGuid(), Type = "DOSSIER_PACKET:" + kind, Source = nameof(DossierPacketWorkflowService),
            UserId = actor, CorrelationId = requestId, Timestamp = now, Data = JsonSerializer.Serialize(new { recordId = id, scope.CountyId, scope.TaxYear, scope.ParcelId, scope.PacketId, revision, contentHash = hash }, Json) });
    }
    private static void ValidateCommand(string requestId, string revision, string actor)
    {
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 200 || requestId != requestId.Trim() || string.IsNullOrWhiteSpace(actor) || actor.Length > 200 ||
            revision == null || !System.Text.RegularExpressions.Regex.IsMatch(revision, "^[a-f0-9]{64}$")) throw Invalid("Request identity, actor and exact revision are required.");
    }
    private Task<T> Transaction<T>(Func<Task<T>> action, CancellationToken ct) => db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
    {
        if (db.Database.CurrentTransaction != null)
        {
            if (db.Database.CurrentTransaction.GetDbTransaction().IsolationLevel != IsolationLevel.Serializable)
                throw new DossierWorkflowException(409, "TRANSACTION_ISOLATION_REQUIRED", "Packet operations require the caller's Serializable transaction.");
            return await action();
        }
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try { var result = await action(); await transaction.CommitAsync(ct); return result; }
        catch { await transaction.RollbackAsync(CancellationToken.None); db.ChangeTracker.Clear(); throw; }
    });
}
