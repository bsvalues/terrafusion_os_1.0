using System.Data;
using System.Diagnostics;
using System.Reflection;
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

    public async Task<object> Context(Guid county, int? year, string? parcel, bool canReadValuations, CancellationToken ct)
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
        var visible = records.Where(x => canReadValuations || !NeedsValuationPermission(x)).ToArray();
        return new { countyId = county, taxYears = years,
            studies = studies.Where(x => !year.HasValue || x.TaxYear == year).OrderBy(x => x.StudyId)
                .Select(x => new { x.StudyId, x.TaxYear, status = x.Status.ToString(), x.BaselineVersion }),
            drafts = visible.Where(x => x.Kind == DraftKind).OrderByDescending(x => x.CreatedAt).Select(DraftSummary),
            exports = visible.Where(x => x.Kind != DraftKind).OrderByDescending(x => x.CreatedAt).Select(ExportSummary) };
    }

    public async Task<object> CreateDraft(Guid county, string actor, AssessmentDraftRequest request, WorkflowExecutionContext execution, CancellationToken ct)
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
            await AddScenariosAndCohorts(artifacts, county, study.TaxYear, [study.StudyId], ct);
            await AddPackets(artifacts, county, study.TaxYear, null, null, ct);
            return new WorkflowPayload(county, study.TaxYear, DraftKind, study.StudyId, null, null, null, null, null, actor, DateTime.UtcNow, Ordered(artifacts));
        }, execution, ct);
        return DraftSummary(record);
    }

    public async Task<string> GetDraft(Guid county, Guid id, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        if (row.Kind != DraftKind) throw Missing();
        var payload = Payload(row);
        // Use the storage encoder so embedded JSON definitions retain their hashed bytes.
        return JsonSerializer.Serialize(new { draftId = row.Id, row.StudyId, row.CountyId, row.TaxYear, row.Revision,
            artifactCount = payload.Artifacts.Count, row.CreatedAt, payload.Artifacts, payload.Receipt }, Json);
    }

    public async Task<object> Equalization(Guid county, string actor, EqualizationExportRequest request, WorkflowExecutionContext execution, CancellationToken ct)
    {
        Confirm(request.Confirmed, request.ReasonCode, audit: false); Year(request.TaxYear);
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
        }, execution, ct);
        return ExportSummary(row);
    }

    public async Task<object> Audit(Guid county, string actor, AuditBundleRequest request, WorkflowExecutionContext execution, CancellationToken ct)
    {
        Confirm(request.Confirmed, request.ReasonCode, audit: true); Year(request.TaxYear);
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
                    await AddScenariosAndCohorts(artifacts, county, request.TaxYear, ids, ct);
                    Add(artifacts, await db.CertificationSteps.AsNoTracking().Where(x => x.CountyId == county && x.TaxYear == request.TaxYear).ToListAsync(ct), x => x.Id, county, request.TaxYear);
                }
            }
            var packets = await AddPackets(artifacts, county, request.TaxYear, parcel, appealId, ct);
            if (appealId.HasValue && packets.Count == 0) throw Missing();
            if (artifacts.Count == 0) throw Incomplete("No persisted records exist for the requested scope and year.");
            return new WorkflowPayload(county, request.TaxYear, "audit", null, null, null, request.BundleScope,
                request.SubjectId, request.ReasonCode, actor, DateTime.UtcNow, Ordered(artifacts));
        }, execution, ct);
        return ExportSummary(row);
    }

    public async Task<object> GetExport(Guid county, Guid id, bool canReadValuations, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        if (row.Kind == DraftKind) throw Missing();
        RequireSourcePermission(row, canReadValuations);
        return ExportSummary(row);
    }

    public async Task<string> Content(Guid county, Guid id, bool canReadValuations, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        if (row.Kind == DraftKind) throw Missing();
        RequireSourcePermission(row, canReadValuations);
        _ = Payload(row);
        return row.PayloadJson;
    }

    public async Task<object> GetReceipt(Guid county, Guid id, bool canReadValuations, CancellationToken ct)
    {
        var row = await Find(county, id, ct);
        RequireSourcePermission(row, canReadValuations);
        var receipt = Payload(row).Receipt ?? throw Missing();
        // This exact linked audit is execution evidence, never an audit-export source input.
        var audit = await db.AuditLogs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == receipt.ExecutionEvidence.AuditLogId, ct);
        if (audit == null || audit.Source != "DossierWorkflowService" || audit.UserId != row.CreatedBy ||
            audit.CorrelationId != receipt.CorrelationId || audit.Type != $"DOSSIER_WORKFLOW:{receipt.Operation}" ||
            receipt.ReceiptId != row.Id || receipt.CountyId != row.CountyId || receipt.TaxYear != row.TaxYear)
            throw Incomplete("Persisted receipt audit linkage is unavailable.");
        JsonElement data;
        try
        {
            data = JsonSerializer.Deserialize<JsonElement>(audit.Data ?? "null", Json);
            if (data.GetProperty("recordId").GetGuid() != row.Id || data.GetProperty("contentHash").GetString() != row.ContentHash)
                throw Incomplete("Persisted receipt audit linkage does not match.");
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException or FormatException)
        { throw Incomplete("Persisted receipt audit metadata is invalid."); }
        return new { row.CountyId, row.TaxYear, receipt, executionEvidence = new { auditLogId = audit.Id,
            source = audit.Source, type = audit.Type, actorId = audit.UserId, recordedAt = audit.Timestamp, data } };
    }

    private async Task<DossierWorkflowRecord> Persist(Guid county, string actor, string requestId, string kind, object request,
        Func<Task<WorkflowPayload>> assemble, WorkflowExecutionContext execution, CancellationToken ct)
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
                var id = Guid.NewGuid();
                var auditId = Guid.NewGuid();
                var operation = kind switch { DraftKind => "assessment_draft.create", "equalization" => "export_equalization_package", _ => "export_audit_bundle" };
                var assembly = typeof(DossierWorkflowService).Assembly;
                var recordedAt = DateTime.UtcNow;
                var receipt = new WorkflowReceipt(id, "1.0", execution.CorrelationId, requestId, actor, county,
                    payload.TaxYear, operation, payload.ReasonCode, JsonSerializer.SerializeToElement(request, Json),
                    new(id, payload.StudyId, kind == DraftKind ? id : payload.DraftId, kind == DraftKind ? null : id,
                        payload.SourceRevision, payload.Artifacts.Count, payload.Artifacts.Select(x => new WorkflowArtifactReference(x.Name, x.Sha256, x.MediaType, x.SourceId)).ToArray()),
                    recordedAt, new(execution.StartedAt, Stopwatch.GetElapsedTime(execution.StartedTimestamp).TotalMilliseconds, "api-start-to-precommit-receipt"),
                    new(assembly.GetName().Version?.ToString() ?? "unavailable", assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "unavailable",
                        assembly.ManifestModule.ModuleVersionId.ToString("D"), execution.Environment),
                    new("application-db", auditId, $"/api/dossier/workflows/receipts/{id:D}?county={county:D}"),
                    new(execution.CorrelationId, $"/api/pilot/trace/{execution.CorrelationId}", "pilot", "not_verified"));
                // Final payload includes the receipt; no receipt field contains its own resulting hash.
                payload = payload with { Receipt = receipt };
                var json = JsonSerializer.Serialize(payload, Json);
                var hash = Hash(json);
                var row = new DossierWorkflowRecord { Id = id, CountyId = county, Kind = kind, TaxYear = payload.TaxYear,
                    StudyId = payload.StudyId, DraftId = payload.DraftId, RequestId = requestId, RequestHash = requestHash,
                    Revision = payload.SourceRevision ?? hash, ContentHash = hash, PayloadJson = json,
                    CreatedBy = actor, CreatedAt = payload.CreatedAt };
                db.DossierWorkflowRecords.Add(row);
                db.AuditLogs.Add(new AuditLog { Id = auditId, Type = $"DOSSIER_WORKFLOW:{operation}",
                    Source = "DossierWorkflowService", UserId = actor, CorrelationId = execution.CorrelationId, Timestamp = recordedAt,
                    Data = JsonSerializer.Serialize(new { recordId = id, receipt, contentHash = hash }, Json) });
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

    private async System.Threading.Tasks.Task AddScenariosAndCohorts(List<WorkflowArtifact> artifacts, Guid county, int year, Guid[] studyIds, CancellationToken ct)
    {
        // Called inside the same serializable transaction as study capture. Query referenced IDs
        // before county validation so malformed foreign links fail closed instead of disappearing.
        var scenarios = await db.CountyScenarios.AsNoTracking().Where(x => studyIds.Contains(x.StudyId)).ToListAsync(ct);
        if (scenarios.Any(x => x.CountyId != county)) throw Incomplete("Invalid scenario county/study reference.");
        var cohortIds = scenarios.Select(x => x.CohortId).Distinct().ToArray();
        var cohorts = await db.CountyCohorts.AsNoTracking().Where(x => cohortIds.Contains(x.CohortId)).ToDictionaryAsync(x => x.CohortId, ct);
        foreach (var scenario in scenarios)
            if (!cohorts.TryGetValue(scenario.CohortId, out var cohort) || cohort.CountyId != county || cohort.StudyId != scenario.StudyId)
                throw Incomplete("Invalid scenario cohort county/study reference.");
        Add(artifacts, scenarios, x => x.ScenarioId, county, year);
        Add(artifacts, cohorts.Values, x => x.CohortId, county, year);
    }

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

    private static bool NeedsValuationPermission(DossierWorkflowRecord row) => row.Kind is DraftKind or "equalization" ||
        Payload(row).Artifacts.Any(x => x.Name.StartsWith("ValuationRecords/", StringComparison.Ordinal) ||
            (x.Content.TryGetProperty("sourceTable", out var table) && table.GetString() == "ValuationRecords"));

    private static void RequireSourcePermission(DossierWorkflowRecord row, bool canReadValuations)
    {
        if (!canReadValuations && NeedsValuationPermission(row))
            throw new DossierWorkflowException(403, "SOURCE_PERMISSION_REQUIRED", "access:costforge is required to read stored valuation artifacts.");
    }

    private static WorkflowPayload Payload(DossierWorkflowRecord row)
    {
        if (Hash(row.PayloadJson) != row.ContentHash) throw Incomplete("Stored content integrity check failed.");
        return JsonSerializer.Deserialize<WorkflowPayload>(row.PayloadJson, Json) ?? throw Incomplete("Stored content is missing.");
    }

    private static object DraftSummary(DossierWorkflowRecord row) => new { draftId = row.Id, row.StudyId, row.CountyId,
        row.TaxYear, row.Revision, artifactCount = Payload(row).Artifacts.Count, row.CreatedAt, Payload(row).Receipt };
    private static object ExportSummary(DossierWorkflowRecord row)
    {
        var artifacts = Payload(row).Artifacts;
        var url = $"/api/dossier/workflows/exports/{row.Id:D}/content?county={row.CountyId:D}";
        return new { packageRef = row.Id, payloadRef = url, row.CountyId, row.TaxYear, row.DraftId, row.Revision,
            artifactCount = artifacts.Count, artifacts = artifacts.Select(x => new { x.Name, x.Sha256, x.MediaType, x.SourceId }),
            row.ContentHash, downloadUrl = url, row.CreatedAt, status = "complete", certification = false, Payload(row).Receipt };
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
    private static void Confirm(bool confirmed, string reason, bool audit)
    {
        // Existing operation-specific reasonCodes in tools/registry/terrapilot.tools.json.
        // No normalization or free-text fallback: direct HTTP callers retain the same controls.
        var allowed = reason is "annual_certification" or "board_directive" || (audit && reason == "legal_compliance");
        if (!confirmed || !allowed) throw Invalid("confirmed=true and an allowed operation-specific reasonCode are required.");
    }
    private static DossierWorkflowException Invalid(string message) => new(400, "INVALID_REQUEST", message);
    private static DossierWorkflowException Missing() => new(404, "NOT_FOUND", "Record not found.");
    private static DossierWorkflowException Conflict(string message) => new(409, "CONFLICT", message);
    private static DossierWorkflowException Incomplete(string message) => new(422, "INCOMPLETE_SOURCES", message);
}
