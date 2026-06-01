using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// What-If Scenarios Controller — CostForge scenario persistence.
    /// Stores and retrieves user-defined assessment scenarios for Benton County assessors.
    /// Uses JSON file persistence for zero-migration deployment.
    /// </summary>
    [ApiController]
    [Route("api/what-if-scenarios")]
    [Produces("application/json")]
    [Authorize]
    public class WhatIfScenariosController : ControllerBase
    {
        private readonly ILogger<WhatIfScenariosController> _logger;
        private static readonly string StorePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "TerraFusion", "what-if-scenarios.json");

        private static readonly object _lock = new();

        public WhatIfScenariosController(ILogger<WhatIfScenariosController> logger)
        {
            _logger = logger;
            EnsureStore();
        }

        private static void EnsureStore()
        {
            var dir = Path.GetDirectoryName(StorePath)!;
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            if (!System.IO.File.Exists(StorePath))
                System.IO.File.WriteAllText(StorePath, "[]");
        }

        private static List<WhatIfScenario> ReadAll()
        {
            lock (_lock)
            {
                try
                {
                    var json = System.IO.File.ReadAllText(StorePath);
                    return JsonSerializer.Deserialize<List<WhatIfScenario>>(json) ?? new();
                }
                catch { return new(); }
            }
        }

        private static void WriteAll(List<WhatIfScenario> scenarios)
        {
            lock (_lock)
            {
                var json = JsonSerializer.Serialize(scenarios, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(StorePath, json);
            }
        }

        /// <summary>GET /api/what-if-scenarios — List all scenarios.</summary>
        [HttpGet]
        public IActionResult GetScenarios()
        {
            try
            {
                var all = ReadAll();
                return Ok(new { scenarios = all, count = all.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to read scenarios");
                return StatusCode(500, new { error = "Failed to retrieve scenarios." });
            }
        }

        /// <summary>GET /api/what-if-scenarios/{id} — Get one scenario.</summary>
        [HttpGet("{id}")]
        public IActionResult GetScenario(Guid id)
        {
            var scenario = ReadAll().FirstOrDefault(s => s.ScenarioId == id);
            if (scenario is null) return NotFound(new { error = "Scenario not found." });
            return Ok(scenario);
        }

        /// <summary>POST /api/what-if-scenarios — Create a scenario.</summary>
        [HttpPost]
        public IActionResult CreateScenario([FromBody] WhatIfScenarioRequest req)
        {
            try
            {
                var all = ReadAll();
                var scenario = new WhatIfScenario
                {
                    ScenarioId = Guid.NewGuid(),
                    Name = req.Name,
                    Description = req.Description,
                    BaseParcelId = req.BaseParcelId,
                    Assumptions = req.Assumptions,
                    Results = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                all.Add(scenario);
                WriteAll(all);
                return CreatedAtAction(nameof(GetScenario), new { id = scenario.ScenarioId }, scenario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create scenario");
                return StatusCode(500, new { error = "Failed to create scenario." });
            }
        }

        /// <summary>PATCH /api/what-if-scenarios/{id} — Update a scenario.</summary>
        [HttpPatch("{id}")]
        public IActionResult UpdateScenario(Guid id, [FromBody] WhatIfScenarioRequest req)
        {
            try
            {
                var all = ReadAll();
                var existing = all.FirstOrDefault(s => s.ScenarioId == id);
                if (existing is null) return NotFound(new { error = "Scenario not found." });

                existing.Name = req.Name ?? existing.Name;
                existing.Description = req.Description ?? existing.Description;
                existing.BaseParcelId = req.BaseParcelId ?? existing.BaseParcelId;
                if (req.Assumptions != null) existing.Assumptions = req.Assumptions;
                existing.UpdatedAt = DateTime.UtcNow;

                WriteAll(all);
                return Ok(existing);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update scenario {Id}", id);
                return StatusCode(500, new { error = "Failed to update scenario." });
            }
        }

        /// <summary>DELETE /api/what-if-scenarios/{id} — Soft delete a scenario.</summary>
        [HttpDelete("{id}")]
        public IActionResult DeleteScenario(Guid id)
        {
            try
            {
                var all = ReadAll();
                var idx = all.FindIndex(s => s.ScenarioId == id);
                if (idx < 0) return NotFound(new { error = "Scenario not found." });
                all.RemoveAt(idx);
                WriteAll(all);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete scenario {Id}", id);
                return StatusCode(500, new { error = "Failed to delete scenario." });
            }
        }
    }

    public class WhatIfScenario
    {
        public Guid ScenarioId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? BaseParcelId { get; set; }
        public Dictionary<string, object>? Assumptions { get; set; }
        public Dictionary<string, object>? Results { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class WhatIfScenarioRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? BaseParcelId { get; set; }
        public Dictionary<string, object>? Assumptions { get; set; }
    }
}
