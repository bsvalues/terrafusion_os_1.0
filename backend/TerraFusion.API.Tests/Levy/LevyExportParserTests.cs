using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-076: Multi-format export/parser tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class LevyExportParserTests
    {
        private record ParsedRow(string DistrictCode, string DistrictName, decimal Rate);

        private static List<ParsedRow> ParseCsv(string csv)
        {
            return csv.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Skip(1) // skip header
                .Select(line =>
                {
                    var parts = line.Split(',');
                    return new ParsedRow(parts[0].Trim(), parts[1].Trim(), decimal.Parse(parts[2].Trim()));
                })
                .ToList();
        }

        private static List<ParsedRow> ParseTabDelimited(string tsv)
        {
            return tsv.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Skip(1)
                .Select(line =>
                {
                    var parts = line.Split('\t');
                    return new ParsedRow(parts[0].Trim(), parts[1].Trim(), decimal.Parse(parts[2].Trim()));
                })
                .ToList();
        }

        [Fact]
        public void ParseCsv_ValidInput_ReturnsCorrectRows()
        {
            var csv = "Code,Name,Rate\nFD-10,Test Fire Dist,1.25\nSCH-20,Test School Dist,3.10";

            var rows = ParseCsv(csv);

            Assert.Equal(2, rows.Count);
            Assert.Equal("FD-10", rows[0].DistrictCode);
            Assert.Equal(3.10m, rows[1].Rate);
        }

        [Fact]
        public void ParseTabDelimited_ValidInput_ReturnsCorrectRows()
        {
            var tsv = "Code\tName\tRate\nPK-05\tTest Park Dist\t0.65\nLIB-03\tTest Library Dist\t0.50";

            var rows = ParseTabDelimited(tsv);

            Assert.Equal(2, rows.Count);
            Assert.Equal("PK-05", rows[0].DistrictCode);
            Assert.Equal(0.50m, rows[1].Rate);
        }

        [Fact]
        public void ParseCsv_MalformedInput_ThrowsException()
        {
            var badCsv = "Code,Name,Rate\nFD-10,Missing Rate Field";

            Assert.Throws<IndexOutOfRangeException>(() => ParseCsv(badCsv));
        }

        [Fact]
        public void ParseCsv_EmptyInput_ReturnsEmptyList()
        {
            var csv = "Code,Name,Rate";

            var rows = ParseCsv(csv);

            Assert.Empty(rows);
        }

        [Fact]
        public void ParseCsv_InvalidDecimal_ThrowsFormatException()
        {
            var csv = "Code,Name,Rate\nFD-10,Test Dist,NOT_A_NUMBER";

            Assert.Throws<FormatException>(() => ParseCsv(csv));
        }
    }
}
