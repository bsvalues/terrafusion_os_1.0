
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Communications;

public interface ICurrentUseOwnerCommunicationService
{
    Task<CurrentUseOwnerCommunicationDto> GenerateAsync(
        CreateCurrentUseOwnerCommunicationDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseOwnerCommunicationService : ICurrentUseOwnerCommunicationService
{
    public Task<CurrentUseOwnerCommunicationDto> GenerateAsync(
        CreateCurrentUseOwnerCommunicationDto request,
        CancellationToken cancellationToken)
    {
        var title = request.CommunicationType switch
        {
            CurrentUseCommunicationType.RollbackSummary => "Current Use Rollback Estimate Summary",
            CurrentUseCommunicationType.MissingEvidenceInstructions => "Current Use Missing Evidence Instructions",
            CurrentUseCommunicationType.WithdrawalInstructions => "Current Use Withdrawal Instructions",
            CurrentUseCommunicationType.AppealRightsSummary => "Current Use Appeal Rights Summary",
            CurrentUseCommunicationType.ReclassificationOptionSummary => "Current Use Reclassification Option Summary",
            _ => "Current Use Owner Explanation Packet"
        };

        var body = request.CommunicationType switch
        {
            CurrentUseCommunicationType.RollbackSummary =>
                BuildRollbackSummary(request),

            CurrentUseCommunicationType.MissingEvidenceInstructions =>
                BuildMissingEvidenceInstructions(request),

            CurrentUseCommunicationType.WithdrawalInstructions =>
                BuildWithdrawalInstructions(request),

            _ => BuildGenericPacket(request)
        };

        return Task.FromResult(new CurrentUseOwnerCommunicationDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.CommunicationType,
            title,
            body,
            "This summary is provided to help explain Current Use review. It is not a substitute for official notices, statutes, or legal advice.",
            request.LanguageCode,
            DateTimeOffset.UtcNow,
            request.GeneratedBy));
    }

    private static string BuildRollbackSummary(CreateCurrentUseOwnerCommunicationDto request)
    {
        return string.Join("\n\n", new[]
        {
            $"Dear {request.OwnerName},",
            $"The Assessor's Office has prepared a Current Use rollback estimate for parcel {request.ParcelId}.",
            $"Classification: {request.ClassificationType}.",
            request.EstimatedTotalDue.HasValue
                ? $"Estimated total due: {request.EstimatedTotalDue.Value:C}."
                : "The total due is not final until reviewed by authorized staff.",
            "A rollback estimate may include additional tax, interest, and penalty unless an exception applies.",
            "Please contact the Assessor's Office if you believe the parcel information or classification status is incorrect."
        });
    }

    private static string BuildMissingEvidenceInstructions(CreateCurrentUseOwnerCommunicationDto request)
    {
        return string.Join("\n\n", new[]
        {
            $"Dear {request.OwnerName},",
            "The Assessor's Office needs additional information to complete Current Use review.",
            "Requested evidence may include income proof, lease agreement, owner intent response, farm plan, inspection evidence, or other supporting documents.",
            request.ResponseDeadline.HasValue
                ? $"Please respond by {request.ResponseDeadline.Value:yyyy-MM-dd}."
                : "Please respond by the deadline listed in the official notice."
        });
    }

    private static string BuildWithdrawalInstructions(CreateCurrentUseOwnerCommunicationDto request)
    {
        return string.Join("\n\n", new[]
        {
            $"Dear {request.OwnerName},",
            "This summary explains the voluntary withdrawal review process for Current Use classification.",
            "Withdrawal may result in additional tax and interest. Penalty treatment depends on the applicable procedure and staff review.",
            "Do not rely on this summary as a final tax statement."
        });
    }

    private static string BuildGenericPacket(CreateCurrentUseOwnerCommunicationDto request)
    {
        return $"Current Use explanation packet for parcel {request.ParcelId}.";
    }
}
