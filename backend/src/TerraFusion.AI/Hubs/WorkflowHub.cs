/*
 * WorkflowHub - Real-Time Workflow Execution Monitoring
 *
 * SignalR hub for real-time workflow execution monitoring,
 * node-level progress tracking, and workflow collaboration.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 2
 */

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Hubs;

/// <summary>
/// SignalR hub for real-time workflow execution monitoring
/// </summary>
public class WorkflowHub : Hub
{
    private readonly IWorkflowRepository _workflowRepository;
    private readonly IWorkflowExecutionRepository _executionRepository;
    private readonly ILogger<WorkflowHub> _logger;

    // Track workflow subscriptions
    private static readonly ConcurrentDictionary<int, HashSet<string>> _workflowSubscriptions = new();

    // Track workflow locks (for editing)
    private static readonly ConcurrentDictionary<int, WorkflowLock> _workflowLocks = new();

    public WorkflowHub(
        IWorkflowRepository workflowRepository,
        IWorkflowExecutionRepository executionRepository,
        ILogger<WorkflowHub> logger)
    {
        _workflowRepository = workflowRepository ?? throw new ArgumentNullException(nameof(workflowRepository));
        _executionRepository = executionRepository ?? throw new ArgumentNullException(nameof(executionRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Workflow Execution Monitoring

    /// <summary>
    /// Subscribe to workflow execution updates
    /// </summary>
    public async Task SubscribeToWorkflow(int workflowId, Guid userId, Guid countyId)
    {
        // Verify access to workflow
        var hasAccess = await _workflowRepository.HasAccessAsync(workflowId, userId, countyId);
        if (!hasAccess)
        {
            _logger.LogWarning("User {UserId} attempted to subscribe to workflow {WorkflowId} without access",
                userId, workflowId);
            throw new HubException("Access denied to workflow");
        }

        var groupName = $"workflow_{workflowId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _workflowSubscriptions.AddOrUpdate(
            workflowId,
            new HashSet<string> { Context.ConnectionId },
            (_, subscribers) =>
            {
                subscribers.Add(Context.ConnectionId);
                return subscribers;
            });

        _logger.LogInformation("Connection {ConnectionId} subscribed to workflow {WorkflowId}",
            Context.ConnectionId, workflowId);

        // Send current workflow status
        var runningExecutions = await _executionRepository.GetRunningByWorkflowIdAsync(workflowId);
        await Clients.Caller.SendAsync("WorkflowStatus", new
        {
            WorkflowId = workflowId,
            RunningExecutions = runningExecutions,
            SubscribedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Unsubscribe from workflow execution updates
    /// </summary>
    public async Task UnsubscribeFromWorkflow(int workflowId)
    {
        var groupName = $"workflow_{workflowId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        if (_workflowSubscriptions.TryGetValue(workflowId, out var subscribers))
        {
            subscribers.Remove(Context.ConnectionId);
            if (subscribers.Count == 0)
            {
                _workflowSubscriptions.TryRemove(workflowId, out _);
            }
        }

        _logger.LogInformation("Connection {ConnectionId} unsubscribed from workflow {WorkflowId}",
            Context.ConnectionId, workflowId);
    }

    /// <summary>
    /// Broadcast workflow execution started
    /// </summary>
    public async Task BroadcastExecutionStarted(int workflowId, int executionId, int totalNodes)
    {
        _logger.LogInformation("Workflow {WorkflowId} execution {ExecutionId} started with {TotalNodes} nodes",
            workflowId, executionId, totalNodes);

        await Clients.Group($"workflow_{workflowId}").SendAsync("ExecutionStarted", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            TotalNodes = totalNodes,
            StartedAt = DateTime.UtcNow,
            Status = "running"
        });
    }

    /// <summary>
    /// Broadcast execution progress update
    /// </summary>
    public async Task BroadcastExecutionProgress(int workflowId, int executionId, ExecutionProgress progress)
    {
        await Clients.Group($"workflow_{workflowId}").SendAsync("ExecutionProgress", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            Progress = progress,
            UpdatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast node execution started
    /// </summary>
    public async Task BroadcastNodeStarted(int workflowId, int executionId, int nodeId, string nodeName)
    {
        await Clients.Group($"workflow_{workflowId}").SendAsync("NodeStarted", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            NodeId = nodeId,
            NodeName = nodeName,
            StartedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast node execution completed
    /// </summary>
    public async Task BroadcastNodeCompleted(int workflowId, int executionId, int nodeId, NodeResult result)
    {
        _logger.LogDebug("Node {NodeId} completed in workflow {WorkflowId} execution {ExecutionId}",
            nodeId, workflowId, executionId);

        await Clients.Group($"workflow_{workflowId}").SendAsync("NodeCompleted", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            NodeId = nodeId,
            Result = result,
            CompletedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast node execution failed
    /// </summary>
    public async Task BroadcastNodeFailed(int workflowId, int executionId, int nodeId, string error, string? stackTrace = null)
    {
        _logger.LogError("Node {NodeId} failed in workflow {WorkflowId} execution {ExecutionId}: {Error}",
            nodeId, workflowId, executionId, error);

        await Clients.Group($"workflow_{workflowId}").SendAsync("NodeFailed", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            NodeId = nodeId,
            Error = error,
            StackTrace = stackTrace,
            FailedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast execution completed
    /// </summary>
    public async Task BroadcastExecutionCompleted(int workflowId, int executionId, string status, int durationMs)
    {
        _logger.LogInformation("Workflow {WorkflowId} execution {ExecutionId} completed with status {Status} in {Duration}ms",
            workflowId, executionId, status, durationMs);

        await Clients.Group($"workflow_{workflowId}").SendAsync("ExecutionCompleted", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            Status = status,
            DurationMs = durationMs,
            CompletedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast execution cancelled
    /// </summary>
    public async Task BroadcastExecutionCancelled(int workflowId, int executionId, string reason)
    {
        _logger.LogInformation("Workflow {WorkflowId} execution {ExecutionId} cancelled: {Reason}",
            workflowId, executionId, reason);

        await Clients.Group($"workflow_{workflowId}").SendAsync("ExecutionCancelled", new
        {
            WorkflowId = workflowId,
            ExecutionId = executionId,
            Reason = reason,
            CancelledAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Workflow Collaboration

    /// <summary>
    /// Lock workflow for editing
    /// </summary>
    public async Task LockWorkflow(int workflowId, int userId, string userName)
    {
        var lockInfo = new WorkflowLock
        {
            WorkflowId = workflowId,
            UserId = userId,
            UserName = userName,
            ConnectionId = Context.ConnectionId,
            LockedAt = DateTime.UtcNow
        };

        var acquired = _workflowLocks.TryAdd(workflowId, lockInfo);

        if (acquired)
        {
            _logger.LogInformation("Workflow {WorkflowId} locked by user {UserName}", workflowId, userName);

            await Clients.Group($"workflow_{workflowId}").SendAsync("WorkflowLocked", lockInfo);
            await Clients.Caller.SendAsync("LockAcquired", new { WorkflowId = workflowId });
        }
        else
        {
            var existingLock = _workflowLocks[workflowId];
            _logger.LogWarning("Workflow {WorkflowId} lock attempt by {UserName} denied - already locked by {ExistingUser}",
                workflowId, userName, existingLock.UserName);

            await Clients.Caller.SendAsync("LockDenied", new
            {
                WorkflowId = workflowId,
                CurrentLock = existingLock
            });
        }
    }

    /// <summary>
    /// Unlock workflow
    /// </summary>
    public async Task UnlockWorkflow(int workflowId)
    {
        if (_workflowLocks.TryRemove(workflowId, out var lockInfo))
        {
            _logger.LogInformation("Workflow {WorkflowId} unlocked", workflowId);

            await Clients.Group($"workflow_{workflowId}").SendAsync("WorkflowUnlocked", new
            {
                WorkflowId = workflowId,
                UnlockedAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Broadcast workflow definition update
    /// </summary>
    public async Task BroadcastWorkflowUpdate(int workflowId, object workflowDefinition)
    {
        _logger.LogDebug("Broadcasting workflow {WorkflowId} update", workflowId);

        await Clients.OthersInGroup($"workflow_{workflowId}").SendAsync("WorkflowUpdated", new
        {
            WorkflowId = workflowId,
            Definition = workflowDefinition,
            UpdatedBy = Context.ConnectionId,
            UpdatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast node added to workflow
    /// </summary>
    public async Task BroadcastNodeAdded(int workflowId, object nodeDefinition)
    {
        await Clients.OthersInGroup($"workflow_{workflowId}").SendAsync("NodeAdded", new
        {
            WorkflowId = workflowId,
            Node = nodeDefinition,
            AddedBy = Context.ConnectionId,
            AddedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast node removed from workflow
    /// </summary>
    public async Task BroadcastNodeRemoved(int workflowId, int nodeId)
    {
        await Clients.OthersInGroup($"workflow_{workflowId}").SendAsync("NodeRemoved", new
        {
            WorkflowId = workflowId,
            NodeId = nodeId,
            RemovedBy = Context.ConnectionId,
            RemovedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast edge added to workflow
    /// </summary>
    public async Task BroadcastEdgeAdded(int workflowId, object edgeDefinition)
    {
        await Clients.OthersInGroup($"workflow_{workflowId}").SendAsync("EdgeAdded", new
        {
            WorkflowId = workflowId,
            Edge = edgeDefinition,
            AddedBy = Context.ConnectionId,
            AddedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast edge removed from workflow
    /// </summary>
    public async Task BroadcastEdgeRemoved(int workflowId, string edgeId)
    {
        await Clients.OthersInGroup($"workflow_{workflowId}").SendAsync("EdgeRemoved", new
        {
            WorkflowId = workflowId,
            EdgeId = edgeId,
            RemovedBy = Context.ConnectionId,
            RemovedAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Connection Management

    /// <summary>
    /// Handle disconnection cleanup
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up workflow subscriptions
        var workflowsToClean = _workflowSubscriptions
            .Where(kvp => kvp.Value.Contains(Context.ConnectionId))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var workflowId in workflowsToClean)
        {
            if (_workflowSubscriptions.TryGetValue(workflowId, out var subscribers))
            {
                subscribers.Remove(Context.ConnectionId);
                if (subscribers.Count == 0)
                {
                    _workflowSubscriptions.TryRemove(workflowId, out _);
                }
            }
        }

        // Release any workflow locks held by this connection
        var lockedWorkflows = _workflowLocks
            .Where(kvp => kvp.Value.ConnectionId == Context.ConnectionId)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var workflowId in lockedWorkflows)
        {
            if (_workflowLocks.TryRemove(workflowId, out var lockInfo))
            {
                _logger.LogInformation("Automatically released workflow {WorkflowId} lock due to disconnection",
                    workflowId);

                await Clients.Group($"workflow_{workflowId}").SendAsync("WorkflowUnlocked", new
                {
                    WorkflowId = workflowId,
                    Reason = "Connection lost",
                    UnlockedAt = DateTime.UtcNow
                });
            }
        }

        _logger.LogInformation("Connection {ConnectionId} disconnected from WorkflowHub", Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    #endregion
}

#region DTOs

/// <summary>
/// Workflow execution progress
/// </summary>
public record ExecutionProgress(
    int NodesExecuted,
    int NodesFailed,
    int TotalNodes,
    double ProgressPercentage,
    string CurrentNode);

/// <summary>
/// Node execution result
/// </summary>
public record NodeResult(
    string Output,
    int DurationMs,
    Dictionary<string, object>? Metadata = null);

/// <summary>
/// Workflow lock information
/// </summary>
public class WorkflowLock
{
    public int WorkflowId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public DateTime LockedAt { get; set; }
}

#endregion
