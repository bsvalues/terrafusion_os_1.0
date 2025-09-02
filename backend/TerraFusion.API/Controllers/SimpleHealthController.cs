using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/simple-health")]
public class SimpleHealthController : ControllerBase
{
    private readonly ILogger<SimpleHealthController> _logger;

    public SimpleHealthController(ILogger<SimpleHealthController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get()
    {
        _logger.LogInformation("Simple health check requested");
        
        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            Version = "1.0.0",
            Service = "TerraFusion OS API - Basic Mode"
        });
    }

    [HttpGet("ready")]
    public IActionResult Ready()
    {
        return Ok(new
        {
            Status = "Ready",
            Timestamp = DateTime.UtcNow,
            Message = "TerraFusion OS is initializing"
        });
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new
        {
            Status = "Live",
            Timestamp = DateTime.UtcNow
        });
    }
}