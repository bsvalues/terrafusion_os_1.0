using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Services.Dossier;

/// <summary>Snapshots existing records only. No valuation, certification or custody decisions.</summary>
public sealed class DossierWorkflowService(TerraFusionDbContext db)
{
    private const string DraftKind = "assessment-draft";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    { Converters = { new JsonStringEnumConverter() } };

    public async Task<object> Context(Guid county, int? year, string? parcel, CancellationToken ct)
    {
        if (year.HasValue) Year(year.Value);
        var studies = await db.CountyStudySessions.AsNoTracking().Where(x => x.CountyId == county).ToListAsync(ct);
        var years = studies.Select(x => x.TaxYear)
            .Concat(await db.ValuationRecords.Where(x => x.CountyId == county).Select(x => x.TaxYear).Distinct().ToListAsync(ct))
            .Concat(await db.Appeals.Where(x => x.CountyId == county).Select(x => x.TaxYear).Distinct().ToListAsync(ct))
            .Concat(await db.CertificationSteps.Where(x => x.CountyId == county).Select(x => x.TaxYear).Distinct().ToListAsync(ct))
            .Distinct().OrderByDescending(x => x).ToArray();
        var records = await db.DossierWorkflowRecords.AsNoTracking()
            .Where(x => x.CountyId == county && (!year.HasValue || x.TaxYear == year)).ToListAsync(ct);
        return new { countyId = county, taxYears = years,
            studies = studies.Where(x => !year.HasValue || x.TaxYear == year).OrderBy(x => x.StudyId)
                .Select(x => new { x.StudyId, x.TaxYear, status = x.Status.ToString(), x.BaselineVersion }),
            drafts = records.Where(x => x.Kind == DraftKind).OrderByDescending(x => x.CreatedAt).Select(DraftSummary),
            exports = records.Where(x => x.Kind != DraftKind).OrderByDescending(x => x.CreatedAt).Select(ExportSummary) };
    }

