using Microsoft.Extensions.Logging;
using System.Data.SqlClient;
using Dapper;

public class DataSyncService : IDataSyncService
{
    private readonly ILogger<DataSyncService> _logger;
    private readonly string _pacsConnectionString;
    private readonly string _ciapsConnectionString;
    private readonly DatabaseContext _context;

    public DataSyncService(
        ILogger<DataSyncService> logger,
        IConfiguration configuration,
        DatabaseContext context)
    {
        _logger = logger;
        _pacsConnectionString = configuration.GetConnectionString("PacsConnection");
        _ciapsConnectionString = configuration.GetConnectionString("CiapsConnection");
        _context = context;
    }

    public async Task SyncPropertiesAsync(int tenantId, DateTime? lastSyncTime = null)
    {
        try
        {
            using var pacsConnection = new SqlConnection(_pacsConnectionString);
            await pacsConnection.OpenAsync();

            // Get updated properties from PACS
            var query = @"
                SELECT 
                    p.prop_id as PropertyID,
                    p.geo_id as GeoID,
                    pv.market as AppraisedValue,
                    o.owner_name as OwnerName,
                    s.situs_addr as Situs
                FROM property p
                JOIN property_val pv ON p.prop_id = pv.prop_id
                JOIN owner o ON p.prop_id = o.prop_id
                JOIN situs s ON p.prop_id = s.prop_id
                WHERE (@LastSyncTime IS NULL OR p.last_updated > @LastSyncTime)
                    AND p.tenant_id = @TenantId";

            var properties = await pacsConnection.QueryAsync<PropertySync>(
                query,
                new { TenantId = tenantId, LastSyncTime = lastSyncTime }
            );

            // Begin transaction for CIAPS updates
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var property in properties)
                {
                    var existingProperty = await _context.Properties
                        .FirstOrDefaultAsync(p => p.PropertyID == property.PropertyID);

                    if (existingProperty == null)
                    {
                        _context.Properties.Add(new Property
                        {
                            PropertyID = property.PropertyID,
                            TenantID = tenantId,
                            GeoID = property.GeoID,
                            OwnerName = property.OwnerName,
                            Situs = property.Situs,
                            AppraisedValue = property.AppraisedValue,
                            LastSyncedAt = DateTime.UtcNow
                        });
                    }
                    else
                    {
                        existingProperty.GeoID = property.GeoID;
                        existingProperty.OwnerName = property.OwnerName;
                        existingProperty.Situs = property.Situs;
                        existingProperty.AppraisedValue = property.AppraisedValue;
                        existingProperty.LastSyncedAt = DateTime.UtcNow;
                    }
                }

                // Log the sync
                _context.SyncLogs.Add(new SyncLog
                {
                    TenantID = tenantId,
                    SyncType = "PACS_TO_CIAPS",
                    RecordsProcessed = properties.Count(),
                    StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow,
                    Status = "Success"
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error syncing properties for tenant {TenantId}", tenantId);
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting to PACS database for tenant {TenantId}", tenantId);
            throw;
        }
    }
}
