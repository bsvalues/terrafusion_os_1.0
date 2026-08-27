using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public sealed record CreateAppealCommand(
    string ParcelId,
    string? AppealGround,
    string? PetitionerName,
    decimal CurrentValue,
    decimal RequestedValue,
    int TaxYear);

public interface IAppealService
{
    Task<Appeal> CreateAsync(
        Guid countyId,
        CreateAppealCommand request,
        string? createdBy = null,
        DateTime? utcNow = null,
        CancellationToken cancellationToken = default);
    Task<Appeal?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<Appeal>> GetByParcelAsync(string parcelId, Guid countyId);
    Task<Appeal> UpdateStatusAsync(
        Guid id,
        string status,
        Guid countyId,
        string? decisionNotes = null,
        decimal? decidedValue = null,
        CancellationToken cancellationToken = default);
    Task<List<Appeal>> GetByTaxYearAsync(int taxYear, Guid countyId);
}

public class AppealService : IAppealService
{
    private const string MutationSchemaVersion = "1.0.0";

    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<AppealService> _logger;
    private readonly IDaisAppealMutationDecisionPort _decisionPort;

    public AppealService(
        ITerraFusionDbContext context,
        ILogger<AppealService> logger,
        IDaisAppealMutationDecisionPort decisionPort)
    {
        _context = context;
        _logger = logger;
        _decisionPort = decisionPort;
    }

    public async Task<Appeal> CreateAsync(
        Guid countyId,
        CreateAppealCommand request,
        string? createdBy = null,
        DateTime? utcNow = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var effectiveAt = ToEffectiveInstant(utcNow ?? DateTime.UtcNow);
        var decisionRequest = new DaisAppealCreateDecisionRequest
        {
            SchemaVersion = MutationSchemaVersion,
            Operation = DaisAppealMutationOperation.create,
            CommandId = Guid.NewGuid().ToString("D"),
            CountyId = countyId.ToString("D"),
            EffectiveAt = effectiveAt,
            Command = new DaisAppealCreateDecisionCommand
            {
                Ground = request.AppealGround,
                TaxYear = request.TaxYear == 0 ? null : request.TaxYear,
            },
        };

        var decision = await _decisionPort
            .DecideCreateAsync(decisionRequest, cancellationToken)
            .ConfigureAwait(false);
        var mutation = RequireAcceptedCreateDecision(decisionRequest, decision);

        var entity = new Appeal
        {
            Id = Guid.NewGuid(),
            ParcelId = request.ParcelId,
            AppealGround = mutation.Ground.ToString(),
            PetitionerName = request.PetitionerName,
            CurrentValue = request.CurrentValue,
            RequestedValue = request.RequestedValue,
            TaxYear = mutation.TaxYear,
            FiledDate = RequireUtcDateTime(mutation.FiledAt, nameof(mutation.FiledAt)),
            Status = mutation.Status.ToString(),
            CountyId = countyId,
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
            CreatedAt = effectiveAt.UtcDateTime,
            UpdatedAt = RequireUtcDateTime(mutation.UpdatedAt, nameof(mutation.UpdatedAt)),
        };

        _context.Appeals.Add(entity);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Created appeal {AppealId} for parcel {ParcelId} in county {CountyId}, ground {AppealGround}, tax year {TaxYear}",
            entity.Id,
            entity.ParcelId,
            entity.CountyId,
            entity.AppealGround,
            entity.TaxYear);

