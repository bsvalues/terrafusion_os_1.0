using Azure.Storage.Blobs;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace PACSIntegration.Services.DisasterRecovery
{
    public class BackupService : IBackupService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<BackupService> _logger;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _backupPath;

        public BackupService(
            IConfiguration configuration,
            ILogger<BackupService> logger,
            BlobServiceClient blobServiceClient)
        {
            _configuration = configuration;
            _logger = logger;
            _blobServiceClient = blobServiceClient;
            _backupPath = configuration["Backup:LocalPath"];
        }

        public async Task PerformFullBackupAsync()
        {
            try
            {
                _logger.LogInformation("Starting full backup process");

                // 1. Database Backup
                await BackupDatabaseAsync();

                // 2. File Storage Backup
                await BackupBlobStorageAsync();

                // 3. Upload backups to secondary storage
                await UploadBackupsToSecondaryStorageAsync();

                // 4. Clean up old backups
                await CleanupOldBackupsAsync();

                _logger.LogInformation("Full backup completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during full backup process");
                throw;
            }
        }

        private async Task BackupDatabaseAsync()
        {
            try
            {
                var backupFileName = $"PACS_CIAPS_{DateTime.UtcNow:yyyyMMdd_HHmmss}.bak";
                var backupFilePath = Path.Combine(_backupPath, "database", backupFileName);

                Directory.CreateDirectory(Path.GetDirectoryName(backupFilePath));

                using var connection = new SqlConnection(
                    _configuration.GetConnectionString("DefaultConnection"));
                await connection.OpenAsync();

                var backupCommand = new SqlCommand(
                    $@"BACKUP DATABASE [PACS_CIAPS] 
                    TO DISK = '{backupFilePath}' 
                    WITH FORMAT, 
                    MEDIANAME = 'PACS_CIAPS_Backup',
                    NAME = 'PACS_CIAPS-Full Database Backup'", 
                    connection);

                await backupCommand.ExecuteNonQueryAsync();

                _logger.LogInformation("Database backup completed: {BackupFile}", backupFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during database backup");
                throw;
            }
        }

        private async Task BackupBlobStorageAsync()
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(
                    _configuration["Azure:BlobStorage:ContainerName"]);

                var backupContainer = _blobServiceClient.GetBlobContainerClient(
                    $"backup-{DateTime.UtcNow:yyyyMMdd}");
                await backupContainer.CreateIfNotExistsAsync();

                await foreach (var blobItem in containerClient.GetBlobsAsync())
                {
                    var sourceBlob = containerClient.GetBlobClient(blobItem.Name);
                    var destinationBlob = backupContainer.GetBlobClient(blobItem.Name);

                    await destinationBlob.StartCopyFromUriAsync(sourceBlob.Uri);
                }

                _logger.LogInformation("Blob storage backup completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during blob storage backup");
                throw;
            }
        }

        private async Task UploadBackupsToSecondaryStorageAsync()
        {
            try
            {
                var secondaryStorageClient = new BlobServiceClient(
                    _configuration["Backup:SecondaryStorage:ConnectionString"]);
                
                var backupContainer = secondaryStorageClient.GetBlobContainerClient(
                    $"disaster-recovery-{DateTime.UtcNow:yyyyMMdd}");
                await backupContainer.CreateIfNotExistsAsync();

                // Upload database backup
                var databaseBackups = Directory.GetFiles(
                    Path.Combine(_backupPath, "database"), 
                    "*.bak");

                foreach (var backupFile in databaseBackups)
                {
                    var blobClient = backupContainer.GetBlobClient(
                        Path.GetFileName(backupFile));
                    
                    await using var stream = File.OpenRead(backupFile);
                    await blobClient.UploadAsync(stream, true);
                }

                _logger.LogInformation("Backups uploaded to secondary storage");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading backups to secondary storage");
                throw;
            }
        }

        private async Task CleanupOldBackupsAsync()
        {
            try
            {
                // Clean up local backups older than 7 days
                var cutoffDate = DateTime.UtcNow.AddDays(-7);
                var oldBackups = Directory.GetFiles(
                    Path.Combine(_backupPath, "database"), 
                    "*.bak")
                    .Where(f => File.GetCreationTimeUtc(f) < cutoffDate);

                foreach (var backup in oldBackups)
                {
                    File.Delete(backup);
                    _logger.LogInformation("Deleted old backup: {BackupFile}", backup);
                }

                // Clean up old blob storage backups
                var containers = await _blobServiceClient
                    .GetBlobContainersAsync(prefix: "backup-")
                    .ToListAsync();

                foreach (var container in containers)
                {
                    if (DateTime.Parse(container.Name.Replace("backup-", "")) < cutoffDate)
                    {
                        await _blobServiceClient.DeleteBlobContainerAsync(container.Name);
                        _logger.LogInformation("Deleted old blob container: {ContainerName}", 
                            container.Name);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old backups");
                throw;
            }
        }

        public async Task<BackupStatus> GetBackupStatusAsync()
        {
            try
            {
                var lastBackup = Directory.GetFiles(
                    Path.Combine(_backupPath, "database"), 
                    "*.bak")
                    .OrderByDescending(f => File.GetCreationTimeUtc(f))
                    .FirstOrDefault();

                var containers = await _blobServiceClient
                    .GetBlobContainersAsync(prefix: "backup-")
                    .ToListAsync();

                var lastBlobBackup = containers
                    .OrderByDescending(c => c.Name)
                    .FirstOrDefault();

                return new BackupStatus
                {
                    LastDatabaseBackup = lastBackup != null 
                        ? File.GetCreationTimeUtc(lastBackup) 
                        : null,
                    LastBlobStorageBackup = lastBlobBackup != null 
                        ? DateTime.Parse(lastBlobBackup.Name.Replace("backup-", "")) 
                        : null,
                    BackupSizeBytes = lastBackup != null 
                        ? new FileInfo(lastBackup).Length 
                        : 0,
                    IsHealthy = IsBackupHealthy(lastBackup)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting backup status");
                throw;
            }
        }

        private bool IsBackupHealthy(string lastBackup)
        {
            if (lastBackup == null)
                return false;

            var lastBackupTime = File.GetCreationTimeUtc(lastBackup);
            return DateTime.UtcNow.Subtract(lastBackupTime).TotalHours < 24;
        }
    }

    public class BackupStatus
    {
        public DateTime? LastDatabaseBackup { get; set; }
        public DateTime? LastBlobStorageBackup { get; set; }
        public long BackupSizeBytes { get; set; }
        public bool IsHealthy { get; set; }
    }
}
