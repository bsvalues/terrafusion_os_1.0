using System.Text;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Domain.Notices;

public sealed class CurrentUseNoticeRenderer
{
    public NoticePreviewResultDto RenderPreview(NoticePreviewRequestDto request)
    {
        var title = request.NoticeType switch
        {
            CurrentUseNoticeType.NoticeOfIntentToRemove => "Notice of Intent to Remove Current Use Assessment Classification",
            CurrentUseNoticeType.NoticeOfOwnerRequestToWithdraw => "Notice of Owner's Request to Withdraw Current Use Classification",
            CurrentUseNoticeType.MissingEvidenceRequest => "Request for Missing Current Use Evidence",
            CurrentUseNoticeType.RequestForInformationVerifyIntent => "Request for Information Verifying Intent to Continue Current Use Classification",
            CurrentUseNoticeType.ReclassificationOptionNotice => "Reclassification Option Notice",
            _ => "Current Use Draft Notice"
        };

        var body = request.NoticeType switch
        {
            CurrentUseNoticeType.NoticeOfIntentToRemove => BuildIntentToRemove(request),
            CurrentUseNoticeType.NoticeOfOwnerRequestToWithdraw => BuildOwnerWithdrawal(request),
            CurrentUseNoticeType.MissingEvidenceRequest => BuildMissingEvidence(request),
            CurrentUseNoticeType.RequestForInformationVerifyIntent => BuildVerifyIntent(request),
            CurrentUseNoticeType.ReclassificationOptionNotice => BuildReclassificationOption(request),
            _ => BuildGenericNotice(request)
        };

        return new NoticePreviewResultDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.NoticeType,
            CurrentUseNoticeStatus.PreviewGenerated,
            title,
            body,
            "Draft generated for assessor review. This document is not final until reviewed, approved, and issued by authorized county staff.",
            DateTimeOffset.UtcNow,
            request.GeneratedBy);
    }

    private static string BuildIntentToRemove(NoticePreviewRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"To: {request.OwnerName}");
        sb.AppendLine($"Parcel: {request.ParcelId}");
        sb.AppendLine($"Classification: {request.ClassificationType}");
        sb.AppendLine();
        sb.AppendLine("This draft notice indicates that the Current Use Assessment Classification granted to the above-described land is under review for removal.");
        sb.AppendLine();
        sb.AppendLine($"Reason for proposed removal: {request.RemovalReason ?? "[reason required]"}");
        sb.AppendLine();
        if (request.ResponseDeadline.HasValue)
        {
            sb.AppendLine($"The property owner may provide a written response by {request.ResponseDeadline.Value:yyyy-MM-dd}.");
            sb.AppendLine();
        }
        sb.AppendLine("Upon removal of classification, the affected land may be valued at true and fair value without regard to its previous classification and may be subject to additional tax, interest, and penalty unless an exception applies.");
        AppendContact(sb, request);
        return sb.ToString();
    }

    private static string BuildOwnerWithdrawal(NoticePreviewRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Owner: {request.OwnerName}");
        sb.AppendLine($"Parcel: {request.ParcelId}");
        sb.AppendLine($"Classification: {request.ClassificationType}");
        sb.AppendLine();
        sb.AppendLine("This draft acknowledges an owner request to withdraw land from Current Use classification.");
        sb.AppendLine();
        sb.AppendLine("Additional tax and interest may apply. A 20% penalty may be suppressed only where the statutory withdrawal procedure and timing requirements are satisfied.");
        if (request.RollbackTotalDue.HasValue)
        {
            sb.AppendLine();
            sb.AppendLine($"Draft rollback total due: {request.RollbackTotalDue.Value:C}");
        }
        AppendContact(sb, request);
        return sb.ToString();
    }

    private static string BuildMissingEvidence(NoticePreviewRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"To: {request.OwnerName}");
        sb.AppendLine($"Parcel: {request.ParcelId}");
        sb.AppendLine();
        sb.AppendLine("The Assessor's Office requires additional information to complete Current Use review.");
        sb.AppendLine();
        sb.AppendLine("Requested evidence may include farm plan, lease agreement, income proof, ownership/operation verification, or other documentation relevant to continued classification.");
        if (request.ResponseDeadline.HasValue)
        {
            sb.AppendLine();
            sb.AppendLine($"Please respond by {request.ResponseDeadline.Value:yyyy-MM-dd}.");
        }
        AppendContact(sb, request);
        return sb.ToString();
    }

    private static string BuildVerifyIntent(NoticePreviewRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"To: {request.OwnerName}");
        sb.AppendLine($"Parcel: {request.ParcelId}");
        sb.AppendLine();
        sb.AppendLine("The Assessor's Office is requesting information verifying intent to continue Current Use classification following transfer or review.");
        sb.AppendLine();
        sb.AppendLine("Please explain how the land will continue to be used in a manner consistent with its classification.");
        if (request.ResponseDeadline.HasValue)
        {
            sb.AppendLine();
            sb.AppendLine($"Response due: {request.ResponseDeadline.Value:yyyy-MM-dd}.");
        }
        AppendContact(sb, request);
        return sb.ToString();
    }

    private static string BuildReclassificationOption(NoticePreviewRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"To: {request.OwnerName}");
        sb.AppendLine($"Parcel: {request.ParcelId}");
        sb.AppendLine();
        sb.AppendLine("A reclassification option may be available if an application for another current use classification or designated forestland status is submitted within the applicable time period.");
        sb.AppendLine("No additional tax, interest, or penalty should be treated as final from this draft notice.");
        AppendContact(sb, request);
        return sb.ToString();
    }

    private static string BuildGenericNotice(NoticePreviewRequestDto request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Owner: {request.OwnerName}");
        sb.AppendLine($"Parcel: {request.ParcelId}");
        sb.AppendLine($"Notice Type: {request.NoticeType}");
        AppendContact(sb, request);
        return sb.ToString();
    }

    private static void AppendContact(StringBuilder sb, NoticePreviewRequestDto request)
    {
        sb.AppendLine();
        sb.AppendLine("Assessor Contact:");
        sb.AppendLine(request.AssessorContactName ?? "[contact name]");
        sb.AppendLine(request.AssessorContactPhone ?? "[contact phone]");
        sb.AppendLine(request.AssessorContactEmail ?? "[contact email]");
    }
}
