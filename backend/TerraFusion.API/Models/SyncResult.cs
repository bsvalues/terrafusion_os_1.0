namespace TerraFusion.API.Models;

public class SyncResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SyncOperation> SyncOperations { get; set; } = new();
    public DateTime SyncTimestamp { get; set; } = DateTime.UtcNow;
    public int RecordsProcessed { get; set; }
}

public class SyncOperation
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty;
}