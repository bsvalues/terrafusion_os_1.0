using TerraFusion.AI.Entities;

namespace TerraFusion.AI.Interfaces;

public interface IGptGroundedAnswerService
{
    Task<GPTMessage> SendAsync(int configId, int conversationId, string question,
        string userId, int countyId, string traceId, CancellationToken cancellationToken = default);
}
