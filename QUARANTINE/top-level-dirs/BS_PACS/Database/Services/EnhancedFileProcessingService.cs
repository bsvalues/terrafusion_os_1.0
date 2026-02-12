using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using OfficeOpenXml;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using PACSIntegration.Models.FileProcessing;

namespace PACSIntegration.Services
{
    public class EnhancedFileProcessingService : IFileProcessingService
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<EnhancedFileProcessingService> _logger;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _configuration;

        public EnhancedFileProcessingService(
            DatabaseContext context,
            ILogger<EnhancedFileProcessingService> logger,
            BlobServiceClient blobServiceClient,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _blobServiceClient = blobServiceClient;
            _configuration = configuration;
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        public async Task<FileProcessingResult> ProcessFileAsync(
            IFormFile file,
            int tenantId,
            ImportConfiguration config)
        {
            var result = new FileProcessingResult
            {
                FileName = file.FileName,
                FileType = Path.GetExtension(file.FileName).ToLower(),
                FileSizeBytes = file.Length
            };

            try
            {
                // Store file in blob storage
                var blobName = await StoreFileInBlobStorage(file, tenantId);

                // Process file based on type
                var records = file.FileName.ToLower() switch
                {
                    var f when f.EndsWith(".csv") => await ProcessCsvFile(file, config),
                    var f when f.EndsWith(".xlsx") => await ProcessExcelFile(file, config),
                    var f when f.EndsWith(".json") => await ProcessJsonFile(file, config),
                    _ => throw new NotSupportedException($"File type {result.FileType} is not supported")
                };

                if (!config.ValidateOnly)
                {
                    await SaveRecordsInBatches(records, tenantId, result, config.BatchSize);
                }

                // Log import
                await LogImport(tenantId, result, blobName);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing file {FileName} for tenant {TenantId}", 
                    file.FileName, tenantId);
                result.Errors.Add(new ProcessingError 
                { 
                    Message = $"System error: {ex.Message}" 
                });
                throw;
            }
        }

        private async Task<string> StoreFileInBlobStorage(IFormFile file, int tenantId)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(
                _configuration["Azure:BlobStorage:ContainerName"]);
            
            var blobName = $"tenant-{tenantId}/imports/{DateTime.UtcNow:yyyy-MM-dd}/{Guid.NewGuid()}/{file.FileName}";
            var blobClient = containerClient.GetBlobClient(blobName);
            
