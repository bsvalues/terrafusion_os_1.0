/**
 * ═══════════════════════════════════════════════════════════════
 * AI AGENT DATABASE CONTROLLER - Persistent AI Agent Management
 * TerraFusion.API - Elite Government AI Integration
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides RESTful CRUD operations for AI Agents with database persistence.
 * Part of Phase 2: Complete AI Agent Integration
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

/// <summary>
/// AI Agent Database Controller - Persistent AI Agent Management
/// Provides CRUD operations for AI agents stored in TerraFusion database
/// </summary>
[ApiController]
[Route("api/agents")]
public class AIAgentDatabaseController : ControllerBase
{
    private readonly TerraFusionDbContext _dbContext;
    private readonly ILogger<AIAgentDatabaseController> _logger;

    public AIAgentDatabaseController(
        TerraFusionDbContext dbContext,
        ILogger<AIAgentDatabaseController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get all AI agents from database
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllAgents(
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] string? countyId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _dbContext.AIAgents.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(a => a.Type == type);

            if (!string.IsNullOrEmpty(countyId))
                query = query.Where(a => a.AssignedCounty == countyId);

            var totalCount = await query.CountAsync();
            var agents = await query
                .OrderByDescending(a => a.LastActiveAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                agents,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                },
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI agents");
            return StatusCode(500, new { error = "Failed to get AI agents", details = ex.Message });
        }
    }

    /// <summary>
    /// Get AI agent by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAgentById(Guid id)
    {
        try
        {
            var agent = await _dbContext.AIAgents.FindAsync(id);

            if (agent == null)
                return NotFound(new { error = $"Agent with ID {id} not found" });

            return Ok(agent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI agent {AgentId}", id);
            return StatusCode(500, new { error = "Failed to get AI agent", details = ex.Message });
        }
    }

    /// <summary>
    /// Create new AI agent
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateAgent([FromBody] CreateAgentRequest request)
    {
        try
        {
            var agent = new AIAgent
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Type = request.Type,
                Status = "Initializing",
                Configuration = JsonSerializer.Serialize(request.Configuration ?? new Dictionary<string, object>()),
                CurrentTask = null,
                ProcessedTasks = 0,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow,
                AssignedCounty = request.AssignedCounty,
                PerformanceScore = 0.0
            };

            _dbContext.AIAgents.Add(agent);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Created AI agent {AgentName} ({AgentId}) of type {AgentType}",
                agent.Name, agent.Id, agent.Type);

            // Update status to Active after successful creation
            agent.Status = "Active";
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAgentById), new { id = agent.Id }, agent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating AI agent");
            return StatusCode(500, new { error = "Failed to create AI agent", details = ex.Message });
        }
    }

    /// <summary>
    /// Update AI agent
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAgent(Guid id, [FromBody] UpdateAgentRequest request)
    {
        try
        {
            var agent = await _dbContext.AIAgents.FindAsync(id);

            if (agent == null)
                return NotFound(new { error = $"Agent with ID {id} not found" });

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.Name))
                agent.Name = request.Name;

            if (!string.IsNullOrEmpty(request.Status))
                agent.Status = request.Status;

            if (!string.IsNullOrEmpty(request.CurrentTask))
                agent.CurrentTask = request.CurrentTask;

            if (request.Configuration != null)
                agent.Configuration = JsonSerializer.Serialize(request.Configuration);

            if (!string.IsNullOrEmpty(request.AssignedCounty))
                agent.AssignedCounty = request.AssignedCounty;

            agent.LastActiveAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Updated AI agent {AgentName} ({AgentId})", agent.Name, agent.Id);

            return Ok(agent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating AI agent {AgentId}", id);
            return StatusCode(500, new { error = "Failed to update AI agent", details = ex.Message });
        }
    }

    /// <summary>
    /// Delete AI agent
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAgent(Guid id)
    {
        try
        {
            var agent = await _dbContext.AIAgents.FindAsync(id);

            if (agent == null)
                return NotFound(new { error = $"Agent with ID {id} not found" });

            _dbContext.AIAgents.Remove(agent);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Deleted AI agent {AgentName} ({AgentId})", agent.Name, agent.Id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting AI agent {AgentId}", id);
            return StatusCode(500, new { error = "Failed to delete AI agent", details = ex.Message });
        }
    }

    /// <summary>
    /// Assign task to AI agent
    /// </summary>
    [HttpPost("{id:guid}/task")]
    public async Task<IActionResult> AssignTask(Guid id, [FromBody] AssignTaskRequest request)
    {
        try
        {
            var agent = await _dbContext.AIAgents.FindAsync(id);

            if (agent == null)
                return NotFound(new { error = $"Agent with ID {id} not found" });

            agent.CurrentTask = request.TaskDescription;
            agent.Status = "Processing";
            agent.LastActiveAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Assigned task to AI agent {AgentName}: {Task}",
                agent.Name, request.TaskDescription);

            return Ok(new
            {
                agent,
                message = "Task assigned successfully",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning task to AI agent {AgentId}", id);
            return StatusCode(500, new { error = "Failed to assign task", details = ex.Message });
        }
    }

    /// <summary>
    /// Complete task for AI agent
    /// </summary>
    [HttpPost("{id:guid}/task/complete")]
    public async Task<IActionResult> CompleteTask(Guid id, [FromBody] CompleteTaskRequest request)
    {
        try
        {
            var agent = await _dbContext.AIAgents.FindAsync(id);

            if (agent == null)
                return NotFound(new { error = $"Agent with ID {id} not found" });

            agent.CurrentTask = null;
            agent.Status = "Active";
            agent.ProcessedTasks++;
            agent.LastActiveAt = DateTime.UtcNow;

            // Update performance score based on success
            if (request.Success)
            {
                agent.PerformanceScore = Math.Min(1.0, agent.PerformanceScore + 0.01);
            }
            else
            {
                agent.PerformanceScore = Math.Max(0.0, agent.PerformanceScore - 0.05);
            }

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("AI agent {AgentName} completed task (success: {Success})",
                agent.Name, request.Success);

            return Ok(new
            {
                agent,
                message = "Task completed",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing task for AI agent {AgentId}", id);
            return StatusCode(500, new { error = "Failed to complete task", details = ex.Message });
        }
    }

    /// <summary>
    /// Get agent statistics summary
    /// </summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetAgentStatistics()
    {
        try
        {
            var totalAgents = await _dbContext.AIAgents.CountAsync();
            var activeAgents = await _dbContext.AIAgents.CountAsync(a => a.Status == "Active");
            var processingAgents = await _dbContext.AIAgents.CountAsync(a => a.Status == "Processing");
            var totalTasksProcessed = await _dbContext.AIAgents.SumAsync(a => a.ProcessedTasks);
            var avgPerformanceScore = totalAgents > 0
                ? await _dbContext.AIAgents.AverageAsync(a => a.PerformanceScore)
                : 0.0;

            var agentsByType = await _dbContext.AIAgents
                .GroupBy(a => a.Type)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToListAsync();

            var agentsByCounty = await _dbContext.AIAgents
                .Where(a => a.AssignedCounty != null)
                .GroupBy(a => a.AssignedCounty)
                .Select(g => new { County = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                summary = new
                {
                    totalAgents,
                    activeAgents,
                    processingAgents,
                    idleAgents = totalAgents - activeAgents - processingAgents,
                    totalTasksProcessed,
                    averagePerformanceScore = Math.Round(avgPerformanceScore, 3)
                },
                byType = agentsByType,
                byCounty = agentsByCounty,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent statistics");
            return StatusCode(500, new { error = "Failed to get statistics", details = ex.Message });
        }
    }

    /// <summary>
    /// Seed initial AI agents (for development/testing)
    /// </summary>
    [HttpPost("seed")]
    public async Task<IActionResult> SeedAgents([FromQuery] int count = 10)
    {
        try
        {
            // Check if agents already exist
            var existingCount = await _dbContext.AIAgents.CountAsync();
            if (existingCount > 0)
            {
                return BadRequest(new {
                    error = "Agents already exist",
                    existingCount,
                    message = "Use DELETE /api/agents to remove existing agents first"
                });
            }

            var agentTypes = new[] { "CommandBrain", "SwarmCoordinator", "RevenueHunter", "PropertyAnalyst", "ComplianceMonitor" };
            var counties = new[] { "benton", "king", "pierce", "spokane", "clark" };
            var random = new Random();

            var agents = new List<AIAgent>();
            for (int i = 0; i < count; i++)
            {
                agents.Add(new AIAgent
                {
                    Id = Guid.NewGuid(),
                    Name = $"Agent-{agentTypes[i % agentTypes.Length]}-{i + 1:D3}",
                    Type = agentTypes[i % agentTypes.Length],
                    Status = "Active",
                    Configuration = JsonSerializer.Serialize(new {
                        priority = random.Next(1, 10),
                        maxConcurrentTasks = random.Next(1, 5)
                    }),
                    CurrentTask = null,
                    ProcessedTasks = random.Next(0, 100),
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30)),
                    LastActiveAt = DateTime.UtcNow.AddMinutes(-random.Next(0, 60)),
                    AssignedCounty = counties[i % counties.Length],
                    PerformanceScore = Math.Round(0.7 + random.NextDouble() * 0.3, 3)
                });
            }

            _dbContext.AIAgents.AddRange(agents);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Seeded {Count} AI agents to database", count);

            return Ok(new
            {
                message = $"Successfully seeded {count} AI agents",
                agents = agents.Select(a => new { a.Id, a.Name, a.Type, a.Status, a.AssignedCounty }),
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding AI agents");
            return StatusCode(500, new { error = "Failed to seed agents", details = ex.Message });
        }
    }
}

// Request DTOs
public class CreateAgentRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "General";
    public string? AssignedCounty { get; set; }
    public Dictionary<string, object>? Configuration { get; set; }
}

public class UpdateAgentRequest
{
    public string? Name { get; set; }
    public string? Status { get; set; }
    public string? CurrentTask { get; set; }
    public string? AssignedCounty { get; set; }
    public Dictionary<string, object>? Configuration { get; set; }
}

public class AssignTaskRequest
{
    public string TaskDescription { get; set; } = string.Empty;
}

public class CompleteTaskRequest
{
    public bool Success { get; set; } = true;
    public string? Result { get; set; }
}