    public async Task<object> CreateDraft(Guid county, string actor, AssessmentDraftRequest request, CancellationToken ct)
    {
        if (request.StudyId == Guid.Empty) throw Invalid("studyId is required.");
        var record = await Persist(county, actor, request.RequestId, DraftKind, request, async () =>
        {
            var study = await db.CountyStudySessions.AsNoTracking().SingleOrDefaultAsync(x => x.StudyId == request.StudyId && x.CountyId == county, ct)
                ?? throw Missing();
            var valuations = await db.ValuationRecords.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == study.TaxYear).ToListAsync(ct);
            if (valuations.Count == 0 || valuations.Any(x => x.FinalReconciledValue == null))
                throw Incomplete("The study year needs persisted reconciled valuation records.");
            var artifacts = new List<WorkflowArtifact> { Capture(study, study.StudyId, county, study.TaxYear) };
            Add(artifacts, valuations, x => x.Id, county, study.TaxYear);
            Add(artifacts, await db.CountyScenarios.AsNoTracking().Where(x => x.CountyId == county && x.StudyId == study.StudyId).ToListAsync(ct), x => x.ScenarioId, county, study.TaxYear);
            await AddPackets(artifacts, county, study.TaxYear, null, null, ct);
            return new WorkflowPayload(county, study.TaxYear, DraftKind, study.StudyId, null, null, null, null, null, actor, DateTime.UtcNow, Ordered(artifacts));
        }, ct);
        return DraftSummary(record);
    }

    public async Task<object> GetDraft(Guid county, Guid id, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        if (row.Kind != DraftKind) throw Missing();
        var payload = Payload(row);
        return new { draftId = row.Id, row.StudyId, row.CountyId, row.TaxYear, row.Revision,
            artifactCount = payload.Artifacts.Count, row.CreatedAt, payload.Artifacts };
    }

    public async Task<object> Equalization(Guid county, string actor, EqualizationExportRequest request, CancellationToken ct)
    {
        Confirm(request.Confirmed, request.ReasonCode); Year(request.TaxYear);
        if (request.DraftId == Guid.Empty || string.IsNullOrWhiteSpace(request.Revision)) throw Invalid("draftId and revision are required.");
        var row = await Persist(county, actor, request.RequestId, "equalization", request, async () =>
        {
            var draft = await Find(county, request.DraftId, ct);
            if (draft.Kind != DraftKind) throw Missing();
            if (draft.TaxYear != request.TaxYear || draft.Revision != request.Revision) throw Conflict("Draft year or revision does not match.");
            var source = Payload(draft);
            if (source.Artifacts.Count == 0) throw Incomplete("Draft has no stored artifacts.");
            return new WorkflowPayload(county, draft.TaxYear, "equalization", draft.StudyId, draft.Id, draft.Revision,
                null, null, request.ReasonCode, actor, DateTime.UtcNow, source.Artifacts);
        }, ct);
        return ExportSummary(row);
    }

    public async Task<object> Audit(Guid county, string actor, AuditBundleRequest request, CancellationToken ct)
    {
        Confirm(request.Confirmed, request.ReasonCode); Year(request.TaxYear);
        if (request.BundleScope is not ("county" or "parcel" or "appeal")) throw Invalid("Unknown bundleScope.");
        if ((request.BundleScope == "county") != string.IsNullOrWhiteSpace(request.SubjectId)) throw Invalid("subjectId must match bundleScope.");
        var row = await Persist(county, actor, request.RequestId, "audit", request, async () =>
        {
            var artifacts = new List<WorkflowArtifact>();
            string? parcel = request.BundleScope == "parcel" ? request.SubjectId : null;
            Guid? appealId = null;
            if (request.BundleScope == "appeal")
            {
                if (!Guid.TryParseExact(request.SubjectId, "D", out var parsed)) throw Invalid("subjectId must be an appeal GUID.");
                appealId = parsed;
                var appeal = await Appeal(county, parsed, request.TaxYear, null, ct);
                parcel = appeal.ParcelId;
                artifacts.Add(Capture(appeal, appeal.Id, county, request.TaxYear));
            }
            else
            {
                Add(artifacts, await db.Appeals.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == request.TaxYear && (parcel == null || x.ParcelId == parcel)).ToListAsync(ct), x => x.Id, county, request.TaxYear);
                if (parcel == null)
                {
                    var studies = await db.CountyStudySessions.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == request.TaxYear).ToListAsync(ct);
                    Add(artifacts, studies, x => x.StudyId, county, request.TaxYear);
                    var ids = studies.Select(x => x.StudyId).ToArray();
                    Add(artifacts, await db.CountyScenarios.AsNoTracking().Where(x => x.CountyId == county && ids.Contains(x.StudyId)).ToListAsync(ct), x => x.ScenarioId, county, request.TaxYear);
                    Add(artifacts, await db.CertificationSteps.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == request.TaxYear).ToListAsync(ct), x => x.Id, county, request.TaxYear);
                }
            }
            var packets = await AddPackets(artifacts, county, request.TaxYear, parcel, appealId, ct);
            if (appealId.HasValue && packets.Count == 0) throw Missing();
            if (artifacts.Count == 0) throw Incomplete("No persisted records exist for the requested scope and year.");
            return new WorkflowPayload(county, request.TaxYear, "audit", null, null, null, request.BundleScope,
                request.SubjectId, request.ReasonCode, actor, DateTime.UtcNow, Ordered(artifacts));
        }, ct);
        return ExportSummary(row);
    }

    public async Task<object> GetExport(Guid county, Guid id, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        if (row.Kind == DraftKind) throw Missing();
        return ExportSummary(row);
    }

    public async Task<string> Content(Guid county, Guid id, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        if (row.Kind == DraftKind) throw Missing();
        _ = Payload(row);
        return row.PayloadJson;
    }

    private async Task<DossierWorkflowRecord> Persist(Guid county, string actor, string requestId, string kind, object request,
        Func<Task<WorkflowPayload>> assemble, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 200 || requestId != requestId.Trim()) throw Invalid("A requestId of 1-200 characters is required.");
        var requestHash = Hash(JsonSerializer.Serialize(new { kind, actor, request }, Json));
        // Provider execution strategies retain their normal transient retry handling. A database unique
        // constraint, not an in-memory cache, owns request identity across processes and restarts.
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
            try
            {
                var prior = await db.DossierWorkflowRecords.AsNoTracking().SingleOrDefaultAsync(x => x.CountyId == county && x.RequestId == requestId, ct);
                if (prior != null)
                {
                    if (prior.RequestHash != requestHash) throw Conflict("requestId was already used with different inputs.");
                    _ = Payload(prior);
                    return prior;
                }
                var payload = await assemble();
                var json = JsonSerializer.Serialize(payload, Json);
                var hash = Hash(json);
                var row = new DossierWorkflowRecord { CountyId = county, Kind = kind, TaxYear = payload.TaxYear,
                    StudyId = payload.StudyId, DraftId = payload.DraftId, RequestId = requestId, RequestHash = requestHash,
                    Revision = payload.SourceRevision ?? hash, ContentHash = hash, PayloadJson = json,
                    CreatedBy = actor, CreatedAt = payload.CreatedAt };
                db.DossierWorkflowRecords.Add(row);
                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                return row;
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                db.ChangeTracker.Clear();
                throw;
            }
        });
    }

    private async Task<DossierWorkflowRecord> Find(Guid county, Guid id, CancellationToken ct) =>
        await db.DossierWorkflowRecords.AsNoTracking().SingleOrDefaultAsync(x => x.CountyId == county && x.Id == id, ct) ?? throw Missing();

    private async Task<Appeal> Appeal(Guid county, Guid id, int year, string? parcel, CancellationToken ct) =>
        await db.Appeals.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.CountyId == county &&
            x.TaxYear == year && (parcel == null || x.ParcelId == parcel), ct) ?? throw Missing();

    private async Task<List<DossierPacket>> AddPackets(List<WorkflowArtifact> artifacts, Guid county, int year,
        string? parcel, Guid? appeal, CancellationToken ct, Guid? packetId = null)
    {
        var packets = await db.DossierPackets.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == year &&
            (parcel == null || x.ParcelId == parcel) && (!appeal.HasValue || x.AppealId == appeal) &&
            (!packetId.HasValue || x.Id == packetId)).OrderBy(x => x.Id).ToListAsync(ct);
        foreach (var packet in packets)
        {
            if (packet.AppealId.HasValue) _ = await Appeal(county, packet.AppealId.Value, year, packet.ParcelId, ct);
            artifacts.Add(Capture(packet, packet.Id, county, year));
            var items = await db.DossierPacketItems.AsNoTracking().Where(x => x.PacketId == packet.Id).ToListAsync(ct);
            if (items.Count == 0) throw Incomplete("A packet has no persisted items.");
            Add(artifacts, items, x => x.Id, county, year);
            var ids = items.Where(x => x.DocumentId.HasValue).Select(x => x.DocumentId!.Value).Distinct().ToArray();
            var documents = await db.DossierDocuments.AsNoTracking().Where(x => x.CountyId == county && x.ParcelId == packet.ParcelId && ids.Contains(x.Id)).ToListAsync(ct);
            if (documents.Count != ids.Length || items.Any(x => x.Required && (!x.Satisfied || !x.DocumentId.HasValue)))
                throw Incomplete("A packet is missing required documents or has invalid document scope.");
            Add(artifacts, documents, x => x.Id, county, year);
            var evidence = await db.DossierEvidenceItems.AsNoTracking().Where(x => x.CountyId == county && x.ParcelId == packet.ParcelId && x.DocumentId.HasValue && ids.Contains(x.DocumentId.Value)).ToListAsync(ct);
            Add(artifacts, evidence, x => x.Id, county, year);
            var evidenceIds = evidence.Select(x => x.Id).ToArray();
            Add(artifacts, await db.DossierCustodyEvents.AsNoTracking().Where(x => x.CountyId == county && evidenceIds.Contains(x.EvidenceId)).ToListAsync(ct), x => x.Id, county, year);
        }
        // A document/evidence item may be referenced by several packets. Store each actual JSON once.
        var distinct = artifacts.DistinctBy(x => x.Name).ToArray();
        artifacts.Clear(); artifacts.AddRange(distinct);
        return packets;
    }

    public async Task<object> AppealPacket(Guid county, Guid appealId, int year, string? parcel, CancellationToken ct)
    {
        Year(year);
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var appeal = await Appeal(county, appealId, year, parcel, ct);
        var packet = await db.DossierPackets.AsNoTracking().Where(x => x.CountyId == county && x.AppealId == appealId &&
            x.TaxYear == year && x.ParcelId == appeal.ParcelId).OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id).FirstOrDefaultAsync(ct)
            ?? throw Missing();
        var artifacts = new List<WorkflowArtifact>();
        await AddPackets(artifacts, county, year, appeal.ParcelId, appealId, ct, packet.Id);
        var itemIds = await db.DossierPacketItems.Where(x => x.PacketId == packet.Id).Select(x => x.DocumentId).ToListAsync(ct);
        var documents = artifacts.Where(x => x.Name.StartsWith("DossierDocuments/", StringComparison.Ordinal) && itemIds.Contains(Guid.Parse(x.SourceId))).ToArray();
        var docIds = documents.Select(x => x.SourceId).ToHashSet();
        var evidence = artifacts.Where(x => x.Name.StartsWith("DossierEvidenceItems/", StringComparison.Ordinal) &&
            x.Content.GetProperty("record").GetProperty("documentId").ValueKind == JsonValueKind.String &&
            docIds.Contains(x.Content.GetProperty("record").GetProperty("documentId").GetString()!)).ToArray();
        var evidenceIds = evidence.Select(x => x.SourceId).ToHashSet();
        return (object)new { countyId = county, taxYear = year, appealId, parcelId = appeal.ParcelId, packetRef = packet.Id,
            payloadRef = $"/api/dossier/workflows/appeals/{appealId:D}/packet?county={county:D}&taxYear={year}&parcelId={Uri.EscapeDataString(appeal.ParcelId)}",
            packet = new { sourceTable = "DossierPackets", sourceId = packet.Id, countyId = county, taxYear = year,
                artifactType = "persisted-record-metadata", record = Capture(packet, packet.Id, county, year).Content.GetProperty("record"),
                items = artifacts.Where(x => x.Name.StartsWith("DossierPacketItems/", StringComparison.Ordinal)).Select(x => x.Content) },
            documents = documents.Select(x => x.Content),
            evidence = evidence.Select(x => x.Content), custody = artifacts.Where(x => x.Name.StartsWith("DossierCustodyEvents/", StringComparison.Ordinal) &&
                evidenceIds.Contains(x.Content.GetProperty("record").GetProperty("evidenceId").GetString()!)).Select(x => x.Content) };
        });
    }

    public async Task<object> MorningBrief(Guid county, int year, string role, CancellationToken ct)
    {
        Year(year);
        var queue = role switch { "chief_appraiser" or "residential_analyst" or "commercial_analyst" => "calibration_review",
            "gis_analyst" => "morning_brief", "field_appraiser" => "parcel_correction", "appeals_specialist" => "appeal_packet",
            "assessor_leadership" => "certification", _ => throw Invalid("Unknown assessor role.") };
        var findings = new List<object>();
        void Finding(Guid id, string table, string status, string scope, string? parcel, DateTime updatedAt, string action) => findings.Add(new
        {
            findingId = $"{table}:{id:D}", findingType = "NO_ACTION", scope, severity = "low", confidence = 1.0,
            countyId = county, taxYear = year, evidenceLineage = new[] { new { source = table, asOf = updatedAt,
                recordCount = 1, citation = $"{table}/{id:D}" } }, affectedParcelIds = parcel == null ? Array.Empty<string>() : new[] { parcel },
            recommendedAction = action, assignedRole = role, sourceStatus = status
        });
        if (role is "appeals_specialist" or "assessor_leadership")
            foreach (var appeal in await db.Appeals.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == year && x.Status != "decided" && x.Status != "withdrawn").OrderBy(x => x.Id).ToListAsync(ct))
                Finding(appeal.Id, "Appeals", appeal.Status, "appeal", appeal.ParcelId, appeal.UpdatedAt, "Review the persisted appeal and its explicitly linked packet.");
        if (role == "assessor_leadership")
            foreach (var step in await db.CertificationSteps.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == year && x.Status != "completed").OrderBy(x => x.Id).ToListAsync(ct))
                Finding(step.Id, "CertificationSteps", step.Status, "county", null, step.UpdatedAt, $"Review certification step {step.StepCode} ({step.Status}) in Dais.");
        if (role is "chief_appraiser" or "residential_analyst" or "commercial_analyst")
            foreach (var study in await db.CountyStudySessions.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == year && x.Status != StudyStatus.Archived).OrderBy(x => x.StudyId).ToListAsync(ct))
                Finding(study.StudyId, "CountyStudySessions", study.Status.ToString(), "county", null, study.UpdatedAt, "Review the existing study in County Studio.");
        return new { countyId = county, taxYear = year,
            brief = new { role, queueType = queue, priority = "low", dueWindow = "No deadline inferred", blockingDependencies = Array.Empty<string>(),
                recommendedTool = role == "appeals_specialist" ? "open_appeal_packet" : "generate_morning_brief", readyToAct = findings.Count > 0 },
            findings, summary = $"{findings.Count} persisted operational record(s) for {year}.", generatedAt = DateTime.UtcNow };
    }

    private static WorkflowPayload Payload(DossierWorkflowRecord row)
    {
        if (Hash(row.PayloadJson) != row.ContentHash) throw Incomplete("Stored content integrity check failed.");
        return JsonSerializer.Deserialize<WorkflowPayload>(row.PayloadJson, Json) ?? throw Incomplete("Stored content is missing.");
    }

    private static object DraftSummary(DossierWorkflowRecord row) => new { draftId = row.Id, row.StudyId, row.CountyId,
        row.TaxYear, row.Revision, artifactCount = Payload(row).Artifacts.Count, row.CreatedAt };
    private static object ExportSummary(DossierWorkflowRecord row)
    {
        var artifacts = Payload(row).Artifacts;
        var url = $"/api/dossier/workflows/exports/{row.Id:D}/content?county={row.CountyId:D}";
        return new { packageRef = row.Id, payloadRef = url, row.CountyId, row.TaxYear, row.DraftId, row.Revision,
            artifactCount = artifacts.Count, artifacts = artifacts.Select(x => new { x.Name, x.Sha256, x.MediaType, x.SourceId }),
            row.ContentHash, downloadUrl = url, row.CreatedAt, status = "complete", certification = false };
    }

    private WorkflowArtifact Capture<T>(T entity, Guid id, Guid county, int year) where T : class
    {
        var model = db.Model.FindEntityType(typeof(T))!;
        var fields = new SortedDictionary<string, object?>(StringComparer.Ordinal);
        foreach (var property in model.GetProperties().Where(x => x.PropertyInfo != null))
            fields[JsonNamingPolicy.CamelCase.ConvertName(property.Name)] = property.PropertyInfo!.GetValue(entity);
        var content = JsonSerializer.SerializeToElement(new { sourceTable = model.GetTableName(), sourceId = id,
            countyId = county, taxYear = year, artifactType = "persisted-record-metadata", record = fields }, Json);
        return new WorkflowArtifact($"{model.GetTableName()}/{id:D}.json", Hash(content.GetRawText()), "application/json", id.ToString("D"), content);
    }

    private void Add<T>(List<WorkflowArtifact> artifacts, IEnumerable<T> rows, Func<T, Guid> id, Guid county, int year) where T : class
    { artifacts.AddRange(rows.Select(x => Capture(x, id(x), county, year))); }
    private static IReadOnlyList<WorkflowArtifact> Ordered(IEnumerable<WorkflowArtifact> artifacts) => artifacts.OrderBy(x => x.Name, StringComparer.Ordinal).ToArray();
    private static string Hash(string text) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();
    private static void Year(int year) { if (year < 1900 || year > 9999) throw Invalid("A valid selected taxYear is required."); }
    private static void Confirm(bool confirmed, string reason) { if (!confirmed || string.IsNullOrWhiteSpace(reason) || reason.Length > 200) throw Invalid("confirmed=true and reasonCode are required."); }
    private static DossierWorkflowException Invalid(string message) => new(400, "INVALID_REQUEST", message);
    private static DossierWorkflowException Missing() => new(404, "NOT_FOUND", "Record not found.");
    private static DossierWorkflowException Conflict(string message) => new(409, "CONFLICT", message);
    private static DossierWorkflowException Incomplete(string message) => new(422, "INCOMPLETE_SOURCES", message);
}
