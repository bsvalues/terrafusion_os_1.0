using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Models;

namespace TerraFusion.Data.Repositories
{
    public class PluginRepository : IPluginRepository
    {
        private readonly TerraFusionDbContext _context;

        public PluginRepository(TerraFusionDbContext context)
        {
            _context = context;
        }

        public async Task<Plugin> GetByIdAsync(Guid id)
        {
            return await _context.Plugins.FindAsync(id);
        }

        public async Task<IEnumerable<Plugin>> GetAllAsync()
        {
            return await _context.Plugins.ToListAsync();
        }

        public async Task AddAsync(Plugin plugin)
        {
            await _context.Plugins.AddAsync(plugin);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Plugin plugin)
        {
            _context.Plugins.Update(plugin);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var plugin = await GetByIdAsync(id);
            if (plugin != null)
            {
                _context.Plugins.Remove(plugin);
                await _context.SaveChangesAsync();
            }
        }
    }
}
