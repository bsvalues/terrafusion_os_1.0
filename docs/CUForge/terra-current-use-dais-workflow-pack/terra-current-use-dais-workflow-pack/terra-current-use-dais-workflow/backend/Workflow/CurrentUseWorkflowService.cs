using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Workflow;

public interface ICurrentUseWorkflowService
{
    Task<IReadOnlyList<CurrentUseWorkflowTaskDto>> GetTasksForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<CurrentUseWorkflowTaskDto> CreateTaskAsync(
        CreateCurrentUseWorkflowTaskDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseWorkflowTaskDto> UpdateStatusAsync(
        Guid taskId,
        UpdateCurrentUseWorkflowTaskStatusDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseWorkflowService : ICurrentUseWorkflowService
{
    private static readonly List<CurrentUseWorkflowTaskDto> Tasks = new();

    public Task<IReadOnlyList<CurrentUseWorkflowTaskDto>> GetTasksForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseWorkflowTaskDto> result = Tasks
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<CurrentUseWorkflowTaskDto> CreateTaskAsync(
        CreateCurrentUseWorkflowTaskDto request,
        CancellationToken cancellationToken)
    {
        var task = new CurrentUseWorkflowTaskDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.WorkflowType,
            CurrentUseWorkflowStatus.Open,
            request.Title,
            request.AssignedTo,
            request.DueDate,
            request.Priority,
            request.Summary,
            DateTimeOffset.UtcNow,
            request.CreatedBy);

        Tasks.Add(task);

        return Task.FromResult(task);
    }

    public Task<CurrentUseWorkflowTaskDto> UpdateStatusAsync(
        Guid taskId,
        UpdateCurrentUseWorkflowTaskStatusDto request,
        CancellationToken cancellationToken)
    {
        var existing = Tasks.FirstOrDefault(x => x.Id == taskId);

        if (existing is null)
        {
            throw new InvalidOperationException($"Workflow task not found: {taskId}");
        }

        var updated = existing with
        {
            Status = request.Status
        };

        Tasks.Remove(existing);
        Tasks.Add(updated);

        return Task.FromResult(updated);
    }
}
