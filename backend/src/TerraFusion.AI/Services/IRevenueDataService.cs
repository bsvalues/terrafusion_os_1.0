using System.Threading.Tasks;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Service for querying revenue data from property assessments and tax records.
/// </summary>
public interface IRevenueDataService
{
    System.Threading.Tasks.Task<object> GetRevenueDataAsync();
    System.Threading.Tasks.Task<List<RevenueData>> GetHistoricalRevenueDataAsync(string jurisdiction, int months);
}
