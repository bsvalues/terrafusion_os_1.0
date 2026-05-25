using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.API.Security.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

var options = CliOptions.Parse(args);
if (options.ShowHelp)
{
    CliOptions.PrintHelp();
    return 0;
}

if (!options.IsValid(out var validationError))
{
    Console.Error.WriteLine(validationError);
    CliOptions.PrintHelp();
    return 2;
}

var configuration = new ConfigurationBuilder()
    .AddEnvironmentVariables()
    .Build();

var connectionString = options.ConnectionString
    ?? configuration.GetConnectionString("DefaultConnection")
    ?? configuration["ConnectionStrings__DefaultConnection"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Missing TerraFusion DB connection string. Use --connection-string or ConnectionStrings__DefaultConnection.");
    return 2;
}

var dbOptions = new DbContextOptionsBuilder<TerraFusionDbContext>();
var provider = options.Provider ?? configuration["DatabaseProvider"] ?? DetectProvider(connectionString);
if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
{
    dbOptions.UseSqlite(connectionString);
}
else if (
    provider.Equals("Npgsql", StringComparison.OrdinalIgnoreCase) ||
    provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase) ||
    provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
{
    dbOptions.UseNpgsql(connectionString);
}
else
{
    Console.Error.WriteLine($"Unsupported TerraFusion DB provider '{provider}'. Use Sqlite or Npgsql.");
    return 2;
}

await using var db = new TerraFusionDbContext(dbOptions.Options, configuration);

var normalizedEmail = options.Email!.Trim().ToLowerInvariant();
var password = options.ResolvePassword()!;
var now = DateTime.UtcNow;

Guid? countyId = options.CountyId;
if (!countyId.HasValue && !string.IsNullOrWhiteSpace(options.CountyName))
{
    var countyName = options.CountyName.Trim();
    var countyState = string.IsNullOrWhiteSpace(options.CountyState) ? "WA" : options.CountyState.Trim().ToUpperInvariant();
    var county = !string.IsNullOrWhiteSpace(options.CountyFips)
        ? await db.Counties.FirstOrDefaultAsync(item => item.FipsCode == options.CountyFips)
        : null;

    county ??= await db.Counties.FirstOrDefaultAsync(item =>
        item.Name.ToLower() == countyName.ToLower()
        && item.State.ToUpper() == countyState);

    if (county is null && options.CreateCounty)
    {
        county = new County
        {
            Id = Guid.NewGuid(),
            Name = countyName,
            State = countyState,
            FipsCode = options.CountyFips,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Counties.Add(county);
    }

    countyId = county?.Id;
}

var roles = CliOptions.ParseCsv(options.Roles);
var permissions = CliOptions.ParseCsv(options.Permissions);
if (roles.Length == 0)
{
    roles = ["GovernmentUser"];
}

var user = await db.GovernmentUsers.FirstOrDefaultAsync(item => item.Email.ToLower() == normalizedEmail);
var created = user is null;
if (user is null)
{
    user = new GovernmentUser
    {
        Id = Guid.NewGuid(),
        Email = normalizedEmail,
        FirstName = options.FirstName ?? "Provisioned",
        LastName = options.LastName ?? "Operator",
        Role = string.Join(",", roles),
        CreatedAt = now,
        IsActive = true,
        CountyId = countyId
    };
    db.GovernmentUsers.Add(user);
}
else
{
    user.Email = normalizedEmail;
    user.FirstName = options.FirstName ?? user.FirstName;
    user.LastName = options.LastName ?? user.LastName;
    user.Role = string.Join(",", roles);
    user.IsActive = true;
    user.CountyId = countyId ?? user.CountyId;
}

user.PasswordHash = ProvisionedPasswordHasher.HashPassword(password);
user.Permissions = JsonSerializer.Serialize(permissions);

db.PasswordHistories.Add(new PasswordHistory
{
    Id = Guid.NewGuid(),
    UserId = user.Id,
    PasswordHash = user.PasswordHash,
    CreatedAt = now
});

await db.SaveChangesAsync();

Console.WriteLine(JsonSerializer.Serialize(new
{
    result = created ? "created" : "updated",
    userId = user.Id,
    email = user.Email,
    countyId = user.CountyId,
    roles,
    permissions,
    passwordHashStored = !string.IsNullOrWhiteSpace(user.PasswordHash)
}));

return 0;

static string DetectProvider(string connectionString)
{
    return connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase)
        ? "Npgsql"
        : "Sqlite";
}

