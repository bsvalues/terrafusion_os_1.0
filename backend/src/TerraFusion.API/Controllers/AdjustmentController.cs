using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/adjustment")]
public class AdjustmentController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    public AdjustmentController(TerraFusionDbContext db) => _db = db;

    // ─── Proposals ───────────────────────────────────────────────────────────

    [HttpGet("proposals")]
    public async Task<IActionResult> ListProposals([FromQuery] int taxYear, [FromQuery] Guid? setId)
    {
        var q = _db.AdjustmentProposals
            .Where(p => p.CountyId == BentonCountyId && p.TaxYear == taxYear);
        if (setId.HasValue) q = q.Where(p => p.AdjustmentSetId == setId);
        var list = await q.OrderByDescending(p => p.ProposedAt).ToListAsync();
        return Ok(list);
    }

    [HttpGet("proposals/{id:guid}")]
    public async Task<IActionResult> GetProposal(Guid id)
    {
        var p = await _db.AdjustmentProposals.FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost("proposals")]
    public async Task<IActionResult> CreateProposal([FromBody] CreateProposalRequest req)
    {
        var p = new AdjustmentProposal
        {
            CountyId = BentonCountyId,
            TaxYear = req.TaxYear,
            Scope = req.Scope,
            Kind = req.Kind,
            Magnitude = req.Magnitude,
            TargetNeighborhoodCode = req.TargetNeighborhoodCode,
            TargetFeatureCode = req.TargetFeatureCode,
            TargetCityCode = req.TargetCityCode,
            TargetQuintile = req.TargetQuintile,
            ParcelListJson = req.ParcelListJson,
            Rationale = req.Rationale,
            ProposedByUserId = req.ProposedByUserId,
            AdjustmentSetId = req.AdjustmentSetId,
            Status = ProposalStatus.Draft,
        };
        _db.AdjustmentProposals.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProposal), new { id = p.Id }, p);
    }

    [HttpPatch("proposals/{id:guid}/status")]
    public async Task<IActionResult> SetProposalStatus(Guid id, [FromBody] SetStatusRequest<ProposalStatus> req)
    {
        var p = await _db.AdjustmentProposals.FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (p is null) return NotFound();
        p.Status = req.Status;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpDelete("proposals/{id:guid}")]
    public async Task<IActionResult> DeleteProposal(Guid id)
    {
        var p = await _db.AdjustmentProposals.FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (p is null) return NotFound();
        if (p.Status is ProposalStatus.Applied or ProposalStatus.Reverted)
            return Conflict(new { error = "Cannot delete an applied or reverted proposal." });
        _db.AdjustmentProposals.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Simulation (non-destructive preview) ────────────────────────────────

    [HttpPost("proposals/{id:guid}/simulate")]
    public async Task<IActionResult> SimulateProposal(Guid id)
    {
        var p = await _db.AdjustmentProposals.FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (p is null) return NotFound();

        var (affected, delta, snapshot) = await RunSimulationAsync(p);
        p.SimulatedParcelsAffected = affected;
        p.SimulatedTotalDeltaAV = delta;
        p.SimulationResultJson = snapshot;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { parcelsAffected = affected, totalDeltaAV = delta });
    }

    // ─── Sets ─────────────────────────────────────────────────────────────────

    [HttpGet("sets")]
    public async Task<IActionResult> ListSets([FromQuery] int taxYear)
    {
        var sets = await _db.AdjustmentSets
            .Where(s => s.CountyId == BentonCountyId && s.TaxYear == taxYear)
            .Include(s => s.Proposals)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(sets);
    }

    [HttpGet("sets/{id:guid}")]
    public async Task<IActionResult> GetSet(Guid id)
    {
        var s = await _db.AdjustmentSets
            .Include(x => x.Proposals)
            .FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        return s is null ? NotFound() : Ok(s);
    }

    [HttpPost("sets")]
    public async Task<IActionResult> CreateSet([FromBody] CreateSetRequest req)
    {
        var s = new AdjustmentSet
        {
            CountyId = BentonCountyId,
            TaxYear = req.TaxYear,
            Name = req.Name,
            Description = req.Description,
            OwnerUserId = req.OwnerUserId,
            Status = SetStatus.Draft,
        };
        _db.AdjustmentSets.Add(s);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSet), new { id = s.Id }, s);
    }

    [HttpPost("sets/{id:guid}/submit")]
    public async Task<IActionResult> SubmitSet(Guid id)
        => await TransitionSet(id, SetStatus.Draft, SetStatus.PendingApproval);

    [HttpPost("sets/{id:guid}/approve")]
    public async Task<IActionResult> ApproveSet(Guid id, [FromBody] ApproveSetRequest req)
    {
        var s = await _db.AdjustmentSets.FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (s is null) return NotFound();
        if (s.Status != SetStatus.PendingApproval)
            return Conflict(new { error = "Set must be in PendingApproval to approve." });
        if (req.ApprovedByUserId == s.OwnerUserId)
            return Conflict(new { error = "Approver must differ from owner (two-person integrity)." });

        s.Status = SetStatus.Approved;
        s.ApprovedByUserId = req.ApprovedByUserId;
        s.ApprovedAt = DateTime.UtcNow;
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    [HttpPost("sets/{id:guid}/discard")]
    public async Task<IActionResult> DiscardSet(Guid id)
        => await TransitionSet(id, null, SetStatus.Discarded);

    // ─── Runs ─────────────────────────────────────────────────────────────────

    [HttpGet("runs")]
    public async Task<IActionResult> ListRuns([FromQuery] int taxYear)
    {
        var runs = await _db.AdjustmentRuns
            .Where(r => r.CountyId == BentonCountyId && r.TaxYear == taxYear)
            .OrderByDescending(r => r.AppliedAt)
            .ToListAsync();
        return Ok(runs);
    }

    [HttpGet("runs/{id:guid}")]
    public async Task<IActionResult> GetRun(Guid id)
    {
        var r = await _db.AdjustmentRuns
            .Include(x => x.ParcelChanges)
            .FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost("sets/{id:guid}/apply")]
    public async Task<IActionResult> ApplySet(Guid id, [FromBody] ApplySetRequest req)
    {
        var set = await _db.AdjustmentSets
            .Include(s => s.Proposals)
            .FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (set is null) return NotFound();
        if (set.Status != SetStatus.Approved)
            return Conflict(new { error = "Set must be Approved before applying." });
        if (req.AppliedByUserId == set.ApprovedByUserId)
            return Conflict(new { error = "Applier must differ from approver (two-person integrity)." });

        var preStats = await GetNeighborhoodStatsJsonAsync(set.TaxYear);

        var run = new AdjustmentRun
        {
            AdjustmentSetId = set.Id,
            CountyId = BentonCountyId,
            TaxYear = set.TaxYear,
            AppliedByUserId = req.AppliedByUserId,
            ApprovedByUserId = set.ApprovedByUserId!.Value,
            PreStatsSnapshot = preStats,
            PostStatsSnapshot = "[]",
        };

        var records = new List<ParcelAdjustmentRecord>();
        int totalParcels = 0;
        decimal totalDelta = 0m;

        foreach (var proposal in set.Proposals.Where(p => p.Status == ProposalStatus.Approved))
        {
            var (changed, delta, parcelRecords) = await ApplyProposalToPropertiesAsync(proposal, run.Id);
            totalParcels += changed;
            totalDelta += delta;
            records.AddRange(parcelRecords);
            proposal.Status = ProposalStatus.Applied;
        }

        run.ParcelsAffected = totalParcels;
        run.TotalDeltaAV = totalDelta;
        run.ParcelChanges = records;
        run.PostStatsSnapshot = await GetNeighborhoodStatsJsonAsync(set.TaxYear);

        set.Status = SetStatus.Applied;
        set.AppliedAt = DateTime.UtcNow;
        set.AppliedRunId = run.Id;

        _db.AdjustmentRuns.Add(run);
        await _db.SaveChangesAsync();

        return Ok(new { runId = run.Id, parcelsAffected = totalParcels, totalDeltaAV = totalDelta });
    }

    [HttpPost("runs/{id:guid}/revert")]
    public async Task<IActionResult> RevertRun(Guid id, [FromBody] RevertRunRequest req)
    {
        var original = await _db.AdjustmentRuns
            .Include(r => r.ParcelChanges)
            .FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (original is null) return NotFound();
        if (original.IsReversion)
            return Conflict(new { error = "Cannot revert a reversion run." });

        var set = await _db.AdjustmentSets.FindAsync(original.AdjustmentSetId);

        var preStats = await GetNeighborhoodStatsJsonAsync(original.TaxYear);

        var reversion = new AdjustmentRun
        {
            AdjustmentSetId = original.AdjustmentSetId,
            CountyId = BentonCountyId,
            TaxYear = original.TaxYear,
            AppliedByUserId = req.RevertedByUserId,
            ApprovedByUserId = req.ApprovedByUserId,
            PreStatsSnapshot = preStats,
            IsReversion = true,
            RevertedRunId = original.Id,
        };

        var records = new List<ParcelAdjustmentRecord>();
        decimal totalDelta = 0m;

        foreach (var change in original.ParcelChanges)
        {
            var prop = await _db.Properties.FirstOrDefaultAsync(p =>
                p.ParcelNumber == change.ParcelId && p.TaxYear == original.TaxYear);
            if (prop is null) continue;

            var rec = new ParcelAdjustmentRecord
            {
                AdjustmentRunId = reversion.Id,
                ParcelId = change.ParcelId,
                PreAV = change.PostAV,
                PostAV = change.PreAV,
                DeltaAV = change.PreAV - change.PostAV,
                SourceProposalId = change.SourceProposalId,
            };
            prop.AssessedValue = change.PreAV;
            records.Add(rec);
            totalDelta += rec.DeltaAV;
        }

        reversion.ParcelsAffected = records.Count;
        reversion.TotalDeltaAV = totalDelta;
        reversion.ParcelChanges = records;
        reversion.PostStatsSnapshot = await GetNeighborhoodStatsJsonAsync(original.TaxYear);

        if (set is not null) { set.Status = SetStatus.Reverted; set.UpdatedAt = DateTime.UtcNow; }

        _db.AdjustmentRuns.Add(reversion);
        await _db.SaveChangesAsync();

        return Ok(new { reversionRunId = reversion.Id, parcelsAffected = records.Count, totalDeltaAV = totalDelta });
    }

    // ─── AI Recommender ───────────────────────────────────────────────────────

    [HttpGet("recommend")]
    public async Task<IActionResult> Recommend([FromQuery] int taxYear, [FromQuery] string neighborhoodCode)
    {
        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId
                && s.Neighborhood == neighborhoodCode
                && (s.QualificationDecision == "qualified" || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified"))
                && s.SalesYear == taxYear)
            .ToListAsync();

        if (sales.Count < 5)
            return Ok(new { recommendation = (object?)null, reason = "Insufficient qualified sales." });

        var ids = sales.Select(s => s.ParcelId!).Distinct().ToList();
        var avMap = await _db.Properties
            .Where(p => p.TaxYear == taxYear && ids.Contains(p.ParcelNumber) && p.AssessedValue > 0)
            .ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);

        var pairs = sales
            .Where(s => avMap.ContainsKey(s.ParcelId!))
            .Select(s =>
            {
                var sp = s.AdjustedSalePrice ?? s.SalePrice;
                return sp == 0m ? 0m : avMap[s.ParcelId!] / sp;
            })
            .Where(r => r > 0)
            .ToList();

        if (pairs.Count < 5)
            return Ok(new { recommendation = (object?)null, reason = "Insufficient ratio pairs." });

        var sorted = pairs.Order().ToList();
        var median = Median(sorted);
        var target = 1.00m;
        var delta = target - median;
        var pctAdj = Math.Round(delta * 100, 2);

        return Ok(new
        {
            neighborhoodCode,
            taxYear,
            medianRatio = Math.Round(median, 4),
            recommendedAdjustmentPct = pctAdj,
            direction = delta > 0 ? "increase" : delta < 0 ? "decrease" : "none",
            sampleSize = pairs.Count,
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<IActionResult> TransitionSet(Guid id, SetStatus? fromStatus, SetStatus toStatus)
    {
        var s = await _db.AdjustmentSets.FirstOrDefaultAsync(x => x.Id == id && x.CountyId == BentonCountyId);
        if (s is null) return NotFound();
        if (fromStatus.HasValue && s.Status != fromStatus)
            return Conflict(new { error = $"Set must be {fromStatus} to transition to {toStatus}." });
        s.Status = toStatus;
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    private async Task<(int affected, decimal delta, string snapshot)> RunSimulationAsync(AdjustmentProposal p)
    {
        var parcels = await GetTargetParcelsAsync(p);
        decimal total = 0m;
        var snap = new List<object>();

        foreach (var prop in parcels)
        {
            var preAV = prop.AssessedValue;
            var postAV = ApplyKind(p.Kind, preAV, p.Magnitude);
            total += postAV - preAV;
            snap.Add(new { parcelId = prop.ParcelNumber, preAV, postAV, deltaAV = postAV - preAV });
        }

        var json = System.Text.Json.JsonSerializer.Serialize(snap);
        return (parcels.Count, total, json);
    }

    private async Task<(int affected, decimal delta, List<ParcelAdjustmentRecord> records)>
        ApplyProposalToPropertiesAsync(AdjustmentProposal p, Guid runId)
    {
        var parcels = await GetTargetParcelsAsync(p);
        var records = new List<ParcelAdjustmentRecord>();
        decimal total = 0m;

        foreach (var prop in parcels)
        {
            var preAV = prop.AssessedValue;
            var postAV = ApplyKind(p.Kind, preAV, p.Magnitude);
            prop.AssessedValue = postAV;
            var delta = postAV - preAV;
            total += delta;
            records.Add(new ParcelAdjustmentRecord
            {
                AdjustmentRunId = runId,
                ParcelId = prop.ParcelNumber,
                PreAV = preAV,
                PostAV = postAV,
                DeltaAV = delta,
                SourceProposalId = p.Id,
            });
        }

        return (parcels.Count, total, records);
    }

    private async Task<List<Property>> GetTargetParcelsAsync(AdjustmentProposal p)
    {
        var q = _db.Properties.Where(x => x.TaxYear == p.TaxYear && x.CountyId == BentonCountyId);

        q = p.Scope switch
        {
            AdjustmentScope.Neighborhood => q.Where(x => x.Neighborhood == p.TargetNeighborhoodCode),
            AdjustmentScope.CityRollup => q.Where(x => x.SitusCity == p.TargetCityCode),
            AdjustmentScope.FeatureCode => q,
            AdjustmentScope.ParcelList when p.ParcelListJson != null =>
                q.Where(x => EF.Functions.Like(p.ParcelListJson, $"%{x.ParcelNumber}%")),
            _ => q.Where(x => x.Neighborhood == p.TargetNeighborhoodCode),
        };

        return await q.ToListAsync();
    }

    private static decimal ApplyKind(AdjustmentKind kind, decimal preAV, decimal magnitude) => kind switch
    {
        AdjustmentKind.PercentOfAV => preAV * (1m + magnitude / 100m),
        AdjustmentKind.FlatDelta => preAV + magnitude,
        _ => preAV * (1m + magnitude / 100m),
    };

    private async Task<string> GetNeighborhoodStatsJsonAsync(int taxYear)
    {
        var props = await _db.Properties
            .Where(p => p.CountyId == BentonCountyId && p.TaxYear == taxYear && p.AssessedValue > 0)
            .GroupBy(p => p.Neighborhood)
            .Select(g => new
            {
                neighborhoodCode = g.Key,
                count = g.Count(),
                totalAV = g.Sum(p => p.AssessedValue),
                medianAV = g.OrderBy(p => p.AssessedValue).Skip(g.Count() / 2).First().AssessedValue,
            })
            .ToListAsync();
        return System.Text.Json.JsonSerializer.Serialize(props);
    }

    private static decimal Median(List<decimal> sorted)
    {
        int n = sorted.Count;
        return n % 2 == 1 ? sorted[n / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2m;
    }
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

public record CreateProposalRequest(
    int TaxYear,
    AdjustmentScope Scope,
    AdjustmentKind Kind,
    decimal Magnitude,
    string? TargetNeighborhoodCode,
    string? TargetFeatureCode,
    string? TargetCityCode,
    int? TargetQuintile,
    string? ParcelListJson,
    string Rationale,
    Guid ProposedByUserId,
    Guid? AdjustmentSetId
);

public record CreateSetRequest(
    int TaxYear,
    string Name,
    string? Description,
    Guid OwnerUserId
);

public record ApproveSetRequest(Guid ApprovedByUserId);

public record ApplySetRequest(Guid AppliedByUserId);

public record RevertRunRequest(Guid RevertedByUserId, Guid ApprovedByUserId);

public record SetStatusRequest<T>(T Status);
