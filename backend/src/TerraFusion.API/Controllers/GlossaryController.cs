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

    /// <summary>
    /// Retrieve all glossary terms, optionally filtered by search query.
    /// </summary>
    [HttpGet("terms")]
    public IActionResult GetTerms([FromQuery] string? q, [FromQuery] string? category)
    {
        _logger.LogInformation("LEV-041: Glossary terms requested");
        return Ok(new { status = "stub", message = "Glossary terms not yet implemented." });
    }

    /// <summary>
    /// Retrieve a specific glossary term by its URL slug.
    /// </summary>
    [HttpGet("term/{slug}")]
    public IActionResult GetTerm(string slug)
    {
        _logger.LogInformation("LEV-041: Glossary term requested: {Slug}", slug);
        return Ok(new { status = "stub", slug, message = "Glossary term lookup not yet implemented." });
    }

    /// <summary>
    /// Retrieve available glossary categories.
    /// </summary>
    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        _logger.LogInformation("LEV-041: Glossary categories requested");
        return Ok(new { status = "stub", message = "Glossary categories not yet implemented." });
    }
}