        return entity;
    }

    public async Task<Appeal?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.Appeals
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && a.CountyId == countyId);
    }

    public async Task<List<Appeal>> GetByParcelAsync(string parcelId, Guid countyId)
    {
        return await _context.Appeals
            .AsNoTracking()
            .Where(a => a.ParcelId == parcelId && a.CountyId == countyId)
            .OrderByDescending(a => a.FiledDate)
            .ToListAsync();
    }

    public async Task<Appeal> UpdateStatusAsync(
        Guid id,
        string status,
        Guid countyId,
        string? decisionNotes = null,
        decimal? decidedValue = null,
        CancellationToken cancellationToken = default)
    {
        var entity = await _context.Appeals
            .FirstOrDefaultAsync(
                a => a.Id == id && a.CountyId == countyId,
                cancellationToken)
            .ConfigureAwait(false);

        if (entity is null)
        {
            throw new KeyNotFoundException($"Appeal {id} not found in county {countyId}.");
        }

        var decisionRequest = new DaisAppealTransitionDecisionRequest
        {
            SchemaVersion = MutationSchemaVersion,
            Operation = DaisAppealMutationOperation.transition,
            CommandId = Guid.NewGuid().ToString("D"),
            CountyId = countyId.ToString("D"),
            EffectiveAt = DateTimeOffset.UtcNow,
            Command = new DaisAppealTransitionDecisionCommand
            {
                AppealId = id.ToString("D"),
                Current = new DaisAppealLifecycleSnapshot
                {
                    Status = entity.Status,
                    FiledAt = ToPersistenceInstant(entity.FiledDate, nameof(entity.FiledDate)),
                    HearingAt = ToNullablePersistenceInstant(entity.HearingDate, nameof(entity.HearingDate)),
                    DecisionAt = ToNullablePersistenceInstant(entity.DecisionDate, nameof(entity.DecisionDate)),
                },
                Requested = new DaisAppealTransitionRequest
                {
                    Status = status,
                    HasDecidedValue = decidedValue.HasValue,
                },
            },
        };

        var decision = await _decisionPort
            .DecideTransitionAsync(decisionRequest, cancellationToken)
            .ConfigureAwait(false);
        var mutation = RequireAcceptedTransitionDecision(decisionRequest, decision);

        entity.Status = mutation.Status.ToString();
        entity.UpdatedAt = RequireUtcDateTime(mutation.UpdatedAt, nameof(mutation.UpdatedAt));
        if (mutation.DecisionAt.HasValue)
        {
            entity.DecisionDate = RequireUtcDateTime(
                mutation.DecisionAt.Value,
                nameof(mutation.DecisionAt));
        }
        if (decisionNotes is not null)
        {
            entity.DecisionNotes = decisionNotes;
        }
        if (decidedValue.HasValue)
        {
            entity.DecidedValue = decidedValue.Value;
        }

        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Updated appeal {AppealId} status to {Status} in county {CountyId}",
            id,
            entity.Status,
            countyId);

        return entity;
    }

    public async Task<List<Appeal>> GetByTaxYearAsync(int taxYear, Guid countyId)
    {
        return await _context.Appeals
            .AsNoTracking()
            .Where(a => a.TaxYear == taxYear && a.CountyId == countyId)
            .OrderByDescending(a => a.FiledDate)
            .ToListAsync();
    }

    private static DaisAppealCreateMutation RequireAcceptedCreateDecision(
        DaisAppealCreateDecisionRequest request,
        DaisAppealCreateDecisionResult result)
    {
        if (result.Operation != DaisAppealMutationOperation.create
            || !string.Equals(result.SchemaVersion, MutationSchemaVersion, StringComparison.Ordinal)
            || !string.Equals(result.CommandId, request.CommandId, StringComparison.Ordinal)
            || !string.Equals(result.CountyId, request.CountyId, StringComparison.Ordinal)
            || (result.Decision == DaisAppealMutationDecision.accepted
                && (result.Mutation is null || result.Violations.Count != 0))
            || (result.Decision == DaisAppealMutationDecision.rejected
                && (result.Mutation is not null || result.Violations.Count == 0)))
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais create decision identity or shape was invalid.");
        }
        if (result.Decision == DaisAppealMutationDecision.rejected)
        {
            throw new DaisAppealMutationRejectedException(result.Operation, result.Violations);
        }
        return result.Mutation!;
    }

    private static DaisAppealTransitionMutation RequireAcceptedTransitionDecision(
        DaisAppealTransitionDecisionRequest request,
        DaisAppealTransitionDecisionResult result)
    {
        if (result.Operation != DaisAppealMutationOperation.transition
            || !string.Equals(result.SchemaVersion, MutationSchemaVersion, StringComparison.Ordinal)
            || !string.Equals(result.CommandId, request.CommandId, StringComparison.Ordinal)
            || !string.Equals(result.CountyId, request.CountyId, StringComparison.Ordinal)
            || (result.Decision == DaisAppealMutationDecision.accepted
                && (result.Mutation is null || result.Violations.Count != 0))
            || (result.Decision == DaisAppealMutationDecision.rejected
                && (result.Mutation is not null || result.Violations.Count == 0)))
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais transition decision identity or shape was invalid.");
        }
        if (result.Decision == DaisAppealMutationDecision.rejected)
        {
            throw new DaisAppealMutationRejectedException(result.Operation, result.Violations);
        }
        return result.Mutation!;
    }

    private static DateTimeOffset ToEffectiveInstant(DateTime value)
    {
        if (value.Kind == DateTimeKind.Local)
        {
            throw new ArgumentException("Appeal effective time must be UTC, not Local.", nameof(value));
        }
        return new DateTimeOffset(
            value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime());
    }

    private static DateTimeOffset ToPersistenceInstant(DateTime value, string field)
    {
        if (value.Kind == DateTimeKind.Local)
        {
            throw new DaisAppealMutationUnavailableException(
                $"Persisted appeal {field} must not contain a Local timestamp.");
        }
        return new DateTimeOffset(
            value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime());
    }

    private static DateTimeOffset? ToNullablePersistenceInstant(DateTime? value, string field) =>
        value.HasValue ? ToPersistenceInstant(value.Value, field) : null;

    private static DateTime RequireUtcDateTime(DateTimeOffset value, string field)
    {
        if (value.Offset != TimeSpan.Zero)
        {
            throw new DaisAppealMutationUnavailableException(
                $"Dais mutation {field} must be a UTC instant.");
        }
        return value.UtcDateTime;
    }
}
