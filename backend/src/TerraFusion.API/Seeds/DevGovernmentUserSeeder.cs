using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Seeds;

/// <summary>
/// CARD-17: Dev-only seeder for a single GovernmentUsers admin identity.
/// This keeps the development auth story honest without seeding any
/// production users or widening into broader auth changes.
/// </summary>
public sealed class DevGovernmentUserSeeder
{
    internal static readonly Guid DevAdminUserId = Guid.Parse("17170017-1717-1717-1717-171717171717");
    internal const string DevAdminEmail = "admin@terrafusionmarket.com";
    internal const string DevAdminRole = "Administrator";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DevGovernmentUserSeeder> _logger;

    public DevGovernmentUserSeeder(TerraFusionDbContext db, ILogger<DevGovernmentUserSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async SystemTask SeedAsync(CancellationToken ct = default)
    {
        var existingUser = await _db.GovernmentUsers
            .FirstOrDefaultAsync(u => u.Email == DevAdminEmail, ct);

        if (existingUser is not null)
        {
            _logger.LogInformation("[DevGovernmentUserSeeder] Dev admin user already present — skipping.");
            return;
        }

        var now = DateTime.UtcNow;
        var user = new GovernmentUser
        {
            Id = DevAdminUserId,
            Email = DevAdminEmail,
            FirstName = "Dev",
            LastName = "Administrator",
            Department = "Development",
            Role = DevAdminRole,
            PasswordHash = null,
            IsActive = true,
            CreatedAt = now,
            LastLoginAt = now,
            CountyId = DatabaseSeeder.BentonCountyId,
            Permissions = """
                ["read:dossier","write:dossier","read:properties","read:parcel","access:costforge"]
                """
        };

        _db.GovernmentUsers.Add(user);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "[DevGovernmentUserSeeder] Seeded dev admin user {Email} for county {CountyId}.",
            DevAdminEmail,
            DatabaseSeeder.BentonCountyId);
    }
}
