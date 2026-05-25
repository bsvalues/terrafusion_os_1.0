using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Import;

public interface ICurrentUseImportValidator
{
    CurrentUseImportType ImportType { get; }

    IReadOnlyList<CurrentUseImportValidationIssueDto> Validate(
        IReadOnlyList<Dictionary<string, string?>> rows);
}

public sealed class ClassificationInventoryImportValidator : ICurrentUseImportValidator
{
    public CurrentUseImportType ImportType => CurrentUseImportType.ClassificationInventory;

    private static readonly string[] RequiredFields =
    [
        "ParcelId",
        "ClassificationType",
        "LifecycleState",
        "ClassifiedAcres",
        "OwnerName"
    ];

    public IReadOnlyList<CurrentUseImportValidationIssueDto> Validate(
        IReadOnlyList<Dictionary<string, string?>> rows)
    {
        var issues = new List<CurrentUseImportValidationIssueDto>();

        for (var i = 0; i < rows.Count; i++)
        {
            var rowNumber = i + 2;
            var row = rows[i];

            foreach (var field in RequiredFields)
            {
                if (!row.TryGetValue(field, out var value) || string.IsNullOrWhiteSpace(value))
                {
                    issues.Add(new CurrentUseImportValidationIssueDto(
                        rowNumber,
                        field,
                        CurrentUseImportSeverity.Error,
                        $"Required field missing: {field}"));
                }
            }

            if (row.TryGetValue("ClassifiedAcres", out var acresText) &&
                !string.IsNullOrWhiteSpace(acresText) &&
                !decimal.TryParse(acresText, out _))
            {
                issues.Add(new CurrentUseImportValidationIssueDto(
                    rowNumber,
                    "ClassifiedAcres",
                    CurrentUseImportSeverity.Error,
                    "ClassifiedAcres must be numeric."));
            }
        }

        return issues;
    }
}

public sealed class RollbackWorksheetImportValidator : ICurrentUseImportValidator
{
    public CurrentUseImportType ImportType => CurrentUseImportType.RollbackWorksheet;

    private static readonly string[] RequiredFields =
    [
        "ParcelId",
        "TaxYear",
        "CurrentUseValue",
        "TrueAndFairValue",
        "LevyRate"
    ];

    public IReadOnlyList<CurrentUseImportValidationIssueDto> Validate(
        IReadOnlyList<Dictionary<string, string?>> rows)
    {
        var issues = new List<CurrentUseImportValidationIssueDto>();

        for (var i = 0; i < rows.Count; i++)
        {
            var rowNumber = i + 2;
            var row = rows[i];

            foreach (var field in RequiredFields)
            {
                if (!row.TryGetValue(field, out var value) || string.IsNullOrWhiteSpace(value))
                {
                    issues.Add(new CurrentUseImportValidationIssueDto(
                        rowNumber,
                        field,
                        CurrentUseImportSeverity.Error,
                        $"Required field missing: {field}"));
                }
            }

            foreach (var numericField in new[] { "TaxYear", "CurrentUseValue", "TrueAndFairValue", "LevyRate" })
            {
                if (row.TryGetValue(numericField, out var text) &&
                    !string.IsNullOrWhiteSpace(text) &&
                    !decimal.TryParse(text, out _))
                {
                    issues.Add(new CurrentUseImportValidationIssueDto(
                        rowNumber,
                        numericField,
                        CurrentUseImportSeverity.Error,
                        $"{numericField} must be numeric."));
                }
            }
        }

        return issues;
    }
}
