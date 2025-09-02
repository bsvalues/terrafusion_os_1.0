using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

public interface IModuleCatalog
{
    Task<IReadOnlyList<Module>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Module>> GetEnabledAsync(CancellationToken ct = default);
    Task<Module?> GetByNameAsync(string name, CancellationToken ct = default);
    Task<int> GetCountAsync(bool enabledOnly = false, CancellationToken ct = default);
    Task<Dictionary<string, Module>> GetByNamesAsync(IEnumerable<string> names, CancellationToken ct = default);
}
