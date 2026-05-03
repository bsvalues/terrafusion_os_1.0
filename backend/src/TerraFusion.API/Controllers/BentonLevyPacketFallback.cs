using System.Globalization;

namespace TerraFusion.API.Controllers;

internal sealed record BentonLevyPacketRow(
    int Year,
    string DistrictCode,
    string DistrictName,
    decimal AssessedValue,
    decimal LevyRatePerThousand,
    decimal DistrictLevy,
    string CountyCode);

internal static class BentonLevyPacketFallback
{
    private static readonly Lazy<IReadOnlyList<BentonLevyPacketRow>> Rows = new(LoadRows);

    public static bool TryGetRows(int requestedYear, out int actualYear, out IReadOnlyList<BentonLevyPacketRow> rows)
    {
        var allRows = Rows.Value;
        if (allRows.Count == 0)
        {
            actualYear = requestedYear;
            rows = Array.Empty<BentonLevyPacketRow>();
            return false;
        }

        var years = allRows.Select(r => r.Year).Distinct().OrderBy(y => y).ToArray();
        var matchingYears = years.Where(y => y <= requestedYear).ToArray();
        actualYear = matchingYears.Length > 0 ? matchingYears[^1] : years[^1];
        var selectedYear = actualYear;
        rows = allRows.Where(r => r.Year == selectedYear).OrderBy(r => r.DistrictCode).ToArray();
        return rows.Count > 0;
    }

    public static decimal ResolveStatutoryLimit(BentonLevyPacketRow row)
    {
        var districtName = row.DistrictName.ToLowerInvariant();
        if (districtName.Contains("state school")) return 3.60m;
        if (districtName.Contains("county general")) return 1.80m;
        if (districtName.Contains("county road")) return 2.25m;
        if (districtName.Contains("library")) return 0.50m;
        if (districtName.Contains("hospital")) return 0.75m;
        if (districtName.Contains("port")) return 0.45m;
        if (districtName.Contains("cemetery")) return 0.1125m;
        if (districtName.Contains("fire")) return 1.50m;
        if (districtName.Contains("school")) return 5.90m;
        if (row.DistrictCode.StartsWith("303", StringComparison.OrdinalIgnoreCase)) return 3.375m;
        return 10.00m;
    }

    public static IReadOnlyList<BentonLevyPacketRow> SelectRowsForParcel(
        IReadOnlyList<BentonLevyPacketRow> yearRows,
        string? situsCity)
    {
        if (yearRows.Count == 0)
        {
            return Array.Empty<BentonLevyPacketRow>();
        }

        static bool HasName(BentonLevyPacketRow row, string value) =>
            row.DistrictName.Contains(value, StringComparison.OrdinalIgnoreCase);

        var selected = new List<BentonLevyPacketRow>();
        selected.AddRange(yearRows.Where(r => HasName(r, "State School Part 1") || HasName(r, "State School Part 2")));
        selected.AddRange(yearRows.Where(r => HasName(r, "County General")));

        var city = (situsCity ?? string.Empty).Trim().ToUpperInvariant();
        switch (city)
        {
            case "KENNEWICK":
                selected.AddRange(yearRows.Where(r => HasName(r, "Kennewick") || HasName(r, "Kennewick #17")));
                break;
            case "RICHLAND":
                selected.AddRange(yearRows.Where(r => HasName(r, "Richland") || HasName(r, "Richland #400")));
                break;
            case "WEST RICHLAND":
                selected.AddRange(yearRows.Where(r => HasName(r, "West Richland") || HasName(r, "Richland #400")));
                break;
            case "PROSSER":
                selected.AddRange(yearRows.Where(r => HasName(r, "Prosser") || HasName(r, "Prosser #116")));
                break;
            case "BENTON CITY":
                selected.AddRange(yearRows.Where(r => HasName(r, "Benton City") || HasName(r, "Kiona-Benton #52")));
                break;
            case "FINLEY":
                selected.AddRange(yearRows.Where(r => HasName(r, "Finley #53")));
                break;
            default:
                selected.AddRange(yearRows.Where(r => HasName(r, "County Road")));
                break;
        }

        return selected
            .GroupBy(r => r.DistrictCode)
            .Select(g => g.First())
            .OrderBy(r => r.DistrictCode)
            .ToArray();
    }

    public static Guid DeterministicGuid(string seed)
    {
        var bytes = System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(seed));
        return new Guid(bytes);
    }

    private static IReadOnlyList<BentonLevyPacketRow> LoadRows()
    {
        var path = ResolveFilePath();
        if (path is null || !File.Exists(path))
        {
            return Array.Empty<BentonLevyPacketRow>();
        }

        var rows = new List<BentonLevyPacketRow>();
        foreach (var line in File.ReadLines(path).Skip(1))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var columns = line.Split(',');
            if (columns.Length < 7)
            {
                continue;
            }

            if (!int.TryParse(columns[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var year))
            {
                continue;
            }

            if (!decimal.TryParse(columns[3], NumberStyles.Float, CultureInfo.InvariantCulture, out var assessedValue) ||
                !decimal.TryParse(columns[4], NumberStyles.Float, CultureInfo.InvariantCulture, out var levyRate) ||
                !decimal.TryParse(columns[5], NumberStyles.Float, CultureInfo.InvariantCulture, out var districtLevy))
            {
                continue;
            }

            rows.Add(new BentonLevyPacketRow(
                year,
                columns[1].Trim(),
                columns[2].Trim(),
                assessedValue,
                levyRate,
                districtLevy,
                columns[6].Trim()));
        }

        return rows;
    }

    private static string? ResolveFilePath()
    {
        var relativePath = Path.Combine("docs", "VEI-TerraForge", "benton_levy_districts_2010_2025.csv");
        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var current = Path.GetFullPath(start);
            for (var depth = 0; depth < 10; depth++)
            {
                var candidate = Path.Combine(current, relativePath);
                if (File.Exists(candidate))
                {
                    return candidate;
                }

                var parent = Directory.GetParent(current);
                if (parent is null)
                {
                    break;
                }

                current = parent.FullName;
            }
        }

        return null;
    }
}