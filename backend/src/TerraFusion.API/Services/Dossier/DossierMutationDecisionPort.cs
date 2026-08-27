using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services.Dossier;

public sealed class DossierMutationDecisionPort(
    IDossierMutationProcessHost processHost,
    IOptions<DossierMutationOptions> options) : IDossierMutationDecisionPort
{
    private static readonly JsonSerializerOptions JsonOptions = CreateOptions();

    public Task<DossierMutationPortResult<DossierCreateNoteMutation>> DecideCreateNoteAsync(DossierCreateNoteDecisionRequest r, CancellationToken c = default) => DecideAsync<DossierCreateNoteDecisionRequest,DossierCreateNoteMutation>(r,c);
    public Task<DossierMutationPortResult<DossierRegisterDocumentMutation>> DecideRegisterDocumentAsync(DossierRegisterDocumentDecisionRequest r, CancellationToken c = default) => DecideAsync<DossierRegisterDocumentDecisionRequest,DossierRegisterDocumentMutation>(r,c);
    public Task<DossierMutationPortResult<DossierTransitionDocumentStatusMutation>> DecideTransitionDocumentStatusAsync(DossierTransitionDocumentStatusDecisionRequest r, CancellationToken c = default) => DecideAsync<DossierTransitionDocumentStatusDecisionRequest,DossierTransitionDocumentStatusMutation>(r,c);
    public Task<DossierMutationPortResult<DossierRegisterEvidenceMutation>> DecideRegisterEvidenceAsync(DossierRegisterEvidenceDecisionRequest r, CancellationToken c = default) => DecideAsync<DossierRegisterEvidenceDecisionRequest,DossierRegisterEvidenceMutation>(r,c);
    public Task<DossierMutationPortResult<DossierAppendCustodyEventMutation>> DecideAppendCustodyEventAsync(DossierAppendCustodyEventDecisionRequest r, CancellationToken c = default) => DecideAsync<DossierAppendCustodyEventDecisionRequest,DossierAppendCustodyEventMutation>(r,c);
    public Task<DossierMutationPortResult<DossierCreatePacketMutation>> DecideCreatePacketAsync(DossierCreatePacketDecisionRequest r, CancellationToken c = default) => DecideAsync<DossierCreatePacketDecisionRequest,DossierCreatePacketMutation>(r,c);

    private async Task<DossierMutationPortResult<TMutation>> DecideAsync<TRequest,TMutation>(TRequest request, CancellationToken cancellationToken)
        where TRequest : DossierMutationDecisionRequest
        where TMutation : DossierAcceptedMutation
    {
        if (options.Value.Mode != DossierMutationMode.LocalExact)
            throw new DossierMutationUnavailableException("Canonical Dossier mutation runtime is disabled.");
        RequireRequest(request);
        var invocation = await processHost.DecideAsync(
            options.Value.ModulePath, DossierMutationOptions.ExpectedModuleSha256,
            options.Value.SchemaPath, DossierMutationOptions.ExpectedSchemaSha256,
            JsonSerializer.Serialize(request, JsonOptions), cancellationToken).ConfigureAwait(false);
        if (invocation.Failure == DossierMutationProcessFailure.Cancelled && cancellationToken.IsCancellationRequested)
            cancellationToken.ThrowIfCancellationRequested();
        if (!invocation.Success || string.IsNullOrWhiteSpace(invocation.ResultJson) ||
            invocation.SourceModuleSha256 != DossierMutationOptions.ExpectedModuleSha256 ||
            invocation.CopiedModuleSha256 != DossierMutationOptions.ExpectedModuleSha256 ||
            invocation.SourceSchemaSha256 != DossierMutationOptions.ExpectedSchemaSha256 ||
            invocation.CopiedSchemaSha256 != DossierMutationOptions.ExpectedSchemaSha256)
            throw new DossierMutationUnavailableException($"Canonical Dossier mutation failed closed: {invocation.Failure} {invocation.ErrorMessage}");
        try
        {
            using var document = JsonDocument.Parse(invocation.ResultJson);
            RejectDuplicates(document.RootElement, "$");
            var decision = document.RootElement.GetProperty("decision").GetString();
            if (decision == "accepted")
            {
                var accepted = JsonSerializer.Deserialize<DossierMutationAcceptedDecision<TMutation>>(invocation.ResultJson, JsonOptions)
                    ?? throw new JsonException("null accepted decision");
                RequireIdentity(request, accepted.SchemaVersion, accepted.Operation, accepted.CommandId, accepted.CountyId, accepted.ParcelId, accepted.TraceId);
                if (accepted.Decision != DossierMutationDecision.accepted || accepted.Violations.Count != 0)
                    throw new JsonException("invalid accepted shape");
                return new(accepted.Decision, accepted.Mutation, accepted.Violations);
            }
            var rejected = JsonSerializer.Deserialize<DossierMutationRejectedDecision>(invocation.ResultJson, JsonOptions)
                ?? throw new JsonException("null rejected decision");
            RequireIdentity(request, rejected.SchemaVersion, rejected.Operation, rejected.CommandId, rejected.CountyId, rejected.ParcelId, rejected.TraceId);
            if (rejected.Decision != DossierMutationDecision.rejected || rejected.Violations.Count == 0)
                throw new JsonException("invalid rejected shape");
            return new(rejected.Decision, null, rejected.Violations);
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            throw new DossierMutationUnavailableException("Canonical Dossier mutation returned invalid exact JSON.", ex);
        }
    }

    private static void RequireRequest(DossierMutationDecisionRequest r)
    {
        if (r.SchemaVersion != "1.0.0" || !Guid.TryParseExact(r.CommandId,"D",out _) ||
            !Guid.TryParseExact(r.CountyId,"D",out _) || string.IsNullOrWhiteSpace(r.ParcelId) ||
            string.IsNullOrWhiteSpace(r.ActorId) || r.EffectiveAt.Offset != TimeSpan.Zero)
            throw new DossierMutationUnavailableException("Sovereign Dossier mutation request identity is invalid.");
    }

    private static void RequireIdentity(DossierMutationDecisionRequest r, string schema, DossierMutationOperation op, string command, string county, string parcel, string? trace)
    {
        if (schema != r.SchemaVersion || op != r.Operation || command != r.CommandId || county != r.CountyId || parcel != r.ParcelId || trace != r.TraceId)
            throw new JsonException("Dossier result identity mismatch");
    }

    private static void RejectDuplicates(JsonElement e, string p)
    {
        if (e.ValueKind == JsonValueKind.Object) { var names = new HashSet<string>(StringComparer.Ordinal); foreach (var x in e.EnumerateObject()) { if (!names.Add(x.Name)) throw new JsonException($"duplicate {p}.{x.Name}"); RejectDuplicates(x.Value,$"{p}.{x.Name}"); } }
        else if (e.ValueKind == JsonValueKind.Array) { var i=0; foreach(var x in e.EnumerateArray()) RejectDuplicates(x,$"{p}[{i++}]"); }
    }

    private static JsonSerializerOptions CreateOptions()
    {
        var o = new JsonSerializerOptions(JsonSerializerDefaults.Web) { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
        o.Converters.Add(new JsonStringEnumConverter());
        return o;
    }
}

internal sealed class UnavailableDossierMutationDecisionPort(string message) : IDossierMutationDecisionPort
{
    private static Task<DossierMutationPortResult<T>> Fail<T>() where T:DossierAcceptedMutation => Task.FromException<DossierMutationPortResult<T>>(new DossierMutationUnavailableException(message));
    public Task<DossierMutationPortResult<DossierCreateNoteMutation>> DecideCreateNoteAsync(DossierCreateNoteDecisionRequest r,CancellationToken c=default)=>Fail<DossierCreateNoteMutation>();
    public Task<DossierMutationPortResult<DossierRegisterDocumentMutation>> DecideRegisterDocumentAsync(DossierRegisterDocumentDecisionRequest r,CancellationToken c=default)=>Fail<DossierRegisterDocumentMutation>();
    public Task<DossierMutationPortResult<DossierTransitionDocumentStatusMutation>> DecideTransitionDocumentStatusAsync(DossierTransitionDocumentStatusDecisionRequest r,CancellationToken c=default)=>Fail<DossierTransitionDocumentStatusMutation>();
    public Task<DossierMutationPortResult<DossierRegisterEvidenceMutation>> DecideRegisterEvidenceAsync(DossierRegisterEvidenceDecisionRequest r,CancellationToken c=default)=>Fail<DossierRegisterEvidenceMutation>();
    public Task<DossierMutationPortResult<DossierAppendCustodyEventMutation>> DecideAppendCustodyEventAsync(DossierAppendCustodyEventDecisionRequest r,CancellationToken c=default)=>Fail<DossierAppendCustodyEventMutation>();
    public Task<DossierMutationPortResult<DossierCreatePacketMutation>> DecideCreatePacketAsync(DossierCreatePacketDecisionRequest r,CancellationToken c=default)=>Fail<DossierCreatePacketMutation>();
}
