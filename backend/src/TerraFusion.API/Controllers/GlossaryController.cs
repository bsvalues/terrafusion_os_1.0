using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-041: Levy glossary and terminology reference.
/// Provides searchable glossary of levy, tax, and assessment terminology
/// with category organization. Public endpoint for citizen education.
/// </summary>
[ApiController]
[Route("api/levy/glossary")]
public class GlossaryController : ControllerBase
{
    private readonly ILogger<GlossaryController> _logger;

    public GlossaryController(ILogger<GlossaryController> logger)
    {
        _logger = logger;
    }

    private IActionResult CompatibilityUnavailable(string operation, object? context = null)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            status = "unavailable",
            mode = "compatibility",
            operation,
            context,
            message = "Levy glossary content is not yet backed by an authoritative curated term set. Use the governed levy reference surfaces until a reviewed glossary packet exists.",
            liveRoutes = new[]
            {
                "/api/levy/v1/ipd-rates",
                "/api/levy/v1/lid-lifts",
                "/api/levy/v1/state-school-levy",
                "/api/levy/v1/refund-fund",
                "/api/levy/v1/tax-code-areas",
                "/api/levy/v1/retention-policy",
            },
        });
    }

    /// <summary>
    /// Retrieve all glossary terms, optionally filtered by search query.
    /// </summary>
    [HttpGet("terms")]
    public IActionResult GetTerms([FromQuery] string? q, [FromQuery] string? category)
    {
        _logger.LogInformation("LEV-041: Glossary terms requested");
        return CompatibilityUnavailable("terms", new { q, category });
    }

    /// <summary>
    /// Retrieve a specific glossary term by its URL slug.
    /// </summary>
    [HttpGet("term/{slug}")]
    public IActionResult GetTerm(string slug)
    {
        _logger.LogInformation("LEV-041: Glossary term requested: {Slug}", slug);
        return CompatibilityUnavailable("term", new { slug });
    }

    /// <summary>
    /// Retrieve available glossary categories.
    /// </summary>
    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        _logger.LogInformation("LEV-041: Glossary categories requested");
        return CompatibilityUnavailable("categories");
    }
}
