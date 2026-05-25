using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Services;

namespace TerraFusion.CurrentUse.Controllers;

/// <summary>
/// Current Use Program API — RCW 84.33/84.34 classifications, rollback calculations,
/// interest rates, removals, and penalty exceptions for Benton County WA.
/// </summary>
[ApiController]
[Route("api/currentuse")]
[Produces("application/json")]
public class CurrentUseController : ControllerBase
{
    private readonly IClassificationService _classifications;
    private readonly IRollbackCalculationService _rollback;
    private readonly IInterestService _interest;
    private readonly IRemovalService _removals;
    private readonly IPenaltyExceptionService _penaltyExceptions;
    private readonly ICaseStateService _caseStates;
    private readonly ILogger<CurrentUseController> _logger;

    public CurrentUseController(
        IClassificationService classifications,
        IRollbackCalculationService rollback,
        IInterestService interest,
        IRemovalService removals,
        IPenaltyExceptionService penaltyExceptions,
        ICaseStateService caseStates,
        ILogger<CurrentUseController> logger)
    {
        _classifications = classifications;
        _rollback = rollback;
        _interest = interest;
        _removals = removals;
        _penaltyExceptions = penaltyExceptions;
        _caseStates = caseStates;
        _logger = logger;
    }

    // ── Classifications ────────────────────────────────────────────────────

    /// <summary>List current use classifications with optional filters.</summary>
    [HttpGet("classifications")]
    public async Task<IActionResult> ListClassifications(
        [FromQuery] string? status,
        [FromQuery] string? classificationCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _classifications.ListAsync(status, classificationCode, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>Get a single classification by ID.</summary>
    [HttpGet("classifications/{id:guid}")]
    public async Task<IActionResult> GetClassification(Guid id, CancellationToken ct)
    {
        var result = await _classifications.GetByIdAsync(id, ct);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Create a new current use classification enrollment.</summary>
    [HttpPost("classifications")]
    public async Task<IActionResult> CreateClassification([FromBody] ClassificationCreateRequest request, CancellationToken ct)
    {
        var result = await _classifications.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetClassification), new { id = result.Id }, result);
    }

    // ── Rollback Calculator ────────────────────────────────────────────────

    /// <summary>Calculate rollback taxes for a removal from current use.</summary>
    [HttpPost("rollback/calculate")]
    public async Task<IActionResult> CalculateRollback([FromBody] RollbackCalculationRequest request, CancellationToken ct)
    {
        var result = await _rollback.CalculateAsync(request, ct);
        return Ok(result);
    }

    // ── Interest Rates ─────────────────────────────────────────────────────

    /// <summary>Get all DOR-published interest rates.</summary>
    [HttpGet("interest-rates")]
    public async Task<IActionResult> GetInterestRates(CancellationToken ct)
    {
        var result = await _interest.GetRatesAsync(ct);
        return Ok(result);
    }

    /// <summary>Calculate compound interest on a principal amount.</summary>
    [HttpGet("interest/calculate")]
    public async Task<IActionResult> CalculateInterest(
        [FromQuery] decimal principal,
        [FromQuery] int startYear,
        [FromQuery] int endYear,
        CancellationToken ct)
    {
        if (principal <= 0) return BadRequest("Principal must be positive.");
        if (startYear >= endYear) return BadRequest("Start year must be before end year.");

        var result = await _interest.CalculateAsync(principal, startYear, endYear, ct);
        return Ok(result);
    }

    // ── Removals ───────────────────────────────────────────────────────────

    /// <summary>List all removal proceedings.</summary>
    [HttpGet("removals")]
    public async Task<IActionResult> ListRemovals(CancellationToken ct)
    {
        var result = await _removals.ListAsync(ct);
        return Ok(result);
    }

    /// <summary>Initiate a removal from current use classification.</summary>
    [HttpPost("removals")]
    public async Task<IActionResult> InitiateRemoval([FromBody] RemovalInitiateRequest request, CancellationToken ct)
    {
        var result = await _removals.InitiateAsync(request, ct);
        return CreatedAtAction(nameof(ListRemovals), result);
    }

    // ── Penalty Exceptions ─────────────────────────────────────────────────

    /// <summary>Evaluate which penalty exceptions apply for a parcel.</summary>
    [HttpGet("penalty-exceptions")]
    public async Task<IActionResult> EvaluatePenaltyExceptions([FromQuery] string parcelId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(parcelId)) return BadRequest("parcelId is required.");

        var result = await _penaltyExceptions.EvaluateAsync(parcelId, ct);
        return Ok(result);
    }

    // ── Case Desk Workflow State ───────────────────────────────────────────

    /// <summary>List persisted CUForge case desk workflow state.</summary>
    [HttpGet("case-states")]
    public async Task<IActionResult> ListCaseStates(CancellationToken ct)
    {
        var result = await _caseStates.ListAsync(ct);
        return Ok(result);
    }

    /// <summary>Get persisted workflow state for a derived Current Use case.</summary>
    [HttpGet("case-states/{caseId:guid}")]
    public async Task<IActionResult> GetCaseState(Guid caseId, CancellationToken ct)
    {
        var result = await _caseStates.GetByCaseIdAsync(caseId, ct);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Upsert human workflow state for a derived Current Use case.</summary>
    [HttpPut("case-states/{caseId:guid}")]
    public async Task<IActionResult> UpsertCaseState(Guid caseId, [FromBody] CaseStateUpsertRequest request, CancellationToken ct)
    {
        var result = await _caseStates.UpsertAsync(caseId, request, ct);
        return Ok(result);
    }
}
