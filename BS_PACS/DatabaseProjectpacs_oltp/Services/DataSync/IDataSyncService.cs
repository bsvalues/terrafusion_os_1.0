namespace DatabaseProjectpacs_oltp.Services.DataSync;

public interface IDataSyncService
{
    Task SyncPropertiesAsync(CancellationToken cancellationToken, DateTime? lastSyncTime = null);
    Task<bool> ValidateSyncStatusAsync();
    Task RollbackSyncAsync(string syncId);
} 