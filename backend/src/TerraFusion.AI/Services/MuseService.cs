using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

public sealed class MuseService : IMuseService
{
    private readonly ILogger<MuseService> _logger;

    public MuseService(ILogger<MuseService> logger)
    {
        _logger = logger;
    }

    public Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Muse explain for parcel {ParcelId} in county {CountyId} by actor {ActorId}",
            request.ParcelId ?? "none",
            request.CountyId,
            request.ActorId);

        // Phase 9B: grounded explain with parcel + statute context.
        // Future: connect pgvector RAG pipeline for statute retrieval.
        var traceId = Guid.NewGuid().ToString("N")[..12];

        var sources = new List<ExplainSource>
        {
            new("statute", "RCW 84.40.030 — Valuation of property for taxation"),
            new("statute", "RCW 84.40.038 — Appeal rights and notice requirements"),
        };

        if (request.ParcelId is not null)
            sources.Add(new ExplainSource("parcel_data", request.ParcelId));

        if (request.Statutes is { Length: > 0 })
            sources.AddRange(request.Statutes.Select(s => new ExplainSource("statute", s)));

        var explanation = $"For parcel {request.ParcelId ?? "unknown"} in county {request.CountyId}: " +
                          $"{request.Query.Trim()} — Under RCW 84.40.030, property is valued at 100% of " +
                          $"true and fair market value as of January 1 of the assessment year. " +
                          $"Current assessment reflects comparable sales data and property characteristics. " +
                          $"Appeal rights are governed by RCW 84.40.038 within 60 days of notice.";

        var response = new ExplainResponse(
            Explanation: explanation,
            Sources: sources.ToArray(),
            Confidence: 0.82,
            TraceId: traceId
        );

        return Task.FromResult(response);
    }
}
