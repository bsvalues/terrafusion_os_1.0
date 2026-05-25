using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Workflow;

[ApiController]
[Route("api/dais/current-use")]
public sealed class CurrentUseWorkflowController : ControllerBase
{
    private readonly ICurrentUseWorkflowService _service;

    public CurrentUseWorkflowController(ICurrentUseWorkflowService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}/tasks")]
    public async Task<ActionResult<IReadOnlyList<CurrentUseWorkflowTaskDto>>> GetTasks(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetTasksForParcelAsync(parcelId, cancellationToken));
    }

    [HttpPost("tasks")]
    public async Task<ActionResult<CurrentUseWorkflowTaskDto>> CreateTask(
        [FromBody] CreateCurrentUseWorkflowTaskDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreateTaskAsync(request, cancellationToken));
    }

    [HttpPatch("tasks/{taskId:guid}/status")]
    public async Task<ActionResult<CurrentUseWorkflowTaskDto>> UpdateStatus(
        Guid taskId,
        [FromBody] UpdateCurrentUseWorkflowTaskStatusDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.UpdateStatusAsync(taskId, request, cancellationToken));
    }
}