internal sealed class CliOptions
{
    public string? ConnectionString { get; private init; }
    public string? Provider { get; private init; }
    public string? Email { get; private init; }
    public string? Password { get; private init; }
    public string? PasswordEnv { get; private init; }
    public string? FirstName { get; private init; }
    public string? LastName { get; private init; }
    public string? Roles { get; private init; }
    public string? Permissions { get; private init; }
    public Guid? CountyId { get; private init; }
    public string? CountyName { get; private init; }
    public string? CountyState { get; private init; }
    public string? CountyFips { get; private init; }
    public bool CreateCounty { get; private init; }
    public bool ShowHelp { get; private init; }

    public static CliOptions Parse(string[] args)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        var flags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < args.Length; i++)
        {
            var arg = args[i];
            if (arg == "--")
            {
                continue;
            }

            if (!arg.StartsWith("--", StringComparison.Ordinal))
            {
                continue;
            }

            var key = arg[2..];
            if (key.Equals("help", StringComparison.OrdinalIgnoreCase))
            {
                flags.Add(key);
                continue;
            }

            if (key.Equals("create-county", StringComparison.OrdinalIgnoreCase))
            {
                flags.Add(key);
                continue;
            }

            if (i + 1 >= args.Length)
            {
                values[key] = null;
                continue;
            }

            values[key] = args[++i];
        }

        Guid? countyId = null;
        if (values.TryGetValue("county-id", out var countyIdRaw) && Guid.TryParse(countyIdRaw, out var parsedCountyId))
        {
            countyId = parsedCountyId;
        }

        return new CliOptions
        {
            ShowHelp = flags.Contains("help"),
            CreateCounty = flags.Contains("create-county"),
            ConnectionString = Value(values, "connection-string"),
            Provider = Value(values, "provider"),
            Email = Value(values, "email"),
            Password = Value(values, "password"),
            PasswordEnv = Value(values, "password-env"),
            FirstName = Value(values, "first-name"),
            LastName = Value(values, "last-name"),
            Roles = Value(values, "roles"),
            Permissions = Value(values, "permissions"),
            CountyId = countyId,
            CountyName = Value(values, "county-name"),
            CountyState = Value(values, "county-state"),
            CountyFips = Value(values, "county-fips")
        };
    }

    public bool IsValid(out string error)
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            error = "--email is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(Password) && string.IsNullOrWhiteSpace(PasswordEnv))
        {
            error = "--password-env is required unless --password is supplied for local-only use.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(PasswordEnv) && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(PasswordEnv)))
        {
            error = $"Password environment variable '{PasswordEnv}' is not set.";
            return false;
        }

        error = string.Empty;
        return true;
    }

    public string? ResolvePassword()
    {
        return !string.IsNullOrWhiteSpace(PasswordEnv)
            ? Environment.GetEnvironmentVariable(PasswordEnv)
            : Password;
    }

    public static string[] ParseCsv(string? raw)
    {
        return string.IsNullOrWhiteSpace(raw)
            ? Array.Empty<string>()
            : raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
    }

    public static void PrintHelp()
    {
        Console.WriteLine("""
TerraFusion.AuthProvisioner provisions real TerraFusion DB-backed operator accounts.

Required:
  --email <email>
  --password-env <env var>       Preferred; reads password from environment.

Database:
  --connection-string <value>    Defaults to ConnectionStrings__DefaultConnection.
  --provider Sqlite|Npgsql       Defaults from the connection string.

User:
  --first-name <name>
  --last-name <name>
  --roles GovernmentUser,Administrator
  --permissions read:parcel,ecosystem:view

County:
  --county-id <guid>
  --county-name Benton --county-state WA --county-fips 53005 --create-county
""");
    }

    private static string? Value(Dictionary<string, string?> values, string key)
    {
        return values.TryGetValue(key, out var value) ? value : null;
    }
}
