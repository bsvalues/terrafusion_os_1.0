using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-077: Data import pipeline tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class DataImportTests
    {
        private record ImportRecord(string DistrictCode, string Name, decimal Rate);

        private static string DetectFileType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".csv" => "CSV",
                ".tsv" => "TSV",
                ".xlsx" => "EXCEL",
                _ => "UNKNOWN",
            };
        }

        private static List<ImportRecord> ImportCsv(string content)
        {
            var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries).Skip(1);
            return lines.Select(line =>
            {
                var p = line.Split(',');
                return new ImportRecord(p[0].Trim(), p[1].Trim(), decimal.Parse(p[2].Trim()));
            }).ToList();
        }

        [Fact]
        public void DetectFileType_CsvExtension_ReturnsCsv()
        {
            Assert.Equal("CSV", DetectFileType("levy_rates_2025.csv"));
        }

        [Fact]
        public void DetectFileType_UnknownExtension_ReturnsUnknown()
        {
            Assert.Equal("UNKNOWN", DetectFileType("data.bin"));
        }

        [Fact]
        public void ImportCsv_ValidData_ReturnsAllRecords()
        {
            var csv = "Code,Name,Rate\nGEN-01,Test General Fund,1.80\nFD-01,Test Fire Dist,1.50";

            var records = ImportCsv(csv);

            Assert.Equal(2, records.Count);
            Assert.Equal("GEN-01", records[0].DistrictCode);
        }

        [Fact]
        public void ImportCsv_ValidationDuringImport_InvalidRateFlagged()
        {
            var csv = "Code,Name,Rate\nBAD-01,Test Bad Dist,-0.50";

            var records = ImportCsv(csv);
            var invalid = records.Where(r => r.Rate < 0).ToList();

            Assert.Single(invalid);
            Assert.Equal("BAD-01", invalid[0].DistrictCode);
        }

        [Fact]
        public void ImportCsv_DuplicateHandling_DetectsDuplicateCodes()
        {
            var csv = "Code,Name,Rate\nFD-01,Test Fire Dist A,1.50\nFD-01,Test Fire Dist B,1.60";

            var records = ImportCsv(csv);
            var duplicates = records.GroupBy(r => r.DistrictCode)
                                    .Where(g => g.Count() > 1)
                                    .Select(g => g.Key)
                                    .ToList();

            Assert.Single(duplicates);
            Assert.Equal("FD-01", duplicates[0]);
        }
    }
}
