// TFR-007: Quality gates specific to PACS data pre-ingest validation
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace TerraFusion.Core.Sync.QualityGates
{
    /// <summary>
    /// Result of running a single quality gate check.
    /// </summary>
    public class GateCheckResult
    {
        /// <summary>Name of the quality gate.</summary>
        public string GateName { get; set; } = string.Empty;

        /// <summary>Whether this gate passed.</summary>
        public bool Passed { get; set; }

        /// <summary>Human-readable message describing the result.</summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>The field or record identifier that failed (if applicable).</summary>
        public string? FailedIdentifier { get; set; }

        /// <summary>
        /// Creates a passing result.
        /// </summary>
        public static GateCheckResult Pass(string gateName, string message = "OK") =>
            new() { GateName = gateName, Passed = true, Message = message };

        /// <summary>
        /// Creates a failing result.
        /// </summary>
        public static GateCheckResult Fail(string gateName, string message, string? identifier = null) =>
            new() { GateName = gateName, Passed = false, Message = message, FailedIdentifier = identifier };
    }

    /// <summary>
    /// Aggregate result of running all quality gates on a batch of records.
    /// </summary>
    public class QualityGateResult
    {
        /// <summary>Whether all gates passed for all records.</summary>
        public bool AllPassed => FailedChecks.Count == 0;

        /// <summary>Total number of gate checks executed.</summary>
        public int TotalChecks { get; set; }

        /// <summary>Number of passed checks.</summary>
        public int PassedCount => TotalChecks - FailedChecks.Count;

        /// <summary>List of failed gate checks.</summary>
        public List<GateCheckResult> FailedChecks { get; set; } = new();

        /// <summary>List of all gate checks (passed and failed).</summary>
        public List<GateCheckResult> AllChecks { get; set; } = new();

        /// <summary>UTC timestamp when validation was executed.</summary>
        public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Represents a single PACS record for quality gate validation.
    /// Uses a dictionary to allow flexible field access.
    /// </summary>
    public class PacsRecord
    {
        /// <summary>Record fields keyed by column name.</summary>
        public Dictionary<string, object?> Fields { get; set; } = new();

        /// <summary>Source table name.</summary>
        public string SourceTable { get; set; } = string.Empty;

        /// <summary>
        /// Gets a field value as a string or null.
        /// </summary>
        public string? GetString(string fieldName) =>
            Fields.TryGetValue(fieldName, out var val) ? val?.ToString() : null;

        /// <summary>
        /// Gets a field value as a decimal or null.
        /// </summary>
        public decimal? GetDecimal(string fieldName)
        {
            if (!Fields.TryGetValue(fieldName, out var val) || val == null)
                return null;
            return val is decimal d ? d : (decimal.TryParse(val.ToString(), out var parsed) ? parsed : null);
        }

        /// <summary>
        /// Gets a field value as an int or null.
        /// </summary>
        public int? GetInt(string fieldName)
        {
            if (!Fields.TryGetValue(fieldName, out var val) || val == null)
                return null;
            return val is int i ? i : (int.TryParse(val.ToString(), out var parsed) ? parsed : null);
        }
    }

    /// <summary>
    /// Quality gates for PACS data pre-ingest validation.
    /// Validates parcel ID format, required fields, sale price constraints,
    /// and year_built bounds before data enters the TerraFusion pipeline.
    /// </summary>
    public static class PacsQualityGates
    {
        /// <summary>
        /// Benton County parcel ID format: dd-dddd-ddd (two digits, dash, four digits, dash, three digits).
        /// </summary>
        private static readonly Regex ParcelIdPattern = new(
            @"^\d{2}-\d{4}-\d{3}$",
            RegexOptions.Compiled);

        /// <summary>
        /// Required fields for Property records that must be non-null and non-empty.
        /// </summary>
        private static readonly string[] RequiredPropertyFields =
        {
            "parcel_number",
            "property_type",
            "status_code",
            "create_date",
        };

        /// <summary>
        /// Required fields for Sale records.
        /// </summary>
        private static readonly string[] RequiredSaleFields =
        {
            "prop_id",
            "sale_date",
        };

        /// <summary>
        /// Runs all quality gates on a batch of PACS records.
        /// </summary>
        /// <param name="records">The records to validate.</param>
        /// <returns>Aggregate quality gate result.</returns>
        public static QualityGateResult ValidateBatch(IEnumerable<PacsRecord> records)
        {
            var result = new QualityGateResult();

            foreach (var record in records)
            {
                var checks = ValidateRecord(record);
                result.AllChecks.AddRange(checks);
                result.TotalChecks += checks.Count;
                result.FailedChecks.AddRange(checks.Where(c => !c.Passed));
            }

            return result;
        }

        /// <summary>
        /// Runs all applicable quality gates on a single PACS record.
        /// </summary>
        /// <param name="record">The record to validate.</param>
        /// <returns>List of gate check results.</returns>
        public static List<GateCheckResult> ValidateRecord(PacsRecord record)
        {
            var checks = new List<GateCheckResult>();

            // Gate: Parcel ID format
            checks.Add(CheckParcelIdFormat(record));

            // Gate: Required fields
            checks.AddRange(CheckRequiredFields(record));

            // Gate: Sale price > 0 when sale_type = 'qualified'
            if (string.Equals(record.SourceTable, "Sale", StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(CheckQualifiedSalePrice(record));
            }

            // Gate: year_built <= current year
            if (string.Equals(record.SourceTable, "Improvement", StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(CheckYearBuilt(record));
            }

            return checks;
        }

        /// <summary>
        /// Validates that parcel_number follows the Benton County format dd-dddd-ddd.
        /// </summary>
        public static GateCheckResult CheckParcelIdFormat(PacsRecord record)
        {
            const string gate = "ParcelIdFormat";
            var parcelNumber = record.GetString("parcel_number");

            if (string.IsNullOrWhiteSpace(parcelNumber))
            {
                // Only fail format check if the field exists but is malformed.
                // Missing parcel is caught by RequiredFields gate.
                if (record.Fields.ContainsKey("parcel_number"))
                    return GateCheckResult.Fail(gate, "Parcel number is blank.", parcelNumber);

                return GateCheckResult.Pass(gate, "Parcel number field not present; skipping format check.");
            }

            if (ParcelIdPattern.IsMatch(parcelNumber))
                return GateCheckResult.Pass(gate, $"Parcel '{parcelNumber}' matches dd-dddd-ddd format.");

            return GateCheckResult.Fail(gate,
                $"Parcel '{parcelNumber}' does not match expected format dd-dddd-ddd.",
                parcelNumber);
        }

        /// <summary>
        /// Validates that all required fields for the record's source table are present and non-empty.
        /// </summary>
        public static IEnumerable<GateCheckResult> CheckRequiredFields(PacsRecord record)
        {
            const string gate = "RequiredFields";

            var requiredFields = record.SourceTable?.ToUpperInvariant() switch
            {
                "PROPERTY" => RequiredPropertyFields,
                "SALE" => RequiredSaleFields,
                _ => Array.Empty<string>(),
            };

            foreach (var field in requiredFields)
            {
                var value = record.GetString(field);
                if (string.IsNullOrWhiteSpace(value))
                {
                    yield return GateCheckResult.Fail(gate,
                        $"Required field '{field}' is missing or empty in {record.SourceTable} record.",
                        field);
                }
                else
                {
                    yield return GateCheckResult.Pass(gate, $"Required field '{field}' is present.");
                }
            }
        }

        /// <summary>
        /// Validates that sale_price > 0 when sale_type is 'qualified'.
        /// </summary>
        public static GateCheckResult CheckQualifiedSalePrice(PacsRecord record)
        {
            const string gate = "QualifiedSalePrice";

            var saleType = record.GetString("sale_type");
            if (!string.Equals(saleType?.Trim(), "qualified", StringComparison.OrdinalIgnoreCase))
                return GateCheckResult.Pass(gate, "Sale is not qualified; price gate does not apply.");

            var salePrice = record.GetDecimal("sale_price");
            if (salePrice == null)
                return GateCheckResult.Fail(gate,
                    "Qualified sale has null sale_price.",
                    record.GetString("sale_id"));

            if (salePrice > 0)
                return GateCheckResult.Pass(gate, $"Qualified sale price {salePrice:C} is greater than zero.");

            return GateCheckResult.Fail(gate,
                $"Qualified sale has sale_price of {salePrice:C}; must be > 0.",
                record.GetString("sale_id"));
        }

        /// <summary>
        /// Validates that year_built does not exceed the current year.
        /// </summary>
        public static GateCheckResult CheckYearBuilt(PacsRecord record)
        {
            const string gate = "YearBuiltBound";

            var yearBuilt = record.GetInt("year_built");
            if (yearBuilt == null)
                return GateCheckResult.Pass(gate, "year_built is null; skipping bounds check.");

            var currentYear = DateTime.UtcNow.Year;
            if (yearBuilt <= currentYear)
                return GateCheckResult.Pass(gate, $"year_built {yearBuilt} <= current year {currentYear}.");

            return GateCheckResult.Fail(gate,
                $"year_built {yearBuilt} exceeds current year {currentYear}.",
                record.GetString("impr_id"));
        }
    }
}
