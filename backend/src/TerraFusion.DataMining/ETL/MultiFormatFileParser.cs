// TMR-034: Multi-format file parser for CSV, Excel, JSON, XML, and geospatial files
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Parses multiple file formats (CSV, TSV, JSON, XML, GeoJSON) into a uniform
    /// collection of <see cref="FileRecord"/> objects. Excel and Shapefile parsing
    /// are stubbed and would require additional NuGet packages in production.
    /// </summary>
    public class MultiFormatFileParser
    {
        private readonly ILogger<MultiFormatFileParser> _logger;

        /// <summary>
        /// Initializes the multi-format file parser.
        /// </summary>
        /// <param name="logger">Logger instance.</param>
        public MultiFormatFileParser(ILogger<MultiFormatFileParser> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Detects the file format from the file extension.
        /// </summary>
        /// <param name="filePath">Path to the file.</param>
        /// <returns>Detected file format.</returns>
        public static FileFormat DetectFormat(string filePath)
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            return ext switch
            {
                ".csv" => FileFormat.Csv,
                ".tsv" or ".tab" => FileFormat.Tsv,
                ".xlsx" or ".xls" => FileFormat.Excel,
                ".json" => FileFormat.Json,
                ".geojson" => FileFormat.GeoJson,
                ".xml" => FileFormat.Xml,
                ".shp" => FileFormat.Shapefile,
                _ => FileFormat.Csv // Default to CSV
            };
        }

        /// <summary>
        /// Parses a file into a collection of <see cref="FileRecord"/> objects.
        /// </summary>
        /// <param name="filePath">Path to the file.</param>
        /// <param name="config">Import configuration with column mapping and format hints.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Collection of parsed records.</returns>
        public async Task<IReadOnlyList<FileRecord>> ParseFileAsync(
            string filePath, FileImportConfig config, CancellationToken cancellationToken = default)
        {
            if (!File.Exists(filePath))
            {
                _logger.LogError("File not found: {Path}", filePath);
                return Array.Empty<FileRecord>();
            }

            var format = config.Format != default ? config.Format : DetectFormat(filePath);
            _logger.LogInformation("Parsing file {Path} as {Format}", filePath, format);

            return format switch
            {
                FileFormat.Csv => await ParseDelimitedAsync(filePath, ',', config, cancellationToken),
                FileFormat.Tsv => await ParseDelimitedAsync(filePath, '\t', config, cancellationToken),
                FileFormat.Json or FileFormat.GeoJson => await ParseJsonAsync(filePath, config, cancellationToken),
                FileFormat.Xml => await ParseXmlAsync(filePath, config, cancellationToken),
                FileFormat.Excel => ParseExcelStub(filePath),
                FileFormat.Shapefile => ParseShapefileStub(filePath),
                _ => Array.Empty<FileRecord>()
            };
        }

        /// <summary>
        /// Parses a delimited text file (CSV or TSV).
        /// </summary>
        private async Task<IReadOnlyList<FileRecord>> ParseDelimitedAsync(
            string filePath, char delimiter, FileImportConfig config, CancellationToken cancellationToken)
        {
            var lines = await File.ReadAllLinesAsync(filePath, cancellationToken);
            if (lines.Length == 0) return Array.Empty<FileRecord>();

            string[] headers;
            int dataStart;

            if (config.HasHeaders && lines.Length > 0)
            {
                headers = ParseDelimitedLine(lines[0], delimiter);
                dataStart = 1;
            }
            else
            {
                var firstLine = ParseDelimitedLine(lines[0], delimiter);
                headers = Enumerable.Range(0, firstLine.Length).Select(i => $"Column{i}").ToArray();
                dataStart = 0;
            }

            var records = new List<FileRecord>();
            for (int i = dataStart; i < lines.Length; i++)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var values = ParseDelimitedLine(lines[i], delimiter);
                var record = new FileRecord
                {
                    SourceFile = filePath,
                    RowIndex = i
                };

                for (int j = 0; j < Math.Min(headers.Length, values.Length); j++)
                {
                    record.Fields[headers[j]] = values[j];
                }

                records.Add(record);
            }

            _logger.LogInformation("Parsed {Count} records from delimited file", records.Count);
            return records.AsReadOnly();
        }

        /// <summary>
        /// Parses a JSON or GeoJSON file.
        /// </summary>
        private async Task<IReadOnlyList<FileRecord>> ParseJsonAsync(
            string filePath, FileImportConfig config, CancellationToken cancellationToken)
        {
            var json = await File.ReadAllTextAsync(filePath, cancellationToken);
            var records = new List<FileRecord>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                // Handle GeoJSON FeatureCollection
                if (root.TryGetProperty("type", out var typeEl) &&
                    typeEl.GetString() == "FeatureCollection" &&
                    root.TryGetProperty("features", out var features))
                {
                    int idx = 0;
                    foreach (var feature in features.EnumerateArray())
                    {
                        var record = new FileRecord { SourceFile = filePath, RowIndex = idx++ };
                        if (feature.TryGetProperty("properties", out var props))
                        {
                            foreach (var prop in props.EnumerateObject())
                            {
                                record.Fields[prop.Name] = prop.Value.ToString();
                            }
                        }
                        records.Add(record);
                    }
                }
                // Handle plain JSON array
                else if (root.ValueKind == JsonValueKind.Array)
                {
                    int idx = 0;
                    foreach (var element in root.EnumerateArray())
                    {
                        var record = new FileRecord { SourceFile = filePath, RowIndex = idx++ };
                        foreach (var prop in element.EnumerateObject())
                        {
                            record.Fields[prop.Name] = prop.Value.ToString();
                        }
                        records.Add(record);
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse JSON file: {Path}", filePath);
            }

            _logger.LogInformation("Parsed {Count} records from JSON file", records.Count);
            return records.AsReadOnly();
        }

        /// <summary>
        /// Parses an XML file.
        /// </summary>
        private async Task<IReadOnlyList<FileRecord>> ParseXmlAsync(
            string filePath, FileImportConfig config, CancellationToken cancellationToken)
        {
            var records = new List<FileRecord>();

            try
            {
                var xmlContent = await File.ReadAllTextAsync(filePath, cancellationToken);
                var xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(xmlContent);

                var xpath = config.XmlRecordXPath ?? "//*[count(child::*) > 0 and count(descendant::*) = count(child::*)]";
                var nodes = xmlDoc.SelectNodes(xpath);

                if (nodes != null)
                {
                    int idx = 0;
                    foreach (XmlNode node in nodes)
                    {
                        var record = new FileRecord { SourceFile = filePath, RowIndex = idx++ };
                        foreach (XmlNode child in node.ChildNodes)
                        {
                            if (child.NodeType == XmlNodeType.Element)
                            {
                                record.Fields[child.Name] = child.InnerText;
                            }
                        }
                        if (record.Fields.Count > 0)
                        {
                            records.Add(record);
                        }
                    }
                }
            }
            catch (XmlException ex)
            {
                _logger.LogError(ex, "Failed to parse XML file: {Path}", filePath);
            }

            _logger.LogInformation("Parsed {Count} records from XML file", records.Count);
            return records.AsReadOnly();
        }

        /// <summary>
        /// Stub for Excel parsing. Production would use a library like EPPlus or ClosedXML.
        /// </summary>
        private IReadOnlyList<FileRecord> ParseExcelStub(string filePath)
        {
            _logger.LogWarning("Excel parsing is a stub. File: {Path}. " +
                "Add EPPlus or ClosedXML NuGet package for production use.", filePath);
            return Array.Empty<FileRecord>();
        }

        /// <summary>
        /// Stub for Shapefile parsing. Production would use NetTopologySuite.
        /// </summary>
        private IReadOnlyList<FileRecord> ParseShapefileStub(string filePath)
        {
            _logger.LogWarning("Shapefile parsing is a stub. File: {Path}. " +
                "Add NetTopologySuite.IO.ShapeFile NuGet package for production use.", filePath);
            return Array.Empty<FileRecord>();
        }

        /// <summary>
        /// Parses a single delimited line, handling quoted fields.
        /// </summary>
        private static string[] ParseDelimitedLine(string line, char delimiter)
        {
            var fields = new List<string>();
            bool inQuotes = false;
            var current = new System.Text.StringBuilder();

            foreach (char c in line)
            {
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == delimiter && !inQuotes)
                {
                    fields.Add(current.ToString().Trim());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            fields.Add(current.ToString().Trim());
            return fields.ToArray();
        }
    }
}
