using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.Models;

namespace TerraFusion.Data.Repositories
{
    public interface IPluginRepository
    {
        Task<Plugin?> GetByIdAsync(Guid id);
        Task<IEnumerable<Plugin>> GetAllAsync();
        Task AddAsync(Plugin plugin);
        Task UpdateAsync(Plugin plugin);
        Task DeleteAsync(Guid id);
    }
}