            await using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, true);
            
            return blobName;
        }

        private async Task<List<BuildingPermitImport>> ProcessCsvFile(
            IFormFile file, 
            ImportConfiguration config)
        {
            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, new CsvHelper.Configuration.CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = config.SkipHeaderRow,
                MissingFieldFound = null
            });

            if (config.ColumnMappings.Any())
            {
                csv.Context.RegisterClassMap(CreateMappingClass(config.ColumnMappings));
            }

            return await csv.GetRecordsAsync<BuildingPermitImport>().ToListAsync();
        }

        private async Task<List<BuildingPermitImport>> ProcessExcelFile(
            IFormFile file,
            ImportConfiguration config)
        {
            var records = new List<BuildingPermitImport>();
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var package = new ExcelPackage(stream);
            
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension.Rows;
            var startRow = config.SkipHeaderRow ? 2 : 1;

            for (int row = startRow; row <= rowCount; row++)
            {
                try
                {
                    var permit = new BuildingPermitImport
                    {
                        PermitNumber = worksheet.Cells[row, GetColumnIndex("PermitNumber", config)].Text,
                        PropertyID = int.Parse(worksheet.Cells[row, GetColumnIndex("PropertyID", config)].Text),
                        IssueDate = DateTime.ParseExact(
                            worksheet.Cells[row, GetColumnIndex("IssueDate", config)].Text,
                            config.DateFormat,
                            CultureInfo.InvariantCulture),
                        ExpirationDate = DateTime.ParseExact(
                            worksheet.Cells[row, GetColumnIndex("ExpirationDate", config)].Text,
                            config.DateFormat,
                            CultureInfo.InvariantCulture),
                        Status = worksheet.Cells[row, GetColumnIndex("Status", config)].Text,
                        Description = worksheet.Cells[row, GetColumnIndex("Description", config)].Text,
                        EstimatedValue = decimal.Parse(worksheet.Cells[row, GetColumnIndex("EstimatedValue", config)].Text)
                    };
                    records.Add(permit);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing row {Row} in Excel file", row);
                }
            }

            return records;
        }

        private async Task<List<BuildingPermitImport>> ProcessJsonFile(
            IFormFile file,
            ImportConfiguration config)
        {
            using var reader = new StreamReader(file.OpenReadStream());
            var json = await reader.ReadToEndAsync();
            return JsonSerializer.Deserialize<List<BuildingPermitImport>>(json);
        }

        private async Task SaveRecordsInBatches(
            List<BuildingPermitImport> records,
            int tenantId,
            FileProcessingResult result,
            int batchSize)
        {
            var batches = records.Chunk(batchSize);
            
            foreach (var batch in batches)
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var record in batch)
                    {
                        result.TotalRows++;

                        if (!await ValidateRecord(record, tenantId))
                        {
                            result.Errors.Add(new ProcessingError
                            {
                                Row = result.TotalRows,
                                Message = $"Invalid PropertyID: {record.PropertyID}"
                            });
                            continue;
                        }

                        var permit = new BuildingPermit
                        {
                            TenantID = tenantId,
                            PropertyID = record.PropertyID,
                            PermitNumber = record.PermitNumber,
                            IssueDate = record.IssueDate,
                            ExpirationDate = record.ExpirationDate,
                            Status = record.Status,
                            Description = record.Description,
                            EstimatedValue = record.EstimatedValue,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.BuildingPermits.Add(permit);
                        result.SuccessRows++;
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }

            result.ErrorRows = result.Errors.Count;
        }

        private async Task<bool> ValidateRecord(BuildingPermitImport record, int tenantId)
        {
            return await _context.Properties.AnyAsync(p => 
                p.PropertyID == record.PropertyID && 
                p.TenantID == tenantId);
        }

        private async Task LogImport(int tenantId, FileProcessingResult result, string blobPath)
        {
            var importLog = new ImportLog
            {
                TenantID = tenantId,
                FileName = result.FileName,
                FileType = result.FileType,
                FileSizeBytes = result.FileSizeBytes,
                BlobPath = blobPath,
                TotalRows = result.TotalRows,
                SuccessRows = result.SuccessRows,
                ErrorRows = result.ErrorRows,
                ImportedAt = DateTime.UtcNow
            };

            _context.ImportLogs.Add(importLog);
            await _context.SaveChangesAsync();
        }

        private int GetColumnIndex(string columnName, ImportConfiguration config)
        {
            return config.ColumnMappings.TryGetValue(columnName, out var mappedName)
                ? GetColumnLetterIndex(mappedName)
                : GetColumnLetterIndex(columnName);
        }

        private int GetColumnLetterIndex(string column)
        {
            if (int.TryParse(column, out int numericIndex))
                return numericIndex;

            int index = 0;
            for (int i = 0; i < column.Length; i++)
            {
                index *= 26;
                index += (column[i] - 'A' + 1);
            }
            return index;
        }

        private sealed class BuildingPermitMap : CsvHelper.Configuration.ClassMap<BuildingPermitImport>
        {
            public BuildingPermitMap(Dictionary<string, string> mappings)
            {
                foreach (var mapping in mappings)
                {
                    var propertyInfo = typeof(BuildingPermitImport).GetProperty(mapping.Key);
                    if (propertyInfo != null)
                    {
                        Map(typeof(BuildingPermitImport), propertyInfo).Name(mapping.Value);
                    }
                }
            }
        }

        private CsvHelper.Configuration.ClassMap<BuildingPermitImport> CreateMappingClass(
            Dictionary<string, string> mappings)
        {
            return new BuildingPermitMap(mappings);
        }
    }

    public class AuditResult
    {
        public string FileName { get; set; }
        public int TotalRows { get; set; }
        public int ValidRows { get; set; }
        public int ErrorRows { get; set; }
        public List<ErrorLog> Errors { get; set; }
    }

    public class ErrorLog
    {
        public int RowNumber { get; set; }
        public string ErrorMessage { get; set; }
        public string ColumnName { get; set; }
        public string RowData { get; set; }
    }
}
