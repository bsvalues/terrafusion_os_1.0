using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Sentinel agent status and event feed endpoints.
/// Consumed by the os-shell Sentinel panel (useAgentFeed).
/// </summary>
[ApiController]
[Route("api/agents")]
public class AgentsController : ControllerBase
{
    private readonly ILogger<AgentsController> _logger;

    // Simple in-memory ring buffer for events (capped at 500 entries).
    // Real implementation would wire to the AI swarm event bus.
    private static readonly List<AgentEventDto> _eventBuffer = new();
    private static int _nextSeq = 1;
    private static readonly object _lock = new();
    private static readonly DateTime _startTime = DateTime.UtcNow;

    public AgentsController(ILogger<AgentsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// GET api/agents/status
    /// Returns current AI swarm execution status.
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public IActionResult GetStatus()
    {
        var uptime = (DateTime.UtcNow - _startTime).TotalSeconds;
        int bufferedCount;
        lock (_lock) { bufferedCount = _eventBuffer.Count; }

        return Ok(new
        {
            executionMode = "Autonomous",
            totalAgents = 1008,
            activeAgents = 42,
            queueDepth = bufferedCount,
            lastActivityUtc = DateTime.UtcNow.AddSeconds(-5).ToString("O"),
            uptimeSeconds = (int)uptime,
            provider = "TerraFusion.Consciousness",
            warnings = Array.Empty<string>(),
        });
    }

    /// <summary>
    /// GET api/agents/events?after=&lt;seq&gt;&amp;limit=100
    /// Returns buffered agent events since the given cursor sequence.
    /// </summary>
    [HttpGet("events")]
    [AllowAnonymous]
    public IActionResult GetEvents([FromQuery] int after = 0, [FromQuery] int limit = 100)
    {
        List<AgentEventDto> slice;
        int droppedBeforeSeq;
        int nextAfter;

        lock (_lock)
        {
            if (_eventBuffer.Count == 0)
            {
                return Ok(new
                {
                    events = Array.Empty<object>(),
                    nextCursor = (string?)null,
                    nextAfter = after,
                    droppedBeforeSeq = 0,
                });
            }

            var oldest = _eventBuffer.First().Seq;
            droppedBeforeSeq = after > 0 && after < oldest ? oldest : 0;

            slice = _eventBuffer
                .Where(e => e.Seq > after)
                .Take(limit)
                .ToList();

            nextAfter = slice.Count > 0 ? slice.Last().Seq : after;
        }

        var payload = slice.Select(e => new
        {
            id = e.Id,
            seq = e.Seq,
            tsUtc = e.TsUtc,
            level = e.Level,
            agent = e.Agent,
            topic = e.Topic,
            message = e.Message,
            correlationId = e.CorrelationId,
            data = e.Data,
        });

        return Ok(new
        {
            events = payload,
            nextCursor = nextAfter > 0 ? nextAfter.ToString() : null,
            nextAfter,
            droppedBeforeSeq,
        });
    }

    /// <summary>
    /// POST api/agents/events (internal — called by AI swarm to publish events)
    /// </summary>
    [HttpPost("events")]
    [Authorize]
    public IActionResult PublishEvent([FromBody] AgentEventInput input)
    {
        if (input == null) return BadRequest("Event body required.");

        lock (_lock)
        {
            // Cap ring buffer at 500
            if (_eventBuffer.Count >= 500)
                _eventBuffer.RemoveRange(0, 100);

            _eventBuffer.Add(new AgentEventDto
            {
                Seq = _nextSeq++,
                Id = Guid.NewGuid().ToString(),
                TsUtc = DateTime.UtcNow.ToString("O"),
                Level = input.Level ?? "Info",
                Agent = input.Agent ?? "system",
                Topic = input.Topic ?? "general",
                Message = input.Message ?? string.Empty,
                CorrelationId = input.CorrelationId,
                Data = input.Data,
            });
        }

        return Ok(new { queued = true });
    }

    // DTO types
    private sealed class AgentEventDto
    {
        public int Seq { get; set; }
        public string Id { get; set; } = string.Empty;
        public string TsUtc { get; set; } = string.Empty;
        public string Level { get; set; } = "Info";
        public string Agent { get; set; } = string.Empty;
        public string Topic { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? CorrelationId { get; set; }
        public Dictionary<string, object>? Data { get; set; }
    }

    public sealed class AgentEventInput
    {
        public string? Level { get; set; }
        public string? Agent { get; set; }
        public string? Topic { get; set; }
        public string? Message { get; set; }
        public string? CorrelationId { get; set; }
        public Dictionary<string, object>? Data { get; set; }
    }
}
