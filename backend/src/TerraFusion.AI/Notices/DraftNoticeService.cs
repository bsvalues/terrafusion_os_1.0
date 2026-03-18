using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.AI.Notices;

/// <summary>
/// Request model for generating an assessment change notice.
/// </summary>
public class NoticeRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public decimal PriorValue { get; set; }
    public decimal NewValue { get; set; }
    public int TaxYear { get; set; }
    public string PropertyAddress { get; set; } = string.Empty;
    public string CountyName { get; set; } = "Benton County";
}

/// <summary>
/// Generated assessment change notice with legal language.
/// </summary>
public class AssessmentNotice
{
    public string ParcelId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string NoticeText { get; set; } = string.Empty;
    public decimal PriorValue { get; set; }
    public decimal NewValue { get; set; }
    public decimal ChangePercent { get; set; }
    public DateTime NoticeDate { get; set; }
    public string AppealDeadline { get; set; } = string.Empty;
}

/// <summary>
/// Generates assessment change notices for property owners.
/// Takes parcel + old value + new value, produces notice text with legal language.
/// </summary>
public interface IDraftNoticeService
{
    /// <summary>
    /// Generate a formal assessment change notice for a property owner.
    /// </summary>
    Task<AssessmentNotice> GenerateNoticeAsync(
        NoticeRequest request,
        CancellationToken ct = default);
}

/// <summary>
/// Stub implementation of draft notice generation.
/// Produces template notices; real LLM-enhanced generation comes in a later phase.
/// </summary>
public class DraftNoticeService : IDraftNoticeService
{
    public Task<AssessmentNotice> GenerateNoticeAsync(
        NoticeRequest request,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var changeAmount = request.NewValue - request.PriorValue;
        var changePct = request.PriorValue > 0
            ? Math.Round((changeAmount / request.PriorValue) * 100, 2)
            : 0;

        // Appeal deadline is typically 60 days from notice date per RCW 84.40.038
        var noticeDate = DateTime.UtcNow;
        var appealDeadline = noticeDate.AddDays(60).ToString("MMMM d, yyyy");

        var direction = changeAmount >= 0 ? "increased" : "decreased";

        var noticeText =
            $"NOTICE OF CHANGE IN ASSESSED VALUE\n" +
            $"{request.CountyName} Assessor's Office\n" +
            $"Tax Year {request.TaxYear}\n\n" +
            $"Date: {noticeDate:MMMM d, yyyy}\n\n" +
            $"Dear {request.OwnerName},\n\n" +
            $"This notice is to inform you that the assessed value of your property " +
            $"(Parcel Number: {request.ParcelId}) has been {direction} for " +
            $"tax year {request.TaxYear}.\n\n" +
            $"Property Address: {request.PropertyAddress}\n" +
            $"Prior Assessed Value: {request.PriorValue:C0}\n" +
            $"New Assessed Value: {request.NewValue:C0}\n" +
            $"Change: {changeAmount:C0} ({changePct}%)\n\n" +
            $"APPEAL RIGHTS:\n" +
            $"Pursuant to RCW 84.40.038, you have the right to appeal this " +
            $"valuation to the {request.CountyName} Board of Equalization. " +
            $"Appeals must be filed no later than {appealDeadline}.\n\n" +
            $"For questions about your assessment, please contact the " +
            $"{request.CountyName} Assessor's Office.\n\n" +
            $"Sincerely,\n" +
            $"{request.CountyName} Assessor's Office";

        var notice = new AssessmentNotice
        {
            ParcelId = request.ParcelId,
            OwnerName = request.OwnerName,
            NoticeText = noticeText,
            PriorValue = request.PriorValue,
            NewValue = request.NewValue,
            ChangePercent = changePct,
            NoticeDate = noticeDate,
            AppealDeadline = appealDeadline,
        };

        return Task.FromResult(notice);
    }
}
