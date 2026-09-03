using TerraFusion.Core.Import;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvUploadRowValidatorTests
{
    [Fact]
    public void Sales_stages_valid_rows_and_quarantines_bad_values_and_duplicates()
    {
        var result = CountyCsvUploadRowValidator.Validate(
            CountyCsvDataset.Sales,
            Document(
                ["Parcel ID", "Sale Date", "Sale Price", "Assessed Value", "owner_name"],
                [
                    ["P-1", "2026-01-15", "325000.50", "300000", "discarded"],
                    ["P-2", "01/16/2026", "250000", "", "discarded"],
                    ["P-1", "2026-01-15", "325000.50", "300000", "discarded"],
                    ["P-3", "2026-02-01", "0", "275000", "discarded"],
                ]));

        Assert.Equal(4, result.TotalRowCount);
        var staged = Assert.Single(result.StagedRows);
        Assert.Equal("P-1", staged.ParcelId);
        Assert.Equal("2026-01-15", staged.SaleDate);
        Assert.Equal(325000.50m, staged.SalePrice);
        Assert.Equal(300000m, staged.AssessedValue);
        Assert.Collection(
            result.QuarantinedRows,
            row => Assert.Equal("INVALID_SALE_DATE", row.ReasonCode),
            row => Assert.Equal("DUPLICATE_SALE", row.ReasonCode),
            row => Assert.Equal("INVALID_SALE_PRICE", row.ReasonCode));
        Assert.DoesNotContain("owner", System.Text.Json.JsonSerializer.Serialize(result.StagedRows));
    }

    [Fact]
    public void Parcels_stages_canonical_fields_and_quarantines_duplicate_identity()
    {
        var result = CountyCsvUploadRowValidator.Validate(
            CountyCsvDataset.Parcels,
            Document(
                ["account_id", "Property Address", "Market Value", "private_note"],
                [
                    ["10-20", "100 Main St", "450000", "discarded"],
                    ["10-20", "101 Main St", "460000", "discarded"],
                ]));

        var staged = Assert.Single(result.StagedRows);
        Assert.Equal("10-20", staged.ParcelId);
        Assert.Equal("100 Main St", staged.SitusAddress);
        Assert.Equal(450000m, staged.AssessedValue);
        Assert.Equal("DUPLICATE_PARCEL_ID", Assert.Single(result.QuarantinedRows).ReasonCode);
    }

    [Fact]
    public void Missing_required_schema_quarantines_every_row_without_guessing()
    {
        var result = CountyCsvUploadRowValidator.Validate(
            CountyCsvDataset.Sales,
            Document(["parcel_id", "amount"], [["P-1", "100"]]));

        Assert.Empty(result.StagedRows);
        var row = Assert.Single(result.QuarantinedRows);
        Assert.Equal("MISSING_REQUIRED_HEADER", row.ReasonCode);
        Assert.Contains("sale_date", row.Detail, StringComparison.Ordinal);
        Assert.Contains("sale_price", row.Detail, StringComparison.Ordinal);
    }

    [Fact]
    public void Multiple_aliases_for_one_canonical_header_fail_closed()
    {
        var result = CountyCsvUploadRowValidator.Validate(
            CountyCsvDataset.Parcels,
            Document(
                ["parcel_id", "account_id", "address", "assessed_value"],
                [["P-1", "P-1", "100 Main", "1"]]));

        Assert.Empty(result.StagedRows);
        Assert.Equal("AMBIGUOUS_HEADER", Assert.Single(result.QuarantinedRows).ReasonCode);
    }

    [Fact]
    public void Header_only_document_with_invalid_schema_is_rejected_instead_of_appearing_valid()
    {
        var exception = Assert.Throws<CountyCsvUploadRowSchemaException>(() =>
            CountyCsvUploadRowValidator.Validate(
                CountyCsvDataset.Sales,
                Document(["parcel_id", "amount"], [])));

        Assert.Equal("MISSING_REQUIRED_HEADER", exception.ReasonCode);
    }

    [Fact]
    public void Equivalent_decimal_scales_are_one_duplicate_sale_identity()
    {
        var result = CountyCsvUploadRowValidator.Validate(
            CountyCsvDataset.Sales,
            Document(
                ["parcel_id", "sale_date", "sale_price"],
                [
                    ["P-1", "2026-01-15", "325000.5"],
                    ["p-1", "2026-01-15", "325000.50"],
                ]));

        Assert.Single(result.StagedRows);
        Assert.Equal("DUPLICATE_SALE", Assert.Single(result.QuarantinedRows).ReasonCode);
    }

    [Fact]
    public void Parcel_ids_beyond_comparable_sale_capacity_are_quarantined_before_promotion()
    {
        var result = CountyCsvUploadRowValidator.Validate(
            CountyCsvDataset.Sales,
            Document(
                ["parcel_id", "sale_date", "sale_price"],
                [[new string('P', 51), "2025-06-01", "325000"]]));

        Assert.Empty(result.StagedRows);
        var row = Assert.Single(result.QuarantinedRows);
        Assert.Equal("INVALID_PARCEL_ID", row.ReasonCode);
        Assert.Contains("at most 50 characters", row.Detail, StringComparison.Ordinal);
    }

    private static CountyCsvDocument Document(
        IReadOnlyList<string> headers,
        IReadOnlyList<IReadOnlyList<string>> rows) =>
        new(headers, rows, 1, new string('a', 64));
}
