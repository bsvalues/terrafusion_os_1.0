// TerraFusion OS — Levy Reference Controller
// Read-only reference surfaces for the WA State levy regime:
// IPD annual rate, lid lifts (RCW 84.55.050), state school (RCW 84.52.065/068),
// refund fund (RCW 84.69), TCA / annexation, and calculation attestation.
//
// Most endpoints are data-gated on specialist ingestion (see
// docs/levy/reference/open-tickets/LEV-136..LEV-145). When no authoritative
// data has been loaded, endpoints return an empty collection plus a
// `specialistGated: true` envelope flag rather than synthesised values.

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Levy reference and compliance surfaces. Most endpoints are [AllowAnonymous]
/// because they expose only published statutory data; the attestation
/// endpoint is authorized.
/// </summary>
[ApiController]
[Route("api/levy/v1")]
[Route("api/levy-calculation")]
public class LevyReferenceController : ControllerBase
{
    private readonly ILogger<LevyReferenceController> _logger;
    private readonly TerraFusionDbContext _db;

    public LevyReferenceController(
        ILogger<LevyReferenceController> logger,
        TerraFusionDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    // ─────────────────────────────────────────────────────────────────────
    // F1 — IPD annual rate table
    // RCW 84.55.005: Limit Factor = min(1.01, 1 + IPD%) for districts > 10k pop.
    // Ticket: LEV-136. Authoritative values are published annually by WA DOR
    // (September memo). No values are hard-coded here; the admin must ingest.
    // ─────────────────────────────────────────────────────────────────────
    public sealed record IpdAnnualRateDto(
        int Year,
        decimal? IpdPercent,
        string? SourceNote,
        DateTime? PublishedDate,
        string? ImportedBy,
        DateTime? ImportedAt);

    public sealed record IpdRatesEnvelope(
        string Source,
        string Description,
        bool SpecialistGated,
        string? SpecialistGateNote,
        IReadOnlyList<IpdAnnualRateDto> Rates,
        int Count,
        string RcwReference);

    [HttpGet("ipd-rates")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IpdRatesEnvelope), 200)]
    public IActionResult GetIpdRates()
    {
        // No in-memory values — values require WA DOR September memo ingestion.
        // See LEV-136: table schema to be persisted as `ipd_annual_rate` via
        // migration. Until ingestion tooling ships, this endpoint honestly
        // reports specialist-gated empty.
        var envelope = new IpdRatesEnvelope(
            Source: "WA DOR Property Tax Division Annual IPD Memo",
            Description: "Implicit Price Deflator used to derive the Limit Factor per RCW 84.55.005. Limit Factor = min(1.01, 1 + IPD%).",
            SpecialistGated: true,
            SpecialistGateNote: "No IPD values imported. Operator must ingest from the September DOR memo; see docs/levy/reference/open-tickets/LEV-136.",
            Rates: Array.Empty<IpdAnnualRateDto>(),
            Count: 0,
            RcwReference: "RCW 84.55.005");
        return Ok(envelope);
    }

    // ─────────────────────────────────────────────────────────────────────
    // F3 — Lid lifts (RCW 84.55.050)
    // Voter-approved temporary or permanent levy rate increases above the
    // 1% limit factor. Ticket: LEV-138. Persistence deferred; this endpoint
    // returns an empty list with schema + statutory reference until an
    // operator imports approved propositions.
    // ─────────────────────────────────────────────────────────────────────
    public sealed record LidLiftDto(
        Guid DistrictId,
        string DistrictName,
        string PropositionNumber,
        decimal VoterApprovedRate,
        int EffectiveYear,
        int? ExpiresYear,
        bool IsPermanent,
        DateTime ElectionDate,
        string? BallotTitle);

    public sealed record LidLiftsEnvelope(
        string Source,
        bool SpecialistGated,
        string? SpecialistGateNote,
        IReadOnlyList<LidLiftDto> LidLifts,
        int Count,
        string RcwReference);

    [HttpGet("lid-lifts")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LidLiftsEnvelope), 200)]
    public IActionResult GetLidLifts([FromQuery] Guid? districtId = null)
    {
        var envelope = new LidLiftsEnvelope(
            Source: "County Auditor Ballot Measure Records",
            SpecialistGated: true,
            SpecialistGateNote: "No lid lift propositions imported. Operator must load from the County Auditor election records; see docs/levy/reference/open-tickets/LEV-138.",
            LidLifts: Array.Empty<LidLiftDto>(),
            Count: 0,
            RcwReference: "RCW 84.55.050");
        return Ok(envelope);
    }

    // ─────────────────────────────────────────────────────────────────────
    // F4 — State school levy (Part 1 + Part 2)
    // RCW 84.52.065 (Part 1) and RCW 84.52.068 (Part 2 / McCleary).
    // Rates are set by the state legislature and published annually by DOR.
    // Ticket: LEV-140.
    // ─────────────────────────────────────────────────────────────────────
    public sealed record StateSchoolLevyDto(
        string Part,
        decimal? RatePerThousandAV,
        int? LevyYear,
        string RcwReference,
        string Description,
        string? SourceNote);

    public sealed record StateSchoolEnvelope(
        string Source,
        bool SpecialistGated,
        string? SpecialistGateNote,
        IReadOnlyList<StateSchoolLevyDto> Parts,
        int Count);

    [HttpGet("state-school-levy")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StateSchoolEnvelope), 200)]
    public IActionResult GetStateSchoolLevy()
    {
        // Schema returned without rates; rates are DOR-published and must be
        // imported per year before the assessor can certify.
        var parts = new List<StateSchoolLevyDto>
        {
            new(
                Part: "Part 1",
                RatePerThousandAV: null,
                LevyYear: null,
                RcwReference: "RCW 84.52.065",
                Description: "State levy Part 1 (original state school levy). Rate set annually by WA Legislature; certified by DOR.",
                SourceNote: "Import from DOR Property Tax Division annual certification."),
            new(
                Part: "Part 2",
                RatePerThousandAV: null,
                LevyYear: null,
                RcwReference: "RCW 84.52.068",
                Description: "State levy Part 2 (McCleary supplemental). Rate set annually by WA Legislature; certified by DOR.",
                SourceNote: "Import from DOR Property Tax Division annual certification."),
        };

        var envelope = new StateSchoolEnvelope(
            Source: "WA DOR Property Tax Division Annual Certification",
            SpecialistGated: true,
            SpecialistGateNote: "No state school levy rates imported for the current year; see docs/levy/reference/open-tickets/LEV-140.",
            Parts: parts,
            Count: parts.Count);
        return Ok(envelope);
    }

    // ─────────────────────────────────────────────────────────────────────
    // F5 — Refund fund (RCW 84.69)
    // Amounts authorized for refund are levied OUTSIDE the 1% and $5.90
    // aggregate caps. This endpoint describes the rule + exposes a
    // per-district placeholder until operator imports amounts.
    // ─────────────────────────────────────────────────────────────────────
    public sealed record RefundFundDto(
        Guid? DistrictId,
        string? DistrictName,
        decimal? RefundAmount,
        int? LevyYear,
        string? Reason);

    public sealed record RefundFundEnvelope(
        string Source,
        string Description,
        bool OutsideAggregateCap,
        bool SpecialistGated,
        string? SpecialistGateNote,
        IReadOnlyList<RefundFundDto> Refunds,
        int Count,
        string RcwReference);

    [HttpGet("refund-fund")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RefundFundEnvelope), 200)]
    public IActionResult GetRefundFund([FromQuery] Guid? districtId = null)
    {
        var envelope = new RefundFundEnvelope(
            Source: "County Treasurer Refund Records (RCW 84.69)",
            Description: "Refund fund amounts under RCW 84.69 are levied in addition to regular levies and are excluded from the 1% constitutional limit (Article VII §2) and the $5.90/$1,000 aggregate cap (RCW 84.52.043).",
            OutsideAggregateCap: true,
            SpecialistGated: true,
            SpecialistGateNote: "No refund-fund amounts imported. Operator must load from the County Treasurer annual refund report; see ticket tracking in docs/levy/reference/open-tickets/.",
            Refunds: Array.Empty<RefundFundDto>(),
            Count: 0,
            RcwReference: "RCW 84.69");
        return Ok(envelope);
    }

    // ─────────────────────────────────────────────────────────────────────
    // F9 — Tax Code Area (TCA) lookup + annexation effective-dating
    // Backed by PacsTaxArea (already in context). Returns active TCAs plus
    // an annotation that annexation effective-date modeling is deferred to
    // LEV-144 (adding an AnnexationEvent entity with effective_from/to).
    // ─────────────────────────────────────────────────────────────────────
    public sealed record TaxCodeAreaDto(
        string TaxAreaNumber,
        string? Description,
        string? TaxAreaId);

    public sealed record TaxCodeAreasEnvelope(
        string Source,
        IReadOnlyList<TaxCodeAreaDto> TaxCodeAreas,
        int Count,
        bool AnnexationModelingDeferred,
        string DeferralNote,
        string RcwReference);

    [HttpGet("tax-code-areas")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TaxCodeAreasEnvelope), 200)]
    public async Task<IActionResult> GetTaxCodeAreas([FromQuery] int limit = 200)
    {
        limit = Math.Clamp(limit, 1, 1000);

        // PacsTaxArea mirrors dbo.property_tax_area JOIN dbo.tax_area. The table
        // is per-parcel-per-year, so we distinct on TaxAreaNumber for a clean
        // TCA catalogue.
        List<TaxCodeAreaDto> areas;
        try
        {
            areas = await _db.PacsTaxAreas
                .AsNoTracking()
                .Where(t => t.TaxAreaNumber != null && t.TaxAreaNumber != "")
                .GroupBy(t => t.TaxAreaNumber)
                .Select(g => new TaxCodeAreaDto(
                    g.Key ?? string.Empty,
                    g.Select(x => x.TaxAreaDescription).FirstOrDefault(),
                    g.Select(x => x.PacsTaxAreaId).FirstOrDefault().ToString()))
                .OrderBy(a => a.TaxAreaNumber)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "TCA query failed; returning empty envelope.");
            areas = new List<TaxCodeAreaDto>();
        }

        var envelope = new TaxCodeAreasEnvelope(
            Source: "PACS dbo.tax_area (mirrored via PacsTaxArea entity)",
            TaxCodeAreas: areas,
            Count: areas.Count,
            AnnexationModelingDeferred: true,
            DeferralNote: "Annexation effective-date modeling (AnnexationEvent with effective_from/effective_to) deferred; see docs/levy/reference/open-tickets/LEV-144.",
            RcwReference: "RCW 84.09.030 (taxable status date) / RCW 35A.14 (annexation)");
        return Ok(envelope);
    }

    // ─────────────────────────────────────────────────────────────────────
    // F8 — Attestation envelope
    // Canonicalises a calculation payload, produces a SHA-256 digest plus a
    // correlation id and signer identity. Persistence of the resulting
    // attestation record is deferred to LEV-145; this endpoint is stateless.
    // Replaces the "quantum" language of the v1 MVP.
    // ─────────────────────────────────────────────────────────────────────
    public sealed record AttestationRequest(
        string Subject,
        object Payload);

    public sealed record AttestationEnvelope(
        string Algorithm,
        string PayloadHash,
        string Subject,
        string Signer,
        string CorrelationId,
        DateTime AttestedAt,
        bool PersistenceDeferred,
        string? PersistenceNote);

    [HttpPost("attest")]
    [Authorize(Roles = "LevyClerk,Assessor,Admin,Administrator")]
    [ProducesResponseType(typeof(AttestationEnvelope), 200)]
    [ProducesResponseType(400)]
    public IActionResult Attest([FromBody] AttestationRequest request)
    {
        if (request is null || request.Payload is null || string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest(new { error = "Subject and Payload are required." });
        }

        // Canonical JSON — deterministic key ordering not enforced here; for
        // cross-run reproducibility, upstream caller must pass a pre-
        // canonicalised payload (LEV-145 adds server-side canonicaliser).
        var json = JsonSerializer.Serialize(request.Payload, new JsonSerializerOptions
        {
            WriteIndented = false,
        });

        using var sha = SHA256.Create();
        var digest = sha.ComputeHash(Encoding.UTF8.GetBytes(json));
        var hex = Convert.ToHexString(digest).ToLowerInvariant();

        var signer = User?.Identity?.Name
            ?? User?.FindFirst("sub")?.Value
            ?? User?.FindFirst("preferred_username")?.Value
            ?? "unknown";

        var correlationId = HttpContext.TraceIdentifier;

        var envelope = new AttestationEnvelope(
            Algorithm: "SHA-256",
            PayloadHash: hex,
            Subject: request.Subject,
            Signer: signer,
            CorrelationId: correlationId,
            AttestedAt: DateTime.UtcNow,
            PersistenceDeferred: true,
            PersistenceNote: "Attestation envelope is not persisted in this response. Durable ledger + signer-key management tracked in docs/levy/reference/open-tickets/LEV-145.");

        return Ok(envelope);
    }

    // ─────────────────────────────────────────────────────────────────────
    // F7 — Retention / PRA metadata
    // Returns the retention class + minimum retention term applied to levy
    // calculation records under RCW 40.14 / 42.56. Metadata-only endpoint;
    // per-record stamping is deferred to LEV-142.
    // ─────────────────────────────────────────────────────────────────────
    public sealed record RetentionPolicyDto(
        string RecordType,
        string RetentionClass,
        int MinimumRetentionYears,
        string Authority,
        string Disposition);

    public sealed record RetentionPolicyEnvelope(
        string Source,
        IReadOnlyList<RetentionPolicyDto> Policies,
        int Count,
        bool PerRecordStampingDeferred,
        string DeferralNote,
        string RcwReference);

    [HttpGet("retention-policy")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RetentionPolicyEnvelope), 200)]
    public IActionResult GetRetentionPolicy()
    {
        var policies = new List<RetentionPolicyDto>
        {
            new(
                RecordType: "Levy Calculation (final certified)",
                RetentionClass: "GS 50-05-05 / Essential",
                MinimumRetentionYears: 6,
                Authority: "WA State Local Government Common Records Retention Schedule (CORE) – Financial / Levy",
                Disposition: "Transfer to Washington State Archives after retention period; do not destroy."),
            new(
                RecordType: "Levy Scenario (draft / exploratory)",
                RetentionClass: "GS 50-05-10 / Transitory",
                MinimumRetentionYears: 2,
                Authority: "WA State Local Government CORE Retention Schedule – Working Papers",
                Disposition: "Destroy after retention period, per approved schedule."),
        };

        var envelope = new RetentionPolicyEnvelope(
            Source: "WA State Local Government CORE Retention Schedule",
            Policies: policies,
            Count: policies.Count,
            PerRecordStampingDeferred: true,
            DeferralNote: "Per-record retention stamping (RetentionClass / RetainedUntil fields on TaxLevy entity) deferred to docs/levy/reference/open-tickets/LEV-142.",
            RcwReference: "RCW 40.14 (Preservation and Destruction of Public Records) / RCW 42.56 (Public Records Act)");
        return Ok(envelope);
    }
}
