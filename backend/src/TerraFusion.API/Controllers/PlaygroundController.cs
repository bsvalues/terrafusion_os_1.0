using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers
{
    // Explicit response classes for proper JSON serialization
    public class StartScenarioResponse
    {
        public string Message { get; set; } = string.Empty;
        public string ScenarioId { get; set; } = string.Empty;
        public string RunId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
        public DateTime StartedAt { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlaygroundController : ControllerBase
    {
        private readonly PrototypeTestingEngine _engine;
        private readonly ScenarioRunRegistry _runs;
        private readonly ILogger<PlaygroundController> _logger;

        public PlaygroundController(
            PrototypeTestingEngine engine,
            ScenarioRunRegistry runs,
            ILogger<PlaygroundController> logger)
        {
            _engine = engine;
            _runs = runs;
            _logger = logger;
        }

        // Read-only probe — safe to expose without auth (health check, demo usability)
        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult GetHealth()
        {
            return Ok(new
            {
                status = "playground-ready",
                timestamp = DateTime.UtcNow,
                endpoints = new[] {
                    "/api/playground/health",
                    "/api/playground/scenarios",
                    "/api/playground/start"
                }
            });
        }

        // Read-only scenario list — safe to expose without auth for demo discoverability
        [HttpGet("scenarios")]
        [AllowAnonymous]
        public async Task<IActionResult> GetScenarios()
        {
            _logger.LogInformation("🎯 GET /api/playground/scenarios called");
            var ids = await _engine.GetScenariosAsync();
            _logger.LogInformation($"📋 Retrieved {ids.Count} scenario IDs: {string.Join(", ", ids)}");

            var scenarios = ids.Select(id => new
            {
                id,
                name = id switch
                {
                    "hello-world" => "Hello World Prototype",
                    "pilt-sample" => "PILT Sample Flow",
                    "permit-ai" => "Permit AI Prototype",
                    _ => id
                },
                description = id switch
                {
                    "hello-world" => "Smoke test to validate Playground wiring",
                    "pilt-sample" => "Prototype flow for PILT calculation sandbox",
                    "permit-ai" => "Document intake + auto-approval simulation",
                    _ => null
                }
            }).ToList();

            var response = new { count = scenarios.Count, scenarios };
            _logger.LogInformation($"✅ Returning response with {scenarios.Count} scenarios");
            return Ok(response);
        }

        public class StartScenarioRequest
        {
            public string ScenarioId { get; set; } = string.Empty;
            public Dictionary<string, string>? Parameters { get; set; }
        }

        [HttpPost("start")]
        [Produces("application/json")]
        public async Task<JsonResult> StartScenario([FromBody] StartScenarioRequest request)
        {
            _logger.LogInformation("🔍 StartScenario called with scenarioId: {ScenarioId}", request?.ScenarioId);

            if (string.IsNullOrWhiteSpace(request?.ScenarioId))
            {
                _logger.LogWarning("❌ ScenarioId is null or empty");
                return new JsonResult(new { error = "ScenarioId is required" }) { StatusCode = 400 };
            }

            var isValid = await _engine.ValidateScenarioAsync(request.ScenarioId);
            _logger.LogInformation("🔍 Scenario validation result: {IsValid}", isValid);

            if (!isValid)
            {
                _logger.LogWarning("❌ Unknown scenarioId: {ScenarioId}", request.ScenarioId);
                return new JsonResult(new { error = "Unknown scenarioId" }) { StatusCode = 400 };
            }

            var run = _runs.Create(request.ScenarioId, request.Parameters);
            _logger.LogInformation("✅ Created run with ID: {RunId}", run.Id);

            _runs.MarkRunning(run.Id);
            _logger.LogInformation("✅ Marked run {RunId} as running", run.Id);

            // Fire-and-forget prototype execution (simulate async work)
            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(200); // simulate quick processing
                    var result = new
                    {
                        scenarioId = run.ScenarioId,
                        message = run.ScenarioId switch
                        {
                            "hello-world" => "Hello, TerraFusion!",
                            "pilt-sample" => "PILT calculation prototype completed",
                            "permit-ai" => "Permit AI auto-approval prototype completed",
                            _ => "Scenario completed"
                        }
                    };
                    _runs.MarkSucceeded(run.Id, result);
                    _logger.LogInformation("✅ Scenario {RunId} completed successfully", run.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Scenario execution failed: {RunId}", run.Id);
                    _runs.MarkFailed(run.Id, ex.Message);
                }
            });

            var responseObject = new StartScenarioResponse
            {
                Message = "Scenario accepted",
                ScenarioId = request.ScenarioId,
                RunId = run.Id,
                Status = "running",
                Parameters = request.Parameters ?? new Dictionary<string, string>(),
                StartedAt = run.StartedAt
            };

            _logger.LogInformation("📤 Preparing response: {@Response}", responseObject);
            _logger.LogInformation("📤 RunId in response: {RunId}, Type: {Type}", responseObject.RunId, responseObject.RunId?.GetType().Name);

            // CRITICAL FIX: Use JsonResult directly for guaranteed serialization
            var jsonResult = new JsonResult(responseObject) { StatusCode = 200 };
            _logger.LogInformation("✅ Returning JsonResult(200) with guaranteed serialization");
            return jsonResult;
        }

        // Read-only run list — safe to expose without auth for demo observability
        [HttpGet("runs")]
        [AllowAnonymous]
        public IActionResult ListRuns()
        {
            var runs = _runs.List().Select(r => new
            {
                r.Id,
                r.ScenarioId,
                r.Status,
                r.StartedAt,
                r.CompletedAt
            });
            return Ok(new { count = runs.Count(), runs });
        }

        // Read-only run detail — safe to expose without auth
        [HttpGet("runs/{id}")]
        [AllowAnonymous]
        public IActionResult GetRun(string id)
        {
            if (!_runs.TryGet(id, out var run) || run == null)
            {
                return NotFound(new { error = "Run not found" });
            }
            return Ok(run);
        }
    }
}
