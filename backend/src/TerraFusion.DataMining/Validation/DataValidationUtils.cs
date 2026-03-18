using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace TerraFusion.DataMining.Validation;

/// <summary>
/// Static utility methods for validating and normalizing property records
/// ingested from external data sources (Zillow, ATTOM, NARRPR, PACMLS,
/// county GIS). TMR-018.
/// </summary>
public static class DataValidationUtils
{
    // ── Common directional abbreviations for address normalization ──
    private static readonly Dictionary<string, string> DirectionAbbreviations = new(StringComparer.OrdinalIgnoreCase)
    {
        ["north"] = "N", ["south"] = "S", ["east"] = "E", ["west"] = "W",
        ["northeast"] = "NE", ["northwest"] = "NW", ["southeast"] = "SE", ["southwest"] = "SW",
    };

    // ── Common street suffix abbreviations ──
    private static readonly Dictionary<string, string> StreetSuffixes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["street"] = "ST", ["avenue"] = "AVE", ["boulevard"] = "BLVD",
        ["drive"] = "DR", ["lane"] = "LN", ["road"] = "RD",
        ["court"] = "CT", ["circle"] = "CIR", ["place"] = "PL",
        ["way"] = "WAY", ["terrace"] = "TER", ["trail"] = "TRL",
        ["highway"] = "HWY", ["parkway"] = "PKWY", ["loop"] = "LOOP",
    };

    /// <summary>
    /// Validates that all specified fields are non-null and non-empty on the
    /// given record dictionary. Returns a list of field names that are missing.
    /// </summary>
    /// <param name="record">Dictionary of field-name to value.</param>
    /// <param name="requiredFields">Field names that must have a value.</param>
    /// <returns>List of missing field names; empty if all present.</returns>
    public static List<string> ValidateRequiredFields(
        IDictionary<string, string?> record,
        IEnumerable<string> requiredFields)
    {
        if (record == null) throw new ArgumentNullException(nameof(record));
        if (requiredFields == null) throw new ArgumentNullException(nameof(requiredFields));

        var missing = new List<string>();
        foreach (var field in requiredFields)
        {
            if (!record.TryGetValue(field, out var value) || string.IsNullOrWhiteSpace(value))
            {
                missing.Add(field);
            }
        }
        return missing;
    }

    /// <summary>
    /// Trims whitespace, collapses internal runs of whitespace to a single
    /// space, and optionally converts to uppercase.
    /// </summary>
    /// <param name="input">Raw input string.</param>
    /// <param name="toUpper">If true, converts result to uppercase.</param>
    /// <returns>Normalized string, or null if input is null/empty.</returns>
    public static string? NormalizeString(string? input, bool toUpper = false)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var result = Regex.Replace(input.Trim(), @"\s+", " ");
        return toUpper ? result.ToUpperInvariant() : result;
    }

    /// <summary>
    /// Normalizes a US street address for consistent matching across sources.
    /// Uppercases, trims, expands or abbreviates directionals and suffixes,
    /// removes punctuation, and collapses whitespace.
    /// </summary>
    /// <param name="address">Raw address string.</param>
    /// <returns>Normalized address, or null if input is null/empty.</returns>
    public static string? NormalizeAddress(string? address)
    {
        if (string.IsNullOrWhiteSpace(address))
            return null;

        // Uppercase and remove punctuation except #
        var result = address.Trim().ToUpperInvariant();
        result = Regex.Replace(result, @"[.,;:!?()\[\]{}]", "");
        result = Regex.Replace(result, @"\s+", " ");

        // Replace directional words with abbreviations
        foreach (var (word, abbr) in DirectionAbbreviations)
        {
            result = Regex.Replace(
                result,
                $@"\b{Regex.Escape(word.ToUpperInvariant())}\b",
                abbr,
                RegexOptions.IgnoreCase);
        }

        // Replace street suffix words with abbreviations
        foreach (var (word, abbr) in StreetSuffixes)
        {
            result = Regex.Replace(
                result,
                $@"\b{Regex.Escape(word.ToUpperInvariant())}\b",
                abbr,
                RegexOptions.IgnoreCase);
        }

        // Final whitespace collapse
        result = Regex.Replace(result, @"\s+", " ").Trim();
        return result;
    }

    /// <summary>
    /// Computes a fuzzy similarity score between two strings using
    /// bi-gram (Dice coefficient) comparison. Returns 1.0 for identical
    /// strings, 0.0 for completely dissimilar.
    /// </summary>
    /// <param name="a">First string.</param>
    /// <param name="b">Second string.</param>
    /// <returns>Similarity score between 0.0 and 1.0.</returns>
    public static double FuzzyMatch(string? a, string? b)
    {
        if (string.IsNullOrWhiteSpace(a) || string.IsNullOrWhiteSpace(b))
            return 0.0;

        var normalA = a.Trim().ToUpperInvariant();
        var normalB = b.Trim().ToUpperInvariant();

        if (normalA == normalB)
            return 1.0;

        if (normalA.Length < 2 || normalB.Length < 2)
            return normalA == normalB ? 1.0 : 0.0;

        var bigramsA = GetBigrams(normalA);
        var bigramsB = GetBigrams(normalB);

        int intersectionCount = bigramsA.Intersect(bigramsB).Count();
        return (2.0 * intersectionCount) / (bigramsA.Count + bigramsB.Count);
    }

    /// <summary>
    /// Performs a strict equality match after normalizing both strings
    /// (trim, collapse whitespace, uppercase).
    /// </summary>
    /// <param name="a">First string.</param>
    /// <param name="b">Second string.</param>
    /// <returns>True if the normalized forms are identical.</returns>
    public static bool StrictMatch(string? a, string? b)
    {
        var na = NormalizeString(a, toUpper: true);
        var nb = NormalizeString(b, toUpper: true);

        if (na == null && nb == null)
            return true;
        if (na == null || nb == null)
            return false;

        return string.Equals(na, nb, StringComparison.Ordinal);
    }

    /// <summary>
    /// Validates a property record dictionary against a standard set of
    /// rules for mass-appraisal data quality:
    /// <list type="bullet">
    ///   <item>Required fields present (parcel_number, address)</item>
    ///   <item>Year built in plausible range</item>
    ///   <item>Living area positive</item>
    ///   <item>Values non-negative</item>
    /// </list>
    /// </summary>
    /// <param name="record">Property record as field-name/value pairs.</param>
    /// <returns>List of validation error messages; empty if valid.</returns>
    public static List<string> ValidatePropertyRecord(IDictionary<string, string?> record)
    {
        if (record == null) throw new ArgumentNullException(nameof(record));

        var errors = new List<string>();

        // Required fields
        var missing = ValidateRequiredFields(record, new[] { "parcel_number", "address" });
        foreach (var field in missing)
        {
            errors.Add($"Required field '{field}' is missing or empty.");
        }

        // Year built validation
        if (record.TryGetValue("year_built", out var yearStr) &&
            !string.IsNullOrWhiteSpace(yearStr))
        {
            if (int.TryParse(yearStr, out int year))
            {
                if (year < 1700 || year > DateTime.UtcNow.Year + 2)
                {
                    errors.Add($"Year built '{year}' is outside plausible range (1700–{DateTime.UtcNow.Year + 2}).");
                }
            }
            else
            {
                errors.Add($"Year built '{yearStr}' is not a valid integer.");
            }
        }

        // Living area validation
        if (record.TryGetValue("living_area_sqft", out var areaStr) &&
            !string.IsNullOrWhiteSpace(areaStr))
        {
            if (decimal.TryParse(areaStr, out decimal area))
            {
                if (area <= 0)
                {
                    errors.Add("Living area must be positive.");
                }
                else if (area > 100_000)
                {
                    errors.Add($"Living area '{area}' sqft exceeds plausible maximum (100,000).");
                }
            }
            else
            {
                errors.Add($"Living area '{areaStr}' is not a valid number.");
            }
        }

        // Value fields must be non-negative
        foreach (var valueField in new[] { "assessed_value", "market_value", "sale_price" })
        {
            if (record.TryGetValue(valueField, out var valStr) &&
                !string.IsNullOrWhiteSpace(valStr))
            {
                if (decimal.TryParse(valStr, out decimal val) && val < 0)
                {
                    errors.Add($"'{valueField}' must be non-negative (got {val}).");
                }
            }
        }

        return errors;
    }

    // ── Private helpers ──

    /// <summary>
    /// Extracts character bigrams from a string for Dice coefficient calculation.
    /// </summary>
    private static List<string> GetBigrams(string s)
    {
        var bigrams = new List<string>(s.Length - 1);
        for (int i = 0; i < s.Length - 1; i++)
        {
            bigrams.Add(s.Substring(i, 2));
        }
        return bigrams;
    }
}
