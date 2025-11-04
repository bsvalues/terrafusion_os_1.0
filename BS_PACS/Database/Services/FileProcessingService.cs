using CsvHelper;
using System.Globalization;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Logging;

public class FileProcessingService : IFileProcessingService
{
    private readonly DatabaseContext _context;
    private readonly ILogger<FileProcessingService> _logger;
    private readonly BlobServiceClient _blobServiceClient;

    public FileProcessingService(
        DatabaseContext context,
        ILogger<FileProcessingService> logger,
        BlobServiceClient blobServiceClient)
    {
        _context = context;
        _logger = logger;
        _blobServiceClient = blobServiceClient;
    }

    public async Task<ProcessingResult> ProcessBuildingPermitsAsync(IFormFile file, int tenantId)
    {
        var result = new ProcessingResult();
        
        try
        {
            // Store original file in blob storage
            var blobName = $"permits/{DateTime.UtcNow:yyyy-MM-dd}/{Guid.NewGuid()}/{file.FileName}";
            var containerClient = _blobServiceClient.GetBlobContainerClient("uploads");
            await using var stream = file.OpenReadStream();
            await containerClient.UploadBlobAsync(blobName, stream);

            // Process CSV
            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            
            var records = csv.GetRecords<BuildingPermitImport>().ToList();
            
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var record in records)
                {
                    result.TotalRows++;
                    
                    // Validate property exists
                    var property = await _context.Properties
                        .FirstOrDefaultAsync(p => p.TenantID == tenantId && 
                                                p.PropertyID == record.PropertyID);
                    
                    if (property == null)
                    {
                        result.Errors.Add(new ProcessingError
                        {
                            Row = result.TotalRows,
                            Message = $"Property {record.PropertyID} not found"
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
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.BuildingPermits.Add(permit);
                    result.SuccessRows++;
                }

                // Create import log
                var importLog = new ImportLog
                {
                    TenantID = tenantId,
                    FileName = file.FileName,
                    BlobPath = blobName,
                    TotalRows = result.TotalRows,
                    SuccessRows = result.SuccessRows,
                    ErrorRows = result.Errors.Count,
                    ImportedAt = DateTime.UtcNow
                };
                
                _context.ImportLogs.Add(importLog);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing building permits file {FileName}", file.FileName);
            result.Errors.Add(new ProcessingError
            {
                Row = 0,
                Message = "System error: " + ex.Message
            });
        }

        return result;
    }
}
