using TerraFusion.Modules.CurrentUse.Domain.Notices;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Services;

public interface ICurrentUseNoticeService
{
    Task<NoticePreviewResultDto> PreviewAsync(
        NoticePreviewRequestDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseNoticeService : ICurrentUseNoticeService
{
    private readonly CurrentUseNoticeRenderer _renderer;

    public CurrentUseNoticeService(CurrentUseNoticeRenderer renderer)
    {
        _renderer = renderer;
    }

    public Task<NoticePreviewResultDto> PreviewAsync(
        NoticePreviewRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = _renderer.RenderPreview(request);
        return Task.FromResult(result);
    }
}
